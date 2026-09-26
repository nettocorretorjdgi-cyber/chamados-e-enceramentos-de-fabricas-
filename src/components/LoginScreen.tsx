import React, { useState } from 'react';
import { User } from '../types';
import { loginUser } from '../services/authService';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
}) => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    setTimeout(() => {
      const res = loginUser(login, senha);
      setCarregando(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErro(res.error || 'Credenciais inválidas.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner / System Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-slate-900 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold shadow-md">
          M
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
          Manutec Chamados
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Controle de Ordens de Serviço & Manutenção Industrial
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {erro && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Usuário
              </label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="operador ou mecanico"
                required
                className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Senha de Acesso
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha"
                required
                className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{carregando ? 'Validando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

