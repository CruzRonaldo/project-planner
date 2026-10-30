import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';

export default function ConfirmDeleteDialog({ project, onConfirm, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setIsDeleting(true);
    try {
      await onConfirm(project.id);
    } catch (err) {
      setError(err.message || 'Error al eliminar el proyecto.');
      setIsDeleting(false);
    }
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
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300"
          >
            {error}
          </p>
        )}
      </div>
    </ModalDialog>
  );
}

export { ConfirmDeleteDialog };
