import * as XLSX from 'xlsx';

export interface ParsedDebtorRow {
  entityType: 'LEGAL' | 'PHYSICAL';
  taxId: string;
  personalId: string;
  name: string;
  phone: string;
  email: string;
  legalAddress: string;
  actualAddress: string;
  amount: number;
  overdueDays: number;
  agreementNumber: string;
  status?: string;
  sourceFile?: string;
}

/**
 * Generates and triggers download of a formatted Microsoft Excel (.xlsx) template for Debtor import
 */
export function downloadDebtorTemplateXLSX(): void {
  const headers = [
    'სუბიექტის ტიპი (LEGAL / PHYSICAL)',
    'საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა)',
    'პირადი ნომერი (პ/ნ 11 ნიშნა)',
    'სრული დასახელება / სახელი და გვარი',
    'ტელეფონი',
    'ელ-ფოსტა',
    'იურიდიული მისამართი',
    'ფაქტობრივი მისამართი',
    'საწყისი დავალიანება (GEL)',
    'ვადაგადაცილების დღეები',
    'ხელშეკრულების №',
  ];

  const sampleRows = [
    [
      'LEGAL',
      '405118492',
      '01019012345',
      'შპს კავკასუს ტრანს სერვისი',
      '+995 591 442299',
      'info@cts-georgia.ge',
      'ქ. თბილისი, ალ. ყაზბეგის გამზ. #24ა',
      'ქ. თბილისი, ალ. ყაზბეგის გამზ. #24ა',
      48500.0,
      65,
      'AGR-8841',
    ],
    [
      'PHYSICAL',
      '',
      '01024089123',
      'დავით კვირიკაშვილი',
      '+995 599 112233',
      'davit.k@gmail.com',
      'ქ. თბილისი, ვაჟა-ფშაველას გამზ. #12',
      'ქ. თბილისი, ვაჟა-ფშაველას გამზ. #12',
      3200.0,
      42,
      'AGR-7714',
    ],
  ];

  const data = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Mark ID cells explicitly as text so leading zeros are preserved in Excel
  if (ws['B2']) ws['B2'].t = 's';
  if (ws['C2']) ws['C2'].t = 's';
  if (ws['C3']) ws['C3'].t = 's';

  // Set column widths in characters for optimal display in Excel
  ws['!cols'] = [
    { wch: 34 }, // სუბიექტის ტიპი
    { wch: 34 }, // ს/კ
    { wch: 30 }, // პ/ნ
    { wch: 38 }, // დასახელება
    { wch: 22 }, // ტელეფონი
    { wch: 28 }, // ელ-ფოსტა
    { wch: 40 }, // იურიდიული მისამართი
    { wch: 40 }, // ფაქტობრივი მისამართი
    { wch: 26 }, // თანხა
    { wch: 24 }, // ვადაგადაცილება
    { wch: 24 }, // ხელშეკრულების №
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'დებიტორების შაბლონი');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'debitinfo_debtors_import_template.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses an uploaded .xlsx, .xls or .csv file and extracts debtor records
 */
export async function parseDebtorExcelFile(file: File): Promise<ParsedDebtorRow[]> {
  let wb: XLSX.WorkBook;
  const isCsv = file.name.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const text = await file.text();
    wb = XLSX.read(text, { type: 'string' });
  } else {
    const buffer = await file.arrayBuffer();
    wb = XLSX.read(buffer, { type: 'array', raw: false });
  }

  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];

  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  if (!rawRows || rawRows.length < 2) return [];

  const headerRow = (rawRows[0] || []).map((c) => String(c || '').trim().toLowerCase());

  const findColIndex = (...keywords: string[]): number => {
    return headerRow.findIndex((h) => keywords.some((kw) => h.includes(kw.toLowerCase())));
  };

  const colType = findColIndex('სუბიექტის ტიპი', 'ტიპი', 'entity');
  const colTaxId = findColIndex('საიდენტიფიკაციო', 'ს/კ', 'tax');
  const colPersonalId = findColIndex('პირადი ნომერი', 'პირადი', 'პ/ნ', 'personal id', 'pin');
  const colName = findColIndex('სრული დასახელება', 'სახელი', 'name');
  const colPhone = findColIndex('ტელეფონი', 'მობილური', 'phone', 'tel');
  const colEmail = findColIndex('ელ-ფოსტა', 'ფოსტა', 'email', 'mail');
  const colLegalAddr = findColIndex('იურიდიული მისამართი', 'იურიდიული', 'legal address');
  const colActualAddr = findColIndex('ფაქტობრივი მისამართი', 'ფაქტობრივი', 'actual address');
  const colAmount = findColIndex('საწყისი დავალიანება', 'დავალიანება', 'თანხა', 'amount');
  const colOverdue = findColIndex('ვადაგადაცილების დღეები', 'ვადაგადაცილ', 'overdue');
  const colAgreement = findColIndex('ხელშეკრულების №', 'ხელშეკრულება', 'ხელშეკრულებ', 'agreement');

  const parsedDebtors: ParsedDebtorRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const getVal = (colIdx: number, defaultIdx: number): string => {
      const idx = colIdx !== -1 ? colIdx : defaultIdx;
      return String(row[idx] ?? '').trim();
    };

    const rawType = getVal(colType, 0);
    const rawTaxId = getVal(colTaxId, 1).replace(/\D/g, '');
    let rawPersonalId = getVal(colPersonalId, 2).replace(/\D/g, '');
    // If personal ID has 10 digits due to Excel dropping leading 0, restore it
    if (rawPersonalId.length === 10) {
      rawPersonalId = rawPersonalId.padStart(11, '0');
    }

    const rawName = getVal(colName, 3);
    const phone = getVal(colPhone, 4);
    const email = getVal(colEmail, 5);
    const legalAddress = getVal(colLegalAddr, 6);
    const actualAddress = getVal(colActualAddr, 7) || legalAddress;
    const rawAmount = getVal(colAmount, 8).replace(/[^0-9.-]/g, '');
    const rawOverdue = getVal(colOverdue, 9).replace(/\D/g, '');
    const agreementNumber = getVal(colAgreement, 10);

    // Skip empty filler rows
    if (!rawName && !rawPersonalId && !rawTaxId && !rawAmount) {
      continue;
    }

    const isLegal =
      rawType.toUpperCase().includes('LEGAL') ||
      rawType.includes('იურიდიულ') ||
      (rawTaxId.length === 9 && !rawPersonalId);

    const entityType: 'LEGAL' | 'PHYSICAL' = isLegal ? 'LEGAL' : 'PHYSICAL';
    const taxId = isLegal ? rawTaxId : '';
    const personalId =
      rawPersonalId || (isLegal ? rawTaxId : `0101${Math.floor(1000000 + Math.random() * 9000000)}`);
    const name = rawName || (isLegal ? 'შპს დებიტორი' : 'დებიტორი');
    const amount = parseFloat(rawAmount) || 0;
    const overdueDays = parseInt(rawOverdue) || 0;

    parsedDebtors.push({
      entityType,
      taxId,
      personalId,
      name,
      phone: phone || '+995 599 00 00 00',
      email,
      legalAddress: legalAddress || 'ქ. თბილისი',
      actualAddress: actualAddress || 'ქ. თბილისი',
      amount,
      overdueDays,
      agreementNumber: agreementNumber || `AGR-${Date.now().toString().slice(-5)}`,
      status: 'PENDING_VERIFICATION',
      sourceFile: file.name,
    });
  }

  return parsedDebtors;
}
