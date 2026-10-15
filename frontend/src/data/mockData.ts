import { 
  DebtorRecord, 
  DebtorLiabilityItem, 
  CreditorKPIs, 
  CreditorClaim, 
  MacroIndicator, 
  DebtAgingBucket, 
  SectorRisk,
  LegalCase,
  CallQueueItem,
  CallInteractionLog,
  FieldVisitTask,
  Employee,
  FaqItem
} from '@/types';

// ==========================================
// 1. REGISTRY & DEBTOR MOCK DATA
// ==========================================

export const MOCK_DEBTORS: DebtorRecord[] = [
  {
    id: 'deb-1',
    name: 'გიორგი ბერიძე',
    personalId: '01019012345',
    type: 'individual',
    address: 'ქ. თბილისი, პეკინის გამზ. 15',
    phone: '+995 599 00 00 00',
    email: 'g.beridze@mail.ge',
    totalDebt: 12450.00,
    overdueAmount: 3200.00,
    currency: 'GEL',
    status: 'active',
    rating: 'B',
    riskScore: 615,
    caseNumber: 'DB-2024-8841',
    lastUpdated: '2024-10-21T12:45:00Z',
    assignedCurator: {
      name: 'ლევან მაისურაძე',
      phone: '+995 32 2 100 200',
      extension: '104'
    },
    rsGeRecordNumber: '405819'
  },
  {
    id: 'deb-2',
    name: 'შპს "ალფა დისტრიბუცია"',
    personalId: '405123987',
    type: 'company',
    address: 'ქ. თბილისი, წერეთლის გამზ. 116',
    phone: '+995 32 2 45 67 89',
    email: 'finance@alphadist.ge',
    totalDebt: 84300.00,
    overdueAmount: 42100.00,
    currency: 'GEL',
    status: 'in_litigation',
    rating: 'C',
    riskScore: 420,
    caseNumber: 'DB-2024-9102',
    lastUpdated: '2024-10-20T16:30:00Z',
    assignedCurator: {
      name: 'ნინო კალანდაძე',
      phone: '+995 32 2 100 200',
      extension: '112'
    },
    rsGeRecordNumber: '501294'
  },
  {
    id: 'deb-3',
    name: 'მარიამ კობახიძე',
    personalId: '01024056789',
    type: 'individual',
    address: 'ქ. ბათუმი, რუსთაველის ქ. 22',
    phone: '+995 577 12 34 56',
    email: 'm.kobakhidze@gmail.com',
    totalDebt: 0.00,
    overdueAmount: 0.00,
    currency: 'GEL',
    status: 'clean',
    rating: 'A',
    riskScore: 810,
    caseNumber: 'DB-2024-0012',
    lastUpdated: '2024-10-22T09:00:00Z',
    rsGeRecordNumber: '394821'
  },
  {
    id: 'deb-4',
    name: 'სს "კავკასუს იმპექსი"',
    personalId: '204567891',
    type: 'company',
    address: 'ქ. ქუთაისი, ჭავჭავაძის გამზ. 58',
    phone: '+995 431 23 45 67',
    email: 'legal@caucasus-impex.ge',
    totalDebt: 156000.00,
    overdueAmount: 98000.00,
    currency: 'GEL',
    status: 'in_litigation',
    rating: 'C',
    riskScore: 385,
    caseNumber: 'DB-2024-7731',
    lastUpdated: '2024-10-19T11:20:00Z',
    assignedCurator: {
      name: 'ლევან მაისურაძე',
      phone: '+995 32 2 100 200',
      extension: '104'
    },
    rsGeRecordNumber: '612849'
  },
  {
    id: 'deb-5',
    name: 'დავით ჯაფარიძე',
    personalId: '01011098765',
    type: 'individual',
    address: 'ქ. თბილისი, ვაჟა-ფშაველას გამზ. 45',
    phone: '+995 595 99 88 77',
    email: 'd.japaridze@yahoo.com',
    totalDebt: 4500.00,
    overdueAmount: 1100.00,
    currency: 'GEL',
    status: 'disputed',
    rating: 'B',
    riskScore: 590,
    caseNumber: 'DB-2024-9450',
    lastUpdated: '2024-10-21T18:10:00Z',
    assignedCurator: {
      name: 'თამარ ბაქრაძე',
      phone: '+995 32 2 100 200',
      extension: '108'
    },
    rsGeRecordNumber: '482019'
  }
];

export const MOCK_LIABILITIES: DebtorLiabilityItem[] = [
  {
    id: 'liab-1',
    creditorName: 'სს "თიბისი ბანკი"',
    agreementNumber: 'TBC-CR-88910',
    initialAmount: 7500.00,
    remainingAmount: 6200.00,
    penaltyAmount: 450.00,
    daysOverdue: 42,
    monthlyPayment: 380.00,
    nextPaymentDate: '2024-11-05',
    status: 'overdue'
  },
  {
    id: 'liab-2',
    creditorName: 'სს "საქართველოს ბანკი"',
    agreementNumber: 'BOG-LOAN-44912',
    initialAmount: 4500.00,
    remainingAmount: 3800.00,
    penaltyAmount: 180.00,
    daysOverdue: 28,
    monthlyPayment: 260.00,
    nextPaymentDate: '2024-11-12',
    status: 'active'
  },
  {
    id: 'liab-3',
    creditorName: 'მისო "კრედო"',
    agreementNumber: 'CRD-AGR-10293',
    initialAmount: 2000.00,
    remainingAmount: 1820.00,
    penaltyAmount: 390.00,
    daysOverdue: 85,
    monthlyPayment: 190.00,
    nextPaymentDate: '2024-10-28',
    status: 'overdue'
  }
];

// ==========================================
// 2. CREDITOR MOCK DATA
// ==========================================

export const MOCK_CREDITOR_KPIS: CreditorKPIs = {
  totalPortfolio: 18450000,
  activeClaimsCount: 1642,
  recoveredThisMonth: 580000,
  recoveryRatePercent: 71.8,
  litigationCasesCount: 112
};

export const MOCK_CREDITOR_CLAIMS: CreditorClaim[] = [
  {
    id: 'cl-1',
    caseNumber: 'CLM-2024-001',
    debtorName: 'გიორგი ბერიძე',
    personalId: '01019012345',
    claimAmount: 6200,
    daysOverdue: 42,
    status: 'active',
    lastActivity: 'SMS გაგზავნილია',
    riskRating: 'B',
    curatorName: 'ლევან მაისურაძე'
  },
  {
    id: 'cl-2',
    caseNumber: 'CLM-2024-002',
    debtorName: 'შპს "ალფა დისტრიბუცია"',
    personalId: '405123987',
    claimAmount: 42100,
    daysOverdue: 114,
    status: 'legal',
    lastActivity: 'სარჩელი აღძრულია',
    riskRating: 'C',
    curatorName: 'ნინო კალანდაძე'
  },
  {
    id: 'cl-3',
    caseNumber: 'CLM-2024-003',
    debtorName: 'თინათინ ასათიანი',
    personalId: '01025091823',
    claimAmount: 1850,
    daysOverdue: 15,
    status: 'in_negotiation',
    lastActivity: 'შეთანხმებულია გრაფიკი',
    riskRating: 'A',
    curatorName: 'თამარ ბაქრაძე'
  },
  {
    id: 'cl-4',
    caseNumber: 'CLM-2024-004',
    debtorName: 'სს "კავკასუს იმპექსი"',
    personalId: '204567891',
    claimAmount: 98000,
    daysOverdue: 180,
    status: 'legal',
    lastActivity: 'სააღსრულებო ბიუროში',
    riskRating: 'C',
    curatorName: 'ლევან მაისურაძე'
  },
  {
    id: 'cl-5',
    caseNumber: 'CLM-2024-005',
    debtorName: 'ირაკლი გელოვანი',
    personalId: '01008034567',
    claimAmount: 3400,
    daysOverdue: 0,
    status: 'settled',
    lastActivity: 'სრულად დაფარულია',
    riskRating: 'A',
    curatorName: 'თამარ ბაქრაძე'
  }
];

// ==========================================
// 3. ANALYTICS & MACRO MOCK DATA
// ==========================================

