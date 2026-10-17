import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { createHumanResourcesData } from '../src/mocks/humanResourcesData.js';
import {
  buildPersonnelWorkbook,
  personnelWorkbookFilename,
  personnelWorkbookSheetName,
} from '../src/utils/personnelWorkbook.js';

test('La matriz se genera como un Excel formateado con todos los integrantes actuales', async () => {
  const { members } = createHumanResourcesData();
  const workbook = await buildPersonnelWorkbook(members);
  const buffer = await workbook.xlsx.writeBuffer();

  assert.equal(personnelWorkbookFilename, 'matriz-recursos-humanos.xlsx');
  assert.ok(buffer.byteLength > 0);

  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(buffer);
  const worksheet = reopened.getWorksheet(personnelWorkbookSheetName);

  assert.ok(worksheet);
  assert.equal(worksheet.rowCount, members.length + 1);
  assert.deepEqual(
    worksheet.getRow(1).values.slice(1),
    ['Nombre', 'Área técnica', 'Proyecto asignado', 'Estado', 'Disponibilidad'],
  );
  assert.equal(worksheet.getCell('A2').value, members[0].name);
  assert.equal(worksheet.getCell('E2').value, members[0].availability / 100);
  assert.equal(worksheet.getCell('E2').numFmt, '0%');
  assert.equal(worksheet.views[0].state, 'frozen');
  assert.equal(worksheet.views[0].ySplit, 1);
  assert.equal(worksheet.autoFilter, 'A1:E1');
  assert.equal(worksheet.getRow(1).getCell(1).font.bold, true);
  assert.equal(worksheet.getRow(2).getCell(1).font.bold, true);
});

test('Un integrante añadido antes de exportar también aparece en el Excel', async () => {
  const { members } = createHumanResourcesData();
  const newMember = {
    id: 'hr-nuevo',
    name: 'Nuevo Técnico',
    area: 'Sistemas',
    project: 'Torre Reforma',
    status: 'active',
    availability: 75,
  };
  const workbook = await buildPersonnelWorkbook([...members, newMember]);
  const worksheet = workbook.getWorksheet(personnelWorkbookSheetName);
  const lastRow = worksheet.getRow(worksheet.rowCount);

  assert.equal(worksheet.rowCount, members.length + 2);
  assert.equal(lastRow.getCell(1).value, 'Nuevo Técnico');
  assert.equal(lastRow.getCell(5).value, 0.75);
});
