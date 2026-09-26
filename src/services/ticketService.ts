import { Chamado, PecaUtilizada } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { INITIAL_CHAMADOS } from '../data/mockChamados';

const LOCAL_STORAGE_CHAMADOS_KEY = 'manutec_chamados_cache_v1';

function getLocalChamados(): Chamado[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAMADOS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_CHAMADOS_KEY, JSON.stringify(INITIAL_CHAMADOS));
      return INITIAL_CHAMADOS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler chamados locais:', err);
    return INITIAL_CHAMADOS;
  }
}

function saveLocalChamados(chamados: Chamado[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAMADOS_KEY, JSON.stringify(chamados));
  } catch (err) {
    console.error('Erro ao salvar chamados locais:', err);
  }
}

export async function listarChamados(): Promise<{ chamados: Chamado[]; source: 'supabase' | 'local'; error?: string }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .order('data_abertura', { ascending: false });

      if (error) {
        console.warn('Erro ao consultar Supabase, usando armazenamento local:', error.message);
        return { chamados: getLocalChamados(), source: 'local', error: error.message };
      }

      if (data && Array.isArray(data)) {
        // Normaliza itens do Supabase
        const normalizados: Chamado[] = data.map((item: any) => ({
          ...item,
          pecas_utilizadas: typeof item.pecas_utilizadas === 'string' 
            ? JSON.parse(item.pecas_utilizadas) 
            : item.pecas_utilizadas || [],
        }));

        // Atualiza cache local
        saveLocalChamados(normalizados);
        return { chamados: normalizados, source: 'supabase' };
      }
    } catch (err: any) {
      console.warn('Exceção ao buscar do Supabase, fallback para local:', err);
      return { chamados: getLocalChamados(), source: 'local', error: err.message };
    }
  }

  return { chamados: getLocalChamados(), source: 'local' };
}

export async function criarChamado(novo: Omit<Chamado, 'id' | 'numero' | 'data_abertura' | 'status'>): Promise<{ chamado: Chamado; source: 'supabase' | 'local'; error?: string }> {
  const chamados = getLocalChamados();
  const nextNum = chamados.length + 85;
  const numeroGerado = `OS-2026-${String(nextNum).padStart(3, '0')}`;
  const idGerado = `ch-${Date.now()}`;

  const chamadoCompleto: Chamado = {
    ...novo,
    id: idGerado,
    numero: numeroGerado,
    status: 'aberto',
    data_abertura: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  let savedInSupabase = false;
  let supabaseErrorMsg: string | undefined;

  if (supabase) {
    try {
      const payload = {
        ...chamadoCompleto,
        pecas_utilizadas: JSON.stringify(chamadoCompleto.pecas_utilizadas || []),
      };

      const { data, error } = await supabase
        .from('chamados')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Falha ao inserir no Supabase:', error);
        supabaseErrorMsg = error.message;
      } else {
        savedInSupabase = true;
      }
    } catch (err: any) {
      console.error('Erro de conexão ao criar no Supabase:', err);
      supabaseErrorMsg = err.message;
    }
  }

  // Sempre grava no cache local para resiliência instantânea
  const atualizados = [chamadoCompleto, ...chamados];
  saveLocalChamados(atualizados);

  return {
    chamado: chamadoCompleto,
    source: savedInSupabase ? 'supabase' : 'local',
    error: supabaseErrorMsg,
  };
}