export const MOCK_MACRO_INDICATORS: MacroIndicator[] = [
  {
    label: 'დეფოლტის ეროვნული ინდექსი (NDI)',
    value: '4.82%',
    changePercent: -0.34,
    isPositive: true,
    benchmark: 'წინა კვარტალი: 5.16%'
  },
  {
    label: 'საშუალო ვადაგადაცილების პერიოდი (DSO)',
    value: '48 დღე',
    changePercent: -4.2,
    isPositive: true,
    benchmark: 'წინა თვე: 51 დღე'
  },
  {
    label: 'პორტფელის აღდგენის კოეფიციენტი (CRR)',
    value: '72.4%',
    changePercent: 3.1,
    isPositive: true,
    benchmark: 'სამიზნე: 70.0%'
  },
  {
    label: 'სასამართლო დავების წილი მთლიან ვადაგადაცილებაში',
    value: '11.6%',
    changePercent: 0.8,
    isPositive: false,
    benchmark: 'წინა თვე: 10.8%'
  }
];

export const MOCK_AGING_BUCKETS: DebtAgingBucket[] = [
  { period: '0-30 დღე', amount: 8200000, count: 940, percentage: 44.4, color: '#0dfcc4' },
  { period: '31-60 დღე', amount: 4800000, count: 412, percentage: 26.0, color: '#fbbf24' },
  { period: '61-90 დღე', amount: 3100000, count: 210, percentage: 16.8, color: '#f97316' },
  { period: '90+ დღე (კრიტიკული)', amount: 2350000, count: 180, percentage: 12.8, color: '#ef4444' }
];

export const MOCK_SECTOR_RISKS: SectorRisk[] = [
  { sector: 'საბანკო & მიკროსაფინანსო', activeDebt: 11200000, defaultProbability: 3.8, volumeTrend: 'stable' },
  { sector: 'ტელეკომუნიკაციები & ISP', activeDebt: 2400000, defaultProbability: 5.9, volumeTrend: 'down' },
  { sector: 'რითეილი & ონლაინ კომერცია', activeDebt: 3100000, defaultProbability: 7.2, volumeTrend: 'up' },
  { sector: 'სამშენებლო & დეველოპმენტი', activeDebt: 1750000, defaultProbability: 8.4, volumeTrend: 'up' }
];

// ==========================================
// 4. LEGAL CASES MOCK DATA
// ==========================================

export const MOCK_LEGAL_CASES: LegalCase[] = [
  {
    id: 'leg-1',
    caseNumber: 'საქმე #2/18921-24',
    courtInstance: 'თბილისის საქალაქო სასამართლო (სამოქალაქო კოლეგია)',
    plaintiff: 'სს "თიბისი ბანკი"',
    defendant: 'შპს "ალფა დისტრიბუცია"',
    claimAmount: 42100,
    judgeName: 'ზურაბ ძლიერიშვილი',
    enforcementOfficer: 'თორნიკე გოგატიშვილი',
    status: 'in_court',
    nextHearingDate: '2024-11-14T11:00:00',
    executionSheetNumber: 'NCA-9921',
    documentsCount: 8
  },
  {
    id: 'leg-2',
    caseNumber: 'საქმე #2/14502-24',
    courtInstance: 'თბილისის სააპელაციო სასამართლო',
    plaintiff: 'მისო "კრედო"',
    defendant: 'სს "კავკასუს იმპექსი"',
    claimAmount: 98000,
    judgeName: 'ეკატერინე ცისკარიძე',
    enforcementOfficer: 'გიორგი ჩხიკვაძე',
    status: 'decision_enforced',
    nextHearingDate: '2024-10-30T14:30:00',
    executionSheetNumber: 'EXE-2024-4019',
    documentsCount: 14
  },
  {
    id: 'leg-3',
    caseNumber: 'საქმე #Pre-8841',
    courtInstance: 'წინასასამართლო მედიაციის პალატა',
    plaintiff: 'სს "საქართველოს ბანკი"',
    defendant: 'გიორგი ბერიძე',
    claimAmount: 6200,
    judgeName: 'მედიატორი: ნატა ჩხარტიშვილი',
    status: 'pre_trial',
    nextHearingDate: '2024-11-04T10:00:00',
    documentsCount: 4
  }
];

// ==========================================
// 5. CRM OPERATOR MOCK DATA
// ==========================================

