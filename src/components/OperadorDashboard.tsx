import React, { useState } from 'react';
import { Chamado, User, StatusChamado, Prioridade } from '../types';
import { Plus, Search, Filter, HardHat, Flame, Clock, CheckCircle2, AlertTriangle, Eye, ArrowUpRight } from 'lucide-react';

interface OperadorDashboardProps {
  user: User;
  chamados: Chamado[];
  onOpenNovoChamado: () => void;
  onVerDetalhes: (chamado: Chamado) => void;
  isSupabaseConnected: boolean;
}

export const OperadorDashboard: React.FC<OperadorDashboardProps> = ({
  user,
  chamados,
  onOpenNovoChamado,
  onVerDetalhes,
  isSupabaseConnected,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [busca, setBusca] = useState('');

  // Contadores
  const total = chamados.length;
  const abertos = chamados.filter((c) => c.status === 'aberto').length;
  const emAndamento = chamados.filter((c) => c.status === 'em_andamento').length;
  const concluidos = chamados.filter((c) => c.status === 'concluido').length;
  const parados = chamados.filter((c) => c.parou_producao && c.status !== 'concluido').length;

  // Filtragem
  const filtrados = chamados.filter((c) => {
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false;
    if (filtroPrioridade !== 'todas' && c.prioridade !== filtroPrioridade) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const matchNum = c.numero.toLowerCase().includes(q);
      const matchEq = c.equipamento.toLowerCase().includes(q);
      const matchTag = c.tag_equipamento?.toLowerCase().includes(q);
      const matchDesc = c.descricao_problema.toLowerCase().includes(q);
      const matchTit = c.titulo.toLowerCase().includes(q);
      if (!matchNum && !matchEq && !matchTag && !matchDesc && !matchTit) return false;
    }
    return true;
  });

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
      {/* Top Banner / Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Linha de Produção & Fábrica</span>
              <span>·</span>
              <span className="font-semibold text-slate-700">{user.setor || 'Usinagem'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Abertura & Acompanhamento de Chamados
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Identificou uma falha ou ruído? Abra o chamado com a descrição da ocorrência para a manutenção.
            </p>
          </div>

          <button
            onClick={onOpenNovoChamado}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Abrir Novo Chamado</span>
          </button>
        </div>

        {/* Resumo Quantitativo (High-Density Metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Aguardando Mecânico</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-700 font-mono tabular-nums">{abertos}</span>
              <span className="text-[11px] text-slate-500">na fila</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Em Atendimento</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-blue-700 font-mono tabular-nums">{emAndamento}</span>
              <span className="text-[11px] text-slate-500">mecânico na linha</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Concluídos / Liberados</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">{concluidos}</span>
              <span className="text-[11px] text-slate-500">resolvidos</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Máquinas Paradas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-red-700 font-mono tabular-nums">{parados}</span>
              <span className="text-[11px] text-slate-500">críticas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
        {/* Segmented status filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'todos', label: 'Todos os Chamados', count: total },
            { id: 'aberto', label: 'Abertos', count: abertos },
            { id: 'em_andamento', label: 'Em Atendimento', count: emAndamento },
            { id: 'concluido', label: 'Concluídos', count: concluidos },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filtroStatus === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search and Priority select */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar máquina, tag, OS..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="todas">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* List of Tickets */}
      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl p-8">
            <HardHat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">Nenhum chamado localizado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {busca || filtroStatus !== 'todos' || filtroPrioridade !== 'todas'
                ? 'Tente ajustar os filtros ou o termo de busca para visualizar outros chamados.'
                : 'Não há ocorrências registradas no momento. Use o botão acima para abrir um novo chamado.'}
            </p>
            {(!busca && filtroStatus === 'todos') && (
              <button
                onClick={onOpenNovoChamado}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" />
                <span>Abrir Primeiro Chamado</span>
              </button>
            )}
          </div>
        ) : (
          filtrados.map((ch) => (
            <div
              key={ch.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  {/* Clean unboxed metadata according to Zero-Pill Constitution */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-slate-900">{ch.numero}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">{ch.setor}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{ch.tag_equipamento}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatarTempoDecorrido(ch.data_abertura)}</span>
                    {ch.parou_producao && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-red-700 font-semibold inline-flex items-center gap-1">
                          <Flame className="w-3 h-3 text-red-600" /> Parada de Produção
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {ch.titulo}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ch.descricao_problema}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
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

                  {/* Resumo do mecânico quando concluído */}
                  {ch.status === 'concluido' && ch.descricao_servico && (
                    <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Manutenção Concluída por {ch.nome_mecanico || 'Mecânico'}</span>
                      </div>
                      <p className="text-slate-700 line-clamp-2 italic">
                        "{ch.descricao_servico}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Right side: Status indicator & Action button */}
                <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-xs">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Status</span>
                    <span className={`font-semibold ${
                      ch.status === 'aberto'
                        ? 'text-amber-700'
                        : ch.status === 'em_andamento'
                        ? 'text-blue-700'
                        : 'text-emerald-700'
                    }`}>
                      {ch.status === 'aberto' && 'Aguardando Mecânico'}
                      {ch.status === 'em_andamento' && 'Em Atendimento'}
                      {ch.status === 'concluido' && 'Concluído'}
                    </span>
                  </div>

                  <button
                    onClick={() => onVerDetalhes(ch)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver Detalhes</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
