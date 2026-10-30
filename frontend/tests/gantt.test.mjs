import assert from 'node:assert/strict';
import test from 'node:test';
import {
  monthIndex,
  parseISODate,
  legacyMonthRangeToDates,
  getBarGeometry,
  getMilestoneGeometry,
} from '../src/utils/gantt.js';
import {
  evaluateProjectGovernance,
  GOVERNANCE_BUDGET_THRESHOLD,
} from '../src/utils/governance.js';

test('monthIndex calcula el índice absoluto continuo de meses', () => {
  const jan2026 = new Date('2026-01-15T00:00:00');
  const dec2026 = new Date('2026-12-01T00:00:00');
  const jan2027 = new Date('2027-01-05T00:00:00');

  assert.equal(monthIndex(dec2026) - monthIndex(jan2026), 11);
  assert.equal(monthIndex(jan2027) - monthIndex(dec2026), 1);
});

test('parseISODate tolera string YYYY-MM-DD, Date y valores inválidos', () => {
  const parsed = parseISODate('2026-05-15');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 4);
  assert.equal(parsed.getDate(), 15);

  assert.equal(parseISODate(null), null);
  assert.equal(parseISODate('fecha-invalida'), null);
  assert.equal(parseISODate(''), null);
});

test('legacyMonthRangeToDates convierte start y duration a fechas ISO', () => {
  const h1 = legacyMonthRangeToDates(1, 6, 2026);
  assert.equal(h1.startDate, '2026-01-01');
  assert.equal(h1.endDate, '2026-06-30');

  const dec = legacyMonthRangeToDates(12, 1, 2026);
  assert.equal(dec.startDate, '2026-12-01');
  assert.equal(dec.endDate, '2026-12-31');
});

test('getBarGeometry: Proyecto totalmente dentro de la ventana anual', () => {
  const geom = getBarGeometry({
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    windowStart: '2026-01-01',
    windowMonths: 12,
  });

  assert.ok(geom !== null);
  assert.equal(Math.round(geom.leftPct * 100) / 100, 16.67);
  assert.equal(Math.round(geom.widthPct * 100) / 100, 33.33);
  assert.equal(geom.clippedLeft, false);
  assert.equal(geom.clippedRight, false);
});

test('getBarGeometry: Empieza antes de la ventana y termina dentro (clippedLeft)', () => {
  const geom = getBarGeometry({
    startDate: '2025-10-01',
    endDate: '2026-03-31',
    windowStart: '2026-01-01',
    windowMonths: 12,
  });

  assert.ok(geom !== null);
  assert.equal(geom.leftPct, 0);
  assert.equal(geom.widthPct, 25); // Ene, Feb, Mar = 3 de 12 meses
  assert.equal(geom.clippedLeft, true);
  assert.equal(geom.clippedRight, false);
});

test('getBarGeometry: Empieza dentro y termina después (clippedRight)', () => {
  const geom = getBarGeometry({
    startDate: '2026-10-01',
    endDate: '2027-04-30',
    windowStart: '2026-01-01',
    windowMonths: 12,
  });

  assert.ok(geom !== null);
  assert.equal(geom.leftPct, 75); // Octubre es mes 10 (offset 9 meses = 75%)
  assert.equal(geom.widthPct, 25); // Oct, Nov, Dic = 3 meses visibles
  assert.equal(geom.clippedLeft, false);
  assert.equal(geom.clippedRight, true);
});

test('getBarGeometry: Totalmente fuera de la ventana devuelve null', () => {
  const past = getBarGeometry({
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    windowStart: '2026-01-01',
    windowMonths: 12,
  });
  assert.equal(past, null);

  const future = getBarGeometry({
    startDate: '2027-02-01',
    endDate: '2027-06-30',
    windowStart: '2026-01-01',
    windowMonths: 12,
  });
  assert.equal(future, null);
});

test('getBarGeometry: Soporta ventana semestral con cruce de año (Dic -> Ene)', () => {
  const geom = getBarGeometry({
    startDate: '2026-11-01',
    endDate: '2027-01-31',
    windowStart: '2026-10-01',
    windowMonths: 6, // Oct 2026 a Mar 2027
  });

  assert.ok(geom !== null);
  // Noviembre es mes 2 de la ventana (offset 1): (1/6)*100 = 16.67%
  assert.equal(Math.round(geom.leftPct * 100) / 100, 16.67);
  // Nov, Dic, Ene = 3 meses: (3/6)*100 = 50%
  assert.equal(geom.widthPct, 50);
  assert.equal(geom.clippedLeft, false);
  assert.equal(geom.clippedRight, false);
});

test('getBarGeometry: Maneja fechas inválidas o rangos invertidos', () => {
  assert.equal(getBarGeometry({ startDate: '2026-05-01', endDate: '2026-02-01', windowStart: '2026-01-01' }), null);
  assert.equal(getBarGeometry({ startDate: null, endDate: '2026-05-01', windowStart: '2026-01-01' }), null);
  assert.equal(getBarGeometry({ startDate: '2026-01-01', endDate: null, windowStart: '2026-01-01' }), null);
  assert.equal(getBarGeometry({ startDate: '2026-01-01', endDate: '2026-05-01', windowStart: null }), null);
});

test('getMilestoneGeometry: Ubica hitos dentro de la ventana y descarta los exteriores', () => {
  const mMid = getMilestoneGeometry({
    targetDate: '2026-01-16',
    windowStart: '2026-01-01',
    windowMonths: 12,
  });
  assert.ok(mMid !== null);
  assert.ok(mMid.leftPct > 3 && mMid.leftPct < 5); // Mitad de enero

  const mOutside = getMilestoneGeometry({
    targetDate: '2025-05-01',
    windowStart: '2026-01-01',
    windowMonths: 12,
  });
  assert.equal(mOutside, null);
});

test('evaluateProjectGovernance: Aplica umbral de $100k y genera metadatos', () => {
  assert.equal(GOVERNANCE_BUDGET_THRESHOLD, 100000);

  const low = evaluateProjectGovernance(45000);
  assert.equal(low.isRequired, false);
  assert.equal(low.badgeText, 'Líder (≤$100k)');
  assert.equal(low.approvalType, 'Aprobación Líder Técnico');

  const high = evaluateProjectGovernance(250000);
  assert.equal(high.isRequired, true);
  assert.equal(high.badgeText, 'Comité (>$100k)');
  assert.equal(high.approvalType, 'Revisión por Comité Directivo');
});
