/**
 * Utilidades para formateo e internacionalización de notificaciones y bitácora de auditoría.
 * Aplica principios Clean Code, DRY y separación de responsabilidades (SRP).
 */

const REASON_MAP = {
  'vacaciones programadas': 'notifications.reasonVacation',
  'scheduled vacation': 'notifications.reasonVacation',
  'descanso médico': 'notifications.reasonMedicalLeave',
  'medical leave': 'notifications.reasonMedicalLeave',
  'licencia con goce': 'notifications.reasonPaidLeave',
  'paid leave': 'notifications.reasonPaidLeave',
  'licencia sin goce': 'notifications.reasonUnpaidLeave',
  'unpaid leave': 'notifications.reasonUnpaidLeave',
  'permiso personal': 'notifications.reasonPersonalPermission',
  'personal permission': 'notifications.reasonPersonalPermission',
  'capacitación externa': 'notifications.reasonTraining',
  'external training': 'notifications.reasonTraining',
  'otro': 'notifications.reasonOther',
  'other': 'notifications.reasonOther',
};

const AUDIT_ACTION_MAP = {
  password_change: 'notifications.auditPasswordChangeTitle',
  'Cambio de Contraseña': 'notifications.auditPasswordChangeTitle',
  'Password Change': 'notifications.auditPasswordChangeTitle',
  email_change: 'notifications.auditEmailChangeTitle',
  'Cambio de Correo Electrónico': 'notifications.auditEmailChangeTitle',
  'Email Address Change': 'notifications.auditEmailChangeTitle',
  profile_update: 'notifications.auditProfileUpdateTitle',
  'Actualización de Perfil': 'notifications.auditProfileUpdateTitle',
  'Profile Update': 'notifications.auditProfileUpdateTitle',
  integration_update: 'notifications.auditIntegrationUpdateTitle',
  'Modificación de Integraciones': 'notifications.auditIntegrationUpdateTitle',
  'Integration Modification': 'notifications.auditIntegrationUpdateTitle',
  'Integrations Modification': 'notifications.auditIntegrationUpdateTitle',
};

const MAKE_CHANGE_LABEL_REPLACEMENTS = [
  [/Notificaciones y Asignaciones/g, 'Notifications & Assignments'],
  [/Gobernanza de Presupuesto/g, 'Budget Governance'],
  [/Autenticación de 2 Factores/g, 'Two-Factor Authentication'],
];

/**
 * Traduce al inglés los fragmentos descriptivos generados por el backend para cambios de Make/Webhooks.
 * @param {string} rawChanges - Cadena de cambios separados por punto y coma
 * @returns {string} Cadena de cambios traducida al inglés
 */
function translateMakeChangesToEnglish(rawChanges = '') {
  if (!rawChanges) return '';

  return rawChanges
    .split(/;\s*/)
    .map((segment) => {
      let translated = segment.trim();
      translated = translated
        .replace(/\bURL global\b/g, 'Global URL')
        .replace(/\bvac[ií][ao]\b/g, 'empty')
        .replace(/\bFrecuencia\b/g, 'Frequency')
        .replace(/\bEstado\b/g, 'Status')
        .replace(/Token de API de Make actualizado/g, 'Make API token updated')
        .replace(/Token de API de (.+?) actualizado/g, 'API token of $1 updated')
        .replace(/Endpoint de (.+?) \((.+?)\)/g, 'Endpoint of $1 ($2)')
        .replace(/Tarea (.+?) (?:configurada \(activada\)|activada)/g, 'Task $1 enabled')
        .replace(/Tarea (.+?) (?:configurada \(desactivada\)|desactivada)/g, 'Task $1 disabled');

      for (const [pattern, replacement] of MAKE_CHANGE_LABEL_REPLACEMENTS) {
        translated = translated.replace(pattern, replacement);
      }
      return translated;
    })
    .join('; ');
}

/**
 * Busca la primera coincidencia entre múltiples expresiones regulares equivalentes (con o sin negritas).
 */
function matchFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
}

/**
 * Función interna para traducir con fallback e interpolación segura en ausencia de t.
 */
function translateWithFallback(t, key, fallback = '', params = {}) {
  if (typeof t === 'function') {
    return t(key, fallback, params);
  }
  if (typeof fallback === 'string' && params && Object.keys(params).length > 0) {
    return fallback.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, paramKey) => {
      return Object.prototype.hasOwnProperty.call(params, paramKey)
        ? String(params[paramKey])
        : match;
    });
  }
  return fallback !== undefined ? fallback : key;
}

/**
 * Formatea y traduce el título de una notificación.
 * @param {string} title - Título crudo de la notificación
 * @param {Function} [t] - Función de traducción proveniente de useLanguage()
 * @returns {string} Título traducido
 */
