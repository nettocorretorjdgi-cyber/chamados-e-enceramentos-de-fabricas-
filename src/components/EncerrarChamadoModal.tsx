import React, { useState } from 'react';
import { Chamado, User, PecaUtilizada } from '../types';
import { X, CheckCircle2, Wrench, AlertCircle, Plus, Trash2, Clock, Check } from 'lucide-react';

interface EncerrarChamadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chamado: Chamado | null;
  user: User;
  onConfirmarEncerramento: (id: string, dados: {
    descricao_servico: string;
    causa_raiz?: string;
    pecas_utilizadas: PecaUtilizada[];
    tempo_gasto_minutos: number;
    condicao_final: 'operacional' | 'em_observacao' | 'requer_revisao_futura';
    nome_mecanico: string;
    mecanicoLogin: string;
  }) => Promise<void>;
}

export const EncerrarChamadoModal: React.FC<EncerrarChamadoModalProps> = ({
  isOpen,
  onClose,
  chamado,
  user,
  onConfirmarEncerramento,
}) => {
  const [descricaoServico, setDescricaoServico] = useState('');
  const [causaRaiz, setCausaRaiz] = useState('');
  const [tempoGasto, setTempoGasto] = useState(45);
  const [condicaoFinal, setCondicaoFinal] = useState<'operacional' | 'em_observacao' | 'requer_revisao_futura'>('operacional');
  
  // Peças utilizadas
  const [pecas, setPecas] = useState<PecaUtilizada[]>([]);
  const [nomePeca, setNomePeca] = useState('');
  const [qtdPeca, setQtdPeca] = useState(1);
  const [codigoPeca, setCodigoPeca] = useState('');
  const [unidadePeca, setUnidadePeca] = useState('un');

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen || !chamado) return null;

  const handleAddPeca = () => {
    if (!nomePeca.trim()) return;
    const nova: PecaUtilizada = {
      id: `peca-${Date.now()}`,
      nome: nomePeca.trim(),
      quantidade: Number(qtdPeca) || 1,
      codigo: codigoPeca.trim() || undefined,
      unidade: unidadePeca,
    };
    setPecas([...pecas, nova]);
    setNomePeca('');
    setCodigoPeca('');
    setQtdPeca(1);
  };

  const handleRemovePeca = (id: string) => {
    setPecas(pecas.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!descricaoServico.trim()) {
      setErro('É obrigatório descrever detalhadamente o que foi feito na manutenção.');
      return;
    }

    setSalvando(true);
    try {
      await onConfirmarEncerramento(chamado.id, {
        descricao_servico: descricaoServico.trim(),
        causa_raiz: causaRaiz.trim() || 'Desgaste operacional comum',
        pecas_utilizadas: pecas,
        tempo_gasto_minutos: Number(tempoGasto) || 30,
        condicao_final: condicaoFinal,
        nome_mecanico: user.nome,
        mecanicoLogin: user.login,
      });
      onClose();
    } catch (err: any) {
      setErro(`Erro ao encerrar chamado: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-800">
              <CheckCircle2 className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Encerrar Chamado de Manutenção
              </h2>
              <p className="text-xs text-slate-500">
                Ordem de Serviço <span className="font-mono font-semibold text-slate-700">{chamado.numero}</span> · Mecânico: {user.nome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do chamado original */}
        <div className="px-6 py-3.5 bg-slate-100/70 border-b border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="flex items-center justify-between font-semibold">
            <span>{chamado.equipamento} ({chamado.tag_equipamento})</span>
            <span className="text-slate-500 font-normal">{chamado.setor}</span>
          </div>
          <p className="text-slate-600 line-clamp-2 italic">
            "{chamado.descricao_problema}"
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* O que foi feito */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Descrever o que foi feito (Ações Corretivas Executadas) *
            </label>
            <textarea
              rows={4}
              value={descricaoServico}
              onChange={(e) => setDescricaoServico(e.target.value)}
              placeholder="Descreva detalhadamente o diagnóstico encontrado, peças desmontadas, ajustes mecânicos, limpeza, troca de óleo/filtros, regulagens de torque e testes de liberação realizados..."
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
            />
          </div>

          {/* Causa Raiz e Tempo Gasto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Causa Raiz Identificada
              </label>
              <input
                type="text"
                value={causaRaiz}
                onChange={(e) => setCausaRaiz(e.target.value)}
                placeholder="Ex: Desgaste mecânico por fadiga, vedação ressecada..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempo Gasto de Manutenção (Minutos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={tempoGasto}
                  onChange={(e) => setTempoGasto(Number(e.target.value))}
                  className="w-full px-3.5 py-2 pl-9 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Peças Utilizadas */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Peças & Materiais Substituídos
              </label>
              <span className="text-[11px] text-slate-500">
                {pecas.length === 0 ? 'Nenhuma peça registrada' : `${pecas.length} peça(s) adicionada(s)`}
              </span>
            </div>

            {/* Inserir peça */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 sm:col-span-5">
                <input
                  type="text"
                  value={nomePeca}
                  onChange={(e) => setNomePeca(e.target.value)}
                  placeholder="Nome do componente (ex: Rolamento 6205)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <input
                  type="text"
                  value={codigoPeca}
                  onChange={(e) => setCodigoPeca(e.target.value)}
                  placeholder="Part / Código"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <input
                  type="number"
                  min="1"
                  value={qtdPeca}
                  onChange={(e) => setQtdPeca(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddPeca}
                  className="w-full py-1.5 bg-slate-800 text-white rounded-md text-xs font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Lista de Peças */}
            {pecas.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                {pecas.map((peca) => (
                  <div
                    key={peca.id}
                    className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{peca.nome}</span>
                      {peca.codigo && (
                        <span className="font-mono text-slate-500 text-[11px]">({peca.codigo})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-slate-700">
                        {peca.quantidade} {peca.unidade || 'un'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePeca(peca.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Condição Final do Equipamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Condição Final do Equipamento após a Manutenção
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'operacional', label: '100% Operacional', desc: 'Liberado para produção imediata' },
                { id: 'em_observacao', label: 'Em Observação', desc: 'Funciona sob monitoramento' },
                { id: 'requer_revisao_futura', label: 'Revisão Futura', desc: 'Planejar preventiva próxima' },
              ].map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => setCondicaoFinal(cond.id as any)}
                  className={`p-2.5 text-left border rounded-lg transition-all ${
                    condicaoFinal === cond.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{cond.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{cond.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{salvando ? 'Encerrando Chamado...' : 'Confirmar Encerramento da OS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
