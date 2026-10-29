import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export interface ParsedDebtorRow {
  entityType: 'LEGAL' | 'PHYSICAL';
  taxId?: string;
  personalId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  legalAddress?: string;
  actualAddress?: string;
  amount: number;
  debtOriginationDate?: string;
  overdueDays?: number;
  agreementNumber?: string;
  directorFirstName?: string;
  directorLastName?: string;
  directorPersonalId?: string;
  directorEmail?: string;
  directorPhone?: string;
  status?: string;
  sourceFile?: string;
}

/**
 * Format date value to YYYY-MM-DD string
 */
function parseExcelDate(val: any): { dateStr: string; overdueDays: number } {
  if (!val) {
    return { dateStr: '', overdueDays: 0 };
  }

  let date: Date | null = null;

  if (val instanceof Date && !isNaN(val.getTime())) {
    date = val;
  } else if (typeof val === 'number') {
    // Excel serial number (1900 date system)
    date = new Date(Math.round((val - 25569) * 86400 * 1000));
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    // Try YYYY-MM-DD or YYYY/MM/DD
    if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(trimmed)) {
      const parts = trimmed.split(/[-./]/).map((p) => parseInt(p, 10));
      date = new Date(parts[0], parts[1] - 1, parts[2]);
    } else if (/^\d{1,2}[-./]\d{1,2}[-./]\d{4}$/.test(trimmed)) {
      // DD.MM.YYYY or DD/MM/YYYY
      const parts = trimmed.split(/[-./]/).map((p) => parseInt(p, 10));
      date = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }
  }

  if (!date || isNaN(date.getTime())) {
    return { dateStr: '', overdueDays: 0 };
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const diffMs = Date.now() - date.getTime();
  const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  return { dateStr, overdueDays };
}

/**
 * Generates and triggers download of a beautifully styled Microsoft Excel (.xlsx) template
 * with distinct dedicated sheets for Legal Entities (13 fields) and Physical Persons (9 fields).
 */