export function formatNotificationTitle(title = '', t) {
  if (!title) return '';

  if (title === 'Proyecto Asignado' || title === 'Project Assigned') {
    return translateWithFallback(t, 'notifications.projectAssignedTitle', 'Proyecto Asignado');
  }

  if (title === 'Reincorporación próxima' || title === 'Upcoming Return') {
    return translateWithFallback(t, 'notifications.upcomingReturnTitle', 'Reincorporación próxima');
  }

  if (title.startsWith('Auditoría:') || title.startsWith('Audit:')) {
    const actionPart = title.replace(/^(?:Auditoría|Audit):\s*/, '').trim();
    const actionKey = AUDIT_ACTION_MAP[actionPart];
    const translatedAction = actionKey
      ? translateWithFallback(t, actionKey, actionPart)
      : actionPart;
    const prefix = translateWithFallback(t, 'notifications.auditPrefix', 'Auditoría');
    return `${prefix}: ${translatedAction}`;
  }

  if (title.startsWith('Hito próximo:') || title.startsWith('Upcoming Milestone:')) {
    const milestonePart = title.replace(/^(?:Hito próximo|Upcoming Milestone):\s*/, '').trim();
    const prefix = translateWithFallback(t, 'notifications.milestonePrefix', 'Hito próximo');
    return `${prefix}: ${milestonePart}`;
  }

  return title;
}

/**
 * Formatea y traduce el detalle de una notificación o descripción de evento de auditoría.
 * @param {string} detail - Detalle o descripción cruda
 * @param {Function} [t] - Función de traducción proveniente de useLanguage()
 * @returns {string} Detalle traducido e interpolado
 */
export function formatNotificationDetail(detail = '', t) {
  if (!detail) return '';

  // 1. Asignación de proyecto
  const leaderMatch =
    detail.match(/Has sido asignado como líder técnico del proyecto \*\*(.*?)\*\* \((.*?)\)\./) ||
    detail.match(/Has sido asignado como líder técnico del proyecto (.*?) \((.*?)\)\./);
  if (leaderMatch) {
    return translateWithFallback(
      t,
      'notifications.projectAssignedDetail',
      'Has sido asignado como líder técnico del proyecto **{name}** ({code}).',
      { name: leaderMatch[1], code: leaderMatch[2] }
    );
  }

  // 2. Reincorporación de personal
  const returnMatch = detail.match(/^(.*?) retorna el (\d{2}\/\d{2}\/\d{4}) tras (.*?)\.$/);
  if (returnMatch) {
    const rawReason = returnMatch[3].trim().toLowerCase();
    const reasonKey = REASON_MAP[rawReason];
    const translatedReason = reasonKey
      ? translateWithFallback(t, reasonKey, returnMatch[3])
      : returnMatch[3];

    return translateWithFallback(
      t,
      'notifications.personnelReturnDetail',
      '{member} retorna el {date} tras {reason}.',
      { member: returnMatch[1], date: returnMatch[2], reason: translatedReason }
    );
  }

  // 3. Auditoría: Cambio de contraseña
  const passwordMatch =
    detail.match(/El usuario \*\*(.*?)\*\* \((.*?)\) actualizó su contraseña de acceso\./) ||
    detail.match(/El usuario (.*?) \((.*?)\) actualizó su contraseña de acceso\./);
  if (passwordMatch) {
    return translateWithFallback(
      t,
      'notifications.auditPasswordChangeDetail',
      'El usuario **{name}** ({email}) actualizó su contraseña de acceso.',
      { name: passwordMatch[1], email: passwordMatch[2] }
    );
  }

  // 4. Auditoría: Cambio de correo
  const emailMatch =
    detail.match(/El usuario \*\*(.*?)\*\* modificó su correo de acceso de \*\*(.*?)\*\* a \*\*(.*?)\*\*\./) ||
    detail.match(/El usuario (.*?) modificó su correo de acceso de (.*?) a (.*?)\./);
  if (emailMatch) {
    return translateWithFallback(
      t,
      'notifications.auditEmailChangeDetail',
      'El usuario **{name}** modificó su correo de acceso de **{oldEmail}** a **{newEmail}**.',
      { name: emailMatch[1], oldEmail: emailMatch[2], newEmail: emailMatch[3] }
    );
  }

  // 5. Auditoría: Modificación de integraciones (Make/Webhooks)
  const integrationMatch = matchFirst(detail, [
    /El usuario \*\*(.*?)\*\* modificó la configuración de integraciones \(Make\/Webhooks\)\. Cambios: (.*)\./,
    /El usuario (.*?) modificó la configuración de integraciones \(Make\/Webhooks\)\. Cambios: (.*)\./,
  ]);
  if (integrationMatch) {
    const isEnglish = translateWithFallback(t, 'notifications.auditPrefix', 'Auditoría') === 'Audit';
    const changesText = isEnglish
      ? translateMakeChangesToEnglish(integrationMatch[2])
      : integrationMatch[2];
    return translateWithFallback(
      t,
      'notifications.auditIntegrationUpdateDetail',
      'El usuario **{name}** modificó la configuración de integraciones (Make/Webhooks). Cambios: {changes}.',
      { name: integrationMatch[1], changes: changesText }
    );
  }

  // 6. Auditoría: Vinculación de Google Drive OAuth
  const driveMatch = matchFirst(detail, [
    /El usuario \*\*(.*?)\*\* vinculó y autorizó exitosamente la cuenta de Google Drive\./,
    /El usuario (.*?) vinculó y autorizó exitosamente la cuenta de Google Drive\./,
  ]);
  if (driveMatch) {
    return translateWithFallback(
      t,
      'notifications.auditDriveConnectedDetail',
      'El usuario **{name}** vinculó y autorizó exitosamente la cuenta de Google Drive.',
      { name: driveMatch[1] }
    );
  }

  // 7. Auditoría: Autodesk APS (subida, renombrado y eliminación de modelos BIM)
  const apsUploadMatch = matchFirst(detail, [
    /El usuario \*\*(.*?)\*\* subió el modelo BIM \*\*(.*?)\*\* a Autodesk APS\./,
    /El usuario (.*?) subió el modelo BIM (.*?) a Autodesk APS\./,
  ]);
  if (apsUploadMatch) {
    return translateWithFallback(
      t,
      'notifications.auditApsUploadDetail',
      'El usuario **{name}** subió el modelo BIM **{file}** a Autodesk APS.',
      { name: apsUploadMatch[1], file: apsUploadMatch[2] }
    );
  }

  const apsRenameMatch = matchFirst(detail, [
    /El usuario \*\*(.*?)\*\* renombró el modelo BIM de \*\*(.*?)\*\* a \*\*(.*?)\*\* en Autodesk APS\./,
    /El usuario (.*?) renombró el modelo BIM de (.*?) a (.*?) en Autodesk APS\./,
  ]);
  if (apsRenameMatch) {
    return translateWithFallback(
      t,
      'notifications.auditApsRenameDetail',
      'El usuario **{name}** renombró el modelo BIM de **{old}** a **{new}** en Autodesk APS.',
      { name: apsRenameMatch[1], old: apsRenameMatch[2], new: apsRenameMatch[3] }
    );
  }

  const apsDeleteMatch = matchFirst(detail, [
    /El usuario \*\*(.*?)\*\* eliminó el modelo BIM \*\*(.*?)\*\* de la bóveda de Autodesk APS\./,
    /El usuario (.*?) eliminó el modelo BIM (.*?) de la bóveda de Autodesk APS\./,
  ]);
  if (apsDeleteMatch) {
    return translateWithFallback(
      t,
      'notifications.auditApsDeleteDetail',
      'El usuario **{name}** eliminó el modelo BIM **{file}** de la bóveda de Autodesk APS.',
      { name: apsDeleteMatch[1], file: apsDeleteMatch[2] }
    );
  }

  // 8. Hito próximo
  const milestoneMatch =
    detail.match(/Proyecto \*\*(.*?)\*\* \((.*?)\) programado para (.*?)\./) ||
    detail.match(/Proyecto (.*?) \((.*?)\) programado para (.*?)\./);
  if (milestoneMatch) {
    return translateWithFallback(
      t,
      'notifications.milestoneDetail',
      'Proyecto **{name}** ({code}) programado para {date}.',
      { name: milestoneMatch[1], code: milestoneMatch[2], date: milestoneMatch[3] }
    );
  }

  return detail;
}

