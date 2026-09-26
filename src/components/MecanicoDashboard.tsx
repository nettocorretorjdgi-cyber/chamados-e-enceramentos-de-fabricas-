import React, { useState } from 'react';
import { Chamado, User, StatusChamado, Prioridade } from '../types';
import { Wrench, CheckCircle2, Clock, Flame, Search, ArrowRight, Eye, Check, AlertTriangle, AlertCircle, ToolCase as Tool } from 'lucide-react';

interface MecanicoDashboardProps {
  user: User;
  chamados: Chamado[];
  onAssumirChamado: (id: string) => Promise<void>;
  onEncerrarChamado: (chamado: Chamado) => void;
  onVerDetalhes: (chamado: Chamado) => void;
  isSupabaseConnected: boolean;
}

export const MecanicoDashboard: React.FC<MecanicoDashboardProps> = ({
  user,
  chamados,
  onAssumirChamado,
  onEncerrarChamado,
  onVerDetalhes,
  isSupabaseConnected,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'em_andamento' | 'concluidos' | 'todos'>('pendentes');
  const [busca, setBusca] = useState('');
  const [assumindoId, setAssumindoId] = useState<string | null>(null);

  // Contadores
  const abertos = chamados.filter((c) => c.status === 'aberto');
  const emAndamento = chamados.filter((c) => c.status === 'em_andamento');
  const concluidos = chamados.filter((c) => c.status === 'concluido');
  const parados = chamados.filter((c) => c.parou_producao && c.status !== 'concluido');

  // Filtragem
  const filtrados = chamados.filter((c) => {
    if (abaAtiva === 'pendentes' && c.status !== 'aberto') return false;
    if (abaAtiva === 'em_andamento' && c.status !== 'em_andamento') return false;
    if (abaAtiva === 'concluidos' && c.status !== 'concluido') return false;

    if (busca.trim()) {
      const q = busca.toLowerCase();
      const matchNum = c.numero.toLowerCase().includes(q);
      const matchEq = c.equipamento.toLowerCase().includes(q);
      const matchTag = c.tag_equipamento?.toLowerCase().includes(q);
      const matchDesc = c.descricao_problema.toLowerCase().includes(q);
      const matchTit = c.titulo.toLowerCase().includes(q);
      const matchOp = c.nome_operador?.toLowerCase().includes(q);
      if (!matchNum && !matchEq && !matchTag && !matchDesc && !matchTit && !matchOp) return false;
    }
    return true;
  });

  const handleAssumir = async (id: string) => {
    setAssumindoId(id);
    try {
      await onAssumirChamado(id);
    } finally {
      setAssumindoId(null);
    }
  };

  const formatarTempoDecorrido = (iso: string) => {
    try {
      const ms = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(ms / (1000 * 60));
      if (mins < 60) return `${mins}m atrás`;
      const horas = Math.floor(mins / 60);
      if (horas < 24) return `${horas}h atrás`;
      const dias = Math.floor(horas / 24);
      return `${dias}d atrás`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Oficina de Manutenção */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Equipe de Manutenção Geral & Preditiva</span>
              <span>·</span>
              <span className="font-semibold text-slate-700">{user.nome} (Mecânico)</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Fila Técnica de Ordens de Serviço
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Assuma os chamados abertos pelos operadores e encerre informando os reparos realizados e peças trocadas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status da Oficina:</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Equipe Operacional Ativa
            </span>
          </div>
        </div>

        {/* Resumo Numérico */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div
            onClick={() => setAbaAtiva('pendentes')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              abaAtiva === 'pendentes' ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
            }`}
          >
            <span className="text-xs text-slate-600 font-medium">Aguardando Início</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-700 font-mono tabular-nums">{abertos.length}</span>
              <span className="text-[11px] text-slate-500">na fila</span>
            </div>
          </div>

          <div
            onClick={() => setAbaAtiva('em_andamento')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              abaAtiva === 'em_andamento' ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
            }`}
          >
            <span className="text-xs text-slate-600 font-medium">Em Atendimento</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-blue-700 font-mono tabular-nums">{emAndamento.length}</span>
              <span className="text-[11px] text-slate-500">em execução</span>
            </div>
          </div>

          <div
            onClick={() => setAbaAtiva('concluidos')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              abaAtiva === 'concluidos' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
            }`}
          >
            <span className="text-xs text-slate-600 font-medium">Chamados Concluídos</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">{concluidos.length}</span>
              <span className="text-[11px] text-slate-500">finalizados</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-600 font-medium">Produção Interrompida</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-red-700 font-mono tabular-nums">{parados.length}</span>
              <span className="text-[11px] text-slate-500">urgentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'pendentes', label: 'Fila de Espera', count: abertos.length },
            { id: 'em_andamento', label: 'Em Atendimento', count: emAndamento.length },
            { id: 'concluidos', label: 'Histórico Concluídos', count: concluidos.length },
            { id: 'todos', label: 'Todos os Chamados', count: chamados.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                abaAtiva === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar chamado, máquina, defeito..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* List of Tickets for Technician */}
      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl p-8">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">Nenhum chamado nesta visualização</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Não há chamados com o status selecionado ou correspondentes ao termo de busca.
            </p>
          </div>
        ) : (
          filtrados.map((ch) => (
            <div
              key={ch.id}
              className={`bg-white border rounded-xl p-5 transition-all shadow-xs ${
                ch.status === 'aberto' && ch.parou_producao
                  ? 'border-red-300 ring-1 ring-red-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  {/* Zero-Pill Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-slate-900">{ch.numero}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">{ch.setor}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{ch.tag_equipamento}</span>
                    <span aria-hidden="true">·</span>
                    <span>Aberto por {ch.nome_operador} ({formatarTempoDecorrido(ch.data_abertura)})</span>
                    {ch.parou_producao && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-red-700 font-semibold inline-flex items-center gap-1">
                          <Flame className="w-3 h-3 text-red-600" /> Linha Parada
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {ch.titulo}
                  </h3>

                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                    <span className="text-slate-500 font-medium block text-[11px] mb-0.5">Relato do Operador:</span>
                    {ch.descricao_problema}
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-500">
                      Equipamento: <strong className="text-slate-800 font-medium">{ch.equipamento}</strong>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      Falha: <strong className="capitalize text-slate-800 font-medium">{ch.tipo_falha}</strong>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      Prioridade: <strong className={`uppercase font-medium ${
                        ch.prioridade === 'urgente' ? 'text-red-700' : ch.prioridade === 'alta' ? 'text-amber-700' : 'text-slate-700'
                      }`}>{ch.prioridade}</strong>
                    </span>
                  </div>

                  {/* Resumo do encerramento */}
                  {ch.status === 'concluido' && (
                    <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-950 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Serviço Executado ({ch.tempo_gasto_minutos ? `${ch.tempo_gasto_minutos} min` : 'Finalizado'})
                        </span>
                        <span className="font-normal text-[11px] text-emerald-800 font-mono">
                          Mecânico: {ch.nome_mecanico || user.nome}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed italic">
                        "{ch.descricao_servico}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Right side: Action Buttons tailored for mechanic */}
                <div className="shrink-0 flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-xs sm:text-right">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Status</span>
                    <span className={`font-semibold ${
                      ch.status === 'aberto'
                        ? 'text-amber-700'
                        : ch.status === 'em_andamento'
                        ? 'text-blue-700'
                        : 'text-emerald-700'
                    }`}>
                      {ch.status === 'aberto' && 'Aguardando Atendimento'}
                      {ch.status === 'em_andamento' && 'Em Execução'}
                      {ch.status === 'concluido' && 'Concluído'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onVerDetalhes(ch)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                      title="Ver histórico e detalhes"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalhes</span>
                    </button>

                    {/* Ação: Assumir Chamado */}
                    {ch.status === 'aberto' && (
                      <button
                        onClick={() => handleAssumir(ch.id)}
                        disabled={assumindoId === ch.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{assumindoId === ch.id ? 'Assumindo...' : 'Assumir Chamado'}</span>
                      </button>
                    )}

                    {/* Ação Principal solicitada no prompt: Mecânico encerra o chamado e descreve o que foi feito */}
                    {ch.status === 'em_andamento' && (
                      <button
                        onClick={() => onEncerrarChamado(ch)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Encerrar Chamado</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