export async function assumirChamado(
  id: string,
  mecanicoLogin: string,
  nomeMecanico: string
): Promise<{ chamado: Chamado; source: 'supabase' | 'local'; error?: string }> {
  const chamados = getLocalChamados();
  const index = chamados.findIndex(c => c.id === id);

  if (index === -1) {
    throw new Error('Chamado não encontrado.');
  }

  const atualizado: Chamado = {
    ...chamados[index],
    status: 'em_andamento',
    assumido_por: mecanicoLogin,
    nome_mecanico: nomeMecanico,
    data_inicio_atendimento: new Date().toISOString(),
  };

  chamados[index] = atualizado;
  saveLocalChamados(chamados);

  const supabase = getSupabaseClient();
  let savedInSupabase = false;
  let errorMsg: string | undefined;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('chamados')
        .update({
          status: 'em_andamento',
          assumido_por: mecanicoLogin,
          nome_mecanico: nomeMecanico,
          data_inicio_atendimento: atualizado.data_inicio_atendimento,
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar atendimento no Supabase:', error);
        errorMsg = error.message;
      } else {
        savedInSupabase = true;
      }
    } catch (err: any) {
      console.error('Exceção Supabase:', err);
      errorMsg = err.message;
    }
  }

  return { chamado: atualizado, source: savedInSupabase ? 'supabase' : 'local', error: errorMsg };
}

export async function encerrarChamado(
  id: string,
  encerramentoData: {
    descricao_servico: string;
    causa_raiz?: string;
    pecas_utilizadas: PecaUtilizada[];
    tempo_gasto_minutos: number;
    condicao_final: 'operacional' | 'em_observacao' | 'requer_revisao_futura';
    nome_mecanico: string;
    mecanicoLogin: string;
  }
): Promise<{ chamado: Chamado; source: 'supabase' | 'local'; error?: string }> {
  const chamados = getLocalChamados();
  const index = chamados.findIndex(c => c.id === id);

  if (index === -1) {
    throw new Error('Chamado não encontrado.');
  }

  const agora = new Date().toISOString();
  const atualizado: Chamado = {
    ...chamados[index],
    status: 'concluido',
    assumido_por: chamados[index].assumido_por || encerramentoData.mecanicoLogin,
    nome_mecanico: chamados[index].nome_mecanico || encerramentoData.nome_mecanico,
    descricao_servico: encerramentoData.descricao_servico,
    causa_raiz: encerramentoData.causa_raiz,
    pecas_utilizadas: encerramentoData.pecas_utilizadas,
    tempo_gasto_minutos: encerramentoData.tempo_gasto_minutos,
    condicao_final: encerramentoData.condicao_final,
    data_encerramento: agora,
  };

  chamados[index] = atualizado;
  saveLocalChamados(chamados);

  const supabase = getSupabaseClient();
  let savedInSupabase = false;
  let errorMsg: string | undefined;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('chamados')
        .update({
          status: 'concluido',
          assumido_por: atualizado.assumido_por,
          nome_mecanico: atualizado.nome_mecanico,
          descricao_servico: atualizado.descricao_servico,
          causa_raiz: atualizado.causa_raiz,
          pecas_utilizadas: JSON.stringify(atualizado.pecas_utilizadas || []),
          tempo_gasto_minutos: atualizado.tempo_gasto_minutos,
          condicao_final: atualizado.condicao_final,
          data_encerramento: atualizado.data_encerramento,
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao encerrar chamado no Supabase:', error);
        errorMsg = error.message;
      } else {
        savedInSupabase = true;
      }
    } catch (err: any) {
      console.error('Exceção Supabase ao encerrar:', err);
      errorMsg = err.message;
    }
  }

  return { chamado: atualizado, source: savedInSupabase ? 'supabase' : 'local', error: errorMsg };
}

export async function sincronizarChamadosLocaisParaSupabase(): Promise<{ totalSincronizados: number; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase não está configurado.');
  }

  const locais = getLocalChamados();
  if (locais.length === 0) {
    return { totalSincronizados: 0 };
  }

  try {
    const payload = locais.map(c => ({
      ...c,
      pecas_utilizadas: JSON.stringify(c.pecas_utilizadas || []),
    }));

    const { error } = await supabase
      .from('chamados')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { totalSincronizados: 0, error: error.message };
    }

    return { totalSincronizados: locais.length };
  } catch (err: any) {
    return { totalSincronizados: 0, error: err.message };
  }
}
