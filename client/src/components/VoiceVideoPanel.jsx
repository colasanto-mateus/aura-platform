import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Volume2,
  Sparkles,
  Users,
  Settings,
  Maximize2,
  Shield,
  Lock
} from 'lucide-react';

export default function VoiceVideoPanel({
  channel,
  onLeave,
  isMicMuted,
  onToggleMic,
  isVideoOff,
  onToggleVideo,
  voiceParticipants = [],
  localStream,
  remoteStreams = {}
}) {
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  // Anexa o stream local à tag <video>
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Função para compartilhar tela
  async function toggleScreenShare() {
    if (user?.isMinor) {
      alert('Recurso Protegido: Compartilhamento de tela é desativado para contas de 10 a 17 anos por diretriz de segurança infantil.');
      return;
    }
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn('Compartilhamento de tela cancelado ou não suportado:', err);
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#1e1f22] select-none">
      {/* Banner de Proteção Infantil para Menores de Idade (10-17 anos) */}
      {user?.isMinor && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-300 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">Modo Ouvinte Protegido (10-17 anos) Ativo:</span>
            <span className="text-slate-300 hidden md:inline">
              Você pode ouvir as conversas e aulas normalmente. Microfone, webcam e compartilhamento estão desativados por segurança.
            </span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold shrink-0">
            PROTEÇÃO INFANTIL
          </span>
        </div>
      )}
      {/* 1. Barra Superior da Chamada */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-[#2b2d31] bg-[#2b2d31]/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <span>{channel?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ao Vivo
              </span>
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>{1 + voiceParticipants.length} participante(s) na sala</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 bg-[#1e1f22] px-3 py-1 rounded-full border border-slate-700">
            WebRTC Ultra Low Latency • 1080p 60FPS
          </div>
        </div>
      </div>

      {/* 2. Grade de Câmeras e Participantes (Video Grid) */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-center justify-center">
        {/* Card do Usuário Local (Você) */}
        <div className="relative aspect-video bg-[#2b2d31] rounded-2xl overflow-hidden border-2 border-slate-700/60 shadow-xl flex items-center justify-center group">
          {/* Se a câmera estiver ligada e houver stream */}
          {!isVideoOff && localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror scale-x-[-1]"
            />
          ) : (
            /* Se a câmera estiver desligada: mostra o avatar/bonequinho personalizado */
            <div className="flex flex-col items-center justify-center gap-3 p-4">
              <div className="relative">
                <img
                  src={user?.equippedAvatar}
                  alt={user?.username}
                  className={`w-24 h-24 rounded-full bg-slate-900 object-cover border-4 ${
                    user?.borderEffect || 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                  } ${!isMicMuted ? 'ring-4 ring-emerald-500/60 ring-offset-4 ring-offset-[#2b2d31]' : ''}`}
                />
                {!isMicMuted && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#2b2d31] animate-ping" />
                )}
              </div>
              <div className="text-center">
                <span
                  className={`text-base font-bold ${user?.equippedColor || 'text-white'}`}
                  style={{ fontFamily: user?.equippedFont || 'inherit' }}
                >
                  {user?.username}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  {user?.isMinor ? '🛡️ Ouvinte Protegido (10-17 anos)' : 'Câmera desativada'}
                </span>
              </div>
            </div>
          )}

          {/* Nome e badges sobre o vídeo */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span
              className={`font-semibold ${user?.equippedColor || 'text-white'}`}
              style={{ fontFamily: user?.equippedFont || 'inherit' }}
            >
              {user?.username} (Você)
            </span>
            {isMicMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
            {isVideoOff && <VideoOff className="w-3.5 h-3.5 text-amber-400" />}
          </div>
        </div>

        {/* Card de Compartilhamento de Tela (Se ativo) */}
        {isScreenSharing && screenStream && (
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl flex items-center justify-center col-span-1 md:col-span-2">
            <video
              ref={(ref) => {
                if (ref) ref.srcObject = screenStream;
              }}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 bg-indigo-600/80 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white">
              Sua Transmissão de Tela
            </div>
          </div>
        )}

        {/* Participantes Remotos Conectados */}
        {voiceParticipants.map((p, idx) => {
          const remoteStream = remoteStreams[p.socketId];
          const hasRemoteVideo = !p.isVideoOff && remoteStream;

          return (
            <div
              key={p.socketId || idx}
              className="relative aspect-video bg-[#2b2d31] rounded-2xl overflow-hidden border-2 border-slate-700/60 shadow-xl flex items-center justify-center"
            >
              {hasRemoteVideo ? (
                <video
                  ref={(ref) => {
                    if (ref) ref.srcObject = remoteStream;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-4">
                  <div className="relative">
                    <img
                      src={p.user?.equippedAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=remote'}
                      alt={p.user?.username}
                      className={`w-24 h-24 rounded-full bg-slate-900 object-cover border-4 ${
                        p.user?.borderEffect || 'border-slate-500'
                      } ${!p.isMuted ? 'ring-4 ring-emerald-500/60 ring-offset-4 ring-offset-[#2b2d31]' : ''}`}
                    />
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-base font-bold ${p.user?.equippedColor || 'text-white'}`}
                      style={{ fontFamily: p.user?.equippedFont || 'inherit' }}
                    >
                      {p.user?.username || 'Participante'}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {p.isVideoOff ? 'Câmera desativada' : 'Ao vivo'}
                    </span>
                  </div>
                </div>
              )}

              {/* Badges do participante */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <span
                  className={`font-semibold ${p.user?.equippedColor || 'text-white'}`}
                  style={{ fontFamily: p.user?.equippedFont || 'inherit' }}
                >
                  {p.user?.username}
                </span>
                {p.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
              </div>
            </div>
          );
        })}

        {/* Placeholder amigável caso não haja mais ninguém na sala */}
        {voiceParticipants.length === 0 && (
          <div className="aspect-video bg-[#232428]/50 border-2 border-dashed border-slate-700/60 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-600 mb-2" />
            <h4 className="font-semibold text-slate-300">Aguardando mais pessoas...</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Convide seus amigos para entrar em <strong>{channel?.name}</strong> e usar o chat por voz e vídeo juntos!
            </p>
          </div>
        )}
      </div>

      {/* 3. Barra de Controles da Chamada (Fundo Flutuante) */}
      <div className="h-20 bg-[#111214] border-t border-[#2b2d31] flex items-center justify-center gap-4 px-6 shrink-0">
        {/* Toggle Microfone */}
        <button
          onClick={
            user?.isMinor
              ? () => alert('Recurso Protegido: O uso de microfone é desativado para contas de 10 a 17 anos por diretriz de segurança e proteção infantil.')
              : onToggleMic
          }
          className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition cursor-pointer ${
            user?.isMinor
              ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
              : isMicMuted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30'
              : 'bg-[#2b2d31] text-white hover:bg-[#35373c]'
          }`}
          title={
            user?.isMinor
              ? 'Microfone Desativado (Modo Protegido 10-17 anos)'
              : isMicMuted
              ? 'Desmutar Microfone'
              : 'Mutar Microfone'
          }
        >
          {user?.isMinor ? (
            <>
              <MicOff className="w-6 h-6 text-slate-500" />
              <Lock className="w-3 h-3 text-amber-400 absolute top-1.5 right-1.5" />
            </>
          ) : isMicMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
          <span className="text-[10px] font-medium mt-1">
            {user?.isMinor ? 'Protegido' : isMicMuted ? 'Mudo' : 'Microfone'}
          </span>
        </button>

        {/* Toggle Câmera */}
        <button
          onClick={
            user?.isMinor
              ? () => alert('Recurso Protegido: O uso de webcam/câmera é desativado para contas de 10 a 17 anos por diretriz de segurança e proteção infantil.')
              : onToggleVideo
          }
          className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition cursor-pointer ${
            user?.isMinor
              ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
              : isVideoOff
              ? 'bg-[#2b2d31] text-slate-400 hover:bg-[#35373c] hover:text-white'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/30'
          }`}
          title={
            user?.isMinor
              ? 'Webcam Desativada (Modo Protegido 10-17 anos)'
              : isVideoOff
              ? 'Ligar Câmera'
              : 'Desligar Câmera'
          }
        >
          {user?.isMinor ? (
            <>
              <VideoOff className="w-6 h-6 text-slate-500" />
              <Lock className="w-3 h-3 text-amber-400 absolute top-1.5 right-1.5" />
            </>
          ) : isVideoOff ? (
            <VideoOff className="w-6 h-6" />
          ) : (
            <Video className="w-6 h-6" />
          )}
          <span className="text-[10px] font-medium mt-1">
            {user?.isMinor ? 'Protegido' : isVideoOff ? 'Câmera Off' : 'Câmera On'}
          </span>
        </button>

        {/* Compartilhar Tela */}
        <button
          onClick={
            user?.isMinor
              ? () => alert('Recurso Protegido: Compartilhamento de tela é desativado para contas de 10 a 17 anos por diretriz de segurança infantil.')
              : toggleScreenShare
          }
          className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition cursor-pointer ${
            user?.isMinor
              ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
              : isScreenSharing
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#2b2d31] text-slate-300 hover:bg-[#35373c]'
          }`}
          title={
            user?.isMinor
              ? 'Compartilhamento de Tela Desativado (Modo Protegido 10-17 anos)'
              : isScreenSharing
              ? 'Parar Compartilhamento'
              : 'Compartilhar Tela'
          }
        >
          <Monitor className="w-6 h-6" />
          {user?.isMinor && (
            <Lock className="w-3 h-3 text-amber-400 absolute top-1.5 right-1.5" />
          )}
          <span className="text-[10px] font-medium mt-1">
            {user?.isMinor ? 'Protegido' : isScreenSharing ? 'Compartilhando' : 'Tela'}
          </span>
        </button>

        {/* Desconectar Chamada */}
        <button
          onClick={onLeave}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition cursor-pointer ml-4"
          title="Desconectar da Chamada de Voz & Vídeo"
        >
          <PhoneOff className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">Sair</span>
        </button>
      </div>
    </div>
  );
}
