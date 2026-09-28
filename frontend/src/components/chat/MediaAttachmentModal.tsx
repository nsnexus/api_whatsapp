import React, { useState } from 'react';
import { X, Send, FileText, Image as ImageIcon } from 'lucide-react';

interface MediaAttachmentModalProps {
  file: File;
  onSend: (file: File, caption: string) => void;
  onClose: () => void;
}

export const MediaAttachmentModal: React.FC<MediaAttachmentModalProps> = ({ file, onSend, onClose }) => {
  const [caption, setCaption] = useState('');
  const isImage = file.type.startsWith('image/');
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(file, caption);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {isImage ? <ImageIcon className="w-5 h-5 text-emerald-400" /> : <FileText className="w-5 h-5 text-sky-400" />}
            <h3 className="font-semibold text-slate-100 text-sm truncate max-w-xs">
              {isImage ? 'Enviar Imagem' : 'Enviar Documento'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pré-visualização */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/50 min-h-[220px]">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-h-64 rounded-xl object-contain shadow-lg" />
          ) : (
            <div className="flex flex-col items-center text-center p-6 space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <p className="font-medium text-slate-200 text-sm truncate max-w-sm">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>

        {/* Input de Legenda e Envio */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Adicione uma legenda (opcional)..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
