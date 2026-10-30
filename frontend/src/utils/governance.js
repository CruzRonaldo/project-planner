/**
 * Reglas de gobernanza presupuestaria y niveles de aprobación de proyectos.
 */

export const GOVERNANCE_BUDGET_THRESHOLD = 100000;

/**
 * Evalúa si un proyecto requiere dictamen por Comité Directivo según su presupuesto.
 * @param {number|string} budget
 * @returns {{ isRequired: boolean, badgeText: string, approvalType: string, tooltip: string }}
 */
export function evaluateProjectGovernance(budget) {
  const amount = Number(budget) || 0;
  const isRequired = amount > GOVERNANCE_BUDGET_THRESHOLD;

  return {
    isRequired,
    badgeText: isRequired ? 'Comité (>$100k)' : 'Líder (≤$100k)',
    approvalType: isRequired ? 'Revisión por Comité Directivo' : 'Aprobación Líder Técnico',
    tooltip: isRequired
      ? 'Presupuesto > $100k: Requiere revisión y dictamen por Comité Directivo'
      : 'Presupuesto ≤ $100k: Aprobación directa por Líder Técnico',
  };
}
