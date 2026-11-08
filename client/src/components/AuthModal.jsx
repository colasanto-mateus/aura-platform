import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen }) {
  if (!isOpen) return null;

  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const avatarPreviewSeed = username.trim() || 'AuraUser';
  const previewAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarPreviewSeed)}&backgroundColor=1e1b4b`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!username.trim() || !email.trim() || !password) {
          throw new Error('Preencha todos os campos');
        }
        await register(username.trim(), email.trim(), password);
      } else {
        if (!email.trim() || !password) {
          throw new Error('Preencha e-mail/usuário e senha');
        }
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl border border-indigo-500/30 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Banner superior com gradiente */}
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative flex items-center justify-center">
          <div className="absolute -bottom-8 bg-[#2b2d31] p-1.5 rounded-full border-4 border-[#313338] shadow-lg">
            <img
              src={previewAvatarUrl}
              alt="Avatar Preview"
              className="w-16 h-16 rounded-full bg-slate-900 object-cover"
            />
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 border border-amber-400/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            +600 Moedas Grátis no Cadastro!
          </div>
        </div>

        <div className="pt-10 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2 font-orbitron">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              {isRegister ? 'Criar sua Conta no Aura' : 'Boas-vindas ao Aura!'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isRegister
                ? 'Conecte-se à sua Aura. Entre nos canais, converse por voz e câmera e personalize seu bonequinho!'
                : 'Sua voz, sua imagem, sua identidade.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nome de Usuário
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="SeuNickLegal"
                    className="w-full bg-[#1e1f22] border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {isRegister ? 'E-mail' : 'E-mail ou Nome de Usuário'}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={isRegister ? 'email' : 'text'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRegister ? 'voce@exemplo.com' : 'E-mail ou nome'}
                  className="w-full bg-[#1e1f22] border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1e1f22] border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition duration-150 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegister ? (
                'Criar Minha Conta & Resgatar Moedas'
              ) : (
                'Entrar no Nexus'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            {isRegister ? (
              <span>
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Entrar agora
                </button>
              </span>
            ) : (
              <span>
                Precisa de uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                  }}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Cadastre-se grátis
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
