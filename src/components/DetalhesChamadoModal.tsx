import React from 'react';
import { Chamado, User } from '../types';
import { X, CheckCircle2, Clock, AlertTriangle, UserCheck, HardHat, Wrench, Package, Printer, Flame } from 'lucide-react';

interface DetalhesChamadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chamado: Chamado | null;
  currentUser: User;
  onEncerrarChamadoDirect?: (chamado: Chamado) => void;
  onAssumirChamadoDirect?: (chamado: Chamado) => void;
}

export const DetalhesChamadoModal: React.FC<DetalhesChamadoModalProps> = ({
  isOpen,
  onClose,
  chamado,
  currentUser,
  onEncerrarChamadoDirect,
  onAssumirChamadoDirect,
}) => {
  if (!isOpen || !chamado) return null;

  const formatarData = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2.5 py-1 rounded">
              {chamado.numero}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {chamado.titulo}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{chamado.equipamento}</span>
                <span>·</span>
                <span className="font-mono">{chamado.tag_equipamento}</span>
                <span>·</span>
                <span>{chamado.setor}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Imprimir ordem de serviço"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">Status Atual:</span>
              <span className="font-semibold text-slate-800">
                {chamado.status === 'aberto' && 'Aberto (Aguardando Atendimento)'}
                {chamado.status === 'em_andamento' && 'Em Andamento (Mecânico na Linha)'}
                {chamado.status === 'concluido' && 'Concluído (Manutenção Finalizada)'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-500">
              <span>Prioridade: <strong className="uppercase text-slate-800">{chamado.prioridade}</strong></span>
              <span>·</span>
              <span>Tipo: <strong className="capitalize text-slate-800">{chamado.tipo_falha}</strong></span>
              {chamado.parou_producao && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                    <Flame className="w-3.5 h-3.5" /> Produção Parada
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Seção 1: Relato da Abertura (Operador) */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>1. Registro do Operador de Produção</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {formatarData(chamado.data_abertura)}
              </span>
            </div>

            <div className="text-xs space-y-1">
              <p className="text-slate-500">
                Aberto por: <strong className="text-slate-800">{chamado.nome_operador}</strong> ({chamado.criado_por})
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Descrição do Problema e Sintomas Observados:
              </p>
              <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed whitespace-pre-wrap">
                {chamado.descricao_problema}
              </p>
            </div>

            {chamado.foto_url && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1.5">
                  Evidência Fotográfica Anexada:
                </p>
                <div className="max-w-md rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={chamado.foto_url}
                    alt="Evidência da falha"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Atendimento Mecânico */}
          {chamado.status !== 'aberto' ? (
            <div className="border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>2. Intervenção Técnica Mecânica</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formatarData(chamado.data_inicio_atendimento)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Mecânico Responsável:</span>
                  <p className="font-semibold text-slate-800">
                    {chamado.nome_mecanico || 'Carlos Rocha (Mecânico)'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Tempo de Atendimento:</span>
                  <p className="font-mono font-semibold text-slate-800">
                    {chamado.tempo_gasto_minutos ? `${chamado.tempo_gasto_minutos} minutos` : 'Em andamento'}
                  </p>
                </div>
              </div>

              {chamado.status === 'concluido' ? (
                <>
                  {/* Descrição do que foi feito */}
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">
                      Serviço Executado pelo Mecânico:
                    </p>
                    <div className="text-xs text-slate-800 bg-emerald-50/50 p-3 rounded border border-emerald-200 leading-relaxed whitespace-pre-wrap">
                      {chamado.descricao_servico}
                    </div>
                  </div>

                  {chamado.causa_raiz && (
                    <div className="text-xs">
                      <span className="text-slate-500">Causa Raiz da Falha:</span>
                      <p className="font-medium text-slate-800">{chamado.causa_raiz}</p>
                    </div>
                  )}

                  {/* Peças trocadas */}
                  {chamado.pecas_utilizadas && chamado.pecas_utilizadas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        <span>Peças e Materiais Substituídos:</span>
                      </p>
                      <div className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="py-1.5 px-3">Item / Peça</th>
                              <th className="py-1.5 px-3">Código</th>
                              <th className="py-1.5 px-3 text-right">Qtd</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {chamado.pecas_utilizadas.map((p, idx) => (
                              <tr key={idx}>
                                <td className="py-1.5 px-3 font-medium text-slate-800">{p.nome}</td>
                                <td className="py-1.5 px-3 font-mono text-slate-500">{p.codigo || '-'}</td>
                                <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                                  {p.quantidade} {p.unidade || 'un'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Condição Final */}
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Condição de Liberação:</span>
                      <p className="font-bold text-slate-900 capitalize">
                        {chamado.condicao_final === 'operacional' && 'Totalmente Operacional e Liberado'}
                        {chamado.condicao_final === 'em_observacao' && 'Operacional em Observação'}
                        {chamado.condicao_final === 'requer_revisao_futura' && 'Requer Revisão Preventiva Futura'}
                        {!chamado.condicao_final && 'Liberado'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500">Encerramento:</span>
                      <p className="font-mono text-slate-800">
                        {formatarData(chamado.data_encerramento)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span>Mecânico está trabalhando nesta ordem de serviço no momento.</span>
                  </div>

                  {currentUser.role === 'mecanico' && onEncerrarChamadoDirect && (
                    <button
                      onClick={() => onEncerrarChamadoDirect(chamado)}
                      className="px-3 py-1.5 bg-blue-700 text-white font-semibold rounded hover:bg-blue-800 transition-colors"
                    >
                      Encerrar Agora
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            currentUser.role === 'mecanico' && onAssumirChamadoDirect && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Chamado aguardando atendimento técnico</p>
                  <p className="text-[11px] text-slate-500">Inicie o atendimento para sinalizar na linha que o mecânico está atuando.</p>
                </div>
                <button
                  onClick={() => onAssumirChamadoDirect(chamado)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Assumir Chamado
                </button>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Identificador único: <span className="font-mono text-slate-700">{chamado.id}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
