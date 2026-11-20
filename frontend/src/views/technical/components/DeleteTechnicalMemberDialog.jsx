import React, { useState } from 'react';
import { UserX, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import ModalDialog from '../../../components/common/ModalDialog';
import InlineAlert from '../../../components/common/InlineAlert';
import MemberAvatar from './MemberAvatar';
import { runSafe } from '../../../utils/asyncHandler';
import { getMemberFullName } from '../../../utils/technicalTeam';
import {
  nestedClass,
  primaryButtonClass,
} from '../../../constants/themeClasses';

const headingClass =
  'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass =
  'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';

/**
 * Diálogo modal directo de confirmación para integrantes técnicos.
 * Sigue el estándar de GitHub y Jira con acciones separadas:
 * - mode === 'deactivate': Diálogo de confirmación para dar de baja / revocar acceso.
 * - mode === 'hard_delete': Diálogo de confirmación para eliminación definitiva.
 *
 * Cero dropdowns ni selectores dentro del modal: confirmación en 1 clic.
 */
export default function DeleteTechnicalMemberDialog({
  member,
  mode = 'deactivate',
  onConfirm,
  onSubmit,
  onClose,
}) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isDeactivate = mode === 'deactivate';

  const memberName =
    member?.name ||
    getMemberFullName(member) ||
    `${member?.firstName || member?.first_name || ''} ${member?.lastName || member?.last_name || ''}`.trim() ||
    t('technicalTeam.defaultMemberName', 'Integrante');

  const memberEmail = member?.email || '';
  const rawId = member?.dbId ?? member?.id;
  const memberId =
    typeof rawId === 'string' && rawId.includes('-db-')
      ? Number(rawId.split('-db-')[1]) || rawId
      : rawId;

  const handleSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError('');

    const targetHandler = onConfirm || onSubmit;
    if (!targetHandler) return;

    if (!memberId) {
      setError(
        t(
          'technicalTeam.errorMissingMemberId',
          'No se pudo identificar el registro del técnico.'
        )
      );
      return;
    }

    let success = false;
    await runSafe(
      async () => {
        await targetHandler(memberId, { mode });
        success = true;
      },
      {
        setLoading: setIsSubmitting,
        onError: (_err, message) => {
          setError(
            message ||
              t(
                'technicalTeam.errorActionFailed',
                'Ocurrió un error al procesar la solicitud.'
              )
          );
        },
      }
    );

    if (success && onClose) {
      onClose();
    }
  };

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={
        isDeactivate
          ? t('technicalTeam.deactivateTitle', 'Dar de Baja al Técnico')
          : t('technicalTeam.hardDeleteTitle', 'Confirmar Eliminación Definitiva')
      }
      subtitle={memberEmail}
      icon={isDeactivate ? <UserX size={18} /> : <Trash2 size={18} />}
      submitLabel={
        isDeactivate
          ? t('technicalTeam.deactivateAction', 'Dar de baja')
          : t('technicalTeam.hardDeleteAction', 'Eliminar Definitivamente')
      }
      submitIcon={isDeactivate ? <UserX size={15} /> : <Trash2 size={15} />}
      cancelLabel={t('common.cancel', 'Cancelar')}
      isSubmitting={isSubmitting}
      submitButtonClass={
        isDeactivate
          ? primaryButtonClass
          : 'bg-red-600 hover:bg-red-500 text-white'
      }
      maxWidth="max-w-md"
      id="delete-technical-member"
    >
      <div className="space-y-3">
        {/* Ficha compacta del técnico */}
        {member && (
          <div className={`flex items-center gap-3 p-2.5 ${nestedClass}`}>
            <MemberAvatar member={member} sizeClass="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-xs font-semibold ${headingClass}`}>
                {memberName}
              </p>
              <p className={`truncate text-[10px] ${mutedClass}`}>
                {member.specialty || member.role || member.area || memberEmail}
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de confirmación directo y conciso */}
        {isDeactivate ? (
          <div className="space-y-1.5 pt-1">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
              {t(
                'technicalTeam.deactivateConfirmPrompt',
                '¿Deseas dar de baja a {name}?',
                { name: memberName }
              )}
            </p>
            <p className={`text-xs leading-relaxed ${mutedClass}`}>
              {t(
                'technicalTeam.deactivateConfirmDetail',
                'Se revocará su acceso al sistema y su estado pasará a "No disponible". Sus proyectos asignados quedarán liberados, pero se conservará todo su historial de órdenes de trabajo.'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 pt-1">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
              {t(
                'technicalTeam.hardDeleteConfirmPrompt',
                '¿Estás seguro de que deseas eliminar permanentemente a {name}?',
                { name: memberName }
              )}
            </p>
            <p className="text-xs leading-relaxed text-red-600 dark:text-red-400 midnight:text-red-300">
              {t(
                'technicalTeam.hardDeleteConfirmDetail',
                '⚠️ Esta acción es irreversible. Se eliminará su ficha y cuenta de acceso por completo. Las órdenes de trabajo que tenía asignadas quedarán sin responsable.'
              )}
            </p>
          </div>
        )}

        {error && (
          <InlineAlert variant="error" className="mt-2">
            {error}
          </InlineAlert>
        )}
      </div>
    </ModalDialog>
  );
}

export { DeleteTechnicalMemberDialog };