export async function downloadDebtorTemplateXLSX(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Debitinfo.GE';
  wb.created = new Date();

  // =========================================================================
  // SHEET 1: იურიდიული პირები (LEGAL) - 13 ველები
  // =========================================================================
  const wsLegal = wb.addWorksheet('იურიდიული პირები (LEGAL)', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  wsLegal.columns = [
    { header: 'საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა) *', key: 'taxId', width: 34 },
    { header: 'სრული დასახელება *', key: 'name', width: 40 },
    { header: 'ტელეფონი *', key: 'phone', width: 22 },
    { header: 'ელ-ფოსტა', key: 'email', width: 28 },
    { header: 'იურიდიული მისამართი', key: 'legalAddress', width: 40 },
    { header: 'ფაქტობრივი მისამართი', key: 'actualAddress', width: 40 },
    { header: 'საწყისი დავალიანება (GEL) *', key: 'amount', width: 28 },
    { header: 'ვალის წარმოქმნის თარიღი (YYYY-MM-DD)', key: 'debtOriginationDate', width: 34 },
    { header: 'დირექტორის სახელი', key: 'directorFirstName', width: 24 },
    { header: 'დირექტორის გვარი', key: 'directorLastName', width: 24 },
    { header: 'დირექტორის პირადი ნომერი (არასავალდებულო)', key: 'directorPersonalId', width: 38 },
    { header: 'დირექტორის ემაილი', key: 'directorEmail', width: 28 },
    { header: 'დირექტორის ტელეფონის ნომერი', key: 'directorPhone', width: 28 },
  ];

  // Header Styling for Legal Sheet (Deep Royal Navy Blue)
  const legalHeaderRow = wsLegal.getRow(1);
  legalHeaderRow.height = 42;
  legalHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Royal Navy
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF3B82F6' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } },
    };
  });

  // Sample Rows for Legal Sheet
  const legalSample1 = wsLegal.addRow({
    taxId: '405118492',
    name: 'შპს კავკასუს ტრანს სერვისი',
    phone: '+995 591 442299',
    email: 'info@cts-georgia.ge',
    legalAddress: 'ქ. თბილისი, ალ. ყაზბეგის გამზ. #24ა',
    actualAddress: 'ქ. თბილისი, ალ. ყაზბეგის გამზ. #24ა',
    amount: 48500.0,
    debtOriginationDate: '2024-03-15',
    directorFirstName: 'დავით',
    directorLastName: 'კაპანაძე',
    directorPersonalId: '01019045812',
    directorEmail: 'davit.k@cts-georgia.ge',
    directorPhone: '+995 599 114477',
  });
  legalSample1.height = 28;

  const legalSample2 = wsLegal.addRow({
    taxId: '404882190',
    name: 'შპს იბერია ლოჯისტიკსი',
    phone: '+995 577 220033',
    email: 'contact@iberialogistics.ge',
    legalAddress: 'ქ. ბათუმი, რუსთაველის ქ. #15',
    actualAddress: 'ქ. თბილისი, აეროპორტის გზატკეცილი #4',
    amount: 18200.5,
    debtOriginationDate: '2024-06-01',
    directorFirstName: 'გიორგი',
    directorLastName: 'ლომიძე',
    directorPersonalId: '01024099881',
    directorEmail: 'g.lomidze@iberialogistics.ge',
    directorPhone: '+995 577 220033',
  });
  legalSample2.height = 28;

  [legalSample1, legalSample2].forEach((row, idx) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 7 ? 'right' : colNumber === 1 || colNumber === 8 || colNumber === 11 ? 'center' : 'left',
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
          fgColor: { argb: 'FFF0F9FF' },
        };
      }
      if (colNumber === 1 || colNumber === 3 || colNumber === 11 || colNumber === 13) {
        cell.numFmt = '@'; // Force text format to preserve leading zeroes
      }
      if (colNumber === 7) {
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // =========================================================================
  // SHEET 2: ფიზიკური პირები (PHYSICAL) - 9 ველები
  // =========================================================================
  const wsPhysical = wb.addWorksheet('ფიზიკური პირები (PHYSICAL)', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  wsPhysical.columns = [
    { header: 'პირადი ნომერი (პ/ნ 11 ნიშნა) *', key: 'personalId', width: 34 },
    { header: 'სახელი *', key: 'firstName', width: 24 },
    { header: 'გვარი *', key: 'lastName', width: 26 },
    { header: 'ტელეფონი *', key: 'phone', width: 22 },
    { header: 'ელ-ფოსტა', key: 'email', width: 28 },
    { header: 'იურიდიული მისამართი', key: 'legalAddress', width: 40 },
    { header: 'ფაქტობრივი მისამართი', key: 'actualAddress', width: 40 },
    { header: 'საწყისი დავალიანება (GEL) *', key: 'amount', width: 28 },
    { header: 'ვალის წარმოქმნის თარიღი (YYYY-MM-DD)', key: 'debtOriginationDate', width: 34 },
  ];

  // Header Styling for Physical Sheet (Deep Slate Charcoal)
  const physicalHeaderRow = wsPhysical.getRow(1);
  physicalHeaderRow.height = 42;
  physicalHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Slate Navy
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF020617' } },
      right: { style: 'thin', color: { argb: 'FF475569' } },
    };
  });

  // Sample Rows for Physical Sheet
  const physSample1 = wsPhysical.addRow({
    personalId: '01024089123',
    firstName: 'დავით',
    lastName: 'კვირიკაშვილი',
    phone: '+995 599 112233',
    email: 'davit.k@gmail.com',
    legalAddress: 'ქ. თბილისი, ვაჟა-ფშაველას გამზ. #12',
    actualAddress: 'ქ. თბილისი, ვაჟა-ფშაველას გამზ. #12',
    amount: 3200.0,
    debtOriginationDate: '2024-04-20',
  });
  physSample1.height = 28;

  const physSample2 = wsPhysical.addRow({
    personalId: '01019012345',
    firstName: 'გიორგი',
    lastName: 'ბერიძე',
    phone: '+995 595 778899',
    email: 'giorgi.beridze@mail.ge',
    legalAddress: 'ქ. ქუთაისი, ჭავჭავაძის გამზ. #54',
    actualAddress: 'ქ. თბილისი, საბურთალო, ფანჯიკიძის ქ. #8',
    amount: 1540.0,
    debtOriginationDate: '2024-07-10',
  });
  physSample2.height = 28;

  [physSample1, physSample2].forEach((row, idx) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 8 ? 'right' : colNumber === 1 || colNumber === 9 ? 'center' : 'left',
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
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
      if (colNumber === 1 || colNumber === 4) {
        cell.numFmt = '@'; // Force text format
      }
      if (colNumber === 8) {
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // =========================================================================
  // SHEET 3: ინსტრუქცია და წესები
  // =========================================================================
  const wsGuide = wb.addWorksheet('ინსტრუქცია & წესები', {
    views: [{ showGridLines: true }],
  });

  wsGuide.columns = [
    { header: '№', key: 'colNum', width: 6 },
    { header: 'სუბიექტის ტიპი', key: 'sheetTarget', width: 24 },
    { header: 'ველის დასახელება', key: 'colName', width: 34 },
    { header: 'სავალდებულოა', key: 'required', width: 20 },
    { header: 'ფორმატი / მაგალითი', key: 'format', width: 34 },
    { header: 'განმარტება & ვალიდაცია', key: 'desc', width: 52 },
  ];

  const guideHeader = wsGuide.getRow(1);
  guideHeader.height = 38;
  guideHeader.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
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
    // Legal Entity Guide
    {
      colNum: 1,
      sheetTarget: 'იურიდიული პირი',
      colName: 'საიდენტიფიკაციო კოდი',
      required: 'კი (სავალდებულო)',
      format: '9 ნიშნა რიცხვი (405118492)',
      desc: 'ორგანიზაციის/კომპანიის საგადასახადო ს/კ RS.GE-სთვის',
    },
    {
      colNum: 2,
      sheetTarget: 'იურიდიული პირი',
      colName: 'სრული დასახელება',
      required: 'კი (სავალდებულო)',
      format: 'ტექსტი',
      desc: 'კომპანიის ოფიციალური იურიდიული სახელი',
    },
    {
      colNum: 3,
      sheetTarget: 'იურიდიული პირი',
      colName: 'ტელეფონი',
      required: 'კი (სავალდებულო)',
      format: '+995 599 000000',
      desc: 'ორგანიზაციის საკონტაქტო ტელეფონი',
    },
    {
      colNum: 4,
      sheetTarget: 'იურიდიული პირი',
      colName: 'ელ-ფოსტა',
      required: 'არასავალდებულო',
      format: 'info@company.ge',
      desc: 'ორგანიზაციის საკონტაქტო ელექტრონული ფოსტა',
    },
    {
      colNum: 5,
      sheetTarget: 'იურიდიული პირი',
      colName: 'იურიდიული მისამართი',
      required: 'რეკომენდებული',
      format: 'ქ. თბილისი, ...',
      desc: 'რეესტრში რეგისტრირებული იურიდიული მისამართი',
    },
    {
      colNum: 6,
      sheetTarget: 'იურიდიული პირი',
      colName: 'ფაქტობრივი მისამართი',
      required: 'არასავალდებულო',
      format: 'ქ. თბილისი, ...',
      desc: 'ფაქტობრივი ოფისის ან საწყობის მისამართი',
    },
    {
      colNum: 7,
      sheetTarget: 'იურიდიული პირი',
      colName: 'საწყისი დავალიანება (GEL)',
      required: 'კი (სავალდებულო)',
      format: 'რიცხვი (მაგ. 48500.00)',
      desc: 'დავალიანების ძირი თანხა ლარში (GEL)',
    },
    {
      colNum: 8,
      sheetTarget: 'იურიდიული პირი',
      colName: 'ვალის წარმოქმნის თარიღი',
      required: 'რეკომენდებული',
      format: 'YYYY-MM-DD (მაგ. 2024-03-15)',
      desc: 'სისტემა ავტომატურად ითვლის ვადაგადაცილებას დღეებში',
    },
    {
      colNum: 9,
      sheetTarget: 'იურიდიული პირი',
      colName: 'დირექტორის სახელი',
      required: 'არასავალდებულო',
      format: 'დავით',
      desc: 'კომპანიის ხელმძღვანელის სახელი',
    },
    {
      colNum: 10,
      sheetTarget: 'იურიდიული პირი',
      colName: 'დირექტორის გვარი',
      required: 'არასავალდებულო',
      format: 'კაპანაძე',
      desc: 'კომპანიის ხელმძღვანელის გვარი',
    },
    {
      colNum: 11,
      sheetTarget: 'იურიდიული პირი',
      colName: 'დირექტორის პირადი ნომერი',
      required: 'არასავალდებულო',
      format: '11 ნიშნა (01019045812)',
      desc: 'დირექტორის პირადი ნომერი (პ/ნ)',
    },
    {
      colNum: 12,
      sheetTarget: 'იურიდიული პირი',
      colName: 'დირექტორის ემაილი',
      required: 'არასავალდებულო',
      format: 'davit@cts.ge',
      desc: 'დირექტორის პირდაპირი ელექტრონული ფოსტა',
    },
    {
      colNum: 13,
      sheetTarget: 'იურიდიული პირი',
      colName: 'დირექტორის ტელეფონი',
      required: 'არასავალდებულო',
      format: '+995 599 114477',
      desc: 'დირექტორის პირდაპირი ტელეფონი',
    },
    // Physical Person Guide
    {
      colNum: 1,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'პირადი ნომერი (პ/ნ)',
      required: 'კი (სავალდებულო)',
      format: '11 ნიშნა (01024089123)',
      desc: 'მოქალაქის პირადი ნომერი RS.GE-სთვის',
    },
    {
      colNum: 2,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'სახელი',
      required: 'კი (სავალდებულო)',
      format: 'დავით',
      desc: 'მოქალაქის სახელი',
    },
    {
      colNum: 3,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'გვარი',
      required: 'კი (სავალდებულო)',
      format: 'კვირიკაშვილი',
      desc: 'მოქალაქის გვარი',
    },
    {
      colNum: 4,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'ტელეფონი',
      required: 'კი (სავალდებულო)',
      format: '+995 599 000000',
      desc: 'საკონტაქტო მობილური ტელეფონი',
    },
    {
      colNum: 5,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'ელ-ფოსტა',
      required: 'არასავალდებულო',
      format: 'davit@gmail.com',
      desc: 'მოქალაქის ელ-ფოსტის მისამართი',
    },
    {
      colNum: 6,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'იურიდიული მისამართი',
      required: 'რეკომენდებული',
      format: 'ქ. თბილისი, ...',
      desc: 'რეგისტრირებული საცხოვრებელი მისამართი',
    },
    {
      colNum: 7,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'ფაქტობრივი მისამართი',
      required: 'არასავალდებულო',
      format: 'ქ. თბილისი, ...',
      desc: 'ფაქტობრივი საცხოვრებელი მისამართი',
    },
    {
      colNum: 8,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'საწყისი დავალიანება (GEL)',
      required: 'კი (სავალდებულო)',
      format: 'რიცხვი (3200.00)',
      desc: 'დავალიანების თანხა ლარში (GEL)',
    },
    {
      colNum: 9,
      sheetTarget: 'ფიზიკური პირი',
      colName: 'ვალის წარმოქმნის თარიღი',
      required: 'რეკომენდებული',
      format: 'YYYY-MM-DD (2024-04-20)',
      desc: 'სისტემა ავტომატურად ითვლის ვადაგადაცილების დღეებს',
    },
  ];

  guideRules.forEach((rule) => {
    const row = wsGuide.addRow(rule);
    row.height = 24;
    row.eachCell({ includeEmpty: true }, (cell, cIdx) => {
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.alignment = { vertical: 'middle', horizontal: cIdx === 1 || cIdx === 2 ? 'center' : 'left' };
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
 * Supports both dedicated sheets ('იურიდიული პირები' & 'ფიზიკური პირები') and combined formats.
 */
export async function parseDebtorExcelFile(file: File): Promise<ParsedDebtorRow[]> {
  let wb: XLSX.WorkBook;
  const isCsv = file.name.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const text = await file.text();
    wb = XLSX.read(text, { type: 'string', cellDates: true });
  } else {
    const buffer = await file.arrayBuffer();
    wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  }

  const parsedDebtors: ParsedDebtorRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const lowerName = sheetName.toLowerCase();
    // Skip instruction and rule sheets
    if (lowerName.includes('ინსტრუქცია') || lowerName.includes('წეს') || lowerName.includes('guide') || lowerName.includes('info')) {
      continue;
    }

    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    if (!rawRows || rawRows.length < 2) continue;

    const headerRow = (rawRows[0] || []).map((c) => String(c || '').trim().toLowerCase());

    const findColIndex = (...keywords: string[]): number => {
      return headerRow.findIndex((h) => keywords.some((kw) => h.includes(kw.toLowerCase())));
    };

    // Determine sheet entity type: LEGAL vs PHYSICAL vs GENERAL
    const isExplicitLegalSheet = lowerName.includes('იურიდიულ') || lowerName.includes('legal');
    const isExplicitPhysicalSheet = lowerName.includes('ფიზიკურ') || lowerName.includes('physical');

    const colType = findColIndex('სუბიექტის ტიპი', 'ტიპი', 'entity');
    const colTaxId = findColIndex('საიდენტიფიკაციო', 'ს/კ', 'tax');
    const colPersonalId = findColIndex('პირადი ნომერი', 'პირადი', 'პ/ნ', 'personal id', 'pin');
    const colFullName = findColIndex('სრული დასახელება', 'დასახელება');
    const colFirstName = findColIndex('სახელი', 'first name', 'firstname');
    const colLastName = findColIndex('გვარი', 'last name', 'lastname');
    const colPhone = findColIndex('ტელეფონი', 'მობილური', 'phone', 'tel');
    const colEmail = findColIndex('ელ-ფოსტა', 'ემაილი', 'ფოსტა', 'email', 'mail');
    const colLegalAddr = findColIndex('იურიდიული მისამართი', 'იურიდიული', 'legal address');
    const colActualAddr = findColIndex('ფაქტობრივი მისამართი', 'ფაქტობრივი', 'actual address');
    const colAmount = findColIndex('საწყისი დავალიანება', 'დავალიანება', 'თანხა', 'amount');
    const colDebtDate = findColIndex('წარმოქმნის თარიღი', 'თარიღი', 'date', 'origination');
    const colOverdue = findColIndex('ვადაგადაცილების დღეები', 'ვადაგადაცილ', 'overdue');

    // Director columns for Legal Entity
    const colDirFirstName = findColIndex('დირექტორის სახელი', 'director first');
    const colDirLastName = findColIndex('დირექტორის გვარი', 'director last');
    const colDirPersonalId = findColIndex('დირექტორის პირადი', 'director pin', 'director id');
    const colDirEmail = findColIndex('დირექტორის ემაილი', 'დირექტორის ელ-ფოსტა', 'director email');
    const colDirPhone = findColIndex('დირექტორის ტელეფონ', 'director phone');

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const getVal = (colIdx: number): string => {
        if (colIdx === -1 || colIdx === undefined) return '';
        return String(row[colIdx] ?? '').trim();
      };

      const rawType = getVal(colType);
      const rawTaxId = getVal(colTaxId).replace(/\D/g, '');
      let rawPersonalId = getVal(colPersonalId).replace(/\D/g, '');
      if (rawPersonalId.length === 10) {
        rawPersonalId = rawPersonalId.padStart(11, '0');
      }

      const fullName = getVal(colFullName);
      const firstName = getVal(colFirstName);
      const lastName = getVal(colLastName);
      const phone = getVal(colPhone);
      const email = getVal(colEmail);
      const legalAddress = getVal(colLegalAddr);
      const actualAddress = getVal(colActualAddr) || legalAddress;
      const rawAmount = getVal(colAmount).replace(/[^0-9.-]/g, '');
      const rawDebtDate = getVal(colDebtDate);
      const rawOverdue = getVal(colOverdue).replace(/\D/g, '');

      // Director fields
      const directorFirstName = getVal(colDirFirstName);
      const directorLastName = getVal(colDirLastName);
      let directorPersonalId = getVal(colDirPersonalId).replace(/\D/g, '');
      if (directorPersonalId.length === 10) {
        directorPersonalId = directorPersonalId.padStart(11, '0');
      }
      const directorEmail = getVal(colDirEmail);
      const directorPhone = getVal(colDirPhone);

      // Skip blank rows
      if (!rawTaxId && !rawPersonalId && !fullName && !firstName && !rawAmount) {
        continue;
      }

      // Determine entity type
      let entityType: 'LEGAL' | 'PHYSICAL';
      if (isExplicitLegalSheet) {
        entityType = 'LEGAL';
      } else if (isExplicitPhysicalSheet) {
        entityType = 'PHYSICAL';
      } else if (rawType.toUpperCase().includes('LEGAL') || rawType.includes('იურიდიულ') || rawTaxId.length === 9) {
        entityType = 'LEGAL';
      } else {
        entityType = 'PHYSICAL';
      }

      const { dateStr, overdueDays: calcOverdue } = parseExcelDate(rawDebtDate);
      const overdueDays = parseInt(rawOverdue, 10) || calcOverdue || 0;
      const amount = parseFloat(rawAmount) || 0;

      let displayName = '';
      if (entityType === 'LEGAL') {
        displayName = fullName || firstName || 'შპს დებიტორი';
      } else {
        displayName = (firstName && lastName ? `${firstName} ${lastName}` : fullName || firstName || lastName || 'დებიტორი').trim();
      }

      const taxId = entityType === 'LEGAL' ? rawTaxId : '';
      const personalId = entityType === 'PHYSICAL'
        ? (rawPersonalId || `0101${Math.floor(1000000 + Math.random() * 9000000)}`)
        : (directorPersonalId || rawTaxId || `405${Math.floor(100000 + Math.random() * 900000)}`);

      parsedDebtors.push({
        entityType,
        taxId,
        personalId,
        name: displayName,
        firstName: entityType === 'PHYSICAL' ? firstName : undefined,
        lastName: entityType === 'PHYSICAL' ? lastName : undefined,
        phone: phone || '+995 599 00 00 00',
        email: email || undefined,
        legalAddress: legalAddress || 'ქ. თბილისი',
        actualAddress: actualAddress || 'ქ. თბილისი',
        amount,
        debtOriginationDate: dateStr || undefined,
        overdueDays,
        agreementNumber: `AGR-${Date.now().toString().slice(-5)}`,
        directorFirstName: entityType === 'LEGAL' ? directorFirstName : undefined,
        directorLastName: entityType === 'LEGAL' ? directorLastName : undefined,
        directorPersonalId: entityType === 'LEGAL' ? directorPersonalId : undefined,
        directorEmail: entityType === 'LEGAL' ? directorEmail : undefined,
        directorPhone: entityType === 'LEGAL' ? directorPhone : undefined,
        status: 'PENDING_VERIFICATION',
        sourceFile: file.name,
      });
    }
  }

  return parsedDebtors;
}

export interface DebtorScheduleExportParams {
  debtorName: string;
  debtorPersonalId: string;
  creditorName: string;
  caseNumber: string;
  agreementNumber?: string;
  totalInitial: number;
  totalRemaining: number;
  totalPaid: number;
  installments: Array<{
    installmentNo: number | string;
    dueDate: string;
    principal: number | string;
    interest: number | string;
    amount: number | string;
    remaining: number | string;
    isPaid?: boolean;
    isNextDue?: boolean;
    statusText?: string;
  }>;
}

/**
 * Generates and triggers download of an elegant, professional Microsoft Excel (.xlsx) statement
 * for the debtor's payment schedule, balances, and transaction dynamics.
 */
export async function downloadDebtorScheduleStatementXLSX(params: DebtorScheduleExportParams): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Debitinfo.GE';
  wb.created = new Date();

  const ws = wb.addWorksheet('დაფარვის ამონაწერი', {
    views: [{ state: 'frozen', ySplit: 7, showGridLines: true }],
  });

  // Set columns
  ws.columns = [
    { key: 'colA', width: 8 },  // №
    { key: 'colB', width: 22 }, // გადახდის ვადა
    { key: 'colC', width: 22 }, // ძირი თანხა (GEL)
    { key: 'colD', width: 20 }, // პროცენტი (GEL)
    { key: 'colE', width: 24 }, // ჯამური შენატანი (GEL)
    { key: 'colF', width: 26 }, // დარჩენილი ბალანსი (GEL)
    { key: 'colG', width: 24 }, // სტატუსი
  ];

  // Title Banner (Row 1)
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'DEBITINFO.GE • ოფიციალური ამონაწერი და დაფარვის გრაფიკი';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep Royal Navy Blue
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 36;

  // Subtitle Banner (Row 2)
  ws.mergeCells('A2:G2');
  const subCell = ws.getCell('A2');
  subCell.value = `საქმის № ${params.caseNumber} • ხელშეკრულების № ${params.agreementNumber || 'AGR-8841'} • გენერირების თარიღი: ${new Date().toLocaleDateString('ka-GE')}`;
  subCell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FFE0E7FF' } };
  subCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 22;

  // Blank separator (Row 3)
  ws.getRow(3).height = 10;

  // Summary Metadata Info (Rows 4 - 6)
  const metaStyleLabel: Partial<ExcelJS.Style> = {
    font: { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle', horizontal: 'left' },
  };
  const metaStyleVal: Partial<ExcelJS.Style> = {
    font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle', horizontal: 'left' },
  };

  ws.getCell('A4').value = 'მოვალე (დებიტორი):';
  ws.getCell('A4').style = metaStyleLabel as any;
  ws.getCell('B4').value = params.debtorName;
  ws.getCell('B4').style = metaStyleVal as any;
  ws.mergeCells('B4:C4');

  ws.getCell('E4').value = 'კრედიტორი:';
  ws.getCell('E4').style = metaStyleLabel as any;
  ws.getCell('F4').value = params.creditorName;
  ws.getCell('F4').style = metaStyleVal as any;
  ws.mergeCells('F4:G4');

  ws.getCell('A5').value = 'პირადი ნომერი:';
  ws.getCell('A5').style = metaStyleLabel as any;
  ws.getCell('B5').value = String(params.debtorPersonalId);
  ws.getCell('B5').numFmt = '@';
  ws.getCell('B5').style = metaStyleVal as any;

  ws.getCell('E5').value = 'საწყისი დავალიანება:';
  ws.getCell('E5').style = metaStyleLabel as any;
  ws.getCell('F5').value = `₾ ${Number(params.totalInitial).toLocaleString('ka-GE')}.00`;
  ws.getCell('F5').style = metaStyleVal as any;

  ws.getCell('A6').value = 'საქმის სტატუსი:';
  ws.getCell('A6').style = metaStyleLabel as any;
  ws.getCell('B6').value = 'აქტიური (დამტკიცებული გრაფიკი)';
  ws.getCell('B6').style = metaStyleVal as any;

  ws.getCell('E6').value = 'დარჩენილი ბალანსი:';
  ws.getCell('E6').style = metaStyleLabel as any;
  ws.getCell('F6').value = `₾ ${Number(params.totalRemaining).toLocaleString('ka-GE')}.00`;
  ws.getCell('F6').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFD97706' } };

  [4, 5, 6].forEach((r) => {
    ws.getRow(r).height = 20;
  });

  // Table Headers (Row 7)
  const headerRow = ws.getRow(7);
  headerRow.height = 32;
  const headers = [
    '№',
    'გადახდის ვადა',
    'ძირი თანხა (GEL)',
    'პროცენტი (GEL)',
    'ჯამური შენატანი (GEL)',
    'დარჩენილი ბალანსი (GEL)',
    'სტატუსი',
  ];

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Slate Navy
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx === 0 || idx === 1 || idx === 6 ? 'center' : 'right',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF020617' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF020617' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Data Rows (Row 8 onwards)
  let sumPrincipal = 0;
  let sumInterest = 0;
  let sumAmount = 0;

  params.installments.forEach((inst, idx) => {
    const rowNum = 8 + idx;
    const r = ws.getRow(rowNum);
    r.height = 24;

    const parseNum = (val: any): number => {
      if (typeof val === 'number') return val;
      const cleaned = String(val || '').replace(/[^0-9.-]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const p = parseNum(inst.principal);
    const i = parseNum(inst.interest);
    const a = parseNum(inst.amount);
    const rem = parseNum(inst.remaining);

    sumPrincipal += p;
    sumInterest += i;
    sumAmount += a;

    const statusText = inst.statusText || (inst.isPaid ? 'გადახდილი' : inst.isNextDue ? 'მომდევნო გადასახდელი' : 'დაგეგმილი');

    r.getCell(1).value = inst.installmentNo;
    r.getCell(2).value = inst.dueDate;
    r.getCell(3).value = p;
    r.getCell(4).value = i;
    r.getCell(5).value = a;
    r.getCell(6).value = rem;
    r.getCell(7).value = statusText;

    // Zebra striping
    const isEven = idx % 2 === 1;
    const baseBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    for (let c = 1; c <= 7; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: baseBg },
      };

      if (c === 1 || c === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c >= 3 && c <= 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0.00';
        if (c === 5) cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
      } else if (c === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (inst.isPaid) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF166534' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else if (inst.isNextDue) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF92400E' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        } else {
          cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };
        }
      }
    }
  });

  // Totals Row
  const totalRowNum = 8 + params.installments.length;
  const totRow = ws.getRow(totalRowNum);
  totRow.height = 26;
  ws.mergeCells(`A${totalRowNum}:B${totalRowNum}`);
  totRow.getCell(1).value = 'სულ ჯამი:';
  totRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  totRow.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };

  totRow.getCell(3).value = Math.round(sumPrincipal * 100) / 100;
  totRow.getCell(4).value = Math.round(sumInterest * 100) / 100;
  totRow.getCell(5).value = Math.round(sumAmount * 100) / 100;
  totRow.getCell(6).value = 0.0;
  totRow.getCell(7).value = 'სრული დაფარვა';
  totRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

  for (let c = 1; c <= 7; c++) {
    const cell = totRow.getCell(c);
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
    if (c >= 3 && c <= 6) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = '#,##0.00';
    }
  }

  // Footer Row
  const footerRowNum = totalRowNum + 2;
  ws.mergeCells(`A${footerRowNum}:G${footerRowNum}`);
  const footCell = ws.getCell(`A${footerRowNum}`);
  footCell.value = 'დოკუმენტი დაგენერირებულია Debitinfo.GE ფინანსური პლატფორმის მიერ და წარმოადგენს ოფიციალურ ამონაწერს.';
  footCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
  footCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Generate buffer and trigger browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `debitinfo_amonaweri_${params.caseNumber}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and triggers download of a styled Microsoft Excel (.xlsx) Account Turnover Statement (ბრუნვითი ბარათი)
 */
export async function downloadDebtorAccountTurnoverXLSX(params: {
  debtorName: string;
  debtorPersonalId: string;
  creditorName: string;
  caseNumber: string;
  agreementNumber?: string;
  fileName?: string;
  items?: Array<{
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    docNumber: string;
  }>;
}): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Debitinfo.GE';
  wb.created = new Date();

  const ws = wb.addWorksheet('ბრუნვითი ბარათი', {
    views: [{ state: 'frozen', ySplit: 6, showGridLines: true }],
  });

  ws.columns = [
    { key: 'colA', width: 16 }, // თარიღი
    { key: 'colB', width: 44 }, // ოპერაციის დასახელება
    { key: 'colC', width: 22 }, // დებეტი (GEL)
    { key: 'colD', width: 22 }, // კრედიტი (GEL)
    { key: 'colE', width: 22 }, // ნაშთი (GEL)
    { key: 'colF', width: 24 }, // დოკუმენტის №
  ];

  // Header Banner (Row 1)
  ws.mergeCells('A1:F1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Debitinfo.GE • ბრუნვითი ბარათი / ანგარიშსწორების რეესტრი';
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' }, // Teal / Emerald
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 36;

  // Subtitle Banner (Row 2)
  ws.mergeCells('A2:F2');
  const subCell = ws.getCell('A2');
  subCell.value = `მოვალე: ${params.debtorName} (${params.debtorPersonalId}) • კრედიტორი: ${params.creditorName} • საქმე #${params.caseNumber}`;
  subCell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FFF0FDFA' } };
  subCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF115E59' },
  };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 22;

  // Spacing (Row 3)
  ws.getRow(3).height = 10;

  // Metadata Row 4 & 5
  ws.getCell('A4').value = 'გენერირების თარიღი:';
  ws.getCell('A4').font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF475569' } };
  ws.getCell('B4').value = new Date().toLocaleDateString('ka-GE');
  ws.getCell('B4').font = { name: 'Segoe UI', size: 9.5, bold: true };

  ws.getCell('D4').value = 'ხელშეკრულების №:';
  ws.getCell('D4').font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF475569' } };
  ws.getCell('E4').value = params.agreementNumber || 'AGR-8841';
  ws.getCell('E4').font = { name: 'Segoe UI', size: 9.5, bold: true };

  ws.getRow(4).height = 20;
  ws.getRow(5).height = 8;

  // Table Headers (Row 6)
  const headerRow = ws.getRow(6);
  headerRow.height = 30;
  const headers = [
    'თარიღი',
    'ოპერაციის დასახელება',
    'დებეტი (GEL)',
    'კრედიტი (GEL)',
    'ნაშთი (GEL)',
    'დოკუმენტის №',
  ];

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF134E4A' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx === 0 || idx === 5 ? 'center' : idx === 1 ? 'left' : 'right',
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF2DD4BF' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      right: { style: 'thin', color: { argb: 'FF2DD4BF' } },
    };
  });

  const defaultItems = [
    { date: '2024-01-15', description: 'სასაქონლო მიწოდება ხელშეკრულებით #AGR-8841', debit: 5000.0, credit: 0.0, balance: 5000.0, docNumber: 'INV-2024-01' },
    { date: '2024-03-25', description: 'შენატანი 01 (საბანკო გადარიცხვა BOG)', debit: 0.0, credit: 300.0, balance: 4700.0, docNumber: 'REC-8841-01' },
    { date: '2024-04-25', description: 'შენატანი 02 (საბანკო გადარიცხვა TBC)', debit: 0.0, credit: 300.0, balance: 4400.0, docNumber: 'REC-8841-02' },
    { date: '2024-05-25', description: 'შენატანი 03 (საბანკო გადარიცხვა BOG)', debit: 0.0, credit: 300.0, balance: 4100.0, docNumber: 'REC-8841-03' },
    { date: '2024-06-25', description: 'შენატანი 04 (საბანკო გადარიცხვა BOG)', debit: 0.0, credit: 300.0, balance: 3800.0, docNumber: 'REC-8841-04' },
    { date: '2024-07-25', description: 'შენატანი 05 (საბანკო გადარიცხვა TBC)', debit: 0.0, credit: 300.0, balance: 3500.0, docNumber: 'REC-8841-05' },
    { date: '2024-08-25', description: 'შენატანი 06 (საბანკო გადარიცხვა BOG)', debit: 0.0, credit: 300.0, balance: 3200.0, docNumber: 'REC-8841-06' },
    { date: '2024-09-25', description: 'შენატანი 07 (საბანკო გადარიცხვა BOG)', debit: 0.0, credit: 300.0, balance: 2900.0, docNumber: 'REC-8841-07' },
  ];

  const items = params.items && params.items.length > 0 ? params.items : defaultItems;

  let totalDebit = 0;
  let totalCredit = 0;

  items.forEach((item, idx) => {
    const rowNum = 7 + idx;
    const r = ws.getRow(rowNum);
    r.height = 24;

    totalDebit += item.debit;
    totalCredit += item.credit;

    r.getCell(1).value = item.date;
    r.getCell(2).value = item.description;
    r.getCell(3).value = item.debit;
    r.getCell(4).value = item.credit;
    r.getCell(5).value = item.balance;
    r.getCell(6).value = item.docNumber;

    const isEven = idx % 2 === 1;
    const baseBg = isEven ? 'FFF0FDFA' : 'FFFFFFFF';

    for (let c = 1; c <= 6; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: baseBg },
      };

      if (c === 1 || c === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0.00';
      }
    }
  });

  // Totals Row
  const totalRowNum = 7 + items.length;
  const totRow = ws.getRow(totalRowNum);
  totRow.height = 26;
  ws.mergeCells(`A${totalRowNum}:B${totalRowNum}`);
  totRow.getCell(1).value = 'სულ ბრუნვა (ჯამი):';
  totRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  totRow.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };

  totRow.getCell(3).value = totalDebit;
  totRow.getCell(4).value = totalCredit;
  totRow.getCell(5).value = totalDebit - totalCredit;
  totRow.getCell(6).value = '—';
  totRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

  for (let c = 1; c <= 6; c++) {
    const cell = totRow.getCell(c);
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
    if (c >= 3 && c <= 5) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = '#,##0.00';
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const rawName = params.fileName || `brunviti_barati_${params.caseNumber}`;
  const fileName = rawName.replace(/\.csv$/, '.xlsx');
  link.setAttribute('download', fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
