import { personnelStatuses } from '../constants/humanResources.js';

export const personnelWorkbookFilename = 'matriz-recursos-humanos.xlsx';
export const personnelWorkbookSheetName = 'Matriz RRHH';

const headers = ['Nombre', 'Área técnica', 'Proyecto asignado', 'Estado', 'Disponibilidad'];
const statusStyles = {
  active: { fill: 'FFDCFCE7', font: 'FF166534' },
  standby: { fill: 'FFFEF3C7', font: 'FF92400E' },
  support: { fill: 'FFDBEAFE', font: 'FF1D4ED8' },
};

function getStatusLabel(status) {
  return personnelStatuses.find((item) => item.id === status)?.label || status || 'Sin estado';
}

function normalizeAvailability(value) {
  const availability = Number(value);
  if (!Number.isFinite(availability)) return 0;
  return Math.min(100, Math.max(0, availability)) / 100;
}

async function loadExcelJS() {
  const excelJsModule = await import('exceljs');
  return excelJsModule.default ?? excelJsModule;
}

export async function buildPersonnelWorkbook(members = []) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Project Planner';
  workbook.title = 'Matriz de Recursos Humanos';
  workbook.subject = 'Asignación, estado y disponibilidad del personal';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(personnelWorkbookSheetName, {
    properties: { defaultRowHeight: 22 },
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  worksheet.views = [{
    state: 'frozen',
    ySplit: 1,
    topLeftCell: 'A2',
    activeCell: 'A2',
    showGridLines: false,
  }];
  worksheet.columns = [
    { header: headers[0], key: 'name', width: 28 },
    { header: headers[1], key: 'area', width: 22 },
    { header: headers[2], key: 'project', width: 34 },
    { header: headers[3], key: 'status', width: 18 },
    { header: headers[4], key: 'availability', width: 18 },
  ];

  worksheet.addRows(members.map((member) => ({
    name: member?.name || '',
    area: member?.area || '',
    project: member?.project || 'Ninguno',
    status: getStatusLabel(member?.status),
    availability: normalizeAvailability(member?.availability),
  })));

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF22D3EE' } } };
  });

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    row.height = 24;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowNumber % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' },
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    row.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    const statusStyle = statusStyles[members[rowNumber - 2]?.status];
    if (statusStyle) {
      const statusCell = row.getCell(4);
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusStyle.fill } };
      statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: statusStyle.font } };
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    const availabilityCell = row.getCell(5);
    availabilityCell.numFmt = '0%';
    availabilityCell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  worksheet.autoFilter = { from: 'A1', to: 'E1' };
  worksheet.pageSetup.printTitlesRow = '1:1';
  worksheet.pageSetup.printArea = `A1:E${Math.max(1, worksheet.rowCount)}`;

  return workbook;
}

export async function downloadPersonnelWorkbook(members = []) {
  const workbook = await buildPersonnelWorkbook(members);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = personnelWorkbookFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);

  return { filename: personnelWorkbookFilename, rowCount: members.length };
}
