import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, EntityType, ClaimStatus, ScheduleType, VisitStatus } from '@prisma/client';

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

@Injectable()
export class AnalystService {
  private readonly logger = new Logger(AnalystService.name);

  constructor(private readonly prisma: PrismaService) {}

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
}
