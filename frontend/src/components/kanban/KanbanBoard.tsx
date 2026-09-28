import React, { useState } from 'react';
import { 
  KanbanStage, 
  Contact, 
  Tag 
} from '../../types';
import { 
  Plus, 
  MessageSquare, 
  DollarSign, 
  ChevronRight, 
  ChevronLeft,
  MoreHorizontal,
  Flame,
  Clock
} from 'lucide-react';

interface KanbanBoardProps {
  stages: KanbanStage[];
  contacts: Contact[];
  onMoveContactStage: (contactId: string, targetStageId: string) => void;
  onOpenChatWithContact: (contactId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  contacts,
  onMoveContactStage,
  onOpenChatWithContact,
}) => {
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);

  // Drag and drop nativo em HTML5 super suave e sem bibliotecas pesadas
  const handleDragStart = (contactId: string) => {
    setDraggedContactId(contactId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: string) => {
    if (draggedContactId) {
      onMoveContactStage(draggedContactId, stageId);
      setDraggedContactId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Topo do Kanban */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Funil de Vendas (Pipeline)
          </h2>
          <p className="text-xs text-slate-400">
            Arraste os leads entre as etapas para gerenciar suas oportunidades comerciais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-medium border border-slate-700">
            Total no Funil: <strong className="text-emerald-400 font-semibold">
              R$ {contacts.reduce((acc, c) => acc + (c.deal_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </span>
        </div>
      </div>

      {/* Colunas do Funil */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-5 items-start">
        {stages.map((stage, stageIdx) => {
          const stageContacts = contacts.filter((c) => c.kanban_stage_id === stage.id);
          const stageTotal = stageContacts.reduce((acc, c) => acc + (c.deal_value || 0), 0);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              className="w-80 flex-shrink-0 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex flex-col max-h-full shadow-lg"
            >
              {/* Topo da Coluna */}
              <div className="p-3.5 border-b border-slate-800/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                    {stage.name}
                  </h3>
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                    {stageContacts.length}
                  </span>
                </div>

                <span className="text-xs font-semibold text-emerald-400">
                  R$ {stageTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>

              {/* Cards de Oportunidades */}
              <div className="p-3 overflow-y-auto space-y-3 flex-1 min-h-[150px]">
                {stageContacts.map((contact) => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={() => handleDragStart(contact.id)}
                    className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-2.5"
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            contact.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=0D9488&color=fff`
                          }
                          alt={contact.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-600 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-100 truncate">
                            {contact.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{contact.phone}</p>
                        </div>
                      </div>

                      {/* Botão de abrir no chat */}
                      <button
                        onClick={() => onOpenChatWithContact(contact.id)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                        title="Abrir conversa no WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tags */}
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: `${tag.color}25`, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Valor & Movimentação Rápida */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-xs">
                      <span className="font-semibold text-emerald-400 flex items-center">
                        R$ {contact.deal_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>

                      {/* Atalhos para mover coluna */}
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {stageIdx > 0 && (
                          <button
                            onClick={() => onMoveContactStage(contact.id, stages[stageIdx - 1].id)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                            title="Voltar etapa"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {stageIdx < stages.length - 1 && (
                          <button
                            onClick={() => onMoveContactStage(contact.id, stages[stageIdx + 1].id)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                            title="Avançar etapa"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {stageContacts.length === 0 && (
                  <div className="h-28 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500">
                    Arraste leads aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
