import { Injectable, NotFoundException, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallDisposition, ClaimStatus, UserRole, ScheduleType } from '@prisma/client';

export interface LogCallDto {
  claimId: string;
  disposition: CallDisposition;
  promisedDate?: string;
  promisedAmount?: number;
  notes: string;
}

export interface SaveScheduleDto {
  type: 'STANDARD' | 'NON_STANDARD';
  totalMonths: number;
  paymentDay: number; // 1 to 31
  startDate?: string;
  installments?: Array<{
    installmentNo: number;
    dueDate?: string;
    amount: number;
  }>;
  notes?: string;
}

export interface RespondScheduleDto {
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
}

export interface AddDebtorContactDto {
  firstName: string;
  lastName?: string;
  phone: string;
  relationType?: string; // თანამდებობა / როლი: დირექტორი, მთავარი ბუღალტერი, იურისტი, ოჯახის წევრი და ა.შ.
  email?: string;
  notes?: string;
}

@Injectable()
export class CrmService implements OnModuleInit {
  private readonly logger = new Logger(CrmService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seedInitialBlogPostsIfEmpty();
    } catch (err) {
      this.logger.warn(`Blog seed warning: ${(err as Error)?.message}`);
    }
  }

  private async seedInitialBlogPostsIfEmpty() {
    const count = await this.prisma.blogPost.count();
    if (count > 0) return;

    const initialPosts = [
      {
        title: 'საკრედიტო რისკების მართვა და B2B მედიაციის სტანდარტები 2026 წელს',
        slug: 'credit-risk-management-b2b-mediation-2026',
        category: 'credit_risks',
        categoryKa: 'საკრედიტო რისკები',
        excerpt: 'როგორ ეხმარება დროული ანალიტიკა და წინასასამართლო მედიაცია ბიზნესს ლიკვიდურობის შენარჩუნებასა და ვადაგადაცილებული პორტფელის შემცირებაში.',
        content: 'კორპორაციულ სექტორში დებიტორული დავალიანების მართვა მოითხოვს სისტემურ მონიტორინგს, RS.GE დოკუმენტაციის სრულ ვერიფიკაციას და სტრუქტურირებულ მოლაპარაკებებს.',
        authorName: 'გიორგი მალანია',
        authorRole: 'რისკების მართვის დეპარტამენტი',
        published: true,
        tags: ['რისკები', 'მედიაცია', 'B2B'],
      },
      {
        title: 'RS.GE ზედნადებებისა და ბრუნვითი ბარათების სამართლებრივი მნიშვნელობა',
        slug: 'rs-ge-waybills-legal-significance',
        category: 'tax_updates',
        categoryKa: 'საგადასახადო და სამართლებრივი',
        excerpt: 'რა დოკუმენტაციაა აუცილებელი სასაქონლო დავალიანების დასადასტურებლად და როგორ ამარტივებს ელექტრონული რეესტრი სასამართლო წარმოებას.',
        content: 'სასაქონლო ზედნადები, მიღება-ჩაბარების აქტი და ბუღალტრული ბრუნვითი უწყისი წარმოადგენს მოთხოვნის ნამდვილობის უმთავრეს მტკიცებულებას.',
        authorName: 'ნინო გელაშვილი',
        authorRole: 'იურიდიული სამსახურის უფროსი',
        published: true,
        tags: ['RS.GE', 'სამართალი', 'დოკუმენტაცია'],
      },
      {
        title: 'რესტრუქტურიზაცია და ინდივიდუალური გრაფიკები: მოვალესთან შეთანხმების პრაქტიკა',
        slug: 'restructuring-and-repayment-schedules',
        category: 'financial_literacy',
        categoryKa: 'ფინანსური ანალიტიკა',
        excerpt: 'რატომ არის მოქნილი გადახდის გრაფიკი ორივე მხარისთვის უფრო ეფექტური, ვიდრე ხანგრძლივი სასამართლო დავა.',
        content: 'ფიზიკურ და იურიდიულ პირებთან შეთანხმებული 12-თვიანი გრაფიკი ზრდის ამოღების მაჩვენებელს და უნარჩუნებს მხარეებს საქმიან რეპუტაციას.',
        authorName: 'ლევან კვარაცხელია',
        authorRole: 'უფროსი ფინანსური ანალიტიკოსი',
        published: true,
        tags: ['გრაფიკი', 'რესტრუქტურიზაცია', 'ფინანსები'],
      },
    ];

    for (const p of initialPosts) {
      await this.prisma.blogPost.create({ data: p });
    }
  }

  /**
   * Get queue of claims that need calls / follow-up
   */
  async getQueue(search?: string, priority?: string, user?: any) {
    const claims = await this.prisma.debtClaim.findMany({
      where: {
        status: {
          in: [
            ClaimStatus.ACTIVE,
            ClaimStatus.OVERDUE,
            ClaimStatus.DISPUTED,
            ClaimStatus.IN_LITIGATION,
            ClaimStatus.RESTRUCTURED,
          ],
        },
      },
      include: {
        debtor: {
          include: {
            individualProfile: true,
            companyProfile: true,
            contactPersons: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        creditor: {
          include: {
            companyProfile: true,
            individualProfile: true,
          },
        },
        crmLogs: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        schedules: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: [{ daysOverdue: 'desc' }, { remainingAmount: 'desc' }],
    });

    let formatted = claims.map((c) => this.formatQueueItem(c));

    // Prioritize claims assigned directly to the logged-in operator
    if (user?.id && user?.role === UserRole.OPERATOR) {
      formatted.sort((a, b) => {
        const aAssigned = a.assignedOperatorId === user.id ? 1 : 0;
        const bAssigned = b.assignedOperatorId === user.id ? 1 : 0;
        if (aAssigned !== bAssigned) return bAssigned - aAssigned;
        return b.daysOverdue - a.daysOverdue;
      });
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      formatted = formatted.filter(
        (i) =>
          i.debtorName.toLowerCase().includes(q) ||
          i.debtorPersonalId.includes(q) ||
          i.debtorPhone.includes(q) ||
          i.caseNumber.toLowerCase().includes(q),
      );
    }

    if (priority === 'HIGH') {
      formatted = formatted.filter((i) => i.daysOverdue >= 60 || i.remainingAmount >= 10000);
    } else if (priority === 'CALLBACK') {
      formatted = formatted.filter((i) => i.lastDisposition === 'CALLBACK');
    }

    return formatted;
  }

  /**
   * Get claim details for the active call panel
   */
  async getClaimForCall(claimId: string) {
    const claim = await this.prisma.debtClaim.findUnique({
      where: { id: claimId },
      include: {
        debtor: {
          include: {
            individualProfile: true,
            companyProfile: true,
            contactPersons: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        creditor: {
          include: {
            companyProfile: true,
            individualProfile: true,
          },
        },
        crmLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            operator: {
              include: { staffProfile: true },
            },
          },
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        schedules: {
          include: {
            installments: {
              orderBy: { installmentNo: 'asc' },
            },
          },
        },
        paymentReceipts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim ${claimId} not found`);
    }

    return this.formatCallDetail(claim);
  }

  /**
   * Log a phone call result & disposition into PostgreSQL
   */
  async logCall(dto: LogCallDto, user: any) {
    const claim = await this.prisma.debtClaim.findUnique({
      where: { id: dto.claimId },
      include: {
        debtor: {
          include: {
            individualProfile: true,
            companyProfile: true,
            contactPersons: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim ${dto.claimId} not found`);
    }

    const log = await this.prisma.crmCallLog.create({
      data: {
        claimId: claim.id,
        operatorId: user.id,
        disposition: dto.disposition,
        promisedDate: dto.promisedDate ? new Date(dto.promisedDate) : null,
        promisedAmount: dto.promisedAmount ? dto.promisedAmount : null,
        notes: dto.notes,
      },
    });

    // Translate disposition for timeline
    const dispositionKa: Record<string, string> = {
      PROMISE_TO_PAY: 'დათანხმდა დაფარვას / შეპირება',
      REFUSED: 'კატეგორიული უარი დაფარვაზე',
      WRONG_NUMBER: 'ნომერი არასწორია / შეცვლილია',
      CALLBACK: 'დაინიშნა განმეორებითი გადარეკვა',
      VOICEMAIL: 'ხმოვანი ფოსტა / მიუწვდომელი',
      DISPUTE_RAISED: 'სადავო მოთხოვნა / პრეტენზია',
    };

    const dispLabel = dispositionKa[dto.disposition] || dto.disposition;
    const operatorName = user.staffProfile?.fullName || user.email;

    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId: claim.id,
        authorId: user.id,
        department: 'CALL_CENTER',
        authorRoleTitle: `ქოლ-ცენტრის ოპერატორი - ${operatorName}`,
        actionType: 'CALL_MADE',
        description: `სატელეფონო ზარი განხორციელდა. შედეგი: ${dispLabel}. ${
          dto.promisedAmount ? `შეთანხმებული თანხა: ${dto.promisedAmount} ₾ (ვადა: ${dto.promisedDate || 'უახლოეს დღეებში'}). ` : ''
        }${dto.notes ? `კომენტარი: ${dto.notes}` : ''}`,
      },
    });

    // Update claim status if promise made
    if (dto.disposition === CallDisposition.PROMISE_TO_PAY) {
      await this.prisma.debtClaim.update({
        where: { id: claim.id },
        data: {
          lastActivityAt: new Date(),
        },
      });
    }

    return log;
  }

  /**
   * Get CRM KPI metrics (calls today, promises, recovered amount)
   */
  async getCrmStats(operatorId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereToday: any = {
      createdAt: { gte: today },
    };

    if (operatorId) {
      whereToday.operatorId = operatorId;
    }

    const todayLogs = await this.prisma.crmCallLog.findMany({
      where: whereToday,
      include: { claim: true },
    });

    const callsCount = todayLogs.length;
    const promisesCount = todayLogs.filter(
      (l) => l.disposition === CallDisposition.PROMISE_TO_PAY,
    ).length;
    const unreachableCount = todayLogs.filter(
      (l) =>
        l.disposition === CallDisposition.VOICEMAIL ||
        l.disposition === CallDisposition.WRONG_NUMBER,
    ).length;

    const promisedAmountTotal = todayLogs.reduce(
      (sum, l) => sum + Number(l.promisedAmount || 0),
      0,
    );

    return {
      callsToday: callsCount,
      dailyTarget: 60,
      promisesCount,
      unreachableCount,
      promisedAmountTotal,
      activeQueueCount: await this.prisma.debtClaim.count({
        where: { status: { in: [ClaimStatus.ACTIVE, ClaimStatus.OVERDUE, ClaimStatus.IN_LITIGATION] } },
      }),
    };
  }

  private formatQueueItem(c: any) {
    const isLegal = c.debtor.entityType === 'LEGAL';
    const debtorName = isLegal
      ? (c.debtor.companyProfile?.companyName || c.debtor.email)
      : (c.debtor.individualProfile
          ? `${c.debtor.individualProfile.firstName} ${c.debtor.individualProfile.lastName}`.trim()
          : c.debtor.email);

    const creditorName = c.creditor?.companyProfile?.companyName || c.creditor?.email || 'კრედიტორი';
    const lastLog = c.crmLogs && c.crmLogs.length > 0 ? c.crmLogs[0] : null;

    return {
      id: c.id,
      caseNumber: c.caseNumber,
      agreementNumber: c.agreementNumber,
      debtorName,
      debtorPersonalId: c.debtor.personalId,
      debtorPhone: c.debtor.phone || '+995 599 00 00 00',
      creditorName,
      initialAmount: Number(c.initialAmount),
      remainingAmount: Number(c.remainingAmount),
      penaltyAmount: Number(c.penaltyAmount),
      currency: c.currency,
      daysOverdue: c.daysOverdue,
      status: c.status,
      rating: c.rating,
      riskScore: c.riskScore,
      assignedOperatorId: c.assignedOperatorId || null,
      lastDisposition: lastLog?.disposition || null,
      lastCallDate: lastLog?.createdAt || null,
      lastCallNotes: lastLog?.notes || null,
    };
  }

  private formatCallDetail(c: any) {
    const isLegal = c.debtor.entityType === 'LEGAL';
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
      debtorPhone: c.debtor.phone || '+995 599 00 00 00',
      debtorAddress: address || 'ქ. თბილისი',
      creditorName: c.creditor?.companyProfile?.companyName || c.creditor?.email,
      initialAmount: Number(c.initialAmount),
      remainingAmount: Number(c.remainingAmount),
      penaltyAmount: Number(c.penaltyAmount),
      currency: c.currency,
      daysOverdue: c.daysOverdue,
      status: c.status,
      rating: c.rating,
      riskScore: c.riskScore,
      crmLogs: c.crmLogs.map((l: any) => ({
        id: l.id,
        operatorName: l.operator?.staffProfile?.fullName || l.operator?.email,
        disposition: l.disposition,
        promisedDate: l.promisedDate,
        promisedAmount: l.promisedAmount ? Number(l.promisedAmount) : null,
        notes: l.notes,
        createdAt: l.createdAt,
      })),
      timelineEvents: c.timelineEvents.map((e: any) => ({
        id: e.id,
        authorRoleTitle: e.authorRoleTitle,
        actionType: e.actionType,
        description: e.description,
        createdAt: e.createdAt,
      })),
      supportingDocuments: Array.isArray(c.supportingDocuments) ? c.supportingDocuments : [],
      paymentReceipts: c.paymentReceipts || [],
      schedules: c.schedules || [],
      contactPersons: (c.debtor?.contactPersons || []).map((cp: any) => ({
        id: cp.id,
        firstName: cp.firstName,
        lastName: cp.lastName,
        phone: cp.phone,
        email: cp.email || null,
        notes: cp.address || null,
        relationType: cp.relationType || 'საკონტაქტო პირი',
        createdAt: cp.createdAt,
      })),
    };
  }

  /**
   * Add new contact phone / discovered person for debtor (Internal only)
   */
  async addDebtorContact(claimId: string, dto: AddDebtorContactDto, user: any) {
    if (!dto.phone?.trim() || !dto.firstName?.trim()) {
      throw new BadRequestException('ტელეფონის ნომერი და სახელი სავალდებულოა');
    }

    const claim = await this.prisma.debtClaim.findUnique({
      where: { id: claimId },
      include: { debtor: true },
    });

    if (!claim) {
      throw new NotFoundException(`საქმე ${claimId} ვერ მოიძებნა`);
    }

    const contact = await this.prisma.contactPerson.create({
      data: {
        userId: claim.debtorId,
        firstName: dto.firstName.trim(),
        lastName: (dto.lastName || '').trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim() || null,
        address: dto.notes?.trim() || null,
        relationType: dto.relationType?.trim() || 'დამატებითი კონტაქტი',
      },
    });

    const operatorName = user?.staffProfile?.fullName || user?.email || 'კრედიტ მენეჯერი';
    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId: claim.id,
        authorId: user.id,
        department: 'CALL_CENTER',
        authorRoleTitle: `კრედიტ მენეჯერი - ${operatorName}`,
        actionType: 'NOTE_ADDED',
        description: `მოძიებული და დამატებულია ახალი საკონტაქტო ნომერი: ${dto.phone} (${dto.firstName} ${dto.lastName || ''} — ${dto.relationType || 'საკონტაქტო პირი'}). შიდა ჩანაწერი.`,
      },
    });

    return {
      success: true,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
        notes: contact.address,
        relationType: contact.relationType,
        createdAt: contact.createdAt,
      },
      message: 'ახალი საკონტაქტო ნომერი წარმატებით დაემატა!',
    };
  }

  /**
   * Delete contact phone for debtor (Internal only)
   */
  async deleteDebtorContact(claimId: string, contactId: string, user: any) {
    const contact = await this.prisma.contactPerson.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException(`საკონტაქტო პირი ვერ მოიძებნა`);
    }

    await this.prisma.contactPerson.delete({
      where: { id: contactId },
    });

    const operatorName = user?.staffProfile?.fullName || user?.email || 'კრედიტ მენეჯერი';
    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId,
        authorId: user.id,
        department: 'CALL_CENTER',
        authorRoleTitle: `კრედიტ მენეჯერი - ${operatorName}`,
        actionType: 'NOTE_ADDED',
        description: `წაიშალა საკონტაქტო ნომერი: ${contact.phone} (${contact.firstName} ${contact.lastName}).`,
      },
    });

    return { success: true, message: 'საკონტაქტო ნომერი წაიშალა' };
  }

  /**
   * Blog CRUD connected directly to Prisma BlogPost in PostgreSQL
   */
  async getBlogPosts() {
    const posts = await this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });

    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      category: p.categoryKa || p.category,
      categoryCode: p.category,
      categoryKa: p.categoryKa,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: p.coverImage || null,
      author: p.authorName,
      authorName: p.authorName,
      authorRole: p.authorRole,
      date: p.publishedAt.toLocaleDateString('ka-GE'),
      publishedAt: p.publishedAt.toISOString(),
      readTime: `${Math.max(2, Math.ceil((p.content?.length || 300) / 500))} წთ`,
      viewsCount: p.viewsCount,
      tags: p.tags || [],
    }));
  }

  async createBlogPost(dto: any, user?: any) {
    const title = (dto.title || '').trim();
    if (!title) {
      throw new BadRequestException('სტატიის სათაური სავალდებულოა');
    }
    const categoryKa = dto.categoryKa || dto.category || 'ფინანსური ანალიტიკა';
    const category = dto.categoryCode || 'financial_literacy';
    const excerpt = (dto.excerpt || dto.summary || dto.content || title).trim();
    const content = (dto.content || dto.excerpt || title).trim();
    const authorName =
      dto.author || dto.authorName || user?.staffProfile?.fullName || user?.email || 'Debitinfo.GE რედაქცია';
    const authorRole = dto.authorRole || 'საკრედიტო ანალიტიკოსი';
    const slug = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const created = await this.prisma.blogPost.create({
      data: {
        title,
        slug,
        category,
        categoryKa,
        excerpt,
        content,
        coverImage: dto.coverImage || null,
        authorId: user?.id || null,
        authorName,
        authorRole,
        published: true,
        tags: Array.isArray(dto.tags) ? dto.tags : [categoryKa],
      },
    });

    return {
      id: created.id,
      title: created.title,
      slug: created.slug,
      category: created.categoryKa,
      categoryKa: created.categoryKa,
      excerpt: created.excerpt,
      content: created.content,
      author: created.authorName,
      authorName: created.authorName,
      authorRole: created.authorRole,
      date: created.publishedAt.toLocaleDateString('ka-GE'),
      publishedAt: created.publishedAt.toISOString(),
      readTime: `${Math.max(2, Math.ceil((created.content?.length || 300) / 500))} წთ`,
      tags: created.tags,
    };
  }

  async deleteBlogPost(id: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ბლოგის სტატია ვერ მოიძებნა');
    }
    await this.prisma.blogPost.delete({ where: { id } });
    return { success: true, id };
  }

  /**
   * Save or update repayment schedule by Credit Manager
   */
  async saveClaimSchedule(claimId: string, dto: SaveScheduleDto, user: any) {
    const claim = await this.prisma.debtClaim.findUnique({
      where: { id: claimId },
      include: {
        debtor: {
          include: { individualProfile: true, companyProfile: true },
        },
        creditor: {
          include: { individualProfile: true, companyProfile: true },
        },
        schedules: {
          include: { installments: true },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with id ${claimId} not found`);
    }

    const scheduleType = dto.type === 'NON_STANDARD' ? ScheduleType.NON_STANDARD : ScheduleType.STANDARD;
    let totalMonths = Number(dto.totalMonths) || (scheduleType === ScheduleType.STANDARD ? 12 : 18);

    if (scheduleType === ScheduleType.STANDARD) {
      if (totalMonths < 1) totalMonths = 1;
      if (totalMonths > 12) totalMonths = 12;
    } else {
      if (totalMonths < 13) totalMonths = 13;
    }

    let paymentDay = Number(dto.paymentDay) || 15;
    if (paymentDay < 1) paymentDay = 1;
    if (paymentDay > 31) paymentDay = 31;

    const totalAmount = Number(claim.remainingAmount || claim.initialAmount || 0);

    // Compute installments
    let installmentsData: Array<{ installmentNo: number; dueDate: Date; amount: number }> = [];

    const now = new Date();
    const startMonth = now.getMonth() + 1; // start next month
    const startYear = now.getFullYear();

    if (dto.installments && Array.isArray(dto.installments) && dto.installments.length > 0) {
      installmentsData = dto.installments.map((inst, idx) => {
        const targetDate = new Date(startYear, startMonth + idx, Math.min(paymentDay, 28));
        return {
          installmentNo: inst.installmentNo || idx + 1,
          dueDate: inst.dueDate ? new Date(inst.dueDate) : targetDate,
          amount: Number(inst.amount) || 0,
        };
      });
    } else {
      const baseMonthly = Math.floor((totalAmount / totalMonths) * 100) / 100;
      const remainder = Math.round((totalAmount - baseMonthly * totalMonths) * 100) / 100;

      for (let i = 0; i < totalMonths; i++) {
        const targetDate = new Date(startYear, startMonth + i, Math.min(paymentDay, 28));
        const amount = i === 0 ? baseMonthly + remainder : baseMonthly;
        installmentsData.push({
          installmentNo: i + 1,
          dueDate: targetDate,
          amount,
        });
      }
    }

    const monthlyAverage =
      installmentsData.length > 0
        ? installmentsData.reduce((s, i) => s + i.amount, 0) / installmentsData.length
        : totalAmount / totalMonths;

    // Deactivate previous active schedules
    await this.prisma.repaymentSchedule.updateMany({
      where: { claimId: claim.id, isActive: true },
      data: { isActive: false },
    });

    const createdSchedule = await this.prisma.repaymentSchedule.create({
      data: {
        claimId: claim.id,
        type: scheduleType,
        totalMonths,
        monthlyAmount: monthlyAverage,
        startDate: installmentsData[0]?.dueDate || new Date(),
        paymentDay,
        approvalStatus: 'PENDING_DEBTOR_APPROVAL',
        createdByRole: 'CREDIT_MANAGER',
        createdById: user?.id || null,
        notes: dto.notes || null,
        isActive: true,
        installments: {
          create: installmentsData.map((inst) => ({
            installmentNo: inst.installmentNo,
            dueDate: inst.dueDate,
            amount: inst.amount,
            paidAmount: 0,
            isPaid: false,
          })),
        },
      },
      include: {
        installments: {
          orderBy: { installmentNo: 'asc' },
        },
      },
    });

    // Update claim status & scheduleType
    await this.prisma.debtClaim.update({
      where: { id: claim.id },
      data: {
        scheduleType,
        status: ClaimStatus.RESTRUCTURED,
        lastActivityAt: new Date(),
      },
    });

    // Add timeline event
    const managerName = user?.staffProfile?.fullName || user?.name || user?.email || 'კრედიტ მენეჯერი';
    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId: claim.id,
        authorId: user?.id,
        department: 'CALL_CENTER',
        authorRoleTitle: `კრედიტ მენეჯერი - ${managerName}`,
        actionType: 'SCHEDULE_OFFERED',
        description: `შედგა გადახდის გრაფიკი (${
          scheduleType === ScheduleType.STANDARD ? 'სტანდარტული' : 'არასტანდარტული'
        }, ${totalMonths} თვე, ყოველი თვის ${paymentDay} რიცხვი, საშუალო: ${monthlyAverage.toFixed(2)} ₾). მოლოდინში (დებიტორის დასადასტურებელი).`,
      },
    });

    return createdSchedule;
  }

  /**
   * Respond to schedule (Debtor or Credit Manager / Admin)
   */
  async respondToSchedule(scheduleId: string, dto: RespondScheduleDto, user: any) {
    const schedule = await this.prisma.repaymentSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        claim: {
          include: {
            debtor: { include: { individualProfile: true, companyProfile: true } },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule ${scheduleId} not found`);
    }

    const decision = dto.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    const updated = await this.prisma.repaymentSchedule.update({
      where: { id: scheduleId },
      data: {
        approvalStatus: decision,
        debtorRespondedAt: new Date(),
        debtorComment: dto.comment || null,
      },
      include: {
        installments: { orderBy: { installmentNo: 'asc' } },
      },
    });

    const debtorName =
      schedule.claim.debtor.entityType === 'LEGAL'
        ? schedule.claim.debtor.companyProfile?.companyName
        : `${schedule.claim.debtor.individualProfile?.firstName || ''} ${
            schedule.claim.debtor.individualProfile?.lastName || ''
          }`.trim() || schedule.claim.debtor.email;

    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId: schedule.claimId,
        authorId: user?.id,
        department: 'CALL_CENTER',
        authorRoleTitle: `დებიტორი - ${debtorName}`,
        actionType: decision === 'APPROVED' ? 'SCHEDULE_ACCEPTED' : 'SCHEDULE_REJECTED',
        description:
          decision === 'APPROVED'
            ? `დებიტორმა ოფიციალურად დაადასტურა შემოთავაზებული გადახდის გრაფიკი (${
                schedule.type === 'STANDARD' ? 'სტანდარტული' : 'არასტანდარტული'
              }, ${schedule.totalMonths} თვე, ყოველი თვის ${schedule.paymentDay} რიცხვი).`
            : `დებიტორმა უარყო შემოთავაზებული გადახდის გრაფიკი. კომენტარი: ${dto.comment || 'არ არის მითითებული'}.`,
      },
    });

    return updated;
  }
}
