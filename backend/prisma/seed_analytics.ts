import { PrismaClient, UserRole, EntityType, ClaimStatus, ScheduleType, CallDisposition, VisitStatus, LegalCaseStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding comprehensive BI & Smart Analytics data for Debitinfo.GE...');

  const passwordHash = await bcrypt.hash('Debitinfo2024!', 10);

  // 1. Ensure Team Leads & Operators
  const teamLead = await prisma.user.upsert({
    where: { email: 'teamlead@debitinfo.ge' },
    update: {},
    create: {
      email: 'teamlead@debitinfo.ge',
      passwordHash,
      personalId: '01027099112',
      entityType: EntityType.PHYSICAL,
      role: UserRole.OPERATOR,
      phone: '+995 599 44 55 66',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'ნინო მეგრელიძე',
          firstName: 'ნინო',
          lastName: 'მეგრელიძე',
          department: 'Call Center Supervisor',
          internalExt: '102',
        },
      },
    },
  });

  const teonaOperator = await prisma.user.upsert({
    where: { email: 'teona@debitinfo.ge' },
    update: {},
    create: {
      email: 'teona@debitinfo.ge',
      passwordHash,
      personalId: '01025088234',
      entityType: EntityType.PHYSICAL,
      role: UserRole.OPERATOR,
      phone: '+995 598 22 33 44',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'თეონა პეტრიაშვილი',
          firstName: 'თეონა',
          lastName: 'პეტრიაშვილი',
          department: 'Call Center & CRM',
          internalExt: '108',
        },
      },
    },
  });

  const mariamOperator = await prisma.user.upsert({
    where: { email: 'mariam@debitinfo.ge' },
    update: {},
    create: {
      email: 'mariam@debitinfo.ge',
      passwordHash,
      personalId: '01031077654',
      entityType: EntityType.PHYSICAL,
      role: UserRole.OPERATOR,
      phone: '+995 595 11 22 77',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'მარიამ კვირიკაშვილი',
          firstName: 'მარიამ',
          lastName: 'კვირიკაშვილი',
          department: 'Call Center & CRM',
          internalExt: '109',
        },
      },
    },
  });

  // Second Lawyer
  const secondLawyer = await prisma.user.upsert({
    where: { email: 'lawyer2@debitinfo.ge' },
    update: {},
    create: {
      email: 'lawyer2@debitinfo.ge',
      passwordHash,
      personalId: '01019055441',
      entityType: EntityType.PHYSICAL,
      role: UserRole.LEGAL,
      phone: '+995 599 88 77 66',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'თენგიზ ჯაფარიძე',
          firstName: 'თენგიზ',
          lastName: 'ჯაფარიძე',
          department: 'Litigation & Court Representation',
          internalExt: '110',
        },
      },
    },
  });

  // Find existing creditor and debtor
  const creditor = await prisma.user.findFirst({ where: { role: UserRole.CREDITOR } });
  const debtor = await prisma.user.findFirst({ where: { role: UserRole.DEBTOR } });
  const firstLawyer = await prisma.user.findFirst({ where: { email: 'lawyer@debitinfo.ge' } }) || secondLawyer;
  const visitor = await prisma.user.findFirst({ where: { role: UserRole.FIELD_OFFICER } });

  if (!creditor || !debtor) {
    console.warn('⚠️ Creditor or Debtor not found. Run main seed first.');
    return;
  }

  console.log('✅ Core Staff Verified: Teona, Mariam, Team Lead Nino, Lawyers & Visitor.');

  // 2. Clear previous BI mock claims to allow fresh deterministic generation
  await prisma.caseTimelineEvent.deleteMany({ where: { claim: { caseNumber: { startsWith: 'BI-' } } } });
  await prisma.crmCallLog.deleteMany({ where: { claim: { caseNumber: { startsWith: 'BI-' } } } });
  await prisma.fieldVisitTask.deleteMany({ where: { claim: { caseNumber: { startsWith: 'BI-' } } } });
  await prisma.legalCase.deleteMany({ where: { claim: { caseNumber: { startsWith: 'BI-' } } } });
  await prisma.repaymentInstallment.deleteMany({ where: { schedule: { claim: { caseNumber: { startsWith: 'BI-' } } } } });
  await prisma.repaymentSchedule.deleteMany({ where: { claim: { caseNumber: { startsWith: 'BI-' } } } });
  await prisma.debtClaim.deleteMany({ where: { caseNumber: { startsWith: 'BI-' } } });

  console.log('🧹 Cleaned previous BI- prefixed test datasets.');

  // 3. Create Additional Diverse Debtors (Physical & Legal) with Directors & Founders
  const debtorCompanies = [
    {
      email: 'corp1@orbi.ge',
      personalId: '405891101',
      name: 'შპს ორბი დეველოპმენტი',
      directorName: 'ვახტანგ',
      directorLastName: 'ჩხეიძე',
      directorPin: '01019033441',
      directorEmail: 'v.chkheidze@orbi.ge',
      directorPhone: '+995 599 11 00 22',
      founderFirstName: 'გიორგი',
      founderLastName: 'კაპანაძე',
      founderPin: '01018022119',
      legalAddress: 'ქ. თბილისი, ყაზბეგის გამზ. 24',
      actualAddress: 'ქ. თბილისი, ყაზბეგის გამზ. 24',
    },
    {
      email: 'corp2@translog.ge',
      personalId: '405772299',
      name: 'შპს ტრანსლოჯისტიკ ჯორჯია',
      directorName: 'ზურაბ',
      directorLastName: 'მელიქიშვილი',
      directorPin: '01017044558',
      directorEmail: 'zura@translog.ge',
      directorPhone: '+995 595 33 22 11',
      founderFirstName: 'დავით',
      founderLastName: 'გელოვანი',
      founderPin: '01015099882',
      legalAddress: 'ქ. ბათუმი, პორტის ქ. 7',
      actualAddress: 'ქ. ბათუმი, პორტის ქ. 7',
    },
    {
      email: 'corp3@geofood.ge',
      personalId: '405663388',
      name: 'შპს ქართული პროდუქტები',
      directorName: 'ლელა',
      directorLastName: 'ნემსაძე',
      directorPin: '01024055667',
      directorEmail: 'info@geofood.ge',
      directorPhone: '+995 599 88 44 22',
      founderFirstName: 'მამუკა',
      founderLastName: 'გოგოლაძე',
      founderPin: '01022011993',
      legalAddress: 'ქ. ქუთაისი, წერეთლის ქ. 15',
      actualAddress: 'ქ. ქუთაისი, წერეთლის ქ. 15',
    },
  ];

  const createdDebtorUserIds: string[] = [debtor.id];

  for (const c of debtorCompanies) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        passwordHash,
        personalId: c.personalId,
        entityType: EntityType.LEGAL,
        role: UserRole.DEBTOR,
        phone: c.directorPhone,
        isRsVerified: true,
        status: 'ACTIVE',
        companyProfile: {
          create: {
            companyName: c.name,
            legalForm: 'შპს',
            taxId: c.personalId,
            legalAddress: c.legalAddress,
            actualAddress: c.actualAddress,
            isVatPayer: true,
            directorName: c.directorName,
            directorLastName: c.directorLastName,
            directorPin: c.directorPin,
            directorPhone: c.directorPhone,
            directorEmail: c.directorEmail,
            founderFirstName: c.founderFirstName,
            founderLastName: c.founderLastName,
            founderPin: c.founderPin,
          },
        },
      },
    });
    createdDebtorUserIds.push(u.id);
  }

  console.log(`✅ Provisioned ${createdDebtorUserIds.length} debtor entities for rich filtering.`);

  // 4. Generate 24 Representative Claims covering all 5 BI Scenarios
  const products = ['B2B_SUPPLY', 'LOAN', 'LEASING', 'SERVICE'];
  const branches = ['თბილისი - ვაკე', 'თბილისი - საბურთალო', 'ბათუმი - ცენტრი', 'ქუთაისი - ცენტრი'];
  const sourceFiles = ['debtors_october_2024.xlsx', 'registry_q3_import.xlsx', 'creditor_batch_01.xlsx'];

  // Current Date Anchor: 2024-10-30
  const now = new Date('2024-10-30T12:00:00Z');

  // Helper date generators
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000);
  const monthsAgo = (m: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - m);
    return d;
  };

  // --------------------------------------------------------------------------
  // SCENARIO 1 & YoY: Standard vs Non-Standard Schedules in Sep 1 - Oct 1
  // (Both in 2024 and in 2023 for YoY comparison)
  // --------------------------------------------------------------------------
  console.log('📊 Seeding Scenario 1: Schedules (Sep 1 - Oct 1, 2024 vs 2023 & 12M Growth)...');

  // Sep 2024 Schedules
  for (let i = 1; i <= 8; i++) {
    const isStandard = i <= 5; // 5 standard, 3 non-standard
    const scheduleDate = new Date('2024-09-15T10:00:00Z');
    const claim = await prisma.debtClaim.create({
      data: {
        caseNumber: `BI-2024-SCH-${i}`,
        creditorId: creditor.id,
        debtorId: createdDebtorUserIds[i % createdDebtorUserIds.length],
        agreementNumber: `AGR-2024-09-${i}`,
        initialAmount: isStandard ? 6000 : 18000,
        remainingAmount: isStandard ? 4500 : 15500,
        currency: 'GEL',
        daysOverdue: 0,
        status: ClaimStatus.ACTIVE,
        rating: isStandard ? 'A' : 'B',
        scheduleType: isStandard ? ScheduleType.STANDARD : ScheduleType.NON_STANDARD,
        debtOriginationDate: new Date('2024-09-01T09:00:00Z'),
        productType: products[i % products.length],
        branch: branches[i % branches.length],
        sourceFile: sourceFiles[0],
        assignedOperatorId: teonaOperator.id,
        teamLeadId: teamLead.id,
        createdAt: scheduleDate,
      },
    });

    await prisma.repaymentSchedule.create({
      data: {
        claimId: claim.id,
        type: isStandard ? ScheduleType.STANDARD : ScheduleType.NON_STANDARD,
        totalMonths: isStandard ? 10 : 24,
        monthlyAmount: isStandard ? 600 : 750,
        startDate: scheduleDate,
        isActive: true,
      },
    });
  }

  // Sep 2023 Schedules (for Year-over-Year Comparison)
  for (let i = 1; i <= 5; i++) {
    const isStandard = i <= 3; // 3 standard, 2 non-standard
    const scheduleDate = new Date('2023-09-18T10:00:00Z');
    const claim = await prisma.debtClaim.create({
      data: {
        caseNumber: `BI-2023-SCH-${i}`,
        creditorId: creditor.id,
        debtorId: createdDebtorUserIds[i % createdDebtorUserIds.length],
        agreementNumber: `AGR-2023-09-${i}`,
        initialAmount: isStandard ? 4500 : 12000,
        remainingAmount: 0,
        currency: 'GEL',
        daysOverdue: 0,
        status: ClaimStatus.SETTLED,
        rating: 'A',
        scheduleType: isStandard ? ScheduleType.STANDARD : ScheduleType.NON_STANDARD,
        debtOriginationDate: new Date('2023-09-05T09:00:00Z'),
        productType: products[i % products.length],
        branch: branches[i % branches.length],
        sourceFile: sourceFiles[1],
        createdAt: scheduleDate,
      },
    });

    await prisma.repaymentSchedule.create({
      data: {
        claimId: claim.id,
        type: isStandard ? ScheduleType.STANDARD : ScheduleType.NON_STANDARD,
        totalMonths: isStandard ? 8 : 18,
        monthlyAmount: isStandard ? 560 : 660,
        startDate: scheduleDate,
        isActive: false,
      },
    });
  }

  // Monthly timeline for 12 months in 2024 to illustrate smooth growth curve
  for (let m = 1; m <= 10; m++) {
    const count = 3 + Math.floor(m * 0.8);
    for (let c = 0; c < count; c++) {
      const isStd = (c % 2 === 0);
      const mDate = new Date(`2024-${m.toString().padStart(2, '0')}-10T12:00:00Z`);
      const cl = await prisma.debtClaim.create({
        data: {
          caseNumber: `BI-2024-M${m}-${c}`,
          creditorId: creditor.id,
          debtorId: createdDebtorUserIds[c % createdDebtorUserIds.length],
          agreementNumber: `AGR-M${m}-${c}`,
          initialAmount: 3500 + (c * 800),
          remainingAmount: 2000,
          currency: 'GEL',
          daysOverdue: 10,
          status: ClaimStatus.ACTIVE,
          rating: 'B',
          scheduleType: isStd ? ScheduleType.STANDARD : ScheduleType.NON_STANDARD,
          debtOriginationDate: mDate,
          productType: products[c % products.length],
          branch: branches[c % branches.length],
          sourceFile: sourceFiles[2],
          createdAt: mDate,
        },
      });

      await prisma.repaymentSchedule.create({
        data: {
          claimId: cl.id,
          type: isStd ? ScheduleType.STANDARD : ScheduleType.NON_STANDARD,
          totalMonths: isStd ? 12 : 18,
          monthlyAmount: 300,
          startDate: mDate,
          isActive: true,
        },
      });
    }
  }

  // --------------------------------------------------------------------------
  // SCENARIO 2: Lawyer Performance over the last 6 months (Jan 1 - Jun 1)
  // Lawsuits drafted, sequestrations, in court, enforcement, won cases & recovered amounts
  // --------------------------------------------------------------------------
  console.log('⚖️ Seeding Scenario 2: Lawyer Legal Cases & Court Pipeline...');

  const lawyerCases = [
    {
      caseNo: 'LEG-BI-2024-001',
      stage: 'ENFORCEMENT',
      outcome: 'WON',
      lawyer: firstLawyer,
      lawsuitDate: new Date('2024-01-20T10:00:00Z'),
      seqDate: new Date('2024-02-15T14:00:00Z'),
      enfDate: new Date('2024-04-10T11:00:00Z'),
      resolvedDate: new Date('2024-05-18T16:00:00Z'),
      recovered: 14500,
      court: 'თბილისის საქალაქო სასამართლო',
      judge: 'ზ. ჩხეიძე',
    },
    {
      caseNo: 'LEG-BI-2024-002',
      stage: 'COURT_PROCEEDINGS',
      outcome: 'IN_PROGRESS',
      lawyer: firstLawyer,
      lawsuitDate: new Date('2024-02-10T09:00:00Z'),
      seqDate: new Date('2024-03-01T10:00:00Z'),
      enfDate: null,
      resolvedDate: null,
      recovered: 0,
      court: 'თბილისის საქალაქო სასამართლო',
      judge: 'მ. ნადირაძე',
    },
    {
      caseNo: 'LEG-BI-2024-003',
      stage: 'ENFORCEMENT',
      outcome: 'IN_PROGRESS',
      lawyer: firstLawyer,
      lawsuitDate: new Date('2024-03-05T12:00:00Z'),
      seqDate: new Date('2024-03-25T11:00:00Z'),
      enfDate: new Date('2024-05-20T15:00:00Z'),
      resolvedDate: null,
      recovered: 5200,
      court: 'სააპელაციო სასამართლო',
      judge: 'გ. ბერიძე',
    },
    {
      caseNo: 'LEG-BI-2024-004',
      stage: 'SETTLEMENT',
      outcome: 'SETTLED',
      lawyer: secondLawyer,
      lawsuitDate: new Date('2024-02-28T10:00:00Z'),
      seqDate: null,
      enfDate: null,
      resolvedDate: new Date('2024-04-30T12:00:00Z'),
      recovered: 9800,
      court: 'მედიაციის პალატა',
      judge: 'ნ. კაპანაძე',
    },
    {
      caseNo: 'LEG-BI-2024-005',
      stage: 'LAWSUIT_PREPARATION',
      outcome: 'IN_PROGRESS',
      lawyer: secondLawyer,
      lawsuitDate: new Date('2024-05-12T10:00:00Z'),
      seqDate: null,
      enfDate: null,
      resolvedDate: null,
      recovered: 0,
      court: 'თბილისის საქალაქო სასამართლო',
      judge: 'დ. კვირიკაშვილი',
    },
    {
      caseNo: 'LEG-BI-2024-006',
      stage: 'ENFORCEMENT',
      outcome: 'WON',
      lawyer: secondLawyer,
      lawsuitDate: new Date('2024-01-15T11:00:00Z'),
      seqDate: new Date('2024-02-10T12:00:00Z'),
      enfDate: new Date('2024-03-15T10:00:00Z'),
      resolvedDate: new Date('2024-05-25T17:00:00Z'),
      recovered: 22000,
      court: 'ბათუმის საქალაქო სასამართლო',
      judge: 'ლ. ხუციშვილი',
    },
  ];

  for (const lc of lawyerCases) {
    const claim = await prisma.debtClaim.create({
      data: {
        caseNumber: `BI-LEG-${lc.caseNo}`,
        creditorId: creditor.id,
        debtorId: createdDebtorUserIds[1],
        agreementNumber: `AGR-LEG-${lc.caseNo}`,
        initialAmount: lc.recovered > 0 ? lc.recovered : 12000,
        remainingAmount: lc.outcome === 'WON' ? 0 : 7000,
        currency: 'GEL',
        daysOverdue: 140,
        status: lc.outcome === 'WON' ? ClaimStatus.SETTLED : ClaimStatus.IN_LITIGATION,
        rating: 'C',
        debtOriginationDate: new Date('2023-11-01T10:00:00Z'),
        productType: 'LOAN',
        branch: 'თბილისი - ვაკე',
        createdAt: lc.lawsuitDate,
      },
    });

    await prisma.legalCase.create({
      data: {
        caseNumber: lc.caseNo,
        claimId: claim.id,
        assignedLawyerId: lc.lawyer.id,
        courtInstance: lc.court,
        courtCaseNumber: `#2/${Math.floor(1000 + Math.random() * 9000)}-24`,
        judgeName: lc.judge,
        status: lc.stage === 'ENFORCEMENT' ? LegalCaseStatus.DECISION_ENFORCED : LegalCaseStatus.IN_COURT,
        stage: lc.stage,
        outcome: lc.outcome,
        priority: 'HIGH',
        hasSequestration: !!lc.seqDate,
        courtDutyFee: 350,
        lawsuitFiledAt: lc.lawsuitDate,
        sequestrationAppliedAt: lc.seqDate,
        enforcedAt: lc.enfDate,
        resolvedAt: lc.resolvedDate,
        recoveredAmount: lc.recovered,
        documentsCount: 4,
        checklistLawsuitDrafted: true,
        checklistDutyPaid: true,
        checklistWarningSent: true,
        createdAt: lc.lawsuitDate,
      },
    });
  }

  // --------------------------------------------------------------------------
  // SCENARIO 3: Field Visitor Inspection Tasks during May 12 - May 17, 2024
  // --------------------------------------------------------------------------
  console.log('🚶 Seeding Scenario 3: Field Visitor Inspection Tasks (May 12 - May 17)...');

  if (visitor) {
    const visitDates = [
      { date: '2024-05-12T11:00:00Z', status: VisitStatus.COMPLETED, district: 'ვაკე-საბურთალო', lat: 41.7166, lng: 44.7523 },
      { date: '2024-05-13T14:30:00Z', status: VisitStatus.COMPLETED, district: 'დიდუბე-ჩუღურეთი', lat: 41.7350, lng: 44.7890 },
      { date: '2024-05-14T10:15:00Z', status: VisitStatus.UNREACHABLE, district: 'გლდანი-ნაძალადევი', lat: 41.7780, lng: 44.8120 },
      { date: '2024-05-15T16:00:00Z', status: VisitStatus.COMPLETED, district: 'ისანი-სამგორი', lat: 41.6910, lng: 44.8450 },
      { date: '2024-05-16T12:00:00Z', status: VisitStatus.RESCHEDULED, district: 'ვაკე-საბურთალო', lat: 41.7220, lng: 44.7410 },
      { date: '2024-05-17T15:45:00Z', status: VisitStatus.COMPLETED, district: 'ბათუმი - ძველი ქალაქი', lat: 41.6420, lng: 41.6380 },
    ];

    for (let i = 0; i < visitDates.length; i++) {
      const vd = visitDates[i];
      const claim = await prisma.debtClaim.create({
        data: {
          caseNumber: `BI-VISIT-${i + 1}`,
          creditorId: creditor.id,
          debtorId: createdDebtorUserIds[i % createdDebtorUserIds.length],
          agreementNumber: `AGR-VISIT-${i + 1}`,
          initialAmount: 4800,
          remainingAmount: 4800,
          currency: 'GEL',
          daysOverdue: 45,
          status: ClaimStatus.ACTIVE,
          rating: 'B',
          debtOriginationDate: new Date('2024-01-10T10:00:00Z'),
          branch: 'თბილისი - საბურთალო',
          createdAt: new Date(vd.date),
        },
      });

      await prisma.fieldVisitTask.create({
        data: {
          claimId: claim.id,
          officerId: visitor.id,
          scheduledTime: new Date(vd.date),
          status: vd.status,
          priority: 'URGENT',
          latitude: vd.lat,
          longitude: vd.lng,
          district: vd.district,
          addressSnapshot: `თბილისი, ${vd.district}, კორპ. ${i + 2}, ბინა 14`,
          notes: vd.status === VisitStatus.COMPLETED ? 'მოვალეს ჩაბარდა ოფიციალური შეტყობინება პირადად.' : 'ადგილზე არ დახვდა პირი.',
          completedAt: vd.status === VisitStatus.COMPLETED ? new Date(vd.date) : null,
          createdAt: new Date(vd.date),
        },
      });
    }
  }

  // --------------------------------------------------------------------------
  // SCENARIO 4: Call Center Calls from 08:00 to 18:00 (Teona & Mariam)
  // --------------------------------------------------------------------------
  console.log('📞 Seeding Scenario 4: Call Center Hourly Performance (08:00 - 18:00, Teona vs Mariam)...');

  const dispositions = [
    CallDisposition.PROMISE_TO_PAY,
    CallDisposition.REFUSED,
    CallDisposition.CALLBACK,
    CallDisposition.VOICEMAIL,
    CallDisposition.PROMISE_TO_PAY,
  ];

  // Seed 25 calls distributed across hours 8 to 18 for today/recent date
  const callHours = [8, 9, 9, 10, 10, 11, 11, 12, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18];

  for (let idx = 0; idx < callHours.length; idx++) {
    const hr = callHours[idx];
    const isTeona = idx % 2 === 0 || idx % 3 === 0; // Teona makes majority of calls
    const operatorId = isTeona ? teonaOperator.id : mariamOperator.id;
    const disp = dispositions[idx % dispositions.length];

    const callDate = new Date(now);
    callDate.setHours(hr, (idx * 7) % 60, 0, 0);

    const claim = await prisma.debtClaim.create({
      data: {
        caseNumber: `BI-CALL-${idx + 1}`,
        creditorId: creditor.id,
        debtorId: createdDebtorUserIds[idx % createdDebtorUserIds.length],
        agreementNumber: `AGR-CALL-${idx + 1}`,
        initialAmount: 2400 + idx * 300,
        remainingAmount: 1800,
        currency: 'GEL',
        daysOverdue: 25,
        status: ClaimStatus.ACTIVE,
        rating: 'B',
        debtOriginationDate: new Date('2024-04-01T10:00:00Z'),
        assignedOperatorId: operatorId,
        teamLeadId: teamLead.id,
        createdAt: callDate,
      },
    });

    await prisma.crmCallLog.create({
      data: {
        claimId: claim.id,
        operatorId,
        disposition: disp,
        promisedDate: disp === CallDisposition.PROMISE_TO_PAY ? daysAgo(-7) : null,
        promisedAmount: disp === CallDisposition.PROMISE_TO_PAY ? 450 : null,
        durationSeconds: 45 + (idx * 15) % 200,
        callHour: hr,
        teamLeadId: teamLead.id,
        notes: isTeona
          ? `თეონას ზარი (${hr}:00): მოვალეს გააცნო გრაფიკის შეთავაზება.`
          : `ოპერატორის ზარი (${hr}:00): საკონტაქტო ნომრის შემოწმება.`,
        createdAt: callDate,
      },
    });
  }

  // --------------------------------------------------------------------------
  // SCENARIO 5: 3-Year Statute of Limitations & Recent Overdues (Last 4 Months)
  // - Expired > 3 Years (Lost right of claim)
  // - Approaching 3 Years (Reminder radar: expiring in 15, 30, 60, 90 days)
  // --------------------------------------------------------------------------
  console.log('⏰ Seeding Scenario 5: 3-Year Statute of Limitations & 4-Month Overdue Radar...');

  // A) Lost Right of Claim (> 3 Years expired in the last 4 months)
  const expiredClaims = [
    {
      caseNo: 'BI-STAT-EXP-1',
      originationDate: new Date('2021-08-15T10:00:00Z'), // 3 years expired in Aug 2024
      amount: 8500,
      debtorIdx: 0,
      daysOverdue: 1170,
    },
    {
      caseNo: 'BI-STAT-EXP-2',
      originationDate: new Date('2021-09-02T10:00:00Z'), // 3 years expired in Sep 2024
      amount: 14200,
      debtorIdx: 1,
      daysOverdue: 1150,
    },
    {
      caseNo: 'BI-STAT-EXP-3',
      originationDate: new Date('2021-10-05T10:00:00Z'), // 3 years expired in Oct 2024
      amount: 6700,
      debtorIdx: 2,
      daysOverdue: 1120,
    },
  ];

  for (const ec of expiredClaims) {
    const expiredAt = new Date(ec.originationDate);
    expiredAt.setFullYear(expiredAt.getFullYear() + 3);

    await prisma.debtClaim.create({
      data: {
        caseNumber: ec.caseNo,
        creditorId: creditor.id,
        debtorId: createdDebtorUserIds[ec.debtorIdx % createdDebtorUserIds.length],
        agreementNumber: `AGR-STAT-EXP-${ec.debtorIdx}`,
        initialAmount: ec.amount,
        remainingAmount: ec.amount,
        currency: 'GEL',
        daysOverdue: ec.daysOverdue,
        status: ClaimStatus.OVERDUE,
        rating: 'C',
        debtOriginationDate: ec.originationDate,
        statuteExpiredAt: expiredAt,
        productType: 'B2B_SUPPLY',
        branch: 'თბილისი - ვაკე',
        createdAt: ec.originationDate,
      },
    });
  }

  // B) Approaching 3-Year Expiration (Critical Radar for early warning)
  const approachingClaims = [
    {
      caseNo: 'BI-STAT-WARN-1',
      originationDate: new Date('2021-11-15T10:00:00Z'), // Expiring in ~15 days (Nov 2024)
      amount: 12500,
      debtorIdx: 1,
      daysOverdue: 1080,
    },
    {
      caseNo: 'BI-STAT-WARN-2',
      originationDate: new Date('2021-12-01T10:00:00Z'), // Expiring in ~30 days (Dec 2024)
      amount: 9400,
      debtorIdx: 2,
      daysOverdue: 1065,
    },
    {
      caseNo: 'BI-STAT-WARN-3',
      originationDate: new Date('2022-01-10T10:00:00Z'), // Expiring in ~70 days (Jan 2025)
      amount: 18000,
      debtorIdx: 3,
      daysOverdue: 1025,
    },
    {
      caseNo: 'BI-STAT-WARN-4',
      originationDate: new Date('2022-02-15T10:00:00Z'), // Expiring in ~105 days (Feb 2025)
      amount: 21500,
      debtorIdx: 0,
      daysOverdue: 990,
    },
  ];

  for (const ac of approachingClaims) {
    const expiredAt = new Date(ac.originationDate);
    expiredAt.setFullYear(expiredAt.getFullYear() + 3);

    await prisma.debtClaim.create({
      data: {
        caseNumber: ac.caseNo,
        creditorId: creditor.id,
        debtorId: createdDebtorUserIds[ac.debtorIdx % createdDebtorUserIds.length],
        agreementNumber: `AGR-STAT-WARN-${ac.debtorIdx}`,
        initialAmount: ac.amount,
        remainingAmount: ac.amount,
        currency: 'GEL',
        daysOverdue: ac.daysOverdue,
        status: ClaimStatus.OVERDUE,
        rating: 'C',
        debtOriginationDate: ac.originationDate,
        statuteExpiredAt: expiredAt,
        productType: 'LOAN',
        branch: 'ბათუმი - ცენტრი',
        createdAt: ac.originationDate,
      },
    });
  }

  console.log('🎉 BI Analytics Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during BI seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
