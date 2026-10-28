import React from 'react';
import { Video, ExternalLink, X } from 'lucide-react';

export default function VideoConferenceModal({ isOpen, onClose, meetingTitle, roomUrl }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
        {/* Cabecera (Tono oscuro corporativo) */}
        <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-slate-300" />
            <h3 className="font-semibold text-sm truncate">{meetingTitle || "Sala de Proyecto"}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-700 rounded-md text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Minimalista */}
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-6 text-sm">
            La sala de videoconferencia se abrirá en una nueva pestaña segura.
          </p>
          
          <a
            href={roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <span>Ingresar a la Videollamada</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}