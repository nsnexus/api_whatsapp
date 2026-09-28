import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'register',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Login com Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(
          error.message.includes('provider is not enabled')
            ? 'O provedor Google precisa ser ativado no Supabase Auth. Você também pode cadastrar com e-mail e senha abaixo!'
            : error.message
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao conectar com o Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 2. Cadastro / Login com E-mail e Senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0],
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          setSuccessMessage('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1000);
        } else {
          setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar ou entre no painel.');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(
            error.message.includes('Invalid login credentials')
              ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
              : error.message
          );
          return;
        }

        if (data.session) {
          setSuccessMessage('Login realizado com sucesso! Bem-vindo de volta.');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Entrar rápido em modo demonstração / painel
  const handleQuickDemoAccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#0e131f] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Superior */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800/60 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          {/* Topo / Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20 mb-1">
              N
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {mode === 'register' ? 'Criar sua Conta Grátis' : 'Bem-vindo de Volta'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {mode === 'register'
                ? 'Conecte seu WhatsApp, use nossa API REST ultra-rápida e automatize com IA.'
                : 'Acesse seu painel Nexus API.'}
            </p>
          </div>

          {/* Abas Alternar Login / Cadastro */}
          <div className="flex bg-[#161c2d] p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Conta (Cadastro)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Já Tenho Conta (Entrar)
            </button>
          </div>

          {/* Mensagens de Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Botão Oficial: Login com Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700/80 font-semibold text-xs transition-all shadow-sm group hover:border-slate-600 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Continuar com o Google</span>
          </button>

          {/* Separador */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#0e131f] px-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              ou com e-mail
            </span>
          </div>

          {/* Formulário E-mail / Senha */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Seu nome ou da sua empresa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#161c2d] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                E-mail Corporativo ou Pessoal
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#161c2d] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#161c2d] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'register' ? 'Criar Conta Gratuita' : 'Entrar na Plataforma'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Atalho para Acesso Direto / Demonstração */}
          <div className="pt-2 text-center border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors underline font-medium"
            >
              Continuar direto para o Painel de Demonstração &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