export const MOCK_CALL_QUEUE: CallQueueItem[] = [
  {
    id: 'call-1',
    debtorName: 'გიორგი ბერიძე',
    personalId: '01019012345',
    phone: '+995 599 00 00 00',
    priority: 'high',
    debtAmount: 6200,
    lastDisposition: 'დაპირება გადახდაზე (PTP ვადა 21 ოქტ)',
    nextScheduledCall: '10:30'
  },
  {
    id: 'call-2',
    debtorName: 'დავით ჯაფარიძე',
    personalId: '01011098765',
    phone: '+995 595 99 88 77',
    priority: 'medium',
    debtAmount: 4500,
    lastDisposition: 'გაასაჩივრა საპროცენტო განაკვეთი',
    nextScheduledCall: '11:15'
  },
  {
    id: 'call-3',
    debtorName: 'ეკატერინე ლომიძე',
    personalId: '01029098711',
    phone: '+995 577 44 33 22',
    priority: 'normal',
    debtAmount: 1850,
    lastDisposition: 'ზარი არ გავიდა (ხელახლა აკრეფა)',
    nextScheduledCall: '12:00'
  }
];

export const MOCK_CALL_LOGS: CallInteractionLog[] = [
  {
    id: 'log-1',
    timestamp: '2024-10-21 11:45',
    operatorName: 'სალომე კვარაცხელია',
    disposition: 'promise_to_pay',
    promisedDate: '2024-10-28',
    promisedAmount: 1500,
    notes: 'მოვალემ დაადასტურა 1,500 ლარის შეტანა 28 ოქტომბრამდე. გაეგზავნა შეხსენების SMS.'
  },
  {
    id: 'log-2',
    timestamp: '2024-10-18 15:20',
    operatorName: 'გიორგი ჩხაიძე',
    disposition: 'callback',
    notes: 'მოითხოვა გრაფიკის რესტრუქტურიზაციის პირობების ელფოსტაზე მიღება.'
  }
];

// ==========================================
// 6. FIELD OFFICER MOCK DATA
// ==========================================

export const MOCK_FIELD_TASKS: FieldVisitTask[] = [
  {
    id: 'fld-1',
    debtorName: 'გიორგი ბერიძე',
    personalId: '01019012345',
    address: 'ქ. თბილისი, პეკინის გამზ. 15, ბ. 42',
    district: 'საბურთალო',
    coordinates: { lat: 41.7258, lng: 44.7712 },
    debtAmount: 6200,
    scheduledTime: '11:00',
    priority: 'urgent',
    status: 'pending',
    notes: 'კოდი სადარბაზოზე: 42K. მოვალესთან წინასწარი სატელეფონო შეთანხმება მიღწეულია.'
  },
  {
    id: 'fld-2',
    debtorName: 'შპს "ალფა დისტრიბუცია"',
    personalId: '405123987',
    address: 'ქ. თბილისი, წერეთლის გამზ. 116 (საწყობი N3)',
    district: 'დიდუბე',
    coordinates: { lat: 41.7381, lng: 44.7865 },
    debtAmount: 42100,
    scheduledTime: '13:30',
    priority: 'urgent',
    status: 'pending',
    notes: 'სააღსრულებო ინსპექცია და მოძრავი ქონების აღწერა.'
  },
  {
    id: 'fld-3',
    debtorName: 'დავით ჯაფარიძე',
    personalId: '01011098765',
    address: 'ქ. თბილისი, ვაჟა-ფშაველას გამზ. 45, ბ. 18',
    district: 'ვაკე-საბურთალო',
    coordinates: { lat: 41.7214, lng: 44.7431 },
    debtAmount: 4500,
    scheduledTime: '15:45',
    priority: 'regular',
    status: 'pending',
    notes: 'შეტყობინების ჩაბარება ხელმოწერით.'
  }
];

