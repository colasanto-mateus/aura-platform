import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  X,
  Mail,
  ShieldCheck,
  RotateCw,
  Sparkles
} from 'lucide-react';

export default function AuthModal({ isOpen }) {
  if (!isOpen) return null;

  const { login, registerInit, verifyEmailCode, resendCode } = useAuth();

  // 'register' | 'login' | 'verify_email'
  const [viewMode, setViewMode] = useState('register');

  // Form Fields
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [optInNews, setOptInNews] = useState(true);

  // Captcha Modal State (Idêntico ao do Discord)
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [captchaChecking, setCaptchaChecking] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Email Verification State
  const [verificationCode, setVerificationCode] = useState('');
  const [devCodePreview, setDevCodePreview] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [resendAvailable, setResendAvailable] = useState(false);

  // Feedback & Loading
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 90 }, (_, i) => currentYear - 4 - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Timer para reenvio de código
  useEffect(() => {
    let timer;
    if (viewMode === 'verify_email' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendAvailable(true);
    }
    return () => clearInterval(timer);
  }, [viewMode, countdown]);

  // Submissão do formulário de cadastro (Dispara o Captcha)
  function handleStartRegister(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !username.trim() || !password) {
      setError('Por favor, preencha todos os campos obrigatórios (*)');
      return;
    }

    if (!birthDay || !birthMonth || !birthYear) {
      setError('Selecione sua data de nascimento completa.');
      return;
    }

    // Abre o modal do Captcha exatamente como no Discord
    setCaptchaVerified(false);
    setShowCaptchaModal(true);
  }

  // Interação com o Captcha ("Espere! Você é humano?")
  async function handleSolveCaptcha() {
    if (captchaChecking || captchaVerified) return;
    setCaptchaChecking(true);

    // Simula verificação de segurança biométrica/humana de 900ms
    setTimeout(async () => {
      setCaptchaChecking(false);
      setCaptchaVerified(true);

      // Fecha o modal de captcha e envia para o backend
      setTimeout(async () => {
        setShowCaptchaModal(false);
        setLoading(true);

        try {
          const birthDateStr = `${birthDay}/${birthMonth}/${birthYear}`;
          const res = await registerInit({
            email: email.trim(),
            displayName: displayName.trim() || username.trim(),
            username: username.trim(),
            password,
            birthDate: birthDateStr,
            captchaVerified: true
          });

          if (res.devCode) {
            setDevCodePreview(res.devCode);
          }

          setViewMode('verify_email');
          setCountdown(30);
          setResendAvailable(false);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }, 400);
    }, 900);
  }

  // Submissão do código de verificação de 6 dígitos
  async function handleConfirmCode(e) {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Digite o código de 6 dígitos recebido.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyEmailCode(email.trim(), verificationCode.trim());
      // Sucesso! O AuthContext atualizará o user e o modal fechará automaticamente.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Reenviar código
  async function handleResendCode() {
    if (!resendAvailable) return;
    setError('');
    try {
      const res = await resendCode(email.trim());
      if (res.devCode) setDevCodePreview(res.devCode);
      setCountdown(30);
      setResendAvailable(false);
    } catch (err) {
      setError(err.message);
    }
  }

  // Login tradicional
  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-[#1e1f22]">
      {/* Fundo Cósmico com Estrelas e Névoa (Estilo Discord) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#10133a] via-[#1b1c3b] to-[#0d0f28] pointer-events-none" />

      {/* Elementos visuais flutuantes de fundo */}
      <div className="absolute top-1/4 left-1/5 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/5 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo Aura no Canto Superior Esquerdo */}
      <div className="absolute top-6 left-8 flex items-center gap-2.5 z-10">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black font-orbitron text-lg shadow-lg shadow-indigo-600/30">
          A
        </div>
        <span className="text-xl font-black tracking-tight text-white font-orbitron">AURA</span>
      </div>

      {/* ======================================================== */}
      {/* 1. TELA DE CRIAR CONTA (Fiel à imagem 2 do Discord) */}
      {/* ======================================================== */}
      {viewMode === 'register' && (
        <div className="relative w-full max-w-[480px] bg-[#313338] rounded-lg shadow-2xl p-8 z-10 text-white my-auto animate-in fade-in duration-200">
          <h2 className="text-2xl font-bold text-center text-white mb-6">Criar uma conta</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStartRegister} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e1f22] border border-transparent focus:border-indigo-500 rounded p-2.5 text-sm text-white focus:outline-none transition"
                required
              />
            </div>

            {/* Nome Exibido */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome exibido
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como seus amigos vão te chamar"
                className="w-full bg-[#1e1f22] border border-transparent focus:border-indigo-500 rounded p-2.5 text-sm text-white focus:outline-none transition"
              />
            </div>

            {/* Nome de Usuário */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome de usuário <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="seunick_exclusivo"
                className="w-full bg-[#1e1f22] border border-transparent focus:border-indigo-500 rounded p-2.5 text-sm text-white focus:outline-none transition"
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-transparent focus:border-indigo-500 rounded p-2.5 pr-10 text-sm text-white focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Data de nascimento <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="bg-[#1e1f22] text-slate-200 text-xs rounded p-2.5 border border-transparent focus:border-indigo-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Dia</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="bg-[#1e1f22] text-slate-200 text-xs rounded p-2.5 border border-transparent focus:border-indigo-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Mês</option>
                  {months.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="bg-[#1e1f22] text-slate-200 text-xs rounded p-2.5 border border-transparent focus:border-indigo-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Ano</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox Opcional */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="optin"
                checked={optInNews}
                onChange={(e) => setOptInNews(e.target.checked)}
                className="mt-1 rounded bg-[#1e1f22] border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="optin" className="text-xs text-slate-400 cursor-pointer leading-tight">
                (Opcional) Tudo bem me mandar e-mails com atualizações do Aura, novidades da loja e recursos especiais.
              </label>
            </div>

            {/* Termos de Serviço */}
            <p className="text-[11px] text-slate-400 leading-normal pt-1">
              Ao clicar em "Criar conta", você concorda com os termos de serviço do Aura e confirma que leu a política de privacidade.
            </p>

            {/* Botão de Submissão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] text-white font-semibold text-sm rounded transition cursor-pointer disabled:opacity-50"
            >
              Criar conta
            </button>
          </form>

          <div className="mt-4 text-xs text-slate-400">
            <span>Já tem uma conta? </span>
            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setError('');
              }}
              className="text-[#00A8FC] hover:underline font-medium"
            >
              Entre aqui
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL CAPTCHA "ESPERE! VOCÊ É HUMANO?" (Fiel à imagem 3) */}
      {/* ======================================================== */}
      {showCaptchaModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-[400px] bg-[#313338] rounded-xl shadow-2xl p-6 border border-slate-700/60 overflow-hidden text-center">
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setShowCaptchaModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ilustração com Óculos de Disfarce e Bigode (Ícone Fiel do Discord) */}
            <div className="flex justify-center mb-4 mt-2">
              <div className="relative w-36 h-28 flex items-center justify-center">
                <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-lg">
                  {/* Armação dos Óculos Roxos */}
                  <path
                    d="M 25 50 Q 55 35 90 50 Q 100 45 110 50 Q 145 35 175 50 Q 185 75 165 95 Q 135 105 115 85 Q 100 70 85 85 Q 65 105 35 95 Q 15 75 25 50 Z"
                    fill="#7c3aed"
                  />
                  {/* Lentes Espelhadas Azuis */}
                  <ellipse cx="60" cy="70" rx="30" ry="20" fill="#1e1b4b" />
                  <ellipse cx="140" cy="70" rx="30" ry="20" fill="#1e1b4b" />
                  <path d="M 40 62 Q 60 55 78 68" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M 120 62 Q 140 55 158 68" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" />

                  {/* Nariz Rosa Grande */}
                  <ellipse cx="100" cy="85" rx="22" ry="26" fill="#f43f5e" />
                  <ellipse cx="94" cy="76" rx="6" ry="8" fill="#fda4af" opacity="0.8" />

                  {/* Bigode Azul Curvado */}
                  <path
                    d="M 100 105 C 75 95 45 115 40 135 C 65 138 85 125 100 115 C 115 125 135 138 160 135 C 155 115 125 95 100 105 Z"
                    fill="#2563eb"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">Espere! Você é humano?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">Confirme que você não é um robô.</p>

            {/* Widget do Captcha (hCaptcha Interativo com Animação) */}
            <div className="bg-[#202225] border border-slate-700/80 rounded-lg p-3.5 flex items-center justify-between shadow-inner">
              <button
                type="button"
                onClick={handleSolveCaptcha}
                className="flex items-center gap-3 cursor-pointer group text-left select-none"
              >
                <div
                  className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    captchaVerified
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : captchaChecking
                      ? 'border-indigo-400 bg-indigo-500/10'
                      : 'border-slate-500 bg-[#2b2d31] group-hover:border-indigo-400'
                  }`}
                >
                  {captchaChecking ? (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : captchaVerified ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : null}
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition">
                  {captchaVerified ? 'Verificado com sucesso' : 'Sou humano'}
                </span>
              </button>

              <div className="flex flex-col items-center pl-3 border-l border-slate-700/60">
                <ShieldCheck className="w-6 h-6 text-[#00A8FC]" />
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                  Proteção
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TELA DE CONFIRMAÇÃO DO CÓDIGO DE E-MAIL */}
      {/* ======================================================== */}
      {viewMode === 'verify_email' && (
        <div className="relative w-full max-w-[440px] bg-[#313338] rounded-lg shadow-2xl p-8 z-10 text-white my-auto animate-in zoom-in-95 duration-200 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white">Confirme seu e-mail</h2>
          <p className="text-xs text-slate-300 mt-2">
            Enviamos um código de segurança de 6 dígitos para o e-mail:
          </p>
          <div className="inline-block bg-[#1e1f22] px-3 py-1 rounded text-xs font-semibold text-indigo-400 my-2">
            {email}
          </div>

          {devCodePreview && (
            <div className="mt-2 mb-4 p-2.5 bg-amber-500/15 border border-amber-500/30 rounded text-amber-300 text-xs text-left">
              <span className="font-bold block">Código de Confirmação gerado:</span>
              <span className="font-mono text-base font-extrabold tracking-widest">{devCodePreview}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleConfirmCode} className="space-y-4">
            <div>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-[#1e1f22] border-2 border-slate-700 focus:border-indigo-500 rounded p-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none transition"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] text-white font-semibold text-sm rounded transition cursor-pointer disabled:opacity-40"
            >
              {loading ? 'Confirmando...' : 'Confirmar e Entrar no Aura'}
            </button>
          </form>

          <div className="mt-5 text-xs text-slate-400 flex items-center justify-between pt-3 border-t border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setViewMode('register');
                setError('');
              }}
              className="text-slate-400 hover:text-white"
            >
              Alterar e-mail
            </button>

            {resendAvailable ? (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-[#00A8FC] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reenviar código</span>
              </button>
            ) : (
              <span className="text-slate-500">Reenviar em {countdown}s</span>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TELA DE LOGIN (Retornar à conta) */}
      {/* ======================================================== */}
      {viewMode === 'login' && (
        <div className="relative w-full max-w-[480px] bg-[#313338] rounded-lg shadow-2xl p-8 z-10 text-white my-auto animate-in fade-in duration-200">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Boas-vindas de volta!</h2>
            <p className="text-xs text-slate-400 mt-1">Estamos muito animados em ver você novamente!</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                E-mail ou Nome de Usuário <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e1f22] border border-transparent focus:border-indigo-500 rounded p-2.5 text-sm text-white focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-transparent focus:border-indigo-500 rounded p-2.5 pr-10 text-sm text-white focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] text-white font-semibold text-sm rounded transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4 text-xs text-slate-400">
            <span>Precisa de uma conta? </span>
            <button
              type="button"
              onClick={() => {
                setViewMode('register');
                setError('');
              }}
              className="text-[#00A8FC] hover:underline font-medium"
            >
              Registre-se
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
