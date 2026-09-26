import React, { useState } from 'react';
import { User, Prioridade, TipoFalha } from '../types';
import { X, AlertCircle, Camera, Upload, Wrench, HardHat, Check, Flame } from 'lucide-react';

interface NovoChamadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSalvarChamado: (dados: {
    titulo: string;
    equipamento: string;
    tag_equipamento: string;
    setor: string;
    prioridade: Prioridade;
    tipo_falha: TipoFalha;
    parou_producao: boolean;
    descricao_problema: string;
    foto_url?: string;
    criado_por: string;
    nome_operador: string;
  }) => Promise<void>;
}

const EQUIPAMENTOS_SUGERIDOS = [
  { nome: 'Torno CNC Mazak Quick Turn 250', tag: 'CNC-04', setor: 'Usinagem de Precisão' },
  { nome: 'Centro de Usinagem Romi D800', tag: 'CU-01', setor: 'Usinagem de Precisão' },
  { nome: 'Injetora Termoplástica KraussMaffei', tag: 'INJ-07', setor: 'Injeção Plástica' },
  { nome: 'Prensa Hidráulica 100 Toneladas', tag: 'PR-12', setor: 'Estamparia & Conformação' },
  { nome: 'Empilhadeira a Combustão Toyota 2.5T', tag: 'EMP-02', setor: 'Logística & Expedição' },
  { nome: 'Compressor de Parafuso Atlas Copco GA37', tag: 'COMP-01', setor: 'Utilidades & Energia' },
  { nome: 'Exaustor Industrial Cabine Pintura', tag: 'EX-02', setor: 'Pintura & Tratamento Térmico' },
  { nome: 'Esteira Transportadora Principal', tag: 'EST-05', setor: 'Linha de Montagem' },
];

const SETORES_PADRAO = [
  'Usinagem de Precisão',
  'Estamparia & Conformação',
  'Linha de Montagem',
  'Injeção Plástica',
  'Pintura & Tratamento Térmico',
  'Logística & Expedição',
  'Utilidades & Manutenção Predial',
];

