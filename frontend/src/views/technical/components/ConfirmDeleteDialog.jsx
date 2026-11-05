import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import InlineAlert from '../../../components/common/InlineAlert';
import { runSafe } from '../../../utils/asyncHandler';

export default function ConfirmDeleteDialog({ project, onConfirm, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    await runSafe(() => onConfirm(project.id), {
      setLoading: setIsDeleting,
      onError: (_err, message) => {
        setError(message || 'Error al eliminar el proyecto.');
      },
    });
  };

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      onSubmit={handleConfirm}
      title="Confirmar Eliminación"
      subtitle={project?.code}
      icon={<Trash2 size={18} />}
      submitLabel="Eliminar Proyecto"
      submitIcon={<Trash2 size={15} />}
      cancelLabel="Cancelar"
      isSubmitting={isDeleting}
      submitButtonClass="bg-red-600 hover:bg-red-500 text-white"
      maxWidth="max-w-md"
      id="confirm-delete"
    >
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 midnight:text-cyan-200/80">
          ¿Estás seguro de que deseas eliminar permanentemente el proyecto{' '}
          <strong className="text-slate-900 dark:text-white midnight:text-cyan-50">
            {project?.name}
          </strong>
          ?
        </p>
        <p className="mt-2 text-xs leading-relaxed text-amber-600 dark:text-amber-400 midnight:text-amber-300">
          ⚠️ Esta acción es irreversible y eliminará las tareas, hitos y datos
          asociados en el sistema.
        </p>

        {error && (
          <InlineAlert variant="error" className="mt-3">
            {error}
          </InlineAlert>
        )}
      </div>
    </ModalDialog>
  );
}

export { ConfirmDeleteDialog };
