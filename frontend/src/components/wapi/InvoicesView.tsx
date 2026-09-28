import React, { useState } from 'react';
import { CreditCard, Search, CheckCircle, RefreshCw, Smartphone, ChevronLeft, ChevronRight, PlusCircle, ShieldCheck, Zap } from 'lucide-react';
import { Instance } from '../../types';
import { CheckoutModal } from './CheckoutModal';

interface InvoicesViewProps {
  instances: Instance[];
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ instances }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRenew, setAutoRenew] = useState<Record<string, boolean>>({});
  const [selectedInstanceForCheckout, setSelectedInstanceForCheckout] = useState<Instance | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleOpenCheckout = (inst?: Instance) => {
    setSelectedInstanceForCheckout(inst || instances[0] || null);
    setIsCheckoutOpen(true);
  };

  const toggleAutoRenew = (id: string) => {
    setAutoRenew((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredInstances = instances.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.instance_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-8 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Assinaturas & Faturas
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie os vencimentos, faturas e recargas PIX das suas instâncias.
          </p>
        </div>

        <button
          onClick={() => handleOpenCheckout()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Contratar Nova Instância</span>
        </button>
      </div>

      <div className="p-8 max-w-6xl space-y-4">
        {/* Barra de Busca e Filtro */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar instância..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              Todas ({instances.length})
            </span>
          </div>
        </div>

        {/* Tabela de Assinaturas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {instances.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">Nenhuma assinatura ativa</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Assim que você criar sua primeira instância de WhatsApp, seus ciclos de renovação e faturas aparecerão aqui.
              </p>
              <button
                onClick={() => handleOpenCheckout()}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Contratar Instância via PIX
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">INSTÂNCIA / ID</th>
                  <th className="p-4">VALOR</th>
                  <th className="p-4">EXPIRAÇÃO</th>
                  <th className="p-4">FATURAMENTO</th>
                  <th className="p-4 text-center">RENOVAÇÃO AUTOMÁTICA</th>
                  <th className="p-4 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInstances.map((instance) => {
                  const isAuto = autoRenew[instance.id] ?? false;
                  return (
                    <tr key={instance.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100 uppercase">{instance.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{instance.instance_name}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-200">
                        R$ 19,90
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Expira em 30 dias</span>
                        </div>
                        <span className="text-[10px] text-slate-500">24/10/2026</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          PIX
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleAutoRenew(instance.id)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors mx-auto ${
                            isAuto ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              isAuto ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenCheckout(instance)}
                          className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs shadow transition-all active:scale-95"
                        >
                          Renovar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Checkout / PIX */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        instance={selectedInstanceForCheckout}
        onPaymentSuccess={() => {
          alert('Pagamento processado com sucesso! Sua instância foi renovada por mais 30 dias.');
        }}
      />
    </div>
  );
};
