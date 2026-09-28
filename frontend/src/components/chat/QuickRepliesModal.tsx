import React, { useState } from 'react';
import { X, Zap, Search } from 'lucide-react';
import { QuickReply } from '../../types';

interface QuickRepliesModalProps {
  quickReplies: QuickReply[];
  onSelect: (content: string) => void;
  onClose: () => void;
}

export const QuickRepliesModal: React.FC<QuickRepliesModalProps> = ({ quickReplies, onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = quickReplies.filter(
    (qr) =>
      qr.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      qr.title.toLowerCase().includes(search.toLowerCase()) ||
      qr.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Respostas Rápidas</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por atalho ou texto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">Nenhuma resposta rápida encontrada.</p>
          ) : (
            filtered.map((qr) => (
              <button
                key={qr.id}
                onClick={() => {
                  onSelect(qr.content);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-slate-200 group-hover:text-brand-400">
                    {qr.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                    {qr.shortcut}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{qr.content}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