/**
 * Formatea y traduce el tiempo relativo de una notificación.
 * @param {string} time - Tiempo crudo (ej. 'Reciente', 'Hoy', 'En 3 día(s)')
 * @param {Function} [t] - Función de traducción proveniente de useLanguage()
 * @returns {string} Tiempo traducido
 */
export function formatNotificationTime(time = '', t) {
  if (!time) return '';
  if (time === 'Reciente' || time === 'Recent') {
    return translateWithFallback(t, 'notifications.recent', 'Reciente');
  }
  if (time === 'Hoy' || time === 'Today') {
    return translateWithFallback(t, 'notifications.today', 'Hoy');
  }
  if (time === 'Próximamente' || time === 'Soon') {
    return translateWithFallback(t, 'notifications.soon', 'Próximamente');
  }
  const daysMatch = time.match(/^En (\d+) día\(s\)$/);
  if (daysMatch) {
    return translateWithFallback(t, 'notifications.inDays', 'En {count} día(s)', {
      count: daysMatch[1],
    });
  }
  return time;
}

/**
 * Formatea y traduce la acción de bitácora de auditoría.
 * @param {string} [action=''] - Código de acción (ej. 'password_change')
 * @param {string} [actionDisplay=''] - Etiqueta en español (ej. 'Cambio de Contraseña')
 * @param {Function} [t] - Función de traducción proveniente de useLanguage()
 * @returns {string} Acción traducida
 */
export function formatAuditAction(action = '', actionDisplay = '', t) {
  const key = AUDIT_ACTION_MAP[action] || AUDIT_ACTION_MAP[actionDisplay];
  if (key) {
    return translateWithFallback(t, key, actionDisplay || action);
  }
  return actionDisplay || action;
}
