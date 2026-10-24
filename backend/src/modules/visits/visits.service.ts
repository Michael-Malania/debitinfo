import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VisitStatus, UserRole } from '@prisma/client';

export interface CompleteVisitTaskDto {
  status: VisitStatus;
  notes?: string;
  signatureUrl?: string;
  photos?: string[];
  collectedAmount?: number;
}

export interface CreateVisitTaskDto {
  claimId: string;
  officerId: string;
  scheduledTime?: string;
  priority?: string;
  district?: string;
  addressSnapshot?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class VisitsService {
  private readonly logger = new Logger(VisitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all tasks for the current field officer (or all for admin/analyst)
   */
  async getTasks(user: any, filterStatus?: string, district?: string) {
    const where: any = {};

    if (user.role === UserRole.FIELD_OFFICER) {
      where.officerId = user.id;
    }

    if (filterStatus && filterStatus !== 'ALL') {
      where.status = filterStatus as VisitStatus;
    }

    if (district && district !== 'ALL') {
      where.district = { contains: district, mode: 'insensitive' };
    }

    const tasks = await this.prisma.fieldVisitTask.findMany({
      where,
      include: {
        claim: {
          include: {
            debtor: {
              include: {
                individualProfile: true,
                companyProfile: true,
              },
            },
            creditor: {
              include: {
                companyProfile: true,
                individualProfile: true,
              },
            },
          },
        },
        officer: {
          include: {
            staffProfile: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { scheduledTime: 'asc' }],
    });

    return tasks.map((t) => this.formatTask(t));
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string) {
    const task = await this.prisma.fieldVisitTask.findUnique({
      where: { id },
      include: {
        claim: {
          include: {
            debtor: {
              include: {
                individualProfile: true,
                companyProfile: true,
              },
            },
            creditor: {
              include: {
                companyProfile: true,
                individualProfile: true,
              },
            },
            timelineEvents: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        officer: {
          include: {
            staffProfile: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.formatTask(task);
  }

  /**
   * Complete or update a visit task (protocol, signature, photos, notes)
   */
  async completeTask(id: string, dto: CompleteVisitTaskDto, user: any) {
    const task = await this.prisma.fieldVisitTask.findUnique({
      where: { id },
      include: { claim: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const isDone = dto.status === VisitStatus.COMPLETED;

    const updated = await this.prisma.fieldVisitTask.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes : task.notes,
        signatureUrl: dto.signatureUrl || task.signatureUrl,
        photos: dto.photos && dto.photos.length > 0 ? dto.photos : task.photos,
        completedAt: isDone ? new Date() : null,
      },
      include: {
        claim: {
          include: {
            debtor: {
              include: {
                individualProfile: true,
                companyProfile: true,
              },
            },
            creditor: {
              include: {
                companyProfile: true,
                individualProfile: true,
              },
            },
          },
        },
        officer: {
          include: {
            staffProfile: true,
          },
        },
      },
    });

    // Add Timeline Event to Claim
    const statusLabels: Record<string, string> = {
      COMPLETED: 'ვიზიტი წარმატებით დასრულდა / ოქმი შედგენილია',
      RESCHEDULED: 'ვიზიტი გადაიდო მოვალის თხოვნით',
      UNREACHABLE: 'მოვალე ადგილზე არ იმყოფება / დაკეტილი კარი',
      PENDING: 'ვიზიტი მოლოდინის რეჟიმშია',
    };

    const statusTitle = statusLabels[dto.status] || dto.status;
    const officerName = user.staffProfile?.fullName || `${user.email}`;

    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId: task.claimId,
        authorId: user.id,
        department: 'FIELD_VISIT',
        authorRoleTitle: `საველე ოფიცერი - ${officerName}`,
        actionType: 'VISIT_COMPLETED',
        description: `საველე ვიზიტის შედეგი: ${statusTitle}. ${dto.notes ? `ოქმი / შენიშვნა: ${dto.notes}` : ''}`,
      },
    });

    return this.formatTask(updated);
  }

  /**
   * Create a new field visit task (from analyst or admin)
   */
  async createTask(dto: CreateVisitTaskDto, user: any) {
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
      throw new NotFoundException(`DebtClaim ${dto.claimId} not found`);
    }

    const debtorAddress =
      claim.debtor.individualProfile?.actualAddress ||
      claim.debtor.individualProfile?.legalAddress ||
      claim.debtor.companyProfile?.actualAddress ||
      claim.debtor.companyProfile?.legalAddress ||
      'ქ. თბილისი';

    const task = await this.prisma.fieldVisitTask.create({
      data: {
        claimId: claim.id,
        officerId: dto.officerId,
        scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : new Date(Date.now() + 24 * 3600 * 1000),
        priority: dto.priority || 'REGULAR',
        status: VisitStatus.PENDING,
        district: dto.district || 'საბურთალო',
        addressSnapshot: dto.addressSnapshot || debtorAddress,
        notes: dto.notes || null,
        latitude: dto.latitude || 41.7151,
        longitude: dto.longitude || 44.8271,
        photos: [],
      },
      include: {
        claim: {
          include: {
            debtor: {
              include: {
                individualProfile: true,
                companyProfile: true,
              },
            },
            creditor: {
              include: {
                companyProfile: true,
                individualProfile: true,
              },
            },
          },
        },
        officer: {
          include: {
            staffProfile: true,
          },
        },
      },
    });

    // Record timeline
    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId: claim.id,
        authorId: user.id,
        department: 'FIELD_VISIT',
        authorRoleTitle: `დისპეტჩერი - ${user.staffProfile?.fullName || user.email}`,
        actionType: 'HANDOFF_ANALYST',
        description: `საველე ვიზიტის დავალება გაიცა ოფიცერზე. მისამართი: ${task.addressSnapshot}`,
      },
    });

    return this.formatTask(task);
  }

  /**
   * Field officer metrics summary
   */
  async getMetrics(user: any) {
    const where: any = {};
    if (user.role === UserRole.FIELD_OFFICER) {
      where.officerId = user.id;
    }

    const tasks = await this.prisma.fieldVisitTask.findMany({
      where,
      include: { claim: true },
    });

    const totalScheduled = tasks.length;
    const completed = tasks.filter((t) => t.status === VisitStatus.COMPLETED).length;
    const pending = tasks.filter((t) => t.status === VisitStatus.PENDING).length;
    const unreachable = tasks.filter((t) => t.status === VisitStatus.UNREACHABLE).length;

    const totalAmount = tasks.reduce((sum, t) => sum + Number(t.claim?.remainingAmount || 0), 0);
    const recoveredAmount = tasks
      .filter((t) => t.status === VisitStatus.COMPLETED)
      .reduce((sum, t) => sum + Number(t.claim?.remainingAmount || 0), 0);

    const completionRate = totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 0;

    return {
      totalScheduled,
      completed,
      pending,
      unreachable,
      totalAmount,
      recoveredAmount,
      completionRate,
    };
  }

  private formatTask(t: any) {
    const isLegal = t.claim.debtor.entityType === 'LEGAL';
    const debtorName = isLegal
      ? (t.claim.debtor.companyProfile?.companyName || t.claim.debtor.email)
      : (t.claim.debtor.individualProfile
          ? `${t.claim.debtor.individualProfile.firstName} ${t.claim.debtor.individualProfile.lastName}`.trim()
          : t.claim.debtor.email);

    const directorInfo = isLegal && t.claim.debtor.companyProfile
      ? `დირექტორი: ${t.claim.debtor.companyProfile.directorName} ${t.claim.debtor.companyProfile.directorLastName} (პ/ნ ${t.claim.debtor.companyProfile.directorPin})`
      : null;

    return {
      id: t.id,
      claimId: t.claimId,
      caseNumber: t.claim.caseNumber,
      officerId: t.officerId,
      officerName: t.officer?.staffProfile?.fullName || t.officer?.email,
      debtorName,
      debtorPersonalId: t.claim.debtor.personalId,
      debtorPhone: t.claim.debtor.phone || '+995 599 00 00 00',
      directorInfo,
      remainingAmount: Number(t.claim.remainingAmount),
      initialAmount: Number(t.claim.initialAmount),
      daysOverdue: t.claim.daysOverdue,
      rating: t.claim.rating,
      riskScore: t.claim.riskScore,
      scheduledTime: t.scheduledTime,
      priority: t.priority,
      status: t.status,
      district: t.district,
      addressSnapshot: t.addressSnapshot,
      latitude: t.latitude,
      longitude: t.longitude,
      notes: t.notes,
      signatureUrl: t.signatureUrl,
      photos: t.photos || [],
      completedAt: t.completedAt,
      createdAt: t.createdAt,
    };
  }
}
