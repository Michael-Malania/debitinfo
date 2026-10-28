import { PrismaClient, UserRole, EntityType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Debitinfo.GE Database Seeding...');

  const passwordHash = await bcrypt.hash('Debitinfo2024!', 10);

  // 1. System Administrator / HR
  const admin = await prisma.user.upsert({
    where: { email: 'admin@debitinfo.ge' },
    update: {},
    create: {
      email: 'admin@debitinfo.ge',
      passwordHash,
      personalId: '01001011223',
      entityType: EntityType.PHYSICAL,
      role: UserRole.ADMIN,
      phone: '+995 32 2 100 200',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'სისტემური ადმინისტრატორი',
          department: 'IT & Security',
          internalExt: '101',
        },
      },
    },
  });
  console.log('✅ Admin provisioned:', admin.email);

  // 2. Creditor (Lender / Client - Legal Entity: შპს ჯეო ტრეიდინგი)
  const creditor = await prisma.user.upsert({
    where: { email: 'creditor@geotrading.ge' },
    update: {},
    create: {
      email: 'creditor@geotrading.ge',
      passwordHash,
      personalId: '405123456',
      entityType: EntityType.LEGAL,
      role: UserRole.CREDITOR,
      phone: '+995 599 11 22 33',
      isRsVerified: true,
      status: 'ACTIVE',
      companyProfile: {
        create: {
          companyName: 'შპს ჯეო ტრეიდინგი',
          legalForm: 'შპს',
          taxId: '405123456',
          legalAddress: 'ქ. თბილისი, ჭავჭავაძის გამზ. 29',
          actualAddress: 'ქ. თბილისი, ჭავჭავაძის გამზ. 29',
          isVatPayer: true,
          directorName: 'ირაკლი',
          directorLastName: 'ნადირაძე',
          directorPin: '01019088776',
          directorPhone: '+995 599 11 22 33',
          directorEmail: 'i.nadiradze@geotrading.ge',
        },
      },
    },
  });
  console.log('✅ Creditor provisioned:', creditor.email, '(Tax ID: 405123456)');

  // 3. Debtor (Borrower / Debtor - Physical Person: გიორგი ბერიძე)
  const debtor = await prisma.user.upsert({
    where: { email: 'debtor@beridze.ge' },
    update: {},
    create: {
      email: 'debtor@beridze.ge',
      passwordHash,
      personalId: '01019012345',
      entityType: EntityType.PHYSICAL,
      role: UserRole.DEBTOR,
      phone: '+995 599 00 00 00',
      isRsVerified: true,
      status: 'ACTIVE',
      individualProfile: {
        create: {
          firstName: 'გიორგი',
          lastName: 'ბერიძე',
          legalAddress: 'ქ. თბილისი, პეკინის გამზ. 15',
          actualAddress: 'ქ. თბილისი, პეკინის გამზ. 15',
          employmentStatus: 'employed',
          employerName: 'შპს ევროკრედიტი',
        },
      },
    },
  });
  console.log('✅ Debtor provisioned:', debtor.email, '(PIN: 01019012345)');

  // 4. Analyst (Risk Analyst & Debt Registry Manager)
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@debitinfo.ge' },
    update: {},
    create: {
      email: 'analyst@debitinfo.ge',
      passwordHash,
      personalId: '01018044556',
      entityType: EntityType.PHYSICAL,
      role: UserRole.ANALYST,
      phone: '+995 32 2 100 205',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'დავით კაპანაძე',
          department: 'Risk Analysis & Underwriting',
          internalExt: '105',
        },
      },
    },
  });
  console.log('✅ Analyst provisioned:', analyst.email);

  // 5. Regular User (Physical Person - Zero debts / Clean profile: დავით კვირიკაშვილი)
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@regular.ge' },
    update: {},
    create: {
      email: 'user@regular.ge',
      passwordHash,
      personalId: '01024089123',
      entityType: EntityType.PHYSICAL,
      role: UserRole.REGULAR,
      phone: '+995 599 12 34 56',
      isRsVerified: true,
      status: 'ACTIVE',
      individualProfile: {
        create: {
          firstName: 'დავით',
          lastName: 'კვირიკაშვილი',
          legalAddress: 'ქ. თბილისი, ვაჟა-ფშაველას გამზ. 45',
          actualAddress: 'ქ. თბილისი, ვაჟა-ფშაველას გამზ. 45',
          employmentStatus: 'employed',
          employerName: 'სს თიბისი ბანკი',
        },
      },
    },
  });
  console.log('✅ Regular Physical User provisioned:', regularUser.email, '(PIN: 01024089123, Role: REGULAR)');

  // 6. Regular Legal Entity (Company - Clean status: შპს ბათუმი თრეიდი)
  const regularCompany = await prisma.user.upsert({
    where: { email: 'info@batumitrade.ge' },
    update: {},
    create: {
      email: 'info@batumitrade.ge',
      passwordHash,
      personalId: '404899120',
      entityType: EntityType.LEGAL,
      role: UserRole.REGULAR,
      phone: '+995 599 77 88 99',
      isRsVerified: true,
      status: 'ACTIVE',
      companyProfile: {
        create: {
          companyName: 'შპს ბათუმი თრეიდი',
          legalForm: 'შპს',
          taxId: '404899120',
          legalAddress: 'ქ. ბათუმი, რუსთაველის ქ. 12',
          actualAddress: 'ქ. ბათუმი, რუსთაველის ქ. 12',
          isVatPayer: true,
          directorName: 'ზურაბ',
          directorLastName: 'ჩხეიძე',
          directorPin: '61001022334',
          directorPhone: '+995 599 77 88 99',
          directorEmail: 'z.chkheidze@batumitrade.ge',
        },
      },
    },
  });
  console.log('✅ Regular Legal Entity provisioned:', regularCompany.email, '(Tax ID: 404899120, Role: REGULAR)');

  // 7. Operator (CRM Call-Center & Blog Publisher)
  const operator = await prisma.user.upsert({
    where: { email: 'operator@debitinfo.ge' },
    update: {},
    create: {
      email: 'operator@debitinfo.ge',
      passwordHash,
      personalId: '01022033445',
      entityType: EntityType.PHYSICAL,
      role: UserRole.OPERATOR,
      phone: '+995 32 2 100 204',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'თამარ გიორგობიანი',
          department: 'Call Center',
          internalExt: '104',
        },
      },
    },
  });
  console.log('✅ Operator provisioned:', operator.email);

  // 7.1 Lawyer (Legal & Court Enforcement Officer: გიორგი ბერიძე)
  const lawyer = await prisma.user.upsert({
    where: { email: 'lawyer@debitinfo.ge' },
    update: {},
    create: {
      email: 'lawyer@debitinfo.ge',
      passwordHash,
      personalId: '01017088991',
      entityType: EntityType.PHYSICAL,
      role: UserRole.LEGAL,
      phone: '+995 32 2 100 206',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'გიორგი ბერიძე',
          firstName: 'გიორგი',
          lastName: 'ბერიძე',
          department: 'Legal & Court Enforcement',
          internalExt: '106',
          legalAddress: 'ქ. თბილისი, რუსთაველის გამზ. 18',
          actualAddress: 'ქ. თბილისი, რუსთაველის გამზ. 18',
        },
      },
    },
  });
  console.log('✅ Lawyer provisioned:', lawyer.email);

  // 7.2 Field Visitor Officer (Field Inspection & Protocols: ლევან ხუციშვილი)
  const visitor = await prisma.user.upsert({
    where: { email: 'visitor@debitinfo.ge' },
    update: {},
    create: {
      email: 'visitor@debitinfo.ge',
      passwordHash,
      personalId: '01015077882',
      entityType: EntityType.PHYSICAL,
      role: UserRole.FIELD_OFFICER,
      phone: '+995 599 33 44 55',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'ლევან ხუციშვილი',
          firstName: 'ლევან',
          lastName: 'ხუციშვილი',
          department: 'Field Visits & Inspection',
          internalExt: '107',
          legalAddress: 'ქ. თბილისი, წერეთლის გამზ. 48',
          actualAddress: 'ქ. თბილისი, წერეთლის გამზ. 48',
        },
      },
    },
  });
  console.log('✅ Field Visitor provisioned:', visitor.email);

  // 7.2.1 Chief Accountant (Financial Accounting & Payment Orders: მარიამ წიკლაური)
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@debitinfo.ge' },
    update: {},
    create: {
      email: 'accountant@debitinfo.ge',
      passwordHash,
      personalId: '01019044556',
      entityType: EntityType.PHYSICAL,
      role: UserRole.ACCOUNTANT,
      phone: '+995 32 2 100 208',
      isRsVerified: true,
      status: 'ACTIVE',
      staffProfile: {
        create: {
          fullName: 'მარიამ წიკლაური',
          firstName: 'მარიამ',
          lastName: 'წიკლაური',
          department: 'Financial & Accounting',
          internalExt: '108',
          legalAddress: 'ქ. თბილისი, ჭავჭავაძის გამზ. 42',
          actualAddress: 'ქ. თბილისი, ჭავჭავაძის გამზ. 42',
        },
      },
    },
  });
  console.log('✅ Accountant provisioned:', accountant.email);

  // 7.3 Real Debtor 1 - შპს "ორიონ ტექნოლოჯი" (LTD, Tax ID: 405128991)
  const debtorOrion = await prisma.user.upsert({
    where: { email: 'orion@tech.ge' },
    update: {},
    create: {
      email: 'orion@tech.ge',
      passwordHash,
      personalId: '405128991',
      entityType: EntityType.LEGAL,
      role: UserRole.DEBTOR,
      phone: '+995 599 44 55 66',
      isRsVerified: true,
      status: 'ACTIVE',
      companyProfile: {
        create: {
          companyName: 'შპს "ორიონ ტექნოლოჯი"',
          legalForm: 'შპს',
          taxId: '405128991',
          legalAddress: 'თბილისი, ვაჟა-ფშაველას 71',
          actualAddress: 'თბილისი, ვაჟა-ფშაველას 71',
          isVatPayer: true,
          hasMortgage: false,
          hasSequestration: true,
          directorName: 'დავით',
          directorLastName: 'მაისურაძე',
          directorPin: '01019088711',
          directorPhone: '+995 599 44 55 66',
          directorEmail: 'd.maisuradze@oriontech.ge',
        },
      },
    },
  });

  // 7.4 Real Debtor 2 - ნიკოლოზ კობახიძე (Physical, PIN: 01024055112)
  const debtorNikoloz = await prisma.user.upsert({
    where: { email: 'nikoloz@kobakhidze.ge' },
    update: {},
    create: {
      email: 'nikoloz@kobakhidze.ge',
      passwordHash,
      personalId: '01024055112',
      entityType: EntityType.PHYSICAL,
      role: UserRole.DEBTOR,
      phone: '+995 577 11 22 33',
      isRsVerified: true,
      status: 'ACTIVE',
      individualProfile: {
        create: {
          firstName: 'ნიკოლოზ',
          lastName: 'კობახიძე',
          legalAddress: 'ქ. თბილისი, ალ. ყაზბეგის გამზ. 24',
          actualAddress: 'ქ. თბილისი, ალ. ყაზბეგის გამზ. 24',
          employmentStatus: 'employed',
          employerName: 'შპს ევროკრედიტი',
        },
      },
    },
  });

  // 7.5 Real Debtor 3 - შპს "ალფა ლოჯისტიკსი" (LTD, Tax ID: 204918233)
  const debtorAlpha = await prisma.user.upsert({
    where: { email: 'alpha@logistics.ge' },
    update: {},
    create: {
      email: 'alpha@logistics.ge',
      passwordHash,
      personalId: '204918233',
      entityType: EntityType.LEGAL,
      role: UserRole.DEBTOR,
      phone: '+995 32 2 45 67 89',
      isRsVerified: true,
      status: 'ACTIVE',
      companyProfile: {
        create: {
          companyName: 'შპს "ალფა ლოჯისტიკსი"',
          legalForm: 'შპს',
          taxId: '204918233',
          legalAddress: 'ქ. თბილისი, აეროპორტის გზატკეცილი 12',
          actualAddress: 'ქ. თბილისი, აეროპორტის გზატკეცილი 12',
          isVatPayer: true,
          directorName: 'გიორგი',
          directorLastName: 'კალანდაძე',
          directorPin: '01018022334',
          directorPhone: '+995 599 88 99 00',
          directorEmail: 'g.kalandadze@alphalog.ge',
        },
      },
    },
  });

  // 7.6 Real Debtor 4 - თამარ გელოვანი (Physical, PIN: 62001034491)
  const debtorTamar = await prisma.user.upsert({
    where: { email: 'tamar@gelovani.ge' },
    update: {},
    create: {
      email: 'tamar@gelovani.ge',
      passwordHash,
      personalId: '62001034491',
      entityType: EntityType.PHYSICAL,
      role: UserRole.DEBTOR,
      phone: '+995 555 44 33 22',
      isRsVerified: true,
      status: 'ACTIVE',
      individualProfile: {
        create: {
          firstName: 'თამარ',
          lastName: 'გელოვანი',
          legalAddress: 'ქ. ბათუმი, გორგილაძის ქ. 54',
          actualAddress: 'ქ. ბათუმი, გორგილაძის ქ. 54',
          employmentStatus: 'freelancer',
        },
      },
    },
  });

  // 7.7 Real Debtor 5 - შპს "მეგა ბილდერსი" (LTD, Tax ID: 404882190)
  const debtorMega = await prisma.user.upsert({
    where: { email: 'mega@builders.ge' },
    update: {},
    create: {
      email: 'mega@builders.ge',
      passwordHash,
      personalId: '404882190',
      entityType: EntityType.LEGAL,
      role: UserRole.DEBTOR,
      phone: '+995 32 2 90 80 70',
      isRsVerified: true,
      status: 'ACTIVE',
      companyProfile: {
        create: {
          companyName: 'შპს "მეგა ბილდერსი"',
          legalForm: 'შპს',
          taxId: '404882190',
          legalAddress: 'ქ. თბილისი, ჭავჭავაძის გამზ. 82',
          actualAddress: 'ქ. თბილისი, ჭავჭავაძის გამზ. 82',
          isVatPayer: true,
          hasSequestration: true,
          directorName: 'ავთანდილ',
          directorLastName: 'მამულაშვილი',
          directorPin: '01015099881',
          directorPhone: '+995 599 77 66 55',
          directorEmail: 'a.mamulashvili@megabuilders.ge',
        },
      },
    },
  });
  console.log('✅ Real Legal/Debtor Users provisioned (Orion, Nikoloz, Alpha, Tamar, Mega)');

  // 8. Staged Excel Registry Items (Pre-populating Debtors & Creditors tables from Excel)
  const sampleExcelDebtors = [
    {
      type: 'DEBTOR',
      personalId: '01024089123',
      name: 'დავით კვირიკაშვილი',
      companyOrPerson: 'სს საქართველოს ბანკი',
      agreementNumber: 'AGR-77142',
      amount: 3200.00,
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
      amount: 890.00,
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
      amount: 4500.00,
      creditorName: 'შპს ჯეო ტრეიდინგი',
      overdueDays: 90,
      status: 'PENDING',
      sourceFile: 'debtors_registry_2026.xlsx',
    },
  ];

  const sampleExcelCreditors = [
    {
      type: 'CREDITOR',
      personalId: '404899120',
      name: 'შპს ბათუმი თრეიდი',
      companyOrPerson: 'ზურაბ ჩხეიძე',
      agreementNumber: 'PORT-BAT-01',
      amount: 180000.00,
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
      amount: 420000.00,
      creditorName: null,
      overdueDays: 0,
      status: 'PENDING',
      sourceFile: 'creditors_registry_2026.xlsx',
    },
  ];

  for (const item of [...sampleExcelDebtors, ...sampleExcelCreditors]) {
    const exists = await prisma.stagedRegistryItem.findFirst({
      where: { personalId: item.personalId, type: item.type },
    });
    if (!exists) {
      await prisma.stagedRegistryItem.create({ data: item });
    }
  }
  console.log('✅ Staged Excel Registry Items provisioned for Analyst Console');

  // 9. Real Debt Claim (Creditor: შპს ჯეო ტრეიდინგი -> Debtor: გიორგი ბერიძე)
  await prisma.debtClaim.deleteMany({ where: { caseNumber: 'DI-2024-8841' } });
  const claim = await prisma.debtClaim.create({
    data: {
      caseNumber: 'DI-2024-8841',
      creditorId: creditor.id,
      debtorId: debtor.id,
      agreementNumber: 'AGR-99214',
      initialAmount: 5000.00,
      remainingAmount: 2900.00,
      penaltyAmount: 0.00,
      currency: 'GEL',
      daysOverdue: 0,
      status: 'ACTIVE',
      rating: 'B',
      riskScore: 68,
      scheduleType: 'STANDARD',
      supportingDocuments: [
        {
          id: 'doc-01',
          title: 'სასაქონლო ზედნადები (RS.GE #WAYBILL-8841)',
          docType: 'WAYBILL',
          fileName: 'rs_waybill_8841.pdf',
          fileUrl: '/documents/rs_waybill_8841.pdf',
          fileSize: '1.2 MB',
          uploadedAt: '2024-03-01T10:00:00Z',
          description: 'საქონლის მიწოდების ოფიციალური საგადასახადო ზედნადები',
        },
        {
          id: 'doc-02',
          title: 'ბრუნვითი ბარათი / ანგარიშსწორების რეესტრი',
          docType: 'ACCOUNT_TURNOVER',
          fileName: 'brunviti_barati_2024.xlsx',
          fileUrl: '/documents/brunviti_barati_2024.xlsx',
          fileSize: '480 KB',
          uploadedAt: '2024-03-01T10:05:00Z',
          description: 'ურთიერთშედარების აქტი და ბრუნვის ამონაწერი Excel ფორმატში',
        },
        {
          id: 'doc-03',
          title: 'ხელშეკრულება & მიღება-ჩაბარების აქტი #AGR-8841',
          docType: 'CONTRACT',
          fileName: 'khelshekruleba_8841.pdf',
          fileUrl: '/documents/khelshekruleba_8841.pdf',
          fileSize: '2.4 MB',
          uploadedAt: '2024-03-01T10:10:00Z',
          description: 'მხარეთა შორის გაფორმებული საკრედიტო ხელშეკრულება',
        },
      ],
      schedules: {
        create: {
          type: 'STANDARD',
          totalMonths: 12,
          monthlyAmount: 300.00,
          startDate: new Date('2024-03-01'),
          isActive: true,
          installments: {
            create: [
              { installmentNo: 1, dueDate: new Date('2024-03-25'), amount: 300.00, paidAmount: 300.00, isPaid: true, paidAt: new Date('2024-03-25') },
              { installmentNo: 2, dueDate: new Date('2024-04-25'), amount: 300.00, paidAmount: 300.00, isPaid: true, paidAt: new Date('2024-04-25') },
              { installmentNo: 3, dueDate: new Date('2024-05-25'), amount: 300.00, paidAmount: 300.00, isPaid: true, paidAt: new Date('2024-05-25') },
              { installmentNo: 4, dueDate: new Date('2024-06-25'), amount: 300.00, paidAmount: 300.00, isPaid: true, paidAt: new Date('2024-06-25') },
              { installmentNo: 5, dueDate: new Date('2024-07-25'), amount: 300.00, paidAmount: 300.00, isPaid: true, paidAt: new Date('2024-07-25') },
              { installmentNo: 6, dueDate: new Date('2024-08-25'), amount: 300.00, paidAmount: 300.00, isPaid: true, paidAt: new Date('2024-08-25') },
              { installmentNo: 7, dueDate: new Date('2024-09-25'), amount: 300.00, paidAmount: 300.00, isPaid: true, paidAt: new Date('2024-09-25') },
              { installmentNo: 8, dueDate: new Date('2024-10-25'), amount: 300.00, paidAmount: 0.00, isPaid: false },
              { installmentNo: 9, dueDate: new Date('2024-11-25'), amount: 300.00, paidAmount: 0.00, isPaid: false },
              { installmentNo: 10, dueDate: new Date('2024-12-25'), amount: 300.00, paidAmount: 0.00, isPaid: false },
              { installmentNo: 11, dueDate: new Date('2025-01-25'), amount: 300.00, paidAmount: 0.00, isPaid: false },
              { installmentNo: 12, dueDate: new Date('2025-02-25'), amount: 300.00, paidAmount: 0.00, isPaid: false },
            ],
          },
        },
      },
    },
  });
  console.log('✅ Real Debt Claim provisioned:', claim.caseNumber, '(Remaining: 2,900.00 GEL, 12 periods, supporting docs attached)');

  // 9.1 Seed Payment Receipts (Point 8: Creditor & Accountant manual confirmations)
  await prisma.paymentReceipt.upsert({
    where: { receiptNumber: 'REC-2025-09023' },
    update: {},
    create: {
      claimId: claim.id,
      debtorId: debtor.id,
      debtorName: 'გიორგი ბერიძე',
      creditorId: creditor.id,
      creditorName: 'შპს ჯეო ტრეიდინგი',
      amount: 1000.00,
      paymentDate: new Date('2025-02-10T11:30:00Z'),
      receiptNumber: 'REC-2025-09023',
      receiptFileUrl: '/receipts/sample_transfer_receipt_9023.pdf',
      debtorNotes: 'იანვარ-თებერვლის ნაწილობრივი გადახდა (1,000 ₾)',
      status: 'CONFIRMED_BY_CREDITOR',
      confirmedByRole: UserRole.CREDITOR,
      confirmedByUserId: creditor.id,
      confirmedByUserName: 'შპს ჯეო ტრეიდინგი (კრედიტორი)',
      confirmationReceiptUrl: '/receipts/creditor_confirmation_proof_9023.pdf',
      confirmedAt: new Date('2025-02-10T14:45:00Z'),
    },
  });

  await prisma.paymentReceipt.upsert({
    where: { receiptNumber: 'REC-2025-08812' },
    update: {},
    create: {
      claimId: claim.id,
      debtorId: debtor.id,
      debtorName: 'გიორგი ბერიძე',
      creditorId: creditor.id,
      creditorName: 'შპს ჯეო ტრეიდინგი',
      amount: 800.00,
      paymentDate: new Date('2025-01-25T15:20:00Z'),
      receiptNumber: 'REC-2025-08812',
      receiptFileUrl: '/receipts/sample_transfer_receipt_8812.pdf',
      debtorNotes: 'იანვრის შენატანი 800 ₾',
      status: 'CONFIRMED_BY_ACCOUNTANT',
      confirmedByRole: UserRole.ACCOUNTANT,
      confirmedByUserId: accountant.id,
      confirmedByUserName: 'მარიამ წიკლაური (მთავარი ბუღალტერი)',
      accountantOrderNumber: 'ACC-ORD-2025-0142',
      accountantOrderNotes: 'დადასტურებულია კრედიტორის სატელეფონო დასტურის საფუძველზე',
      confirmedAt: new Date('2025-01-26T10:15:00Z'),
    },
  });

  await prisma.paymentReceipt.upsert({
    where: { receiptNumber: 'REC-2026-0041' },
    update: {},
    create: {
      claimId: claim.id,
      debtorId: debtor.id,
      debtorName: 'გიორგი ბერიძე',
      creditorId: creditor.id,
      creditorName: 'შპს ჯეო ტრეიდინგი',
      amount: 300.00,
      paymentDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      receiptNumber: 'REC-2026-0041',
      receiptFileUrl: '/receipts/debtor_transfer_receipt_300.pdf',
      debtorNotes: 'ოქტომბრის მიმდინარე გადახდა 300 ₾, გთხოვთ დაადასტუროთ მიღება.',
      status: 'PENDING_CONFIRMATION',
    },
  });
  console.log('✅ Payment Receipts provisioned with pending & confirmed states');

  // 10. Provision 5 Production-Grade Relational Legal Cases & Dossiers
  // Case 1: #LEG-2025-084 (Orion Technology)
  const claim1 = await prisma.debtClaim.upsert({
    where: { caseNumber: 'DI-2025-0084' },
    update: {},
    create: {
      caseNumber: 'DI-2025-0084',
      creditorId: creditor.id,
      debtorId: debtorOrion.id,
      agreementNumber: 'AGR-OR-2023',
      initialAmount: 21000.00,
      remainingAmount: 24800.00,
      penaltyAmount: 3800.00,
      daysOverdue: 114,
      status: 'IN_LITIGATION',
      rating: 'C',
      riskScore: 32,
    },
  });

  const legalCase1 = await prisma.legalCase.upsert({
    where: { caseNumber: 'LEG-2025-084' },
    update: {},
    create: {
      caseNumber: 'LEG-2025-084',
      claimId: claim1.id,
      assignedLawyerId: lawyer.id,
      courtInstance: 'თბილისის საქალაქო სასამართლო',
      stage: 'LAWSUIT_PREPARATION',
      priority: 'HIGH',
      courtDutyFee: 744.00,
      hasSequestration: true,
      deadlineDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days left
      legalOpinion: 'სარჩელი მზადაა შეტანისთვის. მოპასუხის ქონებრივი მდგომარეობის გადამოწმებით იკვეთება საბანკო ანგარიშების მოძრაობა. რეკომენდებულია სარჩელის უზრუნველყოფის შუამდგომლობის დაყენება (ანგარიშების ყადაღა).',
      checklistWarningSent: true,
      checklistLawsuitDrafted: true,
      checklistDutyPaid: false,
      documentsCount: 4,
      documents: {
        create: [
          {
            title: 'RS.GE ამონაწერი (მიბმულია)',
            documentType: 'RS_EXTRACT',
            fileUrl: '/docs/legal/rs_extract_405128991.pdf',
            isVerified: true,
            fileSize: '1.2 MB',
          },
          {
            title: 'ხელშეკრულება #OR-2023.pdf',
            documentType: 'CONTRACT',
            fileUrl: '/docs/legal/contract_orion_2023.pdf',
            isVerified: true,
            fileSize: '3.4 MB',
          },
          {
            title: 'საბანკო რეკვიზიტები',
            documentType: 'BANK_DETAILS',
            fileUrl: '/docs/legal/bank_details.pdf',
            isVerified: true,
            fileSize: '450 KB',
          },
          {
            title: 'სასამართლო უწყება (შაბლონი)',
            documentType: 'COURT_SUMMONS',
            fileUrl: '/docs/legal/court_summons_template.docx',
            isVerified: false,
            fileSize: '180 KB',
          },
        ],
      },
      timelineEvents: {
        create: [
          {
            claimId: claim1.id,
            authorId: lawyer.id,
            department: 'LEGAL',
            authorRoleTitle: '[იურისტი - გიორგი ბერიძე]',
            actionType: 'LAWSUIT_DRAFTED',
            description: 'მომზადდა სარჩელის პროექტი თბილისის საქალაქო სასამართლოსთვის. ელოდება ბაჟის დადასტურებას და მინდობილობის ხელმოწერას.',
            createdAt: new Date('2026-02-14T11:30:00Z'),
          },
          {
            claimId: claim1.id,
            authorId: visitor.id,
            department: 'FIELD_VISIT',
            authorRoleTitle: '[ვიზიტორი - ლევან ხუციშვილი]',
            actionType: 'VISIT_COMPLETED',
            description: 'ადგილზე ვიზიტი იურიდიულ მისამართზე. ოფისი ფუნქციონირებს, დირექტორმა უარი განაცხადა ნებაყოფლობით დაფარვაზე.',
            createdAt: new Date('2026-02-11T16:45:00Z'),
          },
          {
            claimId: claim1.id,
            authorId: operator.id,
            department: 'CALL_CENTER',
            authorRoleTitle: '[ქოლ-ცენტრის ოპერატორი - მარიამი]',
            actionType: 'CALL_MADE',
            description: 'სატელეფონო ზარი: კონტაქტი შედგა, თუმცა გადახდის გრაფიკის შეთავაზებაზე მიღებულია უარი.',
            createdAt: new Date('2026-02-08T14:20:00Z'),
          },
          {
            claimId: claim1.id,
            authorId: analyst.id,
            department: 'ANALYST',
            authorRoleTitle: '[ანალიტიკოსი - ნინო კაპანაძე]',
            actionType: 'HANDOFF_ANALYST',
            description: 'საქმე გადაეცა იურიდიულ დეპარტამენტს. რეკომენდაცია: სასამართლო წარმოების დაუყოვნებლივ დაწყება.',
            createdAt: new Date('2026-02-05T10:00:00Z'),
          },
        ],
      },
    },
  });

  // Case 2: #LEG-2025-079 (Nikoloz Kobakhidze)
  const claim2 = await prisma.debtClaim.upsert({
    where: { caseNumber: 'DI-2025-0079' },
    update: {},
    create: {
      caseNumber: 'DI-2025-0079',
      creditorId: creditor.id,
      debtorId: debtorNikoloz.id,
      agreementNumber: 'AGR-NK-8812',
      initialAmount: 7800.00,
      remainingAmount: 8450.00,
      penaltyAmount: 650.00,
      daysOverdue: 42,
      status: 'ACTIVE',
      rating: 'B',
      riskScore: 58,
    },
  });

  await prisma.legalCase.upsert({
    where: { caseNumber: 'LEG-2025-079' },
    update: {},
    create: {
      caseNumber: 'LEG-2025-079',
      claimId: claim2.id,
      assignedLawyerId: lawyer.id,
      courtInstance: 'წინასასამართლო მედიაციის პალატა',
      stage: 'OFFICIAL_WARNING',
      priority: 'MEDIUM',
      deadlineDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days left
      checklistWarningSent: true,
      documentsCount: 2,
      documents: {
        create: [
          {
            title: 'ოფიციალური გაფრთხილების წერილი #WR-79',
            documentType: 'NOTICE',
            fileUrl: '/docs/legal/warning_79.pdf',
            isVerified: true,
            fileSize: '890 KB',
          },
          {
            title: 'სესხის ხელშეკრულება.pdf',
            documentType: 'CONTRACT',
            fileUrl: '/docs/legal/contract_nk.pdf',
            isVerified: true,
            fileSize: '2.1 MB',
          },
        ],
      },
      timelineEvents: {
        create: [
          {
            claimId: claim2.id,
            authorId: lawyer.id,
            department: 'LEGAL',
            authorRoleTitle: '[იურისტი - გიორგი ბერიძე]',
            actionType: 'NOTE_ADDED',
            description: 'გაიგზავნა ოფიციალური წერილი რეგისტრაციის მისამართზე 7-დღიანი ნებაყოფლობითი დაფარვის ვადით.',
            createdAt: new Date('2026-02-18T10:00:00Z'),
          },
        ],
      },
    },
  });

  // Case 3: #LEG-2025-063 (Alpha Logistics)
  const claim3 = await prisma.debtClaim.upsert({
    where: { caseNumber: 'DI-2025-0063' },
    update: {},
    create: {
      caseNumber: 'DI-2025-0063',
      creditorId: creditor.id,
      debtorId: debtorAlpha.id,
      agreementNumber: 'AGR-AL-9930',
      initialAmount: 50000.00,
      remainingAmount: 56200.00,
      penaltyAmount: 6200.00,
      daysOverdue: 95,
      status: 'IN_LITIGATION',
      rating: 'C',
      riskScore: 28,
    },
  });

  await prisma.legalCase.upsert({
    where: { caseNumber: 'LEG-2025-063' },
    update: {},
    create: {
      caseNumber: 'LEG-2025-063',
      claimId: claim3.id,
      assignedLawyerId: lawyer.id,
      courtInstance: 'თბილისის საქალაქო სასამართლო (სამოქალაქო კოლეგია)',
      courtCaseNumber: '#3/1142-24',
      judgeName: 'ზურაბ ძლიერიშვილი',
      stage: 'COURT_PROCEEDINGS',
      priority: 'HIGH',
      courtDutyFee: 1686.00,
      nextHearingDate: new Date('2026-02-24T14:30:00Z'),
      checklistWarningSent: true,
      checklistLawsuitDrafted: true,
      checklistDutyPaid: true,
      documentsCount: 4,
      documents: {
        create: [
          {
            title: 'სასამართლო სარჩელი #3/1142-24.pdf',
            documentType: 'LAWSUIT',
            fileUrl: '/docs/legal/lawsuit_alpha.pdf',
            isVerified: true,
            fileSize: '4.2 MB',
          },
          {
            title: 'ბაჟის გადახდის ქვითარი.pdf',
            documentType: 'PAYMENT_RECEIPT',
            fileUrl: '/docs/legal/duty_receipt.pdf',
            isVerified: true,
            fileSize: '510 KB',
          },
        ],
      },
      timelineEvents: {
        create: [
          {
            claimId: claim3.id,
            authorId: lawyer.id,
            department: 'LEGAL',
            authorRoleTitle: '[იურისტი - გიორგი ბერიძე]',
            actionType: 'STATUS_CHANGED',
            description: 'საქმე მიღებულია წარმოებაში. პირველი წინასასამართლო სხდომა ჩაინიშნა 24 თებერვალს 14:30 საათზე.',
            createdAt: new Date('2026-02-04T12:00:00Z'),
          },
        ],
      },
    },
  });

  // Case 4: #LEG-2025-055 (Tamar Gelovani)
  const claim4 = await prisma.debtClaim.upsert({
    where: { caseNumber: 'DI-2025-0055' },
    update: {},
    create: {
      caseNumber: 'DI-2025-0055',
      creditorId: creditor.id,
      debtorId: debtorTamar.id,
      agreementNumber: 'AGR-TG-1144',
      initialAmount: 4000.00,
      remainingAmount: 4300.00,
      penaltyAmount: 300.00,
      daysOverdue: 30,
      status: 'RESTRUCTURED',
      rating: 'B',
      riskScore: 65,
    },
  });

  await prisma.legalCase.upsert({
    where: { caseNumber: 'LEG-2025-055' },
    update: {},
    create: {
      caseNumber: 'LEG-2025-055',
      claimId: claim4.id,
      assignedLawyerId: lawyer.id,
      courtInstance: 'მედიაციის პალატა',
      stage: 'SETTLEMENT',
      priority: 'MEDIUM',
      settlementTerms: 'გრაფიკი: 4 თვე',
      documentsCount: 2,
      timelineEvents: {
        create: [
          {
            claimId: claim4.id,
            authorId: lawyer.id,
            department: 'LEGAL',
            authorRoleTitle: '[იურისტი - გიორგი ბერიძე]',
            actionType: 'NOTE_ADDED',
            description: 'მხარეებთან შედგა მედიაცია. გაფორმდა 4-თვიანი თანაბარი განწილვადების მორიგების აქტი.',
            createdAt: new Date('2026-01-29T15:00:00Z'),
          },
        ],
      },
    },
  });

  // Case 5: #LEG-2025-048 (Mega Builders)
  const claim5 = await prisma.debtClaim.upsert({
    where: { caseNumber: 'DI-2025-0048' },
    update: {},
    create: {
      caseNumber: 'DI-2025-0048',
      creditorId: creditor.id,
      debtorId: debtorMega.id,
      agreementNumber: 'AGR-MB-7781',
      initialAmount: 80000.00,
      remainingAmount: 91000.00,
      penaltyAmount: 11000.00,
      daysOverdue: 180,
      status: 'IN_LITIGATION',
      rating: 'C',
      riskScore: 20,
    },
  });

  await prisma.legalCase.upsert({
    where: { caseNumber: 'LEG-2025-048' },
    update: {},
    create: {
      caseNumber: 'LEG-2025-048',
      claimId: claim5.id,
      assignedLawyerId: lawyer.id,
      courtInstance: 'აღსრულების ეროვნული ბიურო',
      stage: 'ENFORCEMENT',
      priority: 'HIGH',
      hasSequestration: true,
      executionSheetNumber: 'NCA-8891-24',
      enforcementOfficer: 'თორნიკე გოგატიშვილი',
      documentsCount: 3,
      timelineEvents: {
        create: [
          {
            claimId: claim5.id,
            authorId: lawyer.id,
            department: 'LEGAL',
            authorRoleTitle: '[იურისტი - გიორგი ბერიძე]',
            actionType: 'STATUS_CHANGED',
            description: 'გაიცა სააღსრულებო ფურცელი #NCA-8891-24. დადებულია ყადაღა უძრავ ქონებასა და საბანკო ანგარიშებზე.',
            createdAt: new Date('2026-01-21T11:00:00Z'),
          },
        ],
      },
    },
  });
  console.log('✅ 5 Full Relational Legal Cases provisioned (#LEG-2025-084, #079, #063, #055, #048)');

  // 11. Seed Real Field Visit Tasks for Field Officer (visitor@debitinfo.ge)
  await prisma.fieldVisitTask.deleteMany({});
  await prisma.fieldVisitTask.createMany({
    data: [
      {
        claimId: claim1.id,
        officerId: visitor.id,
        scheduledTime: new Date(Date.now() + 2 * 3600 * 1000),
        priority: 'HIGH',
        status: 'PENDING',
        latitude: 41.7225,
        longitude: 44.7578,
        district: 'საბურთალო',
        addressSnapshot: 'თბილისი, ალ. ყაზბეგის გამზ. 24ბ',
        notes: 'ადგილზე მისვლა, ხელმძღვანელთან მოლაპარაკება, ოქმის გაფორმება.',
        photos: [],
      },
      {
        claimId: claim.id,
        officerId: visitor.id,
        scheduledTime: new Date(Date.now() - 3 * 3600 * 1000),
        priority: 'REGULAR',
        status: 'COMPLETED',
        latitude: 41.7118,
        longitude: 44.7490,
        district: 'ვაკე',
        addressSnapshot: 'თბილისი, ი. ჭავჭავაძის გამზ. 75, ბ. 14',
        notes: 'მოვალე ადგილზე იმყოფებოდა. გაფორმდა შეთანხმების ოქმი #412-B.',
        signatureUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiPjxwYXRoIGQ9Ik0xMCAyMCBRIDIwIDUgMzAgMjAgVCA1MCAyMCIgc3Ryb2tlPSJibGFjayIgZmlsbD0idHJhbnNwYXJlbnQiLz48L3N2Zz4=',
        photos: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400'],
        completedAt: new Date(),
      },
      {
        claimId: claim2.id,
        officerId: visitor.id,
        scheduledTime: new Date(Date.now() - 1 * 3600 * 1000),
        priority: 'HIGH',
        status: 'UNREACHABLE',
        latitude: 41.7250,
        longitude: 44.7700,
        district: 'საბურთალო',
        addressSnapshot: 'თბილისი, პეკინის გამზ. 18',
        notes: 'დაკეტილი კარი. მეზობლების ინფორმაციით იმყოფება ქალაქგარეთ.',
        photos: [],
      },
      {
        claimId: claim3.id,
        officerId: visitor.id,
        scheduledTime: new Date(Date.now() + 4 * 3600 * 1000),
        priority: 'HIGH',
        status: 'PENDING',
        latitude: 41.7500,
        longitude: 44.7800,
        district: 'დიდუბე',
        addressSnapshot: 'თბილისი, აეროპორტის გზატკეცილი 12',
        notes: 'სასამართლო სარჩელის ჩაბარების ოქმი.',
        photos: [],
      },
    ],
  });
  console.log('✅ Real Field Visit Tasks provisioned for visitor@debitinfo.ge');

  // 12. Seed Real CRM Call Logs for Operator (operator@debitinfo.ge)
  await prisma.crmCallLog.deleteMany({});
  await prisma.crmCallLog.createMany({
    data: [
      {
        claimId: claim1.id,
        operatorId: operator.id,
        disposition: 'PROMISE_TO_PAY',
        promisedAmount: 5000.00,
        promisedDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        notes: 'დირექტორი დაეთანხმა პირველად შენატანს 5,000 ₾ პარასკევამდე.',
      },
      {
        claimId: claim.id,
        operatorId: operator.id,
        disposition: 'PROMISE_TO_PAY',
        promisedAmount: 300.00,
        promisedDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        notes: 'დაეთანხმა ყოველთვიურ გრაფიკს 150 ₾-ის ოდენობით.',
      },
      {
        claimId: claim2.id,
        operatorId: operator.id,
        disposition: 'CALLBACK',
        notes: 'მოითხოვა გადარეკვა 18:00 საათის შემდეგ სამუშაო დღის ბოლოს.',
      },
      {
        claimId: claim3.id,
        operatorId: operator.id,
        disposition: 'DISPUTE_RAISED',
        notes: 'უარყოფს საურავის მოცულობას, ითხოვს იურისტთან დაკავშირებას.',
      },
    ],
  });
  console.log('✅ Real CRM Call Logs provisioned for operator@debitinfo.ge');

  // 13. Seed Claim Status Configurations (Single Source of Truth for Status Colors)
  const statusConfigs = [
    {
      code: 'ACTIVE',
      label: 'აქტიური',
      bgClass: 'bg-emerald-100',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-200',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      colorHex: '#059669',
      description: 'აქტიური საქმე რეგულარული მონიტორინგის ქვეშ',
    },
    {
      code: 'OVERDUE',
      label: 'ვადაგადაცილებული',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-200',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      colorHex: '#d97706',
      description: 'დავალიანების ვადაგადაცილებული სტატუსი',
    },
    {
      code: 'IN_LITIGATION',
      label: 'სამართლებრივი',
      bgClass: 'bg-rose-100',
      textClass: 'text-rose-800',
      borderClass: 'border-rose-200',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      colorHex: '#e11d48',
      description: 'სასამართლო ან სააღსრულებო წარმოებაში გადაცემული საქმე',
    },
    {
      code: 'SETTLED',
      label: 'დაფარული',
      bgClass: 'bg-slate-100',
      textClass: 'text-slate-700',
      borderClass: 'border-slate-200',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      colorHex: '#64748b',
      description: 'სრულად დაფარული და დახურული საქმე',
    },
    {
      code: 'CLEAN',
      label: 'სუფთა',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-300',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      colorHex: '#10b981',
      description: 'დავალიანების გარეშე სუფთა პროფილი',
    },
    {
      code: 'DISPUTED',
      label: 'სადავო',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-800',
      borderClass: 'border-purple-200',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      colorHex: '#7c3aed',
      description: 'დებიტორის ან კრედიტორის მიერ გახსნილი დავის სტატუსი',
    },
    {
      code: 'RESTRUCTURED',
      label: 'გრაფიკი',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-800',
      borderClass: 'border-blue-200',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      colorHex: '#2563eb',
      description: 'რესტრუქტურიზებული გადანაწილებული გადახდის გრაფიკი',
    },
  ];

  for (const cfg of statusConfigs) {
    await prisma.claimStatusConfig.upsert({
      where: { code: cfg.code },
      update: cfg,
      create: cfg,
    });
  }
  console.log('✅ Claim Status Configurations seeded in Database!');

  console.log('🎉 Seeding successfully completed! Default password for all seed accounts: Debitinfo2024!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
