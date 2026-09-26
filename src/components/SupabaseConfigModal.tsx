import React, { useState, useEffect } from 'react';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, testSupabaseConnection, SUPABASE_SQL_SETUP_SCRIPT } from '../lib/supabase';
import { sincronizarChamadosLocaisParaSupabase } from '../services/ticketService';
import { X, Check, Copy, Database, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'idle' | 'loading' | 'success' | 'warning' | 'error'; text: string }>({
    type: 'idle',
    text: '',
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setSyncResult(null);
      setStatusMsg({ type: 'idle', text: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg({ type: 'loading', text: 'Testando conexão com o Supabase...' });

    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      setStatusMsg({ type: 'error', text: 'Por favor, preencha a URL e a Anon Key do Supabase.' });
      return;
    }

    const test = await testSupabaseConnection(trimmedUrl, trimmedKey);

    if (test.success) {
      saveStoredSupabaseConfig(trimmedUrl, trimmedKey);
      if (test.tableReady) {
        setStatusMsg({
          type: 'success',
          text: 'Conexão confirmada com sucesso! Tabela "chamados" encontrada e pronta para gravação.',
        });
      } else {
        setStatusMsg({
          type: 'warning',
          text: test.message,
        });
      }
      onConfigChanged();
    } else {
      setStatusMsg({
        type: 'error',
        text: test.message,
      });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await sincronizarChamadosLocaisParaSupabase();
      if (res.error) {
        setSyncResult(`Erro ao sincronizar: ${res.error}`);
      } else {
        setSyncResult(`${res.totalSincronizados} chamado(s) sincronizados com sucesso no Supabase!`);
        onConfigChanged();
      }
    } catch (err: any) {
      setSyncResult(`Falha: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Conexão com o Supabase</h2>
              <p className="text-xs text-slate-500">
                Configure seu banco PostgreSQL na nuvem para armazenar todos os chamados
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

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {statusMsg.text && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusMsg.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : statusMsg.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'loading' && <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
              <span className="leading-relaxed">{statusMsg.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project URL (Supabase API URL)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Encontrado em: <strong>Project Settings &gt; API &gt; Project URL</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project API Anon Key (Public Key)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Encontrado em: <strong>Project Settings &gt; API &gt; Project API keys (anon / public)</strong>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={statusMsg.type === 'loading'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statusMsg.type === 'loading' ? 'animate-spin' : ''}`} />
                <span>Testar & Conectar</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                title="Envia todos os chamados existentes para o banco Supabase"
              >
                <Database className="w-3.5 h-3.5 text-slate-600" />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Chamados Locais'}</span>
              </button>
            </div>

            {syncResult && (
              <p className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded border border-slate-200">
                {syncResult}
              </p>
            )}
          </form>

          {/* Setup Instructions & SQL Script */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Script SQL para criar a tabela no Supabase
                </h3>
                <p className="text-[11px] text-slate-500">
                  Copie o script e execute no SQL Editor do seu painel Supabase
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-lg overflow-x-auto max-h-48 leading-relaxed">
              {SUPABASE_SQL_SETUP_SCRIPT}
            </pre>

            {/* Quick 3-Step Guide */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Passo a passo rápido no Supabase:</p>
              <p>1. Crie seu projeto no <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a></p>
              <p>2. Abra o menu <strong>SQL Editor</strong> e cole o código acima, clicando em <strong>Run</strong>.</p>
              <p>3. Em <strong>Project Settings &gt; API</strong>, copie a <em>Project URL</em> e <em>anon public key</em> e cole nos campos acima.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
