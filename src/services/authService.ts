import { User } from '../types';

export const SYSTEM_USERS: Record<string, { pass: string; user: User }> = {
  operador: {
    pass: 'operador123',
    user: {
      id: 'usr-op-01',
      login: 'operador',
      nome: 'João Silva',
      role: 'operador',
      cargo: 'Operador de Máquinas',
      setor: 'Linha de Produção & Usinagem',
    },
  },
  mecanico: {
    pass: 'mecanico123',
    user: {
      id: 'usr-mec-01',
      login: 'mecanico',
      nome: 'Carlos Rocha',
      role: 'mecanico',
      cargo: 'Técnico em Mecânica Industrial',
      setor: 'Oficina de Manutenção Geral',
    },
  },
};

const SESSION_STORAGE_KEY = 'manutec_active_user_session';

export function getActiveUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function loginUser(login: string, pass: string): { success: boolean; user?: User; error?: string } {
  const cleanLogin = login.trim().toLowerCase();
  const entry = SYSTEM_USERS[cleanLogin];

  if (!entry) {
    return {
      success: false,
      error: 'Usuário não encontrado. Utilize "operador" ou "mecanico".',
    };
  }

  if (entry.pass !== pass) {
    return {
      success: false,
      error: 'Senha incorreta para este usuário.',
    };
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(entry.user));
  return { success: true, user: entry.user };
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
