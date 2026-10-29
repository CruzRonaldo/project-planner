/**
 * Utilidades puras de formateo para toda la plataforma (sin JSX).
 * Centraliza formatos monetarios, de fechas y porcentajes.
 */

/**
 * Formatea cantidades monetarias a formato compacto legible ($1.2M, $350K, $450).
 *
 * @param {number|string} amount - Cantidad numérica
 * @param {string} [currency='$'] - Símbolo de la divisa
 * @returns {string} Texto formateado
 */
export function formatMoney(amount, currency = '$') {
  const num = Number(amount) || 0;
  if (num >= 1_000_000) {
    return `${currency}${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${currency}${(num / 1_000).toFixed(0)}K`;
  }
  return `${currency}${num.toLocaleString('es-PE')}`;
}

/**
 * Formatea un objeto Date al formato requerido por inputs HTML5 date ('YYYY-MM-DD').
 *
 * @param {Date} [date=new Date()]
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatDateInput(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha en texto amigable según localización.
 *
 * @param {Date|string} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string} Fecha formateada
 */
export function formatDate(date, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('es-PE', options);
}

/**
 * Formatea un número como porcentaje redondeado.
 *
 * @param {number|string} value
 * @returns {string} Ej. '85%'
 */
export function formatPercentage(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return '0%';
  return `${Math.round(num)}%`;
}
