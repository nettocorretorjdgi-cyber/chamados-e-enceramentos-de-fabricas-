import React from 'react';
import { User } from '../types';
import { LogOut, HardHat, Wrench, RefreshCw } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onRefreshChamados: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onRefreshChamados,
  isRefreshing = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              M
            </div>
            <a href="/" className="text-lg font-bold tracking-tight text-slate-900">
              Manutec Chamados
            </a>
          </div>

          {/* Zone 2: Contextual Navigation & Operational Role Indicator */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <button
              onClick={onRefreshChamados}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors font-medium cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-2 text-slate-600">
              {user.role === 'operador' ? (
                <>
                  <HardHat className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-800">Painel Operacional</span>
                  <span className="text-slate-400">·</span>
                  <span>Abertura de Chamados</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">Oficina Mecânica</span>
                  <span className="text-slate-400">·</span>
                  <span>Atendimento & Encerramento</span>
                </>
              )}
            </div>
          </div>

          {/* Zone 3: User account + Logout */}
          <div className="flex items-center gap-3">
            {/* User Profile Info */}
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-semibold">
                {user.nome.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{user.nome}</p>
                <p className="text-[11px] text-slate-500 capitalize">{user.role} · {user.cargo}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

