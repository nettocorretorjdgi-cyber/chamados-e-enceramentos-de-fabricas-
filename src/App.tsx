import React, { useState, useEffect, useCallback } from 'react';
import { User, Chamado } from './types';
import { getActiveUser, logoutUser } from './services/authService';
import {
  listarChamados,
  criarChamado,
  assumirChamado,
  encerrarChamado,
} from './services/ticketService';
import { getStoredSupabaseConfig, testSupabaseConnection } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { OperadorDashboard } from './components/OperadorDashboard';
import { MecanicoDashboard } from './components/MecanicoDashboard';
import { NovoChamadoModal } from './components/NovoChamadoModal';
import { EncerrarChamadoModal } from './components/EncerrarChamadoModal';
import { DetalhesChamadoModal } from './components/DetalhesChamadoModal';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [chamadoParaEncerrar, setChamadoParaEncerrar] = useState<Chamado | null>(null);
  const [chamadoParaDetalhar, setChamadoParaDetalhar] = useState<Chamado | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Checa status do Supabase em background
  const checkSupabaseStatus = useCallback(async () => {
    const config = getStoredSupabaseConfig();
    if (config.isConfigured) {
      const test = await testSupabaseConnection();
      setIsSupabaseConnected(test.success);
    } else {
      setIsSupabaseConnected(false);
    }
  }, []);

  // Carrega chamados
  const carregarChamados = useCallback(async (silencioso = false) => {
    if (!silencioso) setSincronizando(true);
    try {
      const res = await listarChamados();
      setChamados(res.chamados);
      setDataSource(res.source);
    } catch (err) {
      console.error('Falha ao listar chamados:', err);
    } finally {
      setSincronizando(false);
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // Inicializa usuário logado se existir na sessão
    const user = getActiveUser();
    if (user) {
      setCurrentUser(user);
    }

    checkSupabaseStatus();
    carregarChamados();
  }, [checkSupabaseStatus, carregarChamados]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Bem-vindo, ${user.nome}! Conectado como ${user.role}.`, 'success');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  // Operador abre chamado
  const handleSalvarNovoChamado = async (dados: any) => {
    const res = await criarChamado(dados);
    await carregarChamados(true);
    showToast(
      res.source === 'supabase'
        ? `Chamado ${res.chamado.numero} gravado com sucesso no Supabase!`
        : `Chamado ${res.chamado.numero} aberto com sucesso!`,
      'success'
    );
  };

  // Mecânico assume atendimento
  const handleAssumirChamado = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await assumirChamado(id, currentUser.login, currentUser.nome);
      await carregarChamados(true);
      showToast(`Você assumiu o chamado ${res.chamado.numero}. Atendimento iniciado!`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Mecânico encerra chamado
  const handleConfirmarEncerramento = async (id: string, dados: any) => {
    try {
      const res = await encerrarChamado(id, dados);
      await carregarChamados(true);
      setChamadoParaEncerrar(null);
      showToast(
        res.source === 'supabase'
          ? `Chamado ${res.chamado.numero} encerrado e atualizado no Supabase!`
          : `Chamado ${res.chamado.numero} encerrado com sucesso!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Se não estiver logado, exibe tela de login limpa
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toastMessage.type === 'error'
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-blue-900 text-white border-blue-800'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-300" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onRefreshChamados={() => carregarChamados(false)}
        isRefreshing={sincronizando}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Carregando sistema de chamados...</p>
          </div>
        ) : currentUser.role === 'operador' ? (
          /* Operador Dashboard */
          <OperadorDashboard
            user={currentUser}
            chamados={chamados}
            onOpenNovoChamado={() => setModalNovoAberto(true)}
            onVerDetalhes={(ch) => setChamadoParaDetalhar(ch)}
            isSupabaseConnected={isSupabaseConnected}
          />
        ) : (
          /* Mecânico Dashboard */
          <MecanicoDashboard
            user={currentUser}
            chamados={chamados}
            onAssumirChamado={handleAssumirChamado}
            onEncerrarChamado={(ch) => setChamadoParaEncerrar(ch)}
            onVerDetalhes={(ch) => setChamadoParaDetalhar(ch)}
            isSupabaseConnected={isSupabaseConnected}
          />
        )}
      </main>

      {/* Modais */}
      <NovoChamadoModal
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        user={currentUser}
        onSalvarChamado={handleSalvarNovoChamado}
      />

      <EncerrarChamadoModal
        isOpen={Boolean(chamadoParaEncerrar)}
        onClose={() => setChamadoParaEncerrar(null)}
        chamado={chamadoParaEncerrar}
        user={currentUser}
        onConfirmarEncerramento={handleConfirmarEncerramento}
      />

      <DetalhesChamadoModal
        isOpen={Boolean(chamadoParaDetalhar)}
        onClose={() => setChamadoParaDetalhar(null)}
        chamado={chamadoParaDetalhar}
        currentUser={currentUser}
        onAssumirChamadoDirect={async (ch) => {
          await handleAssumirChamado(ch.id);
          setChamadoParaDetalhar(null);
        }}
        onEncerrarChamadoDirect={(ch) => {
          setChamadoParaDetalhar(null);
          setChamadoParaEncerrar(ch);
        }}
      />
    </div>
  );
}

