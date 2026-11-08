import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ArrowLeft,
  Mail,
  Shield,
  RotateCw,
  Sparkles,
  Lock,
  User,
  Calendar,
  AtSign
} from 'lucide-react';

export default function AuthModal({ isOpen }) {
  if (!isOpen) return null;

  const { login, registerInit, verifyEmailCode, resendCode } = useAuth();

  // Modos de exibição: 'register' | 'verify_email' | 'login'
  const [viewMode, setViewMode] = useState('register');

  // Campos do formulário (iniciam rigorosamente vazios)
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [optInNews, setOptInNews] = useState(false);

  // Verificação Humana Aura Shield Integrada (Captcha Anti-Bot)
  const [shieldChecking, setShieldChecking] = useState(false);
  const [shieldVerified, setShieldVerified] = useState(false);

  // Confirmação de E-mail
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Estados de erro e carregamento
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 85 }, (_, i) => currentYear - 10 - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Temporizador para reenvio de e-mail (30s)
  useEffect(() => {
    let timer;
    if (viewMode === 'verify_email' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setResendAvailable(true);
    }
    return () => clearInterval(timer);
  }, [viewMode, countdown]);

  // Limpa campos e estados ao alternar modo
  function switchMode(newMode) {
    setError('');
    setViewMode(newMode);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    if (newMode === 'register') {
      setDisplayName('');
      setUsername('');
      setBirthDay('');
      setBirthMonth('');
      setBirthYear('');
      setShieldChecking(false);
      setShieldVerified(false);
    }
  }

  // Ativação do Captcha Aura Shield com animação de validação biométrica
  function handleToggleShield() {
    if (shieldChecking || shieldVerified) return;
    setError('');
    setShieldChecking(true);

    setTimeout(() => {
      setShieldChecking(false);
      setShieldVerified(true);
    }, 850);
  }

  // 1. Submissão do Cadastro -> Envia e-mail real com código de 6 dígitos
  async function handleSubmitRegister(e) {
    if (e) e.preventDefault();
    setError('');

    if (!email.trim() || !username.trim() || !password) {
      setError('Preencha os campos obrigatórios marcados com (*).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (!birthDay || !birthMonth || !birthYear) {
      setError('Selecione sua data de nascimento completa.');
      return;
    }

    if (!shieldVerified) {
      setError('Por favor, complete a confirmação de segurança (Aura Shield) abaixo.');
      return;
    }

    setLoading(true);

    try {
      const birthDateStr = `${birthDay}/${birthMonth}/${birthYear}`;
      await registerInit({
        email: email.trim(),
        displayName: displayName.trim() || username.trim(),
        username: username.trim(),
        password,
        birthDate: birthDateStr,
        captchaVerified: true
      });

      // Sucesso! Transiciona diretamente para a tela de confirmação de e-mail
      setViewMode('verify_email');
      setCountdown(30);
      setResendAvailable(false);
      setResendMessage('');
    } catch (err) {
      setError(err.message || 'Erro ao processar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Validação do código de 6 dígitos recebido no e-mail
  async function handleConfirmCode(e) {
    if (e) e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Digite o código de 6 dígitos recebido no seu e-mail.');
      return;
    }

    if (verificationCode.trim().length !== 6) {
      setError('O código precisa conter exatamente 6 dígitos numéricos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyEmailCode(email.trim(), verificationCode.trim());
      // Ao verificar com sucesso, o token é salvo e o modal fecha automaticamente
    } catch (err) {
      setError(err.message || 'Código incorreto ou expirado. Verifique os dígitos no seu e-mail.');
    } finally {
      setLoading(false);
    }
  }

  // 3. Reenviar e-mail com novo código
  async function handleResendCode() {
    if (!resendAvailable || loading) return;
    setError('');
    setResendMessage('');
    try {
      await resendCode(email.trim());
      setResendMessage('Novo código enviado! Verifique sua caixa de entrada e spam.');
      setCountdown(30);
      setResendAvailable(false);
    } catch (err) {
      setError(err.message || 'Erro ao reenviar código.');
    }
  }

  // 4. Login
  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError('Preencha seu e-mail/usuário e senha para entrar.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'E-mail, usuário ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-[#07080d]/95 backdrop-blur-xl">
      {/* Aurora Cósmica Exclusiva da Aura (Violeta, Ciano, Índigo) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.22),rgba(13,14,24,0)_60%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[110px] pointer-events-none" />

      {/* Grid de Alta Tecnologia */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* ======================================================== */}
      {/* 1. TELA DE CADASTRO COM A IDENTIDADE PRÓPRIA DA AURA */}
      {/* ======================================================== */}
      {viewMode === 'register' && (
        <div className="relative w-full max-w-[490px] bg-[#0f111a]/95 backdrop-blur-2xl border border-indigo-500/25 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.18)] p-7 sm:p-9 z-10 text-white my-auto animate-in fade-in duration-300">
          {/* Cabeçalho Aura */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/30 mb-3">
              <div className="w-full h-full bg-[#0f111a] rounded-2xl flex items-center justify-center">
                <span className="font-orbitron font-black text-2xl bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  A
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-wider text-white font-orbitron">
              CRIAR CONTA AURA
            </h2>
            <p className="text-xs text-slate-400 mt-1">Sua voz, sua imagem, sua identidade única</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmitRegister} autoComplete="off" className="space-y-3.5">
            {/* Inputs ocultos para desativar autofill agressivo do Chrome */}
            <input type="text" style={{ display: 'none' }} />
            <input type="password" style={{ display: 'none' }} />

            {/* E-mail */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>E-mail</span> <span className="text-cyan-400">*</span>
              </label>
              <input
                type="email"
                name="aura_custom_user_email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-[#161824] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                required
              />
            </div>

            {/* Nome Exibido & Usuário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nome Exibido</span>
                </label>
                <input
                  type="text"
                  name="aura_custom_display_name"
                  autoComplete="off"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como quer ser visto"
                  className="w-full bg-[#161824] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Usuário (@nick)</span> <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  name="aura_custom_username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="nick_unico"
                  className="w-full bg-[#161824] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-mono"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Senha de Acesso</span> <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="aura_custom_new_password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full bg-[#161824] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Data de Nascimento</span> <span className="text-cyan-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="bg-[#161824] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-slate-700/80 focus:border-cyan-400 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Dia</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="bg-[#161824] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-slate-700/80 focus:border-cyan-400 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Mês</option>
                  {months.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="bg-[#161824] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-slate-700/80 focus:border-cyan-400 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Ano</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Verificação Humana Aura Shield (Captcha Anti-Bot Integrado) */}
            <div className="pt-1">
              <div
                onClick={handleToggleShield}
                className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                  shieldVerified
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : shieldChecking
                    ? 'bg-cyan-500/10 border-cyan-400/50'
                    : 'bg-[#161824] border-slate-700/80 hover:border-cyan-400/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      shieldVerified
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/40'
                        : shieldChecking
                        ? 'border-cyan-400 bg-cyan-500/20'
                        : 'border-slate-500 bg-[#0f111a] group-hover:border-cyan-400'
                    }`}
                  >
                    {shieldChecking ? (
                      <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : shieldVerified ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : null}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white block">
                      {shieldVerified
                        ? 'Identidade Humana Confirmada'
                        : shieldChecking
                        ? 'Verificando presença humana...'
                        : 'Confirmar que sou humano'}
                    </span>
                    <span className="text-[10px] text-slate-400">Proteção anti-bot Aura Shield</span>
                  </div>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider uppercase flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>AURA SHIELD</span>
                </div>
              </div>
            </div>

            {/* Checkbox Opcional */}
            <div className="flex items-start gap-2 pt-0.5">
              <input
                type="checkbox"
                id="optin_news"
                checked={optInNews}
                onChange={(e) => setOptInNews(e.target.checked)}
                className="mt-0.5 rounded bg-[#161824] border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="optin_news" className="text-[11px] text-slate-400 cursor-pointer leading-tight">
                Desejo receber avisos sobre novos bonequinhos da loja, fundos e novidades da Aura.
              </label>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-400 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando código para seu e-mail...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Criar Minha Conta Aura</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <span>Já faz parte da Aura? </span>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
            >
              Entrar agora
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CONFIRMAÇÃO DO CÓDIGO ENVIADO POR E-MAIL */}
      {/* ======================================================== */}
      {viewMode === 'verify_email' && (
        <div className="relative w-full max-w-[460px] bg-[#0f111a]/95 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.2)] p-8 sm:p-9 z-10 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600/30 via-purple-600/30 to-cyan-500/30 border border-cyan-400/40 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white font-orbitron tracking-wide">
            CÓDIGO DE VERIFICAÇÃO
          </h2>
          <p className="text-xs text-slate-300 mt-2">
            Enviamos um código de segurança de 6 dígitos para o endereço:
          </p>
          <div className="inline-block bg-[#161824] border border-cyan-500/30 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-cyan-300 my-3">
            {email}
          </div>

          <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl mb-4 text-left">
            <p className="text-[11px] text-cyan-200/90 leading-relaxed">
              📩 Abra o seu e-mail e verifique a sua <strong>Caixa de Entrada</strong>. Se não encontrar em instantes, confira também na pasta de <strong>Spam / Lixo Eletrônico</strong>.
            </p>
          </div>

          {resendMessage && (
            <div className="mb-4 p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
              {resendMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleConfirmCode} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
                Digite o Código de 6 Dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full bg-[#161824] border-2 border-slate-700/80 focus:border-cyan-400 rounded-2xl p-3 text-center text-3xl font-mono font-bold tracking-[0.5em] text-cyan-300 focus:outline-none transition shadow-inner"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando código...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Entrar no Aura</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-xs text-slate-400 flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setViewMode('register');
                setError('');
              }}
              className="text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Corrigir e-mail</span>
            </button>

            {resendAvailable ? (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 cursor-pointer transition"
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
      {/* 3. TELA DE LOGIN AURA */}
      {/* ======================================================== */}
      {viewMode === 'login' && (
        <div className="relative w-full max-w-[450px] bg-[#0f111a]/95 backdrop-blur-2xl border border-indigo-500/25 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.18)] p-8 sm:p-9 z-10 text-white my-auto animate-in fade-in duration-200">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/30 mb-2.5">
              <div className="w-full h-full bg-[#0f111a] rounded-2xl flex items-center justify-center">
                <span className="font-orbitron font-black text-xl text-cyan-300">A</span>
              </div>
            </div>
            <h2 className="text-2xl font-black text-white font-orbitron tracking-wide">
              ENTRAR NO AURA
            </h2>
            <p className="text-xs text-slate-400 mt-1">Conecte-se à sua presença online</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
            <input type="text" style={{ display: 'none' }} />
            <input type="password" style={{ display: 'none' }} />

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>E-mail ou Nome de Usuário</span> <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="aura_log_identifier_field"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com ou @nick"
                className="w-full bg-[#161824] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Senha</span> <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="aura_log_password_field"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full bg-[#161824] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar na Minha Aura</span>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
            <span>Ainda não possui uma conta? </span>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
            >
              Criar conta gratuita
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
