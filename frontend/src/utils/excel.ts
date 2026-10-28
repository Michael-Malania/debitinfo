import ExcelJS from 'exceljs';
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
 * Generates and triggers download of a beautifully styled Microsoft Excel (.xlsx) template
 * with a native dropdown menu for Subject Type, frozen headers, and instructions.
 */
export async function downloadDebtorTemplateXLSX(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Debitinfo.GE';
  wb.created = new Date();

  // ==========================================
  // SHEET 1: დებიტორების რეესტრი (მთავარი შაბლონი)
  // ==========================================
  const ws = wb.addWorksheet('დებიტორები', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  ws.columns = [
    { header: 'სუბიექტის ტიპი', key: 'entityType', width: 34 },
    { header: 'საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა)', key: 'taxId', width: 34 },
    { header: 'პირადი ნომერი (პ/ნ 11 ნიშნა)', key: 'personalId', width: 30 },
    { header: 'სრული დასახელება / სახელი და გვარი', key: 'name', width: 38 },
    { header: 'ტელეფონი', key: 'phone', width: 22 },
    { header: 'ელ-ფოსტა', key: 'email', width: 28 },
    { header: 'იურიდიული მისამართი', key: 'legalAddress', width: 40 },
    { header: 'ფაქტობრივი მისამართი', key: 'actualAddress', width: 40 },
    { header: 'საწყისი დავალიანება (GEL)', key: 'amount', width: 26 },
    { header: 'ვადაგადაცილების დღეები', key: 'overdueDays', width: 24 },
    { header: 'ხელშეკრულების №', key: 'agreementNumber', width: 24 },
  ];

  // Header Styling (Debitinfo Deep Royal Navy Blue)
  const headerRow = ws.getRow(1);
  headerRow.height = 42;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Primary Royal Navy
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF3B82F6' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } },
    };
  });

  // Dropdown Data Validation on Column A (A2:A1000)
  (ws as any).dataValidations.add('A2:A1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"იურიდიული პირი (LEGAL),ფიზიკური პირი (PHYSICAL)"'],
    showErrorMessage: true,
    errorTitle: 'სუბიექტის ტიპის არჩევა',
    error: 'გთხოვთ აირჩიოთ ჩამოსაშლელი სიიდან: „იურიდიული პირი (LEGAL)“ ან „ფიზიკური პირი (PHYSICAL)“',
    showInputMessage: true,
    promptTitle: 'სუბიექტის ტიპი',
    prompt: 'აირჩიეთ ჩამოსაშლელი სიიდან: იურიდიული პირი (LEGAL) ან ფიზიკური პირი (PHYSICAL)',
  });

  // Sample Row 1: Legal Entity
  const row2 = ws.addRow({
    entityType: 'იურიდიული პირი (LEGAL)',
    taxId: '405118492',
    personalId: '01019012345',
    name: 'შპს კავკასუს ტრანს სერვისი',
    phone: '+995 591 442299',
    email: 'info@cts-georgia.ge',
    legalAddress: 'ქ. თბილისი, ალ. ყაზბეგის გამზ. #24ა',
    actualAddress: 'ქ. თბილისი, ალ. ყაზბეგის გამზ. #24ა',
    amount: 48500.0,
    overdueDays: 65,
    agreementNumber: 'AGR-8841',
  });
  row2.height = 28;

  // Sample Row 2: Physical Person
  const row3 = ws.addRow({
    entityType: 'ფიზიკური პირი (PHYSICAL)',
    taxId: '',
    personalId: '01024089123',
    name: 'დავით კვირიკაშვილი',
    phone: '+995 599 112233',
    email: 'davit.k@gmail.com',
    legalAddress: 'ქ. თბილისი, ვაჟა-ფშაველას გამზ. #12',
    actualAddress: 'ქ. თბილისი, ვაჟა-ფშაველას გამზ. #12',
    amount: 3200.0,
    overdueDays: 42,
    agreementNumber: 'AGR-7714',
  });
  row3.height = 28;

  // Data row styling & number/text formats
  [row2, row3].forEach((row, idx) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 9 || colNumber === 10 ? 'right' : colNumber === 1 ? 'center' : 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (idx === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F9FF' }, // Soft sky blue highlight for sample 1
        };
      }
      if (colNumber === 2 || colNumber === 3) {
        cell.numFmt = '@'; // Force text format to preserve leading zero
      }
      if (colNumber === 9) {
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // ==========================================
  // SHEET 2: ინსტრუქცია და ველების განმარტება
  // ==========================================
  const wsGuide = wb.addWorksheet('ინსტრუქცია & წესები', {
    views: [{ showGridLines: true }],
  });

  wsGuide.columns = [
    { header: '№', key: 'colNum', width: 8 },
    { header: 'ველის დასახელება', key: 'colName', width: 34 },
    { header: 'სავალდებულოა', key: 'required', width: 22 },
    { header: 'ფორმატი / მაგალითი', key: 'format', width: 36 },
    { header: 'დეტალური განმარტება', key: 'desc', width: 58 },
  ];

  const guideHeader = wsGuide.getRow(1);
  guideHeader.height = 38;
  guideHeader.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Dark Slate Navy
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF020617' } },
      right: { style: 'thin', color: { argb: 'FF475569' } },
    };
  });

  const guideRules = [
    {
      colNum: 1,
      colName: 'სუბიექტის ტიპი',
      required: 'კი (სავალდებულო)',
      format: 'ჩამოსაშლელი სია (Dropdown)',
      desc: 'აირჩიეთ „იურიდიული პირი (LEGAL)“ ან „ფიზიკური პირი (PHYSICAL)“',
    },
    {
      colNum: 2,
      colName: 'საიდენტიფიკაციო კოდი (ს/კ)',
      required: 'იურიდიულისთვის სავალდებულოა',
      format: '9 ნიშნა რიცხვი (მაგ. 405118492)',
      desc: 'ორგანიზაციის/კომპანიის საგადასახადო საიდენტიფიკაციო ნომერი RS.GE-სთვის',
    },
    {
      colNum: 3,
      colName: 'პირადი ნომერი (პ/ნ)',
      required: 'ფიზიკურისთვის სავალდებულოა',
      format: '11 ნიშნა (მაგ. 01019012345)',
      desc: 'დებიტორის პირადი ნომერი (ან იურიდიული პირის დირექტორის პ/ნ)',
    },
    {
      colNum: 4,
      colName: 'სრული დასახელება / სახელი გვარი',
      required: 'კი (სავალდებულო)',
      format: 'ტექსტი',
      desc: 'კომპანიის ოფიციალური სახელი ან მოქალაქის სახელი და გვარი',
    },
    {
      colNum: 5,
      colName: 'ტელეფონი',
      required: 'რეკომენდებული',
      format: '+995 599 000000',
      desc: 'საკონტაქტო მობილური ან ქალაქის ტელეფონი შეტყობინებებისთვის',
    },
    {
      colNum: 6,
      colName: 'ელ-ფოსტა',
      required: 'არასავალდებულო',
      format: 'example@domain.ge',
      desc: 'დებიტორის ელექტრონული ფოსტის მისამართი',
    },
    {
      colNum: 7,
      colName: 'იურიდიული მისამართი',
      required: 'რეკომენდებული',
      format: 'ქ. თბილისი, ...',
      desc: 'რეგისტრირებული იურიდიული მისამართი',
    },
    {
      colNum: 8,
      colName: 'ფაქტობრივი მისამართი',
      required: 'არასავალდებულო',
      format: 'ქ. თბილისი, ...',
      desc: 'ფაქტობრივი საცხოვრებელი ან ოფისის მისამართი (თუ განსხვავდება იურიდიულისგან)',
    },
    {
      colNum: 9,
      colName: 'საწყისი დავალიანება (GEL)',
      required: 'კი (სავალდებულო)',
      format: 'რიცხვი (მაგ. 48500.00)',
      desc: 'დავალიანების ძირი თანხა ლარში (GEL)',
    },
    {
      colNum: 10,
      colName: 'ვადაგადაცილების დღეები',
      required: 'არასავალდებულო',
      format: 'მთელი რიცხვი (მაგ. 65)',
      desc: 'ვადაგადაცილებული დღეების რაოდენობა',
    },
    {
      colNum: 11,
      colName: 'ხელშეკრულების №',
      required: 'რეკომენდებული',
      format: 'მაგ. AGR-8841',
      desc: 'სასესხო ან მომსახურების ხელშეკრულების ოფიციალური ნომერი',
    },
  ];

  guideRules.forEach((rule) => {
    const row = wsGuide.addRow(rule);
    row.height = 24;
    row.eachCell({ includeEmpty: true }, (cell, cIdx) => {
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.alignment = { vertical: 'middle', horizontal: cIdx === 1 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Write and trigger download in browser
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
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

  // Find 'დებიტორები' sheet if multiple sheets exist, otherwise use first sheet
  const targetSheetName =
    wb.SheetNames.find((s) => s.includes('დებიტორ') || s.toLowerCase().includes('debtor')) ||
    wb.SheetNames[0];

  if (!targetSheetName) return [];

  const ws = wb.Sheets[targetSheetName];
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

    // Recognize LEGAL whether it says "LEGAL", "იურიდიული პირი", or "იურიდიული პირი (LEGAL)"
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
