import assert from 'node:assert/strict';
import test from 'node:test';
import {
  monthIndex,
  parseISODate,
  legacyMonthRangeToDates,
  getBarGeometry,
  getMilestoneGeometry,
  getRollingWindow,
} from '../src/utils/gantt.js';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

test('getRollingWindow genera ventana semestral con cruce de año y nombres de meses', () => {
  // Octubre 2026 -> Oct 2026 a Mar 2027
  const rolling = getRollingWindow('2026-10-15', 6, 0);
  assert.equal(rolling.windowStart, '2026-10-01');
  assert.equal(rolling.windowMonths, 6);
  assert.equal(rolling.months.length, 6);
  assert.deepEqual(
    rolling.months.map((m) => m.short),
    ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar']
  );
  assert.deepEqual(
    rolling.months.map((m) => m.year),
    [2026, 2026, 2026, 2027, 2027, 2027]
  );
  assert.equal(rolling.months[0].label, 'Oct 2026');
  assert.equal(rolling.months[3].label, 'Ene 2027');
});

test('DashboardContent renderiza calendario con ventana móvil y geometría real con Vite SSR', async () => {
  const server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });

  try {
    const { default: DashboardContent } = await server.ssrLoadModule('/src/views/common/DashboardContent.jsx');

    const portfolioData = {
      projects: [
        {
          id: 1,
          name: 'Edificio Central',
          area: 'Arquitectura',
          progress: 65,
          startDate: '2026-10-01',
          endDate: '2026-12-31',
        },
        {
          id: 2,
          name: 'Autopista Sur',
          area: 'Civil',
          progress: 30,
          startDate: '2026-08-01',
          endDate: '2026-11-30',
        },
        {
          id: 3,
          name: 'Proyecto Futuro',
          area: 'Sistemas',
          progress: 0,
          startDate: '2027-08-01',
          endDate: '2027-12-31',
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(DashboardContent, {
        portfolioData,
        strategicPlanningData: { milestones: [] },
        referenceDate: new Date('2026-10-15T00:00:00'),
      })
    );

    // Cabecera con ventana móvil Oct 2026 – Mar 2027
    assert.ok(html.includes('Calendario de Proyectos (Oct 2026 – Mar 2027)'));
    assert.ok(html.includes('Fases operativas críticas para los próximos 6 meses'));

    // Columnas de meses (Oct, Nov, Dic, Ene '27, Feb '27, Mar '27)
    assert.ok(html.includes('>Oct<'));
    assert.ok(html.includes('>Nov<'));
    assert.ok(html.includes('>Dic<'));
    assert.ok(html.includes('>Ene<'));
    assert.ok(html.includes('&#x27;27') || html.includes("'27"));

    // Proyectos visibles dentro de la ventana del Gantt
    assert.ok(html.includes('aria-label="Cronograma de Edificio Central"'));
    assert.ok(html.includes('aria-label="Cronograma de Autopista Sur"'));
    // Proyecto futuro fuera de la ventana NO debe tener barra en el cronograma
    assert.ok(!html.includes('aria-label="Cronograma de Proyecto Futuro"'));

    // Flecha de continuación para Autopista Sur (inició en agosto, antes de octubre)
    assert.ok(html.includes('title="Inició antes de esta ventana"'));
    assert.ok(html.includes('◀'));

    // Progreso mostrado
    assert.ok(html.includes('65%'));
    assert.ok(html.includes('30%'));
  } finally {
    await server.close();
  }
});
