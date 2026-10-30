/**
 * Motor de cálculo de geometría temporal para diagramas de Gantt y cronogramas.
 * Opera mediante índice absoluto de mes para soportar cualquier escala (6, 12 meses)
 * y cruces de año sin lógica hardcodeada.
 */

export const monthIndex = (d) => d.getFullYear() * 12 + d.getMonth();

/**
 * Parsea un valor de fecha (string YYYY-MM-DD o Date) a un Date válido a las 00:00:00.
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
export function parseISODate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const str = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(`${str}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Convierte un mes de inicio (1-12) y duración en meses a un rango de fechas ISO.
 * @param {number|string} startMonth - Mes 1 a 12
 * @param {number|string} durationMonths - Duración en meses
 * @param {number|string} [year=2026] - Año de referencia
 * @returns {{ startDate: string, endDate: string }}
 */
export function legacyMonthRangeToDates(startMonth, durationMonths, year = new Date().getFullYear()) {
  const y = Number(year) || new Date().getFullYear();
  const s = Math.max(1, Math.min(12, Number(startMonth) || 1));
  const d = Math.max(1, Math.min(13 - s, Number(durationMonths) || 1));
  const startDate = `${y}-${String(s).padStart(2, '0')}-01`;
  const endMonth = s + d - 1;
  const lastDay = new Date(y, endMonth, 0).getDate();
  const endDate = `${y}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

/**
 * Calcula la geometría porcentual (leftPct, widthPct) de una barra dentro de una ventana temporal.
 * @param {Object} params
 * @param {string|Date} params.startDate - Fecha de inicio de la actividad/proyecto
 * @param {string|Date} params.endDate - Fecha de fin de la actividad/proyecto
 * @param {string|Date} params.windowStart - Fecha del primer mes visible de la ventana
 * @param {number} [params.windowMonths=12] - Duración de la ventana en meses (ej. 6 o 12)
 * @returns {{ leftPct: number, widthPct: number, clippedLeft: boolean, clippedRight: boolean }|null}
 */
export function getBarGeometry({ startDate, endDate, windowStart, windowMonths = 12 }) {
  const s = parseISODate(startDate);
  const e = parseISODate(endDate);
  const w = parseISODate(windowStart);

  if (!s || !e || !w) return null;
  const monthsCount = Number(windowMonths);
  if (!Number.isInteger(monthsCount) || monthsCount <= 0) return null;

  const sIdx = monthIndex(s);
  const eIdx = monthIndex(e);
  if (eIdx < sIdx) return null; // rango invertido inválido

  const winStart = monthIndex(w);
  const winEnd = winStart + monthsCount - 1;

  const start = Math.max(sIdx, winStart);
  const end = Math.min(eIdx, winEnd);

  // Fuera de la ventana visible
  if (end < start || sIdx > winEnd || eIdx < winStart) return null;

  return {
    leftPct: ((start - winStart) / monthsCount) * 100,
    widthPct: ((end - start + 1) / monthsCount) * 100,
    clippedLeft: sIdx < winStart,
    clippedRight: eIdx > winEnd,
  };
}

/**
 * Calcula la posición porcentual de un hito puntual dentro de una ventana temporal visible.
 * @param {Object} params
 * @param {string|Date} params.targetDate - Fecha límite del hito
 * @param {string|Date} params.windowStart - Fecha del primer mes visible
 * @param {number} [params.windowMonths=12] - Duración de la ventana en meses
 * @returns {{ leftPct: number }|null} Posición entre 2% y 98%, o null si queda fuera
 */
export function getMilestoneGeometry({ targetDate, windowStart, windowMonths = 12 }) {
  const d = parseISODate(targetDate);
  const w = parseISODate(windowStart);

  if (!d || !w) return null;
  const monthsCount = Number(windowMonths);
  if (!Number.isInteger(monthsCount) || monthsCount <= 0) return null;

  const winStart = monthIndex(w);
  const winEnd = winStart + monthsCount - 1;
  const mIndex = monthIndex(d);

  if (mIndex < winStart || mIndex > winEnd) return null;

  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const dayFraction = Math.max(0, Math.min(1, (d.getDate() - 1) / daysInMonth));
  const monthOffset = mIndex - winStart;
  const rawPct = ((monthOffset + dayFraction) / monthsCount) * 100;

  return {
    leftPct: Math.min(98, Math.max(2, rawPct)),
  };
}