export const NovoChamadoModal: React.FC<NovoChamadoModalProps> = ({
  isOpen,
  onClose,
  user,
  onSalvarChamado,
}) => {
  const [titulo, setTitulo] = useState('');
  const [equipamento, setEquipamento] = useState('');
  const [tagEquipamento, setTagEquipamento] = useState('');
  const [setor, setSetor] = useState(SETORES_PADRAO[0]);
  const [prioridade, setPrioridade] = useState<Prioridade>('alta');
  const [tipoFalha, setTipoFalha] = useState<TipoFalha>('mecanica');
  const [parouProducao, setParouProducao] = useState(false);
  const [descricaoProblema, setDescricaoProblema] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);
  const [fotoNome, setFotoNome] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectEquipamentoSugerido = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const encontrado = EQUIPAMENTOS_SUGERIDOS.find((item) => item.nome === val);
    if (encontrado) {
      setEquipamento(encontrado.nome);
      setTagEquipamento(encontrado.tag);
      setSetor(encontrado.setor);
    } else {
      setEquipamento(val);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErro('A imagem selecionada deve ter no máximo 5MB.');
        return;
      }
      setFotoNome(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!titulo.trim()) {
      setErro('Informe um título ou resumo do chamado.');
      return;
    }
    if (!equipamento.trim()) {
      setErro('Informe o equipamento ou máquina com falha.');
      return;
    }
    if (!descricaoProblema.trim()) {
      setErro('Descreva o problema observado detalhadamente.');
      return;
    }

    setSalvando(true);
    try {
      await onSalvarChamado({
        titulo: titulo.trim(),
        equipamento: equipamento.trim(),
        tag_equipamento: tagEquipamento.trim() || 'S/TAG',
        setor: setor.trim(),
        prioridade,
        tipo_falha: tipoFalha,
        parou_producao: parouProducao,
        descricao_problema: descricaoProblema.trim(),
        foto_url: fotoUrl,
        criado_por: user.login,
        nome_operador: user.nome,
      });
      onClose();
    } catch (err: any) {
      setErro(`Erro ao abrir chamado: ${err.message}`);
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
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Abertura de Chamado de Manutenção</h2>
              <p className="text-xs text-slate-500">
                Operador: <strong className="text-slate-700">{user.nome}</strong> ({user.login})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* Título do Chamado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título da Ocorrência / Sintoma Resumido *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Vazamento de óleo no barramento do eixo Z"
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Seleção de Máquina / Equipamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Equipamento / Máquina *
                </label>
                <span className="text-[11px] text-slate-500">Selecione ou digite abaixo</span>
              </div>
              <select
                onChange={handleSelectEquipamentoSugerido}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 mb-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">-- Escolher da lista da fábrica --</option>
                {EQUIPAMENTOS_SUGERIDOS.map((eq) => (
                  <option key={eq.tag} value={eq.nome}>
                    {eq.nome} ({eq.tag})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={equipamento}
                onChange={(e) => setEquipamento(e.target.value)}
                placeholder="Ou digite o nome completo do equipamento"
                required
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tag / Código Patrimonial
              </label>
              <input
                type="text"
                value={tagEquipamento}
                onChange={(e) => setTagEquipamento(e.target.value)}
                placeholder="Ex: CNC-04"
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Setor e Tipo de Falha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Setor / Área da Fábrica
              </label>
              <select
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {SETORES_PADRAO.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Falha Observada
              </label>
              <select
                value={tipoFalha}
                onChange={(e) => setTipoFalha(e.target.value as TipoFalha)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="mecanica">Mecânica (Ruídos, Vibração, Travamento)</option>
                <option value="hidraulica">Hidráulica (Pressão, Cilindros, Vazamentos)</option>
                <option value="pneumatica">Pneumática (Válvulas, Atuadores, Ar)</option>
                <option value="eletrica">Elétrica / Eletrônica (Sensores, Motor, Painel)</option>
                <option value="lubrificacao">Lubrificação & Mancais</option>
                <option value="outro">Outro / Estrutural</option>
              </select>
            </div>
          </div>

          {/* Prioridade e Impacto na Produção */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Nível de Urgência / Prioridade
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'baixa', label: 'Baixa', desc: 'Não impede trabalho' },
                  { id: 'media', label: 'Média', desc: 'Trabalho com restrição' },
                  { id: 'alta', label: 'Alta', desc: 'Risco iminente de parada' },
                  { id: 'urgente', label: 'Urgente', desc: 'Parada crítica' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPrioridade(item.id as Prioridade)}
                    className={`p-2.5 text-left border rounded-lg transition-all ${
                      prioridade === item.id
                        ? item.id === 'urgente'
                          ? 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500'
                          : item.id === 'alta'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                          : 'border-slate-800 bg-white text-slate-900 ring-1 ring-slate-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold leading-none mb-1">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Switch Parou Produção */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Flame className={`w-4 h-4 ${parouProducao ? 'text-red-600' : 'text-slate-400'}`} />
                  A máquina ou linha de produção está parada?
                </span>
                <p className="text-[11px] text-slate-500">
                  Sinaliza para a equipe mecânica atendimento imediato na linha
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setParouProducao(!parouProducao)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    parouProducao ? 'bg-red-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      parouProducao ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-semibold ${parouProducao ? 'text-red-700' : 'text-slate-500'}`}>
                  {parouProducao ? 'SIM, PARADA' : 'NÃO'}
                </span>
              </div>
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição Detalhada do Problema / Sintomas Observados *
            </label>
            <textarea
              rows={4}
              value={descricaoProblema}
              onChange={(e) => setDescricaoProblema(e.target.value)}
              placeholder="Descreva com detalhes o que aconteceu: ruídos anormais, fumaça, travamento mecânico, código de erro que apareceu na IHM/painel, vibração ou vazamentos..."
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
            />
          </div>

          {/* Anexo de Foto / Imagem */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Foto ou Evidência Visual da Falha (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Anexar Imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {fotoNome && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono truncate max-w-xs">{fotoNome}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFotoUrl(undefined);
                      setFotoNome(null);
                    }}
                    className="text-red-600 hover:underline text-[11px]"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {fotoUrl && (
              <div className="mt-2 relative w-36 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={fotoUrl}
                  alt="Pré-visualização do problema"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <span>{salvando ? 'Gravando Chamado...' : 'Confirmar e Abrir Chamado'}</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