// ==========================================
// 7. HR & ADMIN MOCK DATA
// ==========================================

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    fullName: 'ლევან მაისურაძე',
    email: 'l.maisuradze@debitinfo.ge',
    role: 'operator',
    roleKa: 'უფროსი კურატორი / ოპერატორი',
    department: 'მოვალეთა მართვა & CRM',
    status: 'active',
    assignedCasesCount: 142,
    phone: '+995 599 11 22 33',
    joinedDate: '2023-03-15',
    lastActive: '5 წუთის წინ'
  },
  {
    id: 'emp-2',
    fullName: 'ნინო კალანდაძე',
    email: 'n.kalandadze@debitinfo.ge',
    role: 'legal',
    roleKa: 'იურიდიული მრჩეველი',
    department: 'სასამართლო საქმისწარმოება',
    status: 'active',
    assignedCasesCount: 68,
    phone: '+995 577 22 33 44',
    joinedDate: '2022-09-01',
    lastActive: '12 წუთის წინ'
  },
  {
    id: 'emp-3',
    fullName: 'თამარ ბაქრაძე',
    email: 't.bakradze@debitinfo.ge',
    role: 'analyst',
    roleKa: 'რისკ-ანალიტიკოსი',
    department: 'საკრედიტო ანალიტიკა',
    status: 'active',
    assignedCasesCount: 310,
    phone: '+995 591 33 44 55',
    joinedDate: '2023-01-10',
    lastActive: '1 საათის წინ'
  },
  {
    id: 'emp-4',
    fullName: 'გიორგი ჩხიკვაძე',
    email: 'g.chkhikvadze@debitinfo.ge',
    role: 'field_officer',
    roleKa: 'საველე ოფიცერი',
    department: 'საველე მონიტორინგი',
    status: 'active',
    assignedCasesCount: 34,
    phone: '+995 595 44 55 66',
    joinedDate: '2023-06-20',
    lastActive: '18 წუთის წინ'
  },
  {
    id: 'emp-5',
    fullName: 'ალექსანდრე წერეთელი',
    email: 'admin@debitinfo.ge',
    role: 'admin',
    roleKa: 'სისტემური ადმინისტრატორი',
    department: 'IT & უსაფრთხოება',
    status: 'active',
    assignedCasesCount: 0,
    phone: '+995 599 00 11 22',
    joinedDate: '2022-01-05',
    lastActive: 'ახლა აქტიურია'
  }
];

// ==========================================
// 8. FAQS & TESTIMONIALS
// ==========================================

export const MOCK_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'როგორ მოწმდება დებიტორი Debitinfo.GE რეესტრში?',
    answer: 'დებიტორის გადამოწმება ხდება ფიზიკური პირის 11-ნიშნა პირადი ნომრით ან იურიდიული პირის 9-ნიშნა საიდენტიფიკაციო კოდით. სისტემა პირდაპირ უკავშირდება ოფიციალურ ბაზებს და აჩვენებს აქტიურ დავალიანებებს, სტატუსსა და საკრედიტო რეიტინგს.',
    category: 'registry'
  },
  {
    id: 'faq-2',
    question: 'როგორ ავიღო ცნობა დავალიანების არარსებობის შესახებ (სუფთა ისტორია)?',
    answer: 'თუ თქვენს სახელზე არ ფიქსირდება აქტიური ვადაგადაცილებული დავალიანება, სისტემა ავტომატურად გაძლევთ A-რეიტინგის სერტიფიკატს QR კოდით, რომელიც შეგიძლიათ ჩამოტვირთოთ ან წარუდგინოთ ბანკებსა და პარტნიორებს.',
    category: 'payments'
  },
  {
    id: 'faq-3',
    question: 'რა პროცედურაა საჭირო სადავო დავალიანების გასაჩივრებისთვის?',
    answer: 'დებიტორის პირად კაბინეტში ხელმისაწვდომია "დავის ინიცირების" ფორმა. თქვენ შეგიძლიათ მიუთითოთ გასაჩივრების მიზეზი, ატვირთოთ გადახდის დამადასტურებელი ქვითარი და საქმე გადაეცემა მედიაციის პალატას განსახილველად 3 სამუშაო დღეში.',
    category: 'disputes'
  },
  {
    id: 'faq-4',
    question: 'რა შედეგი მოყვება საქმის სააღსრულებო ბიუროში გადაცემას?',
    answer: 'სასამართლო გადაწყვეტილების კანონიერ ძალაში შესვლის შემდეგ გაიცემა სააღსრულებო ფურცელი, რის საფუძველზეც აღსრულების ეროვნული ბიურო იწყებს იძულებით აღსრულებას (ანგარიშების ყადაღა, ქონების რეგისტრაცია).',
    category: 'legal'
  }
];
