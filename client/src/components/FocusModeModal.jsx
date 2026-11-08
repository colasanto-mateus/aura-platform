import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Brain,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Coins,
  Check,
  X,
  Target,
  Flame,
  Coffee,
  BookOpen,
  Timer as TimerIcon
} from 'lucide-react';

export default function FocusModeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { completeFocusSession } = useAuth();

  // 'pomodoro_25' | 'deep_50' | 'sprint_15' | 'stopwatch'
  const [focusMode, setFocusMode] = useState('pomodoro_25');
  const [topic, setTopic] = useState('Estudo / Trabalho Focado');

  // Timer State
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Sons Ambientes via Web Audio API
  const [ambientSound, setAmbientSound] = useState('rain'); // 'none' | 'rain' | 'binaural_432' | 'cafe'
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const oscNodeRef = useRef(null);

  // Recompensa
  const [rewardMsg, setRewardMsg] = useState('');

  // Sincroniza modo escolhido com tempo
  useEffect(() => {
    let secs = 25 * 60;
    if (focusMode === 'deep_50') secs = 50 * 60;
    if (focusMode === 'sprint_15') secs = 15 * 60;
    if (focusMode === 'stopwatch') secs = 0;

    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setIsRunning(false);
    setIsBreak(false);
  }, [focusMode]);

  // Contagem regressiva / progressiva
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (focusMode === 'stopwatch') {
          setSecondsLeft((prev) => prev + 1);
        } else {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              handleSessionFinished();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, focusMode]);

  // Efeito Sonoro / Ambientes via Web Audio API
  useEffect(() => {
    if (!isRunning || isMuted || ambientSound === 'none') {
      stopAudio();
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopAudio();

      if (ambientSound === 'rain') {
        // Gerador de Som de Chuva Suave usando Pink Noise com Lowpass Filter
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
      } else if (ambientSound === 'binaural_432') {
        // Frequência de Foco Alfa 432 Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscNodeRef.current = osc;
      }
    } catch (e) {
      console.warn('Web Audio error:', e);
    }

    return () => stopAudio();
  }, [isRunning, isMuted, ambientSound]);

  function stopAudio() {
    if (noiseNodeRef.current) {
      try { noiseNodeRef.current.stop(); } catch (e) {}
      noiseNodeRef.current = null;
    }
    if (oscNodeRef.current) {
      try { oscNodeRef.current.stop(); } catch (e) {}
      oscNodeRef.current = null;
    }
  }

  // Finalização da Sessão com Celebração e Moedas de Produtividade
  async function handleSessionFinished() {
    setIsRunning(false);
    stopAudio();

    const minutesMap = { pomodoro_25: 25, deep_50: 50, sprint_15: 15 };
    const mins = minutesMap[focusMode] || 25;

    try {
      const res = await completeFocusSession(mins, focusMode, topic);
      setCompletedSessions((prev) => prev + 1);
      setRewardMsg(`🎉 Sessão concluída! Você ganhou +${res.coinsEarned} Moedas Aura de foco!`);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (err) {
      setRewardMsg('Sessão concluída com sucesso!');
    }
  }

  function toggleStartPause() {
    setIsRunning(!isRunning);
    setRewardMsg('');
  }

  function handleReset() {
    setIsRunning(false);
    stopAudio();
    let secs = 25 * 60;
    if (focusMode === 'deep_50') secs = 50 * 60;
    if (focusMode === 'sprint_15') secs = 15 * 60;
    if (focusMode === 'stopwatch') secs = 0;
    setSecondsLeft(secs);
  }

  // Formatação de Minutos e Segundos
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Cálculo da porcentagem para o círculo SVG
  const progressPercent =
    focusMode === 'stopwatch'
      ? 100
      : Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100));

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-[540px] bg-[#0c0e17] border border-cyan-500/30 rounded-3xl shadow-[0_0_70px_rgba(34,211,238,0.2)] p-6 sm:p-8 text-white z-10 animate-in zoom-in-95 duration-200">
        {/* Botão Fechar */}
        <button
          onClick={() => {
            stopAudio();
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[2px] shadow-lg shadow-cyan-500/20 mb-2">
            <div className="w-full h-full bg-[#0c0e17] rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-orbitron tracking-wide text-white">
            MODO FOCO & PRODUTIVIDADE
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Estudos, trabalho e preparação profissional com timer, som ambiente e ganho de moedas
          </p>
        </div>

        {rewardMsg && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{rewardMsg}</span>
          </div>
        )}

        {/* Seleção do Modo */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setFocusMode('pomodoro_25')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              focusMode === 'pomodoro_25'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                : 'bg-[#151726] border-slate-700/80 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold">25 min</div>
            <div className="text-[10px] text-slate-400">Pomodoro</div>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('deep_50')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              focusMode === 'deep_50'
                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-md'
                : 'bg-[#151726] border-slate-700/80 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold">50 min</div>
            <div className="text-[10px] text-slate-400">Deep Work</div>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('sprint_15')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              focusMode === 'sprint_15'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                : 'bg-[#151726] border-slate-700/80 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold">15 min</div>
            <div className="text-[10px] text-slate-400">Sprint</div>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('stopwatch')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              focusMode === 'stopwatch'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-md'
                : 'bg-[#151726] border-slate-700/80 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold">Livre</div>
            <div className="text-[10px] text-slate-400">Cronômetro</div>
          </button>
        </div>

        {/* Campo de Meta / Assunto */}
        <div className="mb-5">
          <div className="relative">
            <Target className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="O que você está estudando ou produzindo?"
              className="w-full bg-[#151726] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
            />
          </div>
        </div>

        {/* Círculo do Cronômetro / Timer Central */}
        <div className="relative flex flex-col items-center justify-center my-4">
          <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
            {/* SVG Ring Progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-800"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-cyan-400 transition-all duration-1000 ease-linear"
                strokeWidth="5"
                strokeDasharray={276.4}
                strokeDashoffset={276.4 - (276.4 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Display de Tempo */}
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-mono font-black tracking-wider text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                {timeFormatted}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 mt-1">
                {isRunning ? 'Em Concentração' : 'Pausado'}
              </span>
            </div>
          </div>
        </div>

        {/* Sons Ambientes (Web Audio API) */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#151726] border border-slate-700/80 mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Áudio Ambiente:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'rain', label: '🌧️ Chuva' },
              { id: 'binaural_432', label: '🌌 432 Hz' },
              { id: 'none', label: 'Silêncio' }
            ].map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => setAmbientSound(snd.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  ambientSound === snd.id
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {snd.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition ml-1"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Controles: Iniciar / Pausar / Resetar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleStartPause}
            className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pausar Foco</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{secondsLeft === totalSeconds ? 'Iniciar Sessão de Foco' : 'Continuar'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-3.5 bg-[#151726] hover:bg-[#1f2238] border border-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Reiniciar Tempo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Recompensa & Estatísticas */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Recompensa: +25 a +60 Moedas por conclusão</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400 font-bold">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>{completedSessions} sessões concluídas hoje</span>
          </div>
        </div>
      </div>
    </div>
  );
}
