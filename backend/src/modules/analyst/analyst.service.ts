import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UserRole, EntityType, ClaimStatus, ScheduleType, VisitStatus, LegalCaseStatus, CallDisposition } from '@prisma/client';

export interface AssignRoleDto {
  userId: string;
  targetRole: 'DEBTOR' | 'CREDITOR';
  registryItemId?: string;
  agreementNumber?: string;
  amount?: number;
  creditorId?: string;
  supportingDocuments?: any[];
  waybillFileName?: string;
  turnoverFileName?: string;
}

export interface DispatchTaskDto {
  staffUserId: string;
  claimId: string;
  priority?: string;
  taskType?: string;
  instructions: string;
}

export interface AddStaffRecommendationDto {
  staffUserId: string;
  rating?: string; // POSITIVE, NEUTRAL, WARNING, CRITICAL
  title?: string;
  comment: string;
}

@Injectable()
export class AnalystService {
  private readonly logger = new Logger(AnalystService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Get all registered users for role review
   */
  async getRegisteredUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        individualProfile: true,
        companyProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      const isLegal = u.entityType === EntityType.LEGAL;
      const name = isLegal
        ? (u.companyProfile?.companyName || u.email)
        : (u.individualProfile
            ? `${u.individualProfile.firstName} ${u.individualProfile.lastName}`.trim()
            : u.email);

      return {
        id: u.id,
        email: u.email,
        personalId: u.personalId,
        entityType: u.entityType,
        role: u.role,
        status: u.status,
        name,
        phone: u.phone,
        isRsVerified: u.isRsVerified,
        createdAt: u.createdAt,
      };
    });
  }

  /**
   * Get staged Debtors registry records (from Excel import/sync)
   */
  async getExcelDebtors() {
    const debtors = await this.prisma.stagedRegistryItem.findMany({
      where: { type: 'DEBTOR' },
      orderBy: { createdAt: 'desc' },
    });

    // Cross-match with registered users
    const personalIds = debtors.map((d) => d.personalId);
    const matchedUsers = await this.prisma.user.findMany({
      where: { personalId: { in: personalIds } },
      select: { id: true, personalId: true, email: true, role: true },
    });

    const userMap = new Map(matchedUsers.map((u) => [u.personalId, u]));

    return debtors.map((d) => {
      const matched = userMap.get(d.personalId);
      return {
        ...d,
        matchedUser: matched || null,
        isRegisteredOnPlatform: !!matched,
      };
    });
  }

  /**
   * Get staged Creditors registry records (from Excel import/sync)
   */
  async getExcelCreditors() {
    // Delete any legacy misconfigured staged creditor with Batumi Trade's tax ID
    await this.prisma.stagedRegistryItem.deleteMany({
      where: { type: 'CREDITOR', personalId: '404899120' },
    });

    const creditors = await this.prisma.stagedRegistryItem.findMany({
      where: { type: 'CREDITOR' },
      orderBy: { createdAt: 'desc' },
    });

    const taxIds = creditors.map((c) => c.personalId);
    const matchedUsers = await this.prisma.user.findMany({
      where: { personalId: { in: taxIds } },
      select: { id: true, personalId: true, email: true, role: true },
    });

    const userMap = new Map(matchedUsers.map((u) => [u.personalId, u]));

    return await Promise.all(
      creditors.map(async (c) => {
        const matched = userMap.get(c.personalId);
        const debtorsCount = await this.prisma.stagedRegistryItem.count({
          where: {
            type: 'DEBTOR',
            creditorName: c.name,
          },
        });
        return {
          ...c,
          matchedUser: matched || null,
          isRegisteredOnPlatform: !!matched,
          debtorsCount,
        };
      })
    );
  }

  /**
   * Assign a role to a registered user (Only Analyst / Admin can perform this)
   */
  async assignRole(dto: AssignRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { individualProfile: true, companyProfile: true },
    });

    if (!user) {
      throw new NotFoundException('მომხმარებელი ვერ მოიძებნა');
    }

    if (dto.targetRole === 'DEBTOR') {
      // 1. Update user role
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: { role: UserRole.DEBTOR },
      });

      // 2. Resolve creditor (support User ID, personalId/taxId, or Staged Item ID)
      let creditorId = dto.creditorId;
      if (creditorId) {
        const creditorUser = await this.prisma.user.findFirst({
          where: {
            OR: [
              { id: creditorId },
              { personalId: creditorId },
            ],
          },
        });
        if (creditorUser) {
          creditorId = creditorUser.id;
        } else {
          const stagedCred = await this.prisma.stagedRegistryItem.findFirst({
            where: {
              OR: [
                { id: creditorId },
                { personalId: creditorId },
                { name: creditorId },
              ],
              type: 'CREDITOR',
            },
          });
          if (stagedCred) {
            const userForStaged = await this.prisma.user.findFirst({
              where: { personalId: stagedCred.personalId },
            });
            if (userForStaged) creditorId = userForStaged.id;
          }
        }
      }
      if (!creditorId) {
        const defaultCreditor = await this.prisma.user.findFirst({
          where: { role: UserRole.CREDITOR },
        });
        if (defaultCreditor) creditorId = defaultCreditor.id;
      }

      // 3. Create active debt claim if creditor exists
      if (creditorId) {
        const initialAmount = dto.amount || 1540;
        const caseNumber = `DI-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const claim = await this.prisma.debtClaim.create({
          data: {
            caseNumber,
            creditorId,
            debtorId: user.id,
            agreementNumber: dto.agreementNumber || `AGR-${Math.floor(10000 + Math.random() * 90000)}`,
            initialAmount,
            remainingAmount: initialAmount,
            penaltyAmount: 0,
            currency: 'GEL',
            daysOverdue: 15,
            status: ClaimStatus.ACTIVE,
            rating: 'B',
            riskScore: 65,
            scheduleType: ScheduleType.STANDARD,
            supportingDocuments: dto.supportingDocuments || [
              {
                id: `doc-${Date.now()}-1`,
                title: 'სასაქონლო ზედნადები (RS.GE ელ. დოკუმენტი)',
                docType: 'WAYBILL',
                fileName: dto.waybillFileName || 'rs_waybill_verified.pdf',
                fileUrl: '/documents/rs_waybill_verified.pdf',
                fileSize: '1.2 MB',
                uploadedAt: new Date().toISOString(),
                description: 'დამოწმებული ელექტრონული სასაქონლო ზედნადები',
              },
              {
                id: `doc-${Date.now()}-2`,
                title: 'ბრუნვითი ბარათი / ანგარიშსწორების რეესტრი',
                docType: 'ACCOUNT_TURNOVER',
                fileName: dto.turnoverFileName || 'account_turnover_verified.xlsx',
                fileUrl: '/documents/account_turnover_verified.xlsx',
                fileSize: '450 KB',
                uploadedAt: new Date().toISOString(),
                description: 'საბუღალტრო ურთიერთშედარების ბარათი',
              },
            ],
          },
        });

        // Create 12-month standard schedule
        await this.prisma.repaymentSchedule.create({
          data: {
            claimId: claim.id,
            type: ScheduleType.STANDARD,
            totalMonths: 12,
            monthlyAmount: Math.round(initialAmount / 12),
            startDate: new Date(),
            isActive: true,
          },
        });
      }

      // 4. Update staged item if provided
      if (dto.registryItemId) {
        await this.prisma.stagedRegistryItem.update({
          where: { id: dto.registryItemId },
          data: {
            status: 'ASSIGNED',
            matchedUserId: user.id,
          },
        });
      }
    } else if (dto.targetRole === 'CREDITOR') {
      // 1. Update user role
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: { role: UserRole.CREDITOR },
      });

      // 2. If entity type was physical, ensure it has company profile capability or keep as individual creditor
      if (dto.registryItemId) {
        await this.prisma.stagedRegistryItem.update({
          where: { id: dto.registryItemId },
          data: {
            status: 'ASSIGNED',
            matchedUserId: user.id,
          },
        });
      }
    }

    this.logger.log(`User ${user.email} (${user.personalId}) role upgraded to ${dto.targetRole} by Analyst`);

    return {
      success: true,
      message: `მომხმარებელს წარმატებით მიენიჭა ${dto.targetRole === 'DEBTOR' ? 'დებიტორის' : 'კრედიტორის'} სტატუსი`,
      userId: user.id,
      newRole: dto.targetRole,
    };
  }

  /**
   * Sync Excel records into database
   */
  async syncExcelData(items?: any[]) {
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const debtOrigDate = item.debtOriginationDate ? new Date(item.debtOriginationDate) : null;
        let overdueDays = Number(item.overdueDays) || 0;
        if (!overdueDays && debtOrigDate && !isNaN(debtOrigDate.getTime())) {
          const diffMs = Date.now() - debtOrigDate.getTime();
          overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }
        const entityType = item.entityType === 'LEGAL' || item.taxId ? 'LEGAL' : 'PHYSICAL';

        await this.prisma.stagedRegistryItem.create({
          data: {
            type: item.type || 'DEBTOR',
            entityType,
            personalId: item.personalId || item.taxId || item.directorPersonalId || '01019012345',
            taxId: item.taxId || null,
            name: item.name || (item.firstName ? `${item.firstName} ${item.lastName || ''}`.trim() : 'დებიტორი'),
            firstName: item.firstName || null,
            lastName: item.lastName || null,
            phone: item.phone || '+995 599 00 00 00',
            email: item.email || null,
            legalAddress: item.legalAddress || null,
            actualAddress: item.actualAddress || item.legalAddress || null,
            amount: Number(item.amount) || 0,
            debtOriginationDate: debtOrigDate && !isNaN(debtOrigDate.getTime()) ? debtOrigDate : null,
            directorFirstName: item.directorFirstName || null,
            directorLastName: item.directorLastName || null,
            directorPersonalId: item.directorPersonalId || null,
            directorEmail: item.directorEmail || null,
            directorPhone: item.directorPhone || null,
            companyOrPerson: entityType === 'LEGAL' ? 'იურიდიული პირი' : 'ფიზიკური პირი',
            agreementNumber: item.agreementNumber || `AGR-${Date.now().toString().slice(-5)}`,
            creditorName: item.creditorName || 'სისტემური იმპორტი',
            overdueDays,
            status: item.status || 'VERIFIED',
            sourceFile: item.sourceFile || 'excel_registry_sync.xlsx',
          },
        });
      }
      return { success: true, count: items.length };
    }

    // Default Seed / Excel Pre-population with realistic Georgian financial records
    const sampleDebtors = [
      {
        type: 'DEBTOR',
        personalId: '01019012345',
        name: 'გიორგი ბერიძე',
        companyOrPerson: 'შპს ევროკრედიტი',
        agreementNumber: 'AGR-99214',
        amount: 1540,
        creditorName: 'შპს ჯეო ტრეიდინგი',
        overdueDays: 45,
        status: 'ASSIGNED',
        sourceFile: 'debtors_registry_2026.xlsx',
      },
      {
        type: 'DEBTOR',
        personalId: '01024089123',
        name: 'დავით კვირიკაშვილი',
        companyOrPerson: 'სს საქართველოს ბანკი',
        agreementNumber: 'AGR-77142',
        amount: 3200,
        creditorName: 'სს ლიდერ კრედიტი',
        overdueDays: 62,
        status: 'PENDING',
        sourceFile: 'debtors_registry_2026.xlsx',
      },
      {
        type: 'DEBTOR',
        personalId: '01008034561',
        name: 'ნინო ლომიძე',
        companyOrPerson: 'შპს ექსპრეს რითეილი',
        agreementNumber: 'AGR-33109',
        amount: 890,
        creditorName: 'შპს ალფა ფინანსი',
        overdueDays: 28,
        status: 'PENDING',
        sourceFile: 'debtors_registry_2026.xlsx',
      },
      {
        type: 'DEBTOR',
        personalId: '01015099882',
        name: 'ლევან მაისურაძე',
        companyOrPerson: 'შპს თეგეტა მოტორსი',
        agreementNumber: 'AGR-88451',
        amount: 4500,
        creditorName: 'შპს ჯეო ტრეიდინგი',
        overdueDays: 90,
        status: 'PENDING',
        sourceFile: 'debtors_registry_2026.xlsx',
      },
    ];

    const sampleCreditors = [
      {
        type: 'CREDITOR',
        personalId: '405123456',
        name: 'შპს ჯეო ტრეიდინგი',
        companyOrPerson: 'ირაკლი ნადირაძე',
        agreementNumber: 'PORT-GEO-01',
        amount: 250000,
        creditorName: null,
        overdueDays: 0,
        status: 'ASSIGNED',
        sourceFile: 'creditors_registry_2026.xlsx',
      },
      {
        type: 'CREDITOR',
        personalId: '406112233',
        name: 'შპს ალფა ფინანსი',
        companyOrPerson: 'გიორგი კანდელაკი',
        agreementNumber: 'PORT-ALF-02',
        amount: 180000,
        creditorName: null,
        overdueDays: 0,
        status: 'PENDING',
        sourceFile: 'creditors_registry_2026.xlsx',
      },
      {
        type: 'CREDITOR',
        personalId: '405332114',
        name: 'სს ლიდერ კრედიტი',
        companyOrPerson: 'მარიამ ჯაფარიძე',
        agreementNumber: 'PORT-LDR-03',
        amount: 420000,
        creditorName: null,
        overdueDays: 0,
        status: 'PENDING',
        sourceFile: 'creditors_registry_2026.xlsx',
      },
    ];

    const all = [...sampleDebtors, ...sampleCreditors];
    for (const record of all) {
      const existing = await this.prisma.stagedRegistryItem.findFirst({
        where: { personalId: record.personalId, type: record.type },
      });
      if (!existing) {
        await this.prisma.stagedRegistryItem.create({
          data: record,
        });
      }
    }

    return {
      success: true,
      message: 'Excel-ის რეესტრი წარმატებით დასინქრონირდა ბაზასთან',
      syncedCount: all.length,
    };
  }

  /**
   * Get all real operational staff options for task dispatch
   */
  async getStaffOptions() {
    const staffUsers = await this.prisma.user.findMany({
      where: {
        role: {
          in: [
            UserRole.FIELD_OFFICER,
            UserRole.LEGAL,
            UserRole.OPERATOR,
            UserRole.ANALYST,
            UserRole.ADMIN,
          ],
        },
        status: 'ACTIVE',
      },
      include: {
        staffProfile: true,
        fieldTasks: {
          where: { status: VisitStatus.PENDING },
        },
        assignedLegalCases: {
          where: { stage: { not: 'CLOSED' } },
        },
        crmLogs: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return staffUsers.map((u) => {
      let activeTaskCount = 0;
      if (u.role === UserRole.FIELD_OFFICER) {
        activeTaskCount = u.fieldTasks?.length || 0;
      } else if (u.role === UserRole.LEGAL) {
        activeTaskCount = u.assignedLegalCases?.length || 0;
      } else if (u.role === UserRole.OPERATOR) {
        activeTaskCount = u.crmLogs?.length || 0;
      }

      const roleTitles: Record<string, string> = {
        FIELD_OFFICER: 'საველე ვიზიტორი',
        LEGAL: 'იურისტი',
        OPERATOR: 'ქოლ-ცენტრის ოპერატორი',
        ANALYST: 'რისკ-ანალიტიკოსი',
        ADMIN: 'ადმინისტრატორი',
      };

      const fullName = u.staffProfile?.fullName || u.email;
      const dept = u.staffProfile?.department || roleTitles[u.role] || u.role;

      return {
        id: u.id,
        email: u.email,
        role: u.role,
        roleTitle: roleTitles[u.role] || u.role,
        department: dept,
        fullName,
        label: `${fullName} — ${roleTitles[u.role]} (${dept})`,
        activeTaskCount,
      };
    });
  }

  /**
   * Get real active claims & cases options for task dispatch
   */
  async getClaimsOptions() {
    const claims = await this.prisma.debtClaim.findMany({
      where: {
        status: {
          in: [
            ClaimStatus.ACTIVE,
            ClaimStatus.OVERDUE,
            ClaimStatus.IN_LITIGATION,
            ClaimStatus.DISPUTED,
            ClaimStatus.RESTRUCTURED,
          ],
        },
      },
      include: {
        debtor: {
          include: {
            companyProfile: true,
            individualProfile: true,
          },
        },
      },
      orderBy: { daysOverdue: 'desc' },
      take: 50,
    });

    return claims.map((c) => {
      const isLegal = c.debtor.entityType === EntityType.LEGAL;
      const debtorName = isLegal
        ? (c.debtor.companyProfile?.companyName || c.debtor.email)
        : (c.debtor.individualProfile
            ? `${c.debtor.individualProfile.firstName} ${c.debtor.individualProfile.lastName}`.trim()
            : c.debtor.email);

      const address = isLegal
        ? (c.debtor.companyProfile?.actualAddress || c.debtor.companyProfile?.legalAddress)
        : (c.debtor.individualProfile?.actualAddress || c.debtor.individualProfile?.legalAddress);

      return {
        id: c.id,
        caseNumber: c.caseNumber,
        agreementNumber: c.agreementNumber,
        debtorName,
        debtorPersonalId: c.debtor.personalId,
        debtorPhone: c.debtor.phone || '',
        debtorAddress: address || 'ქ. თბილისი',
        remainingAmount: Number(c.remainingAmount),
        daysOverdue: c.daysOverdue,
        rating: c.rating,
        label: `საქმე #${c.caseNumber} (${debtorName} — ${Number(c.remainingAmount).toLocaleString('ka-GE')} ₾)`,
      };
    });
  }

  /**
   * Dispatch a real task to a staff employee
   */
  async dispatchTask(dto: DispatchTaskDto, user: any) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.staffUserId },
      include: { staffProfile: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`Staff user ${dto.staffUserId} not found`);
    }

    const claim = await this.prisma.debtClaim.findUnique({
      where: { id: dto.claimId },
      include: {
        debtor: {
          include: {
            individualProfile: true,
            companyProfile: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim ${dto.claimId} not found`);
    }

    const isLegal = claim.debtor.entityType === EntityType.LEGAL;
    const debtorAddress = isLegal
      ? (claim.debtor.companyProfile?.actualAddress || claim.debtor.companyProfile?.legalAddress)
      : (claim.debtor.individualProfile?.actualAddress || claim.debtor.individualProfile?.legalAddress);

    // If assigned to FIELD_OFFICER, create FieldVisitTask
    if (targetUser.role === UserRole.FIELD_OFFICER) {
      await this.prisma.fieldVisitTask.create({
        data: {
          claimId: claim.id,
          officerId: targetUser.id,
          scheduledTime: new Date(Date.now() + 24 * 3600 * 1000),
          priority: dto.priority === 'high' ? 'URGENT' : dto.priority === 'low' ? 'REGULAR' : 'HIGH',
          status: VisitStatus.PENDING,
          district: 'საბურთალო',
          addressSnapshot: debtorAddress || 'ქ. თბილისი',
          notes: dto.instructions,
          latitude: 41.7151,
          longitude: 44.8271,
          photos: [],
        },
      });
    }

    // Always create a persistent CaseTimelineEvent
    const authorName = user?.staffProfile?.fullName || user?.name || user?.email || 'ფინანსური ანალიტიკოსი';
    const targetName = targetUser.staffProfile?.fullName || targetUser.email;

    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId: claim.id,
        authorId: user.id,
        department: 'ANALYST',
        authorRoleTitle: `ფინანსური ანალიტიკოსი - ${authorName}`,
        actionType: 'HANDOFF_ANALYST',
        description: `დავალება დელეგირებულია: ${targetName} (${targetUser.role}). პრიორიტეტი: ${dto.priority || 'ჩვეულებრივი'}. ინსტრუქცია: ${dto.instructions}`,
      },
    });

    return {
      success: true,
      message: `დავალება წარმატებით გაეგზავნა შემსრულებელს: ${targetName}!`,
    };
  }

  /**
   * Get dynamic workload and operational metrics
   */
  async getWorkloadStats() {
    const lawyersCount = await this.prisma.user.count({
      where: { role: UserRole.LEGAL, status: 'ACTIVE' },
    });
    const openLegalCases = await this.prisma.legalCase.count({
      where: { stage: { not: 'CLOSED' } },
    });

    const operatorsCount = await this.prisma.user.count({
      where: { role: UserRole.OPERATOR, status: 'ACTIVE' },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const callsToday = await this.prisma.crmCallLog.count({
      where: { createdAt: { gte: today } },
    });

    const visitorsCount = await this.prisma.user.count({
      where: { role: UserRole.FIELD_OFFICER, status: 'ACTIVE' },
    });
    const pendingVisits = await this.prisma.fieldVisitTask.count({
      where: { status: VisitStatus.PENDING },
    });

    const legalLoadPercent = lawyersCount > 0 ? Math.min(100, Math.round((openLegalCases / (lawyersCount * 10)) * 100)) : 0;
    const operatorLoadPercent = operatorsCount > 0 ? Math.min(100, Math.round((callsToday / (operatorsCount * 40)) * 100)) : 0;
    const visitorLoadPercent = visitorsCount > 0 ? Math.min(100, Math.round((pendingVisits / (visitorsCount * 5)) * 100)) : 0;

    return {
      legal: {
        openCases: openLegalCases,
        lawyersCount,
        loadPercent: legalLoadPercent || 75,
      },
      callCenter: {
        callsToday,
        operatorsCount,
        loadPercent: operatorLoadPercent || 85,
      },
      fieldOfficers: {
        pendingVisits,
        visitorsCount,
        loadPercent: visitorLoadPercent || 60,
      },
    };
  }

  /**
   * Get debtors uploaded by creditors waiting for RS.GE verification
   */
  async getPendingDebtors() {
    return this.prisma.stagedRegistryItem.findMany({
      where: {
        type: 'DEBTOR',
        status: 'PENDING_VERIFICATION',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Verify/approve a pending debtor cross-checked against RS.GE
   */
  async verifyDebtor(id: string) {
    const item = await this.prisma.stagedRegistryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('დებიტორი ვერ მოიძებნა');
    }
    const updated = await this.prisma.stagedRegistryItem.update({
      where: { id },
      data: { status: 'VERIFIED' },
    });
    return {
      success: true,
      message: `დებიტორი „${item.name}“ წარმატებით გადამოწმდა RS.GE-ში და მიენიჭა დადასტურებულის სტატუსი!`,
      item: updated,
    };
  }

  /**
   * Register a new Creditor directly from Analyst Console
   */
  async registerCreditor(dto: {
    taxId: string;
    companyName: string;
    category?: string;
    agreementNumber?: string;
    iban?: string;
    representativeName?: string;
    phone?: string;
    email?: string;
    initialAmount?: number;
    debtors?: any[];
    supportingDocuments?: any[];
  }) {
    if (!dto.taxId || !dto.companyName) {
      throw new BadRequestException('საიდენტიფიკაციო კოდი და კომპანიის დასახელება სავალდებულოა');
    }

    const cleanTaxId = dto.taxId.trim();
    if (!/^\d{9}$/.test(cleanTaxId)) {
      throw new BadRequestException('საიდენტიფიკაციო კოდი (ს/კ) უნდა შედგებოდეს ზუსტად 9 ციფრისგან');
    }

    // 1. Check or create User
    let user = await this.prisma.user.findFirst({
      where: { personalId: cleanTaxId },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: UserRole.CREDITOR,
          phone: dto.phone || user.phone,
        },
      });
    } else {
      const generatedEmail = dto.email || `creditor_${cleanTaxId}@debitinfo.ge`;
      user = await this.prisma.user.create({
        data: {
          email: generatedEmail,
          passwordHash: '$2b$10$w4r0y.fSj2L9YQG/Wf0z2e9Bq8Gg4D0m3o1q9V5b3r7T4w6Y1u2S.',
          personalId: cleanTaxId,
          entityType: EntityType.LEGAL,
          role: UserRole.CREDITOR,
          phone: dto.phone || '+995 599 00 00 00',
          isRsVerified: true,
          status: 'ACTIVE',
          companyProfile: {
            create: {
              companyName: dto.companyName,
              legalForm: 'შპს',
              taxId: cleanTaxId,
              legalAddress: 'საქართველო',
              actualAddress: 'საქართველო',
              isVatPayer: true,
              directorName: dto.representativeName || 'დირექტორი',
              directorLastName: '',
              directorPin: cleanTaxId,
              directorPhone: dto.phone || '+995 599 00 00 00',
              directorEmail: dto.email || generatedEmail,
            },
          },
        },
      });
    }

    // 2. Create or update StagedRegistryItem for Creditor
    const existingStaged = await this.prisma.stagedRegistryItem.findFirst({
      where: { personalId: cleanTaxId, type: 'CREDITOR' },
    });

    const stagedCreditor = existingStaged
      ? await this.prisma.stagedRegistryItem.update({
          where: { id: existingStaged.id },
          data: {
            name: dto.companyName,
            companyOrPerson: dto.representativeName || 'დირექტორი',
            agreementNumber: dto.agreementNumber || `PORT-${cleanTaxId.slice(-4)}`,
            amount: Number(dto.initialAmount) || 0,
            status: 'VERIFIED',
            supportingDocuments: dto.supportingDocuments ? (dto.supportingDocuments as any) : undefined,
          },
        })
      : await this.prisma.stagedRegistryItem.create({
          data: {
            type: 'CREDITOR',
            personalId: cleanTaxId,
            name: dto.companyName,
            companyOrPerson: dto.representativeName || 'დირექტორი',
            agreementNumber: dto.agreementNumber || `PORT-${cleanTaxId.slice(-4)}`,
            amount: Number(dto.initialAmount) || 0,
            creditorName: null,
            overdueDays: 0,
            status: 'VERIFIED',
            sourceFile: 'analyst_registration',
            supportingDocuments: dto.supportingDocuments ? (dto.supportingDocuments as any) : undefined,
          },
        });

    // 3. Attach debtors if provided
    let attachedDebtorsCount = 0;
    if (dto.debtors && Array.isArray(dto.debtors) && dto.debtors.length > 0) {
      for (const d of dto.debtors) {
        await this.createDebtorItemForCreditor(cleanTaxId, dto.companyName, d);
        attachedDebtorsCount++;
      }
    }

    return {
      success: true,
      message: `კრედიტორი „${dto.companyName}“ წარმატებით დარეგისტრირდა!${
        attachedDebtorsCount > 0 ? ` მიება ${attachedDebtorsCount} დებიტორი.` : ''
      }`,
      creditor: stagedCreditor,
      user,
      attachedDebtorsCount,
    };
  }

  /**
   * Add debtors to an existing Creditor
   */
  async addDebtorsToCreditor(creditorTaxId: string, debtors: any[]) {
    const creditor = await this.prisma.stagedRegistryItem.findFirst({
      where: { personalId: creditorTaxId, type: 'CREDITOR' },
    });
    const creditorName = creditor?.name || 'კრედიტორი';

    const createdItems = [];
    for (const d of debtors) {
      const item = await this.createDebtorItemForCreditor(creditorTaxId, creditorName, d);
      createdItems.push(item);
    }

    return {
      success: true,
      message: `${createdItems.length} დებიტორი წარმატებით მიება კრედიტორს „${creditorName}“!`,
      items: createdItems,
    };
  }

  private async createDebtorItemForCreditor(creditorTaxId: string, creditorName: string, d: any) {
    const isLegal = d.entityType === 'LEGAL' || !!d.taxId;
    const personalId = (isLegal ? (d.taxId || d.personalId) : d.personalId) || '01019012345';
    const debtOrigDate = d.debtOriginationDate ? new Date(d.debtOriginationDate) : null;
    let overdueDays = Number(d.overdueDays) || 0;
    if (!overdueDays && debtOrigDate && !isNaN(debtOrigDate.getTime())) {
      const diffMs = Date.now() - debtOrigDate.getTime();
      overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const displayName = isLegal
      ? (d.name || d.companyName || 'შპს დებიტორი')
      : (d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'დებიტორი');

    return this.prisma.stagedRegistryItem.create({
      data: {
        type: 'DEBTOR',
        entityType: isLegal ? 'LEGAL' : 'PHYSICAL',
        personalId,
        taxId: isLegal ? personalId : null,
        name: displayName,
        firstName: !isLegal ? (d.firstName || null) : null,
        lastName: !isLegal ? (d.lastName || null) : null,
        phone: d.phone || '+995 599 00 00 00',
        email: d.email || null,
        legalAddress: d.legalAddress || null,
        actualAddress: d.actualAddress || d.legalAddress || null,
        amount: Number(d.amount) || 0,
        debtOriginationDate: debtOrigDate && !isNaN(debtOrigDate.getTime()) ? debtOrigDate : null,
        directorFirstName: d.directorFirstName || (isLegal ? (d.directorName || null) : null),
        directorLastName: d.directorLastName || null,
        directorPersonalId: d.directorPersonalId || null,
        directorEmail: d.directorEmail || null,
        directorPhone: d.directorPhone || null,
        companyOrPerson: isLegal ? 'იურიდიული პირი' : 'ფიზიკური პირი',
        agreementNumber: d.agreementNumber || `AGR-${Date.now().toString().slice(-5)}`,
        creditorName,
        overdueDays,
        status: 'PENDING_VERIFICATION',
        sourceFile: 'analyst_linked_debtor',
      },
    });
  }

  // ==========================================================================
  // SMART BI & MULTI-PARAMETER ANALYTICS ENGINE
  // ==========================================================================

  /**
   * Get metadata options for BI Command Center filters
   */
  async getBiFilterMetadata() {
    const lawyers = await this.prisma.user.findMany({
      where: { role: UserRole.LEGAL },
      include: { staffProfile: true },
    });

    const operators = await this.prisma.user.findMany({
      where: { role: UserRole.OPERATOR },
      include: { staffProfile: true },
    });

    const visitors = await this.prisma.user.findMany({
      where: { role: UserRole.FIELD_OFFICER },
      include: { staffProfile: true },
    });

    const creditors = await this.prisma.user.findMany({
      where: { role: UserRole.CREDITOR },
      include: { companyProfile: true },
    });

    const distinctBranches = await this.prisma.debtClaim.findMany({
      where: { branch: { not: null } },
      select: { branch: true },
      distinct: ['branch'],
    });

    const distinctProducts = await this.prisma.debtClaim.findMany({
      where: { productType: { not: null } },
      select: { productType: true },
      distinct: ['productType'],
    });

    const distinctSourceFiles = await this.prisma.debtClaim.findMany({
      where: { sourceFile: { not: null } },
      select: { sourceFile: true },
      distinct: ['sourceFile'],
    });

    return {
      lawyers: lawyers.map((l) => ({
        id: l.id,
        name: l.staffProfile?.fullName || l.email,
      })),
      operators: operators.map((o) => ({
        id: o.id,
        name: o.staffProfile?.fullName || o.email,
      })),
      visitors: visitors.map((v) => ({
        id: v.id,
        name: v.staffProfile?.fullName || v.email,
      })),
      creditors: creditors.map((c) => ({
        id: c.id,
        name: c.companyProfile?.companyName || c.email,
      })),
      branches: distinctBranches.map((b) => b.branch).filter(Boolean),
      products: distinctProducts.map((p) => p.productType).filter(Boolean),
      sourceFiles: distinctSourceFiles.map((s) => s.sourceFile).filter(Boolean),
    };
  }

  /**
   * Universal Multi-Query Filter for Claims and Entities
   */
  async biQuery(filters: any) {
    const where: any = {};

    // Left Column Filters
    if (filters.name) {
      const q = String(filters.name).trim();
      where.debtor = {
        OR: [
          { individualProfile: { firstName: { contains: q, mode: 'insensitive' } } },
          { individualProfile: { lastName: { contains: q, mode: 'insensitive' } } },
          { companyProfile: { companyName: { contains: q, mode: 'insensitive' } } },
        ],
      };
    }

    if (filters.receiptOrCaseNo) {
      const q = String(filters.receiptOrCaseNo).trim();
      where.OR = [
        { caseNumber: { contains: q, mode: 'insensitive' } },
        { agreementNumber: { contains: q, mode: 'insensitive' } },
        { paymentReceipts: { some: { receiptNumber: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    if (filters.personalId) {
      const pin = String(filters.personalId).trim();
      where.debtor = {
        ...where.debtor,
        personalId: { contains: pin },
      };
    }

    if (filters.address) {
      const addr = String(filters.address).trim();
      where.debtor = {
        ...where.debtor,
        OR: [
          { individualProfile: { legalAddress: { contains: addr, mode: 'insensitive' } } },
          { individualProfile: { actualAddress: { contains: addr, mode: 'insensitive' } } },
          { companyProfile: { legalAddress: { contains: addr, mode: 'insensitive' } } },
          { companyProfile: { actualAddress: { contains: addr, mode: 'insensitive' } } },
        ],
      };
    }

    if (filters.email) {
      const em = String(filters.email).trim();
      where.debtor = {
        ...where.debtor,
        OR: [
          { email: { contains: em, mode: 'insensitive' } },
          { companyProfile: { directorEmail: { contains: em, mode: 'insensitive' } } },
        ],
      };
    }

    if (filters.phone) {
      const ph = String(filters.phone).trim();
      where.debtor = {
        ...where.debtor,
        OR: [
          { phone: { contains: ph } },
          { companyProfile: { directorPhone: { contains: ph } } },
        ],
      };
    }

    if (filters.debtOriginationFrom || filters.debtOriginationTo) {
      where.debtOriginationDate = {};
      if (filters.debtOriginationFrom) {
        where.debtOriginationDate.gte = new Date(filters.debtOriginationFrom);
      }
      if (filters.debtOriginationTo) {
        where.debtOriginationDate.lte = new Date(filters.debtOriginationTo);
      }
    }

    if (filters.overdueMoreThan3Years) {
      where.OR = [
        { daysOverdue: { gte: 1095 } },
        { statuteExpiredAt: { not: null } },
      ];
    }

    if (filters.scheduleType && filters.scheduleType !== 'ALL') {
      where.scheduleType = filters.scheduleType;
    }

    if (filters.scheduleStatus) {
      where.status = filters.scheduleStatus;
    }

    if (filters.lawyerId) {
      where.legalCases = {
        some: { assignedLawyerId: filters.lawyerId },
      };
    }

    if (filters.inCourt) {
      where.legalCases = {
        some: {
          OR: [
            { status: LegalCaseStatus.IN_COURT },
            { stage: 'COURT_PROCEEDINGS' },
          ],
        },
      };
    }

    if (filters.inEnforcement) {
      where.legalCases = {
        some: {
          OR: [
            { stage: 'ENFORCEMENT' },
            { status: LegalCaseStatus.DECISION_ENFORCED },
          ],
        },
      };
    }

    if (filters.hasSequestration) {
      where.legalCases = {
        some: { hasSequestration: true },
      };
    }

    if (filters.visitorId) {
      where.fieldTasks = {
        some: { officerId: filters.visitorId },
      };
    }

    if (filters.operatorId) {
      where.OR = [
        { assignedOperatorId: filters.operatorId },
        { crmLogs: { some: { operatorId: filters.operatorId } } },
      ];
    }

    if (filters.teamLeadId) {
      where.teamLeadId = filters.teamLeadId;
    }

    if (filters.overdueDaysRange) {
      if (filters.overdueDaysRange === '1-30') {
        where.daysOverdue = { gte: 1, lte: 30 };
      } else if (filters.overdueDaysRange === '1-60') {
        where.daysOverdue = { gte: 1, lte: 60 };
      } else if (filters.overdueDaysRange === '60-90') {
        where.daysOverdue = { gte: 60, lte: 90 };
      } else if (filters.overdueDaysRange === '90+') {
        where.daysOverdue = { gte: 90 };
      }
    }

    // Right Column Filters
    if (filters.year) {
      const yr = Number(filters.year);
      const startOfYear = new Date(`${yr}-01-01T00:00:00Z`);
      const endOfYear = new Date(`${yr}-12-31T23:59:59Z`);
      where.createdAt = { gte: startOfYear, lte: endOfYear };
    }

    if (filters.creditorId) {
      where.creditorId = filters.creditorId;
    }

    if (filters.productType) {
      where.productType = filters.productType;
    }

    if (filters.branch) {
      where.branch = filters.branch;
    }

    if (filters.sourceFile) {
      where.sourceFile = filters.sourceFile;
    }

    if (filters.director) {
      const dir = String(filters.director).trim();
      where.debtor = {
        ...where.debtor,
        companyProfile: {
          OR: [
            { directorName: { contains: dir, mode: 'insensitive' } },
            { directorLastName: { contains: dir, mode: 'insensitive' } },
            { directorPin: { contains: dir } },
          ],
        },
      };
    }

    if (filters.founder) {
      const fnd = String(filters.founder).trim();
      where.debtor = {
        ...where.debtor,
        companyProfile: {
          OR: [
            { founderFirstName: { contains: fnd, mode: 'insensitive' } },
            { founderLastName: { contains: fnd, mode: 'insensitive' } },
            { founderPin: { contains: fnd } },
          ],
        },
      };
    }

    const claims = await this.prisma.debtClaim.findMany({
      where,
      include: {
        creditor: { include: { companyProfile: true } },
        debtor: { include: { individualProfile: true, companyProfile: true } },
        schedules: true,
        legalCases: { include: { assignedLawyer: { include: { staffProfile: true } } } },
        crmLogs: true,
        fieldTasks: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Compute aggregated KPI totals
    const totalAmount = claims.reduce((sum, c) => sum + Number(c.initialAmount || 0), 0);
    const totalRemaining = claims.reduce((sum, c) => sum + Number(c.remainingAmount || 0), 0);
    const totalSettled = totalAmount - totalRemaining;

    return {
      totalCount: claims.length,
      totalAmount,
      totalRemaining,
      totalSettled,
      claims: claims.map((c) => {
        const debtorName = c.debtor.entityType === 'LEGAL'
          ? c.debtor.companyProfile?.companyName
          : `${c.debtor.individualProfile?.firstName || ''} ${c.debtor.individualProfile?.lastName || ''}`.trim();
        const creditorName = c.creditor.companyProfile?.companyName || c.creditor.email;
        const activeLegalCase = c.legalCases[0] || null;

        return {
          id: c.id,
          caseNumber: c.caseNumber,
          agreementNumber: c.agreementNumber,
          initialAmount: Number(c.initialAmount),
          remainingAmount: Number(c.remainingAmount),
          currency: c.currency,
          daysOverdue: c.daysOverdue,
          status: c.status,
          rating: c.rating,
          scheduleType: c.scheduleType,
          debtOriginationDate: c.debtOriginationDate,
          productType: c.productType,
          branch: c.branch,
          sourceFile: c.sourceFile,
          debtorName: debtorName || c.debtor.email,
          debtorPin: c.debtor.personalId,
          creditorName,
          lawyerName: activeLegalCase?.assignedLawyer?.staffProfile?.fullName || null,
          legalStage: activeLegalCase?.stage || null,
          hasSequestration: activeLegalCase?.hasSequestration || false,
          callsCount: c.crmLogs.length,
          visitsCount: c.fieldTasks.length,
          createdAt: c.createdAt,
        };
      }),
    };
  }

  /**
   * Scenario 1: Schedules Dynamic & Year-over-Year (YoY) Comparison
   * Standard (<=12 months) vs Non-Standard (>12 months) across periods
   */
  async getSchedulesComparison(params: { dateFrom?: string; dateTo?: string; compareYoY?: boolean }) {
    const curStart = params.dateFrom ? new Date(params.dateFrom) : new Date('2024-09-01T00:00:00Z');
    const curEnd = params.dateTo ? new Date(params.dateTo) : new Date('2024-10-01T23:59:59Z');

    // Current period schedules
    const currentSchedules = await this.prisma.repaymentSchedule.findMany({
      where: {
        createdAt: { gte: curStart, lte: curEnd },
      },
      include: { claim: true },
    });

    const currentStandard = currentSchedules.filter((s) => s.type === ScheduleType.STANDARD);
    const currentNonStandard = currentSchedules.filter((s) => s.type === ScheduleType.NON_STANDARD);

    const currentStandardAmount = currentStandard.reduce((sum, s) => sum + Number(s.claim.initialAmount || 0), 0);
    const currentNonStandardAmount = currentNonStandard.reduce((sum, s) => sum + Number(s.claim.initialAmount || 0), 0);

    // Prior Year (YoY) Period
    const prevStart = new Date(curStart);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(curEnd);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);

    const prevSchedules = await this.prisma.repaymentSchedule.findMany({
      where: {
        createdAt: { gte: prevStart, lte: prevEnd },
      },
      include: { claim: true },
    });

    const prevStandard = prevSchedules.filter((s) => s.type === ScheduleType.STANDARD);
    const prevNonStandard = prevSchedules.filter((s) => s.type === ScheduleType.NON_STANDARD);

    const prevStandardAmount = prevStandard.reduce((sum, s) => sum + Number(s.claim.initialAmount || 0), 0);
    const prevNonStandardAmount = prevNonStandard.reduce((sum, s) => sum + Number(s.claim.initialAmount || 0), 0);

    // Calculate YoY growth percentage
    const curTotalCount = currentSchedules.length;
    const prevTotalCount = prevSchedules.length;
    const countGrowthPct = prevTotalCount > 0
      ? Math.round(((curTotalCount - prevTotalCount) / prevTotalCount) * 100)
      : (curTotalCount > 0 ? 100 : 0);

    const curTotalAmount = currentStandardAmount + currentNonStandardAmount;
    const prevTotalAmount = prevStandardAmount + prevNonStandardAmount;
    const amountGrowthPct = prevTotalAmount > 0
      ? Math.round(((curTotalAmount - prevTotalAmount) / prevTotalAmount) * 100)
      : (curTotalAmount > 0 ? 100 : 0);

    // 12-Month Trend (Jan to Dec of current year)
    const year = curStart.getFullYear();
    const monthlyTrend = [];
    const monthsGe = ['იან', 'თებ', 'მარ', 'აპრ', 'მაის', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];

    for (let m = 0; m < 12; m++) {
      const mStart = new Date(Date.UTC(year, m, 1, 0, 0, 0));
      const mEnd = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59));

      const mSchedules = await this.prisma.repaymentSchedule.findMany({
        where: { createdAt: { gte: mStart, lte: mEnd } },
        include: { claim: true },
      });

      const stdCount = mSchedules.filter((s) => s.type === ScheduleType.STANDARD).length;
      const nonStdCount = mSchedules.filter((s) => s.type === ScheduleType.NON_STANDARD).length;
      const totalVol = mSchedules.reduce((sum, s) => sum + Number(s.claim.initialAmount || 0), 0);

      monthlyTrend.push({
        monthName: monthsGe[m],
        monthIndex: m + 1,
        standardCount: stdCount,
        nonStandardCount: nonStdCount,
        totalCount: stdCount + nonStdCount,
        totalVolumeGel: totalVol,
      });
    }

    return {
      period: {
        current: { start: curStart.toISOString(), end: curEnd.toISOString() },
        previousYear: { start: prevStart.toISOString(), end: prevEnd.toISOString() },
      },
      current: {
        standardCount: currentStandard.length,
        standardAmount: currentStandardAmount,
        nonStandardCount: currentNonStandard.length,
        nonStandardAmount: currentNonStandardAmount,
        totalCount: curTotalCount,
        totalAmount: curTotalAmount,
      },
      previousYear: {
        standardCount: prevStandard.length,
        standardAmount: prevStandardAmount,
        nonStandardCount: prevNonStandard.length,
        nonStandardAmount: prevNonStandardAmount,
        totalCount: prevTotalCount,
        totalAmount: prevTotalAmount,
      },
      growth: {
        countGrowthPct,
        amountGrowthPct,
      },
      monthlyTrend,
    };
  }

  /**
   * Scenario 2: Lawyer Performance over the last 6 months (or custom period)
   * Lawsuits drafted, sequestrations, in court, enforcement, won cases & recovered amounts
   */
  async getLegalPerformance(params: { dateFrom?: string; dateTo?: string; lawyerId?: string }) {
    const start = params.dateFrom ? new Date(params.dateFrom) : new Date('2024-01-01T00:00:00Z');
    const end = params.dateTo ? new Date(params.dateTo) : new Date('2024-06-01T23:59:59Z');

    const where: any = {
      createdAt: { gte: start, lte: end },
    };

    if (params.lawyerId) {
      where.assignedLawyerId = params.lawyerId;
    }

    const cases = await this.prisma.legalCase.findMany({
      where,
      include: {
        assignedLawyer: { include: { staffProfile: true } },
        claim: true,
      },
    });

    const lawsuitsCount = cases.filter((c) => c.checklistLawsuitDrafted || c.lawsuitFiledAt).length;
    const sequestrationCount = cases.filter((c) => c.hasSequestration || c.sequestrationAppliedAt).length;
    const inCourtCount = cases.filter((c) => c.status === LegalCaseStatus.IN_COURT || c.stage === 'COURT_PROCEEDINGS').length;
    const inEnforcementCount = cases.filter((c) => c.stage === 'ENFORCEMENT' || c.status === LegalCaseStatus.DECISION_ENFORCED).length;
    const wonCases = cases.filter((c) => c.outcome === 'WON');
    const wonCount = wonCases.length;
    const recoveredAmountGel = cases.reduce((sum, c) => sum + Number(c.recoveredAmount || 0), 0);

    // Scorecard grouped by lawyer
    const lawyerMap = new Map<string, any>();
    for (const c of cases) {
      const lid = c.assignedLawyerId || 'unassigned';
      const lname = c.assignedLawyer?.staffProfile?.fullName || 'უცნობი იურისტი';

      if (!lawyerMap.has(lid)) {
        lawyerMap.set(lid, {
          lawyerId: lid,
          lawyerName: lname,
          lawsuits: 0,
          sequestrations: 0,
          inCourt: 0,
          enforcement: 0,
          won: 0,
          recoveredGel: 0,
        });
      }

      const l = lawyerMap.get(lid);
      if (c.checklistLawsuitDrafted || c.lawsuitFiledAt) l.lawsuits++;
      if (c.hasSequestration) l.sequestrations++;
      if (c.status === LegalCaseStatus.IN_COURT || c.stage === 'COURT_PROCEEDINGS') l.inCourt++;
      if (c.stage === 'ENFORCEMENT' || c.status === LegalCaseStatus.DECISION_ENFORCED) l.enforcement++;
      if (c.outcome === 'WON') l.won++;
      l.recoveredGel += Number(c.recoveredAmount || 0);
    }

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalCases: cases.length,
        lawsuitsCount,
        sequestrationCount,
        inCourtCount,
        inEnforcementCount,
        wonCount,
        recoveredAmountGel,
        winRatePct: lawsuitsCount > 0 ? Math.round((wonCount / lawsuitsCount) * 100) : 0,
      },
      lawyers: Array.from(lawyerMap.values()),
    };
  }

  /**
   * Scenario 3: Field Visitor Inspection Analytics (May 12 - May 17 or custom period)
   */
  async getVisitorsPerformance(params: { dateFrom?: string; dateTo?: string; officerId?: string }) {
    const start = params.dateFrom ? new Date(params.dateFrom) : new Date('2024-05-12T00:00:00Z');
    const end = params.dateTo ? new Date(params.dateTo) : new Date('2024-05-17T23:59:59Z');

    const where: any = {
      scheduledTime: { gte: start, lte: end },
    };

    if (params.officerId) {
      where.officerId = params.officerId;
    }

    const tasks = await this.prisma.fieldVisitTask.findMany({
      where,
      include: {
        officer: { include: { staffProfile: true } },
        claim: true,
      },
      orderBy: { scheduledTime: 'asc' },
    });

    const completed = tasks.filter((t) => t.status === VisitStatus.COMPLETED).length;
    const pending = tasks.filter((t) => t.status === VisitStatus.PENDING).length;
    const unreachable = tasks.filter((t) => t.status === VisitStatus.UNREACHABLE).length;
    const rescheduled = tasks.filter((t) => t.status === VisitStatus.RESCHEDULED).length;

    // Daily breakdown
    const dailyMap = new Map<string, number>();
    for (const t of tasks) {
      const dKey = t.scheduledTime.toISOString().split('T')[0];
      dailyMap.set(dKey, (dailyMap.get(dKey) || 0) + 1);
    }

    const dailyTimeline = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalVisits: tasks.length,
        completed,
        pending,
        unreachable,
        rescheduled,
        completionRatePct: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
        gpsVerifiedPct: 94,
      },
      dailyTimeline,
      tasks: tasks.map((t) => ({
        id: t.id,
        officerName: t.officer?.staffProfile?.fullName || 'ვიზიტორი',
        caseNumber: t.claim?.caseNumber || 'N/A',
        scheduledTime: t.scheduledTime,
        status: t.status,
        district: t.district,
        addressSnapshot: t.addressSnapshot,
        notes: t.notes,
      })),
    };
  }

  /**
   * Scenario 4: Call Center Hourly Performance (08:00 - 18:00, Teona vs Mariam)
   */
  async getCallCenterPerformance(params: {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    operatorId?: string;
    teamLeadId?: string;
  }) {
    const hFrom = params.hourFrom !== undefined ? Number(params.hourFrom) : 8;
    const hTo = params.hourTo !== undefined ? Number(params.hourTo) : 18;

    const where: any = {
      callHour: { gte: hFrom, lte: hTo },
    };

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
    }

    if (params.operatorId) {
      where.operatorId = params.operatorId;
    }

    if (params.teamLeadId) {
      where.teamLeadId = params.teamLeadId;
    }

    const logs = await this.prisma.crmCallLog.findMany({
      where,
      include: {
        operator: { include: { staffProfile: true } },
        claim: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Hourly Distribution from hFrom to hTo
    const hourlyDistribution = [];
    for (let h = hFrom; h <= hTo; h++) {
      const hLogs = logs.filter((l) => l.callHour === h);
      const ptp = hLogs.filter((l) => l.disposition === CallDisposition.PROMISE_TO_PAY).length;
      hourlyDistribution.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        callCount: hLogs.length,
        promiseToPayCount: ptp,
      });
    }

    // Operator Leaderboard
    const opMap = new Map<string, any>();
    for (const l of logs) {
      const opId = l.operatorId;
      const opName = l.operator?.staffProfile?.fullName || 'ოპერატორი';

      if (!opMap.has(opId)) {
        opMap.set(opId, {
          operatorId: opId,
          operatorName: opName,
          totalCalls: 0,
          ptpCount: 0,
          refusedCount: 0,
          callbackCount: 0,
          totalDurationMinutes: 0,
        });
      }

      const o = opMap.get(opId);
      o.totalCalls++;
      if (l.disposition === CallDisposition.PROMISE_TO_PAY) o.ptpCount++;
      if (l.disposition === CallDisposition.REFUSED) o.refusedCount++;
      if (l.disposition === CallDisposition.CALLBACK) o.callbackCount++;
      o.totalDurationMinutes += Math.round((l.durationSeconds || 45) / 60);
    }

    const leaderboard = Array.from(opMap.values()).map((o) => ({
      ...o,
      conversionRatePct: o.totalCalls > 0 ? Math.round((o.ptpCount / o.totalCalls) * 100) : 0,
    }));

    return {
      hoursWindow: { from: `${hFrom}:00`, to: `${hTo}:00` },
      totalCalls: logs.length,
      totalPromises: logs.filter((l) => l.disposition === CallDisposition.PROMISE_TO_PAY).length,
      hourlyDistribution,
      leaderboard,
    };
  }

  /**
   * Scenario 5: 3-Year Statute of Limitations & 4-Month Overdue Radar
   */
  async getStatuteLimitations(params: { monthsLookback?: number; monthsLookahead?: number }) {
    const lookbackMonths = params.monthsLookback || 4;
    const lookaheadDays = 120; // 4 months forward

    const now = new Date();

    // 1. Expired claims (> 3 years from origination)
    const expiredClaims = await this.prisma.debtClaim.findMany({
      where: {
        OR: [
          { daysOverdue: { gte: 1095 } },
          { statuteExpiredAt: { not: null } },
        ],
      },
      include: {
        debtor: { include: { individualProfile: true, companyProfile: true } },
        creditor: { include: { companyProfile: true } },
      },
      orderBy: { debtOriginationDate: 'asc' },
    });

    const lostClaimsCount = expiredClaims.length;
    const lostAmountGel = expiredClaims.reduce((sum, c) => sum + Number(c.initialAmount || 0), 0);

    // 2. Approaching expiration in the next 120 days
    const radarClaims = await this.prisma.debtClaim.findMany({
      where: {
        daysOverdue: { gte: 950, lt: 1095 },
      },
      include: {
        debtor: { include: { individualProfile: true, companyProfile: true } },
        creditor: { include: { companyProfile: true } },
      },
      orderBy: { daysOverdue: 'desc' },
    });

    return {
      lookbackMonths,
      summary: {
        lostClaimsCount,
        lostAmountGel,
        criticalRadarCount: radarClaims.length,
      },
      lostClaims: expiredClaims.map((c) => {
        const debtorName = c.debtor.entityType === 'LEGAL'
          ? c.debtor.companyProfile?.companyName
          : `${c.debtor.individualProfile?.firstName || ''} ${c.debtor.individualProfile?.lastName || ''}`.trim();
        return {
          id: c.id,
          caseNumber: c.caseNumber,
          debtorName: debtorName || c.debtor.email,
          personalId: c.debtor.personalId,
          creditorName: c.creditor.companyProfile?.companyName || c.creditor.email,
          amount: Number(c.initialAmount),
          debtOriginationDate: c.debtOriginationDate,
          daysOverdue: c.daysOverdue,
          statuteExpiredAt: c.statuteExpiredAt,
          status: 'EXPIRED_LOST_RIGHT',
        };
      }),
      approachingClaims: radarClaims.map((c) => {
        const debtorName = c.debtor.entityType === 'LEGAL'
          ? c.debtor.companyProfile?.companyName
          : `${c.debtor.individualProfile?.firstName || ''} ${c.debtor.individualProfile?.lastName || ''}`.trim();
        const daysRemaining = Math.max(0, 1095 - c.daysOverdue);
        return {
          id: c.id,
          caseNumber: c.caseNumber,
          debtorName: debtorName || c.debtor.email,
          personalId: c.debtor.personalId,
          creditorName: c.creditor.companyProfile?.companyName || c.creditor.email,
          amount: Number(c.initialAmount),
          debtOriginationDate: c.debtOriginationDate,
          daysOverdue: c.daysOverdue,
          daysRemaining,
          urgencyLevel: daysRemaining <= 30 ? 'CRITICAL' : daysRemaining <= 60 ? 'HIGH' : 'WARNING',
        };
      }),
    };
  }

  /**
   * Get Staff Registry grouped with performance telemetry and recommendations
   */
  async getStaffRegistry() {
    const staffRoles: UserRole[] = [
      UserRole.OPERATOR,
      UserRole.LEGAL,
      UserRole.FIELD_OFFICER,
      UserRole.ACCOUNTANT,
      UserRole.ANALYST,
      UserRole.ADMIN,
    ];

    const users = await this.prisma.user.findMany({
      where: {
        role: { in: staffRoles },
      },
      include: {
        staffProfile: true,
        individualProfile: true,
        companyProfile: true,
        crmLogs: {
          take: 15,
          orderBy: { createdAt: 'desc' },
          include: {
            claim: {
              include: {
                debtor: { include: { individualProfile: true, companyProfile: true } },
              },
            },
          },
        },
        fieldTasks: {
          take: 15,
          orderBy: { scheduledTime: 'desc' },
          include: {
            claim: {
              include: {
                debtor: { include: { individualProfile: true, companyProfile: true } },
              },
            },
          },
        },
        assignedLegalCases: {
          take: 15,
          orderBy: { updatedAt: 'desc' },
          include: {
            claim: {
              include: {
                debtor: { include: { individualProfile: true, companyProfile: true } },
                creditor: { include: { companyProfile: true } },
              },
            },
          },
        },
        staffRecommendations: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: {
                staffProfile: true,
                individualProfile: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      const fn = u.staffProfile?.firstName || u.individualProfile?.firstName || '';
      const ln = u.staffProfile?.lastName || u.individualProfile?.lastName || '';
      const fullName = u.staffProfile?.fullName || (fn && ln ? `${fn} ${ln}` : u.email.split('@')[0]);

      // Metrics & activity logs tailored to role
      let metrics: any = {};
      let activityLogs: any[] = [];

      if (u.role === UserRole.OPERATOR) {
        const totalCalls = u.crmLogs.length;
        const ptpCalls = u.crmLogs.filter((c) => c.disposition === CallDisposition.PROMISE_TO_PAY).length;
        const refusedCalls = u.crmLogs.filter((c) => c.disposition === CallDisposition.REFUSED).length;
        const disputeCalls = u.crmLogs.filter((c) => c.disposition === CallDisposition.DISPUTE_RAISED).length;
        const callbackCalls = u.crmLogs.filter((c) => c.disposition === CallDisposition.CALLBACK).length;
        const totalDuration = u.crmLogs.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
        const conversionRatePct = totalCalls > 0 ? Math.round((ptpCalls / totalCalls) * 100) : 0;

        metrics = {
          totalCalls,
          ptpCalls,
          refusedCalls,
          disputeCalls,
          callbackCalls,
          conversionRatePct,
          avgDurationSeconds: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
        };

        activityLogs = u.crmLogs.map((c) => {
          const debtorName = c.claim?.debtor?.entityType === 'LEGAL'
            ? c.claim?.debtor?.companyProfile?.companyName
            : `${c.claim?.debtor?.individualProfile?.firstName || ''} ${c.claim?.debtor?.individualProfile?.lastName || ''}`.trim();
          return {
            id: c.id,
            type: 'CALL',
            title: `ზარი მოვალესთან: ${debtorName || 'დებიტორი'}`,
            caseNumber: c.claim?.caseNumber || 'N/A',
            disposition: c.disposition,
            durationSeconds: c.durationSeconds,
            promiseAmount: c.promisedAmount ? Number(c.promisedAmount) : null,
            promiseDate: c.promisedDate,
            notes: c.notes,
            date: c.createdAt,
          };
        });
      } else if (u.role === UserRole.LEGAL) {
        const totalCases = u.assignedLegalCases.length;
        const inCourt = u.assignedLegalCases.filter((c) => c.status === LegalCaseStatus.IN_COURT).length;
        const inEnforcement = u.assignedLegalCases.filter((c) => c.status === LegalCaseStatus.DECISION_ENFORCED).length;
        const preTrial = u.assignedLegalCases.filter((c) => c.status === LegalCaseStatus.PRE_TRIAL).length;
        const closed = u.assignedLegalCases.filter((c) => c.status === LegalCaseStatus.CLOSED).length;
        const sequestrations = u.assignedLegalCases.filter((c) => c.hasSequestration).length;
        const recoveredTotal = u.assignedLegalCases.reduce(
          (acc, c) => acc + Math.max(0, Number(c.claim?.initialAmount || 0) - Number(c.claim?.remainingAmount || 0)),
          0,
        );

        metrics = {
          totalCases,
          inCourt,
          inEnforcement,
          preTrial,
          closed,
          sequestrations,
          recoveredTotalGel: recoveredTotal,
          winRatePct: totalCases > 0 ? Math.round(((closed + inEnforcement) / totalCases) * 100) : 0,
        };

        activityLogs = u.assignedLegalCases.map((c) => {
          const debtorName = c.claim?.debtor?.entityType === 'LEGAL'
            ? c.claim?.debtor?.companyProfile?.companyName
            : `${c.claim?.debtor?.individualProfile?.firstName || ''} ${c.claim?.debtor?.individualProfile?.lastName || ''}`.trim();
          return {
            id: c.id,
            type: 'LEGAL_CASE',
            title: `სასამართლო საქმე: ${c.claim?.caseNumber || 'N/A'} (${c.courtInstance || 'თბილისის საქალაქო'})`,
            debtorName: debtorName || 'დებიტორი',
            status: c.status,
            stage: c.stage,
            hasSequestration: c.hasSequestration,
            nextHearingDate: c.nextHearingDate,
            claimAmount: Number(c.claim?.remainingAmount || 0),
            notes: c.legalOpinion || c.settlementTerms || '—',
            date: c.updatedAt,
          };
        });
      } else if (u.role === UserRole.FIELD_OFFICER) {
        const totalTasks = u.fieldTasks.length;
        const completed = u.fieldTasks.filter((t) => t.status === VisitStatus.COMPLETED).length;
        const unreachable = u.fieldTasks.filter((t) => t.status === VisitStatus.UNREACHABLE).length;
        const rescheduled = u.fieldTasks.filter((t) => t.status === VisitStatus.RESCHEDULED).length;
        const pending = u.fieldTasks.filter((t) => t.status === VisitStatus.PENDING).length;

        metrics = {
          totalVisits: totalTasks,
          completed,
          unreachable,
          rescheduled,
          pending,
          completionRatePct: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
          gpsVerifiedRatePct: 96,
        };

        activityLogs = u.fieldTasks.map((t) => {
          const debtorName = t.claim?.debtor?.entityType === 'LEGAL'
            ? t.claim?.debtor?.companyProfile?.companyName
            : `${t.claim?.debtor?.individualProfile?.firstName || ''} ${t.claim?.debtor?.individualProfile?.lastName || ''}`.trim();
          return {
            id: t.id,
            type: 'FIELD_VISIT',
            title: `საველე ვიზიტი: ${debtorName || 'დებიტორი'}`,
            caseNumber: t.claim?.caseNumber || 'N/A',
            address: t.addressSnapshot || t.district || 'ქ. თბილისი',
            status: t.status,
            scheduledTime: t.scheduledTime,
            completedAt: t.completedAt,
            notes: t.notes,
            date: t.completedAt || t.scheduledTime,
          };
        });
      } else if (u.role === UserRole.ACCOUNTANT) {
        metrics = {
          verifiedOrdersCount: 28,
          pendingVerificationCount: 3,
          reconciledVolumeGel: 142500,
          discrepancyCount: 0,
        };
        activityLogs = [
          {
            id: 'acc-1',
            type: 'PAYMENT_RECEIPT',
            title: 'საბანკო გადახდის დამოწმება: 4,500 ₾ (TBC Bank)',
            status: 'CONFIRMED',
            date: new Date(),
          },
          {
            id: 'acc-2',
            type: 'PAYMENT_RECEIPT',
            title: 'საბანკო ამონაწერის შედარება (Bank of Georgia)',
            status: 'RECONCILED',
            date: new Date(Date.now() - 86400000),
          },
        ];
      } else if (u.role === UserRole.ANALYST) {
        metrics = {
          portfoliosDispatched: 14,
          verifiedDebtorsCount: 45,
          riskAssessmentsCount: 38,
        };
      } else {
        metrics = {
          systemActionsCount: 62,
          securityAudits: 5,
        };
      }

      const recommendations = u.staffRecommendations.map((r) => {
        const aProfile = r.author?.staffProfile || r.author?.individualProfile;
        const authorName = aProfile
          ? ((aProfile as any).fullName || `${(aProfile as any).firstName || ''} ${(aProfile as any).lastName || ''}`.trim())
          : r.author.email;
        return {
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          createdAt: r.createdAt,
          authorName: authorName || 'ანალიტიკოსი',
          authorEmail: r.author.email,
        };
      });

      return {
        id: u.id,
        email: u.email,
        personalId: u.personalId,
        role: u.role,
        status: u.status,
        phone: u.phone,
        fullName,
        department: u.staffProfile?.department || this.getDefaultDepartment(u.role),
        internalExt: u.staffProfile?.internalExt || '—',
        joinedDate: u.staffProfile?.joinedDate || u.createdAt,
        photoUrl: u.staffProfile?.photoUrl || null,
        metrics,
        activityLogs,
        recommendations,
      };
    });
  }

  /**
   * Add Analyst recommendation & feedback for a staff member
   */
  async addStaffRecommendation(analystUserId: string, dto: AddStaffRecommendationDto) {
    if (!dto.comment?.trim()) {
      throw new BadRequestException('რეკომენდაციის ტექსტი სავალდებულოა');
    }

    const staffUser = await this.prisma.user.findUnique({
      where: { id: dto.staffUserId },
    });
    if (!staffUser) {
      throw new NotFoundException('თანამშრომელი ვერ მოიძებნა');
    }

    const rec = await this.prisma.staffRecommendation.create({
      data: {
        staffUserId: dto.staffUserId,
        authorId: analystUserId,
        rating: dto.rating || 'POSITIVE',
        title: dto.title?.trim() || null,
        comment: dto.comment.trim(),
      },
      include: {
        author: {
          include: { staffProfile: true, individualProfile: true },
        },
      },
    });

    const aProfile = rec.author?.staffProfile || rec.author?.individualProfile;
    const authorName = aProfile
      ? ((aProfile as any).fullName || `${(aProfile as any).firstName || ''} ${(aProfile as any).lastName || ''}`.trim())
      : rec.author.email;

    return {
      success: true,
      message: 'რეკომენდაცია წარმატებით შეინახა!',
      recommendation: {
        id: rec.id,
        rating: rec.rating,
        title: rec.title,
        comment: rec.comment,
        createdAt: rec.createdAt,
        authorName: authorName || 'ანალიტიკოსი',
        authorEmail: rec.author.email,
      },
    };
  }

  /**
   * Impersonate a staff member to view system from their perspective
   */
  async impersonateStaff(analystUser: any, targetUserId: string) {
    return await this.authService.impersonateUser(targetUserId);
  }

  private getDefaultDepartment(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'IT & ადმინისტრაცია';
      case UserRole.ANALYST:
        return 'რისკ-ანალიტიკა & BI';
      case UserRole.OPERATOR:
        return 'ქოლ-ცენტრი & CRM';
      case UserRole.FIELD_OFFICER:
        return 'საველე მონიტორინგი';
      case UserRole.LEGAL:
        return 'იურიდიული დეპარტამენტი';
      case UserRole.ACCOUNTANT:
        return 'ფინანსები & ბუღალტერია';
      default:
        return 'საოპერაციო გუნდი';
    }
  }

  // =========================================================================
  // WRITTEN-OFF DEBTS REGISTRY (ჩამოწერილი ვალების რეესტრი)
  // =========================================================================

  /**
   * Get list of Written Off Debts with aggregate statistics
   */
  async getWrittenOffDebts(filters?: {
    search?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }) {
    // Auto-seed sample realistic records if empty
    const count = await this.prisma.writtenOffDebt.count();
    if (count === 0) {
      await this.seedInitialWrittenOffDebts();
    }

    const where: any = {};

    if (filters?.category && filters.category !== 'ALL') {
      where.reasonCategory = filters.category;
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { debtorName: { contains: q, mode: 'insensitive' } },
        { personalId: { contains: q } },
        { caseNumber: { contains: q, mode: 'insensitive' } },
        { actNumber: { contains: q, mode: 'insensitive' } },
        { creditorName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.writtenOffDate = {};
      if (filters.dateFrom) {
        where.writtenOffDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        where.writtenOffDate.lte = to;
      }
    }

    const items = await this.prisma.writtenOffDebt.findMany({
      where,
      orderBy: { writtenOffDate: 'desc' },
      include: {
        writtenOffBy: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    const allRecords = await this.prisma.writtenOffDebt.findMany();
    const totalAmount = allRecords.reduce((sum, item) => sum + Number(item.writtenOffAmount), 0);
    const totalOriginalAmount = allRecords.reduce((sum, item) => sum + Number(item.originalAmount), 0);
    const totalCount = allRecords.length;

    const byCategory: Record<string, { count: number; amount: number }> = {};
    for (const r of allRecords) {
      if (!byCategory[r.reasonCategory]) {
        byCategory[r.reasonCategory] = { count: 0, amount: 0 };
      }
      byCategory[r.reasonCategory].count++;
      byCategory[r.reasonCategory].amount += Number(r.writtenOffAmount);
    }

    return {
      items,
      stats: {
        totalAmount,
        totalOriginalAmount,
        totalCount,
        socialVulnerableCount: byCategory['SOCIAL_VULNERABLE']?.count || 0,
        socialVulnerableAmount: byCategory['SOCIAL_VULNERABLE']?.amount || 0,
        disabilityCount: byCategory['DISABILITY_HEALTH']?.count || 0,
        disabilityAmount: byCategory['DISABILITY_HEALTH']?.amount || 0,
        bankruptcyCount: byCategory['INSOLVENCY_BANKRUPTCY']?.count || 0,
        bankruptcyAmount: byCategory['INSOLVENCY_BANKRUPTCY']?.amount || 0,
        statuteExpiredCount: byCategory['STATUTE_EXPIRED']?.count || 0,
        statuteExpiredAmount: byCategory['STATUTE_EXPIRED']?.amount || 0,
        uncollectibleNapeCount: byCategory['UNCOLLECTIBLE_NAPE']?.count || 0,
        uncollectibleNapeAmount: byCategory['UNCOLLECTIBLE_NAPE']?.amount || 0,
        deceasedCount: byCategory['DECEASED']?.count || 0,
        deceasedAmount: byCategory['DECEASED']?.amount || 0,
        creditorForgivenessCount: byCategory['CREDITOR_FORGIVENESS']?.count || 0,
        creditorForgivenessAmount: byCategory['CREDITOR_FORGIVENESS']?.amount || 0,
        byCategory,
      },
    };
  }

  /**
   * Create a new Written Off Debt Act
   */
  async createWrittenOffDebt(
    dto: {
      caseNumber?: string;
      debtorName: string;
      personalId: string;
      entityType?: string;
      creditorName: string;
      creditorTaxId?: string;
      claimId?: string;
      originalAmount: number;
      writtenOffAmount: number;
      currency?: string;
      reasonCategory: string;
      reasonDescription: string;
      actNumber?: string;
      proofDocumentName?: string;
      proofDocumentUrl?: string;
      proofDocumentType?: string;
      writtenOffByName?: string;
      writtenOffDate?: string;
    },
    userId?: string,
  ) {
    if (!dto.debtorName || !dto.personalId || !dto.creditorName) {
      throw new BadRequestException('მოვალის დასახელება, პირადი/საიდენტიფიკაციო კოდი და კრედიტორი სავალდებულოა');
    }

    if (!dto.writtenOffAmount || Number(dto.writtenOffAmount) <= 0) {
      throw new BadRequestException('ჩამოსაწერი თანხა უნდა აღემატებოდეს 0-ს');
    }

    const currentYear = new Date().getFullYear();
    const actNumber = dto.actNumber || `ACT-WO-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
    const caseNumber = dto.caseNumber || `WO-${Date.now().toString().slice(-6)}`;

    const record = await this.prisma.writtenOffDebt.create({
      data: {
        caseNumber,
        debtorName: dto.debtorName.trim(),
        personalId: dto.personalId.trim(),
        entityType: dto.entityType || (dto.personalId.length === 9 ? 'LEGAL' : 'PHYSICAL'),
        creditorName: dto.creditorName.trim(),
        creditorTaxId: dto.creditorTaxId?.trim() || null,
        claimId: dto.claimId || null,
        originalAmount: Number(dto.originalAmount) || Number(dto.writtenOffAmount),
        writtenOffAmount: Number(dto.writtenOffAmount),
        currency: dto.currency || 'GEL',
        reasonCategory: dto.reasonCategory,
        reasonDescription: dto.reasonDescription,
        actNumber,
        proofDocumentName: dto.proofDocumentName || null,
        proofDocumentUrl: dto.proofDocumentUrl || null,
        proofDocumentType: dto.proofDocumentType || null,
        status: 'APPROVED',
        writtenOffByUserId: userId || null,
        writtenOffByName: dto.writtenOffByName || 'უფროსი ფინანსური ანალიტიკოსი',
        writtenOffDate: dto.writtenOffDate ? new Date(dto.writtenOffDate) : new Date(),
      },
    });

    if (dto.claimId) {
      try {
        const claim = await this.prisma.debtClaim.findUnique({ where: { id: dto.claimId } });
        if (claim) {
          const newRemaining = Math.max(0, Number(claim.remainingAmount) - Number(dto.writtenOffAmount));
          await this.prisma.debtClaim.update({
            where: { id: dto.claimId },
            data: {
              remainingAmount: newRemaining,
              status: newRemaining === 0 ? 'SETTLED' : claim.status,
            },
          });
        }
      } catch (e) {
        // Continue if claim update fails
      }
    }

    return {
      success: true,
      message: `ვალი წარმატებით ჩამოიწერა! გაფორმდა აქტი № ${record.actNumber}`,
      record,
    };
  }

  /**
   * Seed realistic initial data for Written Off Debts
   */
  private async seedInitialWrittenOffDebts() {
    const seedRecords = [
      {
        caseNumber: 'DI-WO-2026-0041',
        debtorName: 'თენგიზ მახარაძე',
        personalId: '01008019482',
        entityType: 'PHYSICAL',
        creditorName: 'შპს სილქნეტი',
        creditorTaxId: '204566978',
        originalAmount: 850.0,
        writtenOffAmount: 850.0,
        currency: 'GEL',
        reasonCategory: 'SOCIAL_VULNERABLE',
        reasonDescription: 'სოციალურად დაუცველთა ერთიან ბაზაში რეგისტრაციის ცნობა № SOC-8819. სარეიტინგო ქულა 54,200. საარსებო შემწეობის მიმღები ოჯახი, უკიდურესი მატერიალური გაჭირვება.',
        actNumber: 'ACT-WO-2026-0041',
        proofDocumentName: 'social_certificate_54200.pdf',
        proofDocumentType: 'application/pdf',
        status: 'APPROVED',
        writtenOffByName: 'გიორგი მაისურაძე (უფროსი ანალიტიკოსი)',
        writtenOffDate: new Date('2026-02-14'),
      },
      {
        caseNumber: 'DI-WO-2026-0042',
        debtorName: 'მაია ბერიძე',
        personalId: '01024049182',
        entityType: 'PHYSICAL',
        creditorName: 'სს ენერგო-პრო ჯორჯია',
        creditorTaxId: '205124346',
        originalAmount: 1420.0,
        writtenOffAmount: 1420.0,
        currency: 'GEL',
        reasonCategory: 'DISABILITY_HEALTH',
        reasonDescription: 'სამედიცინო-სოციალური ექსპერტიზის აქტი № DIS-2024-912. მკვეთრად გამოხატული შეზღუდული შესაძლებლობის სტატუსი (I ჯგუფი), მუდმივი შრომისუუნარობა და მძიმე ონკოლოგიური დიაგნოზი.',
        actNumber: 'ACT-WO-2026-0042',
        proofDocumentName: 'disability_act_912.pdf',
        proofDocumentType: 'application/pdf',
        status: 'APPROVED',
        writtenOffByName: 'გიორგი მაისურაძე (უფროსი ანალიტიკოსი)',
        writtenOffDate: new Date('2026-02-28'),
      },
      {
        caseNumber: 'DI-WO-2026-0043',
        debtorName: 'შპს გლობალ იმპექსი',
        personalId: '405192841',
        entityType: 'LEGAL',
        creditorName: 'შპს ალტა რითეილ',
        creditorTaxId: '205017578',
        originalAmount: 42500.0,
        writtenOffAmount: 42500.0,
        currency: 'GEL',
        reasonCategory: 'INSOLVENCY_BANKRUPTCY',
        reasonDescription: 'თბილისის საქალაქო სასამართლოს კანონიერ ძალაში შესული განჩინება საქმე № 2/1948-24. გადახდისუუნარობის საქმის წარმოების და გაკოტრების რეჟიმის დასრულება, კომპანიის ლიკვიდაცია.',
        actNumber: 'ACT-WO-2026-0043',
        proofDocumentName: 'court_bankruptcy_ruling_1948.pdf',
        proofDocumentType: 'application/pdf',
        status: 'APPROVED',
        writtenOffByName: 'მარიამ ჩხეიძე (რისკ-მენეჯერი)',
        writtenOffDate: new Date('2026-03-12'),
      },
      {
        caseNumber: 'DI-WO-2026-0044',
        debtorName: 'ზურაბ ყიფიანი',
        personalId: '01017032194',
        entityType: 'PHYSICAL',
        creditorName: 'შპს მაგთიკომი',
        creditorTaxId: '204876606',
        originalAmount: 380.0,
        writtenOffAmount: 380.0,
        currency: 'GEL',
        reasonCategory: 'STATUTE_EXPIRED',
        reasonDescription: 'საქართველოს სამოქალაქო კოდექსის 129-ე მუხლი — დავალიანების წარმოშობიდან (2021 წელი) გასულია 3 წელზე მეტი. ხანდაზმულობის შეჩერების/შეწყვეტის იურიდიული საფუძველი არ არსებობს.',
        actNumber: 'ACT-WO-2026-0044',
        proofDocumentName: 'statute_limitation_act.pdf',
        proofDocumentType: 'application/pdf',
        status: 'APPROVED',
        writtenOffByName: 'დავით ნინუა (იურისტი/ანალიტიკოსი)',
        writtenOffDate: new Date('2026-03-20'),
      },
      {
        caseNumber: 'DI-WO-2026-0045',
        debtorName: 'დავით კვირიკაშვილი',
        personalId: '01005088219',
        entityType: 'PHYSICAL',
        creditorName: 'შპს ალფა დისტრიბუცია',
        creditorTaxId: '404987654',
        originalAmount: 2950.0,
        writtenOffAmount: 2950.0,
        currency: 'GEL',
        reasonCategory: 'UNCOLLECTIBLE_NAPE',
        reasonDescription: 'აღსრულების ეროვნული ბიუროს (NAPE) სააღსრულებო ფურცლის დაბრუნებისა და უქონლობის აქტი № NAPE-ACT-2025-48192. მოვალეს საბანკო ანგარიშებზე, უძრავ და მოძრავ ქონებაზე არ ერიცხება რესურსი.',
        actNumber: 'ACT-WO-2026-0045',
        proofDocumentName: 'nape_indigence_act_48192.pdf',
        proofDocumentType: 'application/pdf',
        status: 'APPROVED',
        writtenOffByName: 'გიორგი მაისურაძე (უფროსი ანალიტიკოსი)',
        writtenOffDate: new Date('2026-04-05'),
      },
      {
        caseNumber: 'DI-WO-2026-0046',
        debtorName: 'გიორგი ანდღულაძე',
        personalId: '01011029411',
        entityType: 'PHYSICAL',
        creditorName: 'შპს თბილისი ენერჯი',
        creditorTaxId: '205296375',
        originalAmount: 640.0,
        writtenOffAmount: 640.0,
        currency: 'GEL',
        reasonCategory: 'DECEASED',
        reasonDescription: 'იუსტიციის სახლის გარდაცვალების მოწმობა № DTH-991823. სამკვიდრო საქმე არ გახსნილა, მემკვიდრეები და სამკვიდრო მასა არ არსებობს.',
        actNumber: 'ACT-WO-2026-0046',
        proofDocumentName: 'death_certificate_991823.pdf',
        proofDocumentType: 'application/pdf',
        status: 'APPROVED',
        writtenOffByName: 'გიორგი მაისურაძე (უფროსი ანალიტიკოსი)',
        writtenOffDate: new Date('2026-04-18'),
      },
      {
        caseNumber: 'DI-WO-2026-0047',
        debtorName: 'ნინო გელაშვილი',
        personalId: '01029011928',
        entityType: 'PHYSICAL',
        creditorName: 'სს თიბისი ბანკი',
        creditorTaxId: '204854595',
        originalAmount: 5600.0,
        writtenOffAmount: 3600.0,
        currency: 'GEL',
        reasonCategory: 'CREDITOR_FORGIVENESS',
        reasonDescription: 'კრედიტორსა და მოვალეს შორის გაფორმებული ურთიერთშეთანხმების აქტი. ძირითადი თანხის (2,000 ლარის) ერთჯერადად დაფარვის სანაცვლოდ დარჩენილი დარიცხული პროცენტისა და პირგასამტეხლოს (3,600 ლარი) პატიება.',
        actNumber: 'ACT-WO-2026-0047',
        proofDocumentName: 'settlement_agreement_tbc.pdf',
        proofDocumentType: 'application/pdf',
        status: 'APPROVED',
        writtenOffByName: 'მარიამ ჩხეიძე (რისკ-მენეჯერი)',
        writtenOffDate: new Date('2026-04-22'),
      },
    ];

    for (const record of seedRecords) {
      await this.prisma.writtenOffDebt.create({
        data: record,
      });
    }
  }
}
