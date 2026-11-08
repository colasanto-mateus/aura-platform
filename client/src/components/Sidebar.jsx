import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Hash,
  Volume2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ShoppingBag,
  User,
  LogOut,
  Sparkles,
  PhoneOff,
  Radio,
  Plus,
  Compass,
  Settings
} from 'lucide-react';

export default function Sidebar({
  channels,
  currentChannel,
  onSelectChannel,
  activeVoiceChannel,
  onLeaveVoice,
  onOpenStore,
  onOpenProfile,
  isMicMuted,
  onToggleMic,
  isVideoOff,
  onToggleVideo,
  voiceParticipants
}) {
  const { user, logout } = useAuth();

  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceChannels = channels.filter((c) => c.type === 'voice');

  return (
    <div className="flex h-screen bg-[#1e1f22] select-none">
      {/* 1. Trilho de Servidores (Extrema Esquerda) */}
      <div className="w-18 bg-[#1e1f22] flex flex-col items-center py-3 gap-2 border-r border-[#232428] shrink-0">
        {/* Botão Aura Principal */}
        <button
          title="Início - Comunidade Aura"
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 hover:rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/30 text-white cursor-pointer"
        >
          <span className="text-xl font-black tracking-tighter font-orbitron">A</span>
          <span className="absolute -left-1 w-1 h-8 bg-white rounded-r-full scale-100" />
        </button>

        <div className="w-8 h-[2px] bg-[#35363c] rounded-full my-1" />

        {/* Servidor Ativo */}
        <button
          title="Aura Lounge & Games"
          className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-[#313338] hover:bg-indigo-600 hover:rounded-xl transition-all duration-200 text-white group cursor-pointer"
        >
          <span className="text-sm font-bold font-orbitron">AU</span>
        </button>

        {/* Botão Adicionar */}
        <button
          title="Adicionar um Servidor"
          className="flex items-center justify-center w-12 h-12 rounded-3xl bg-[#313338] hover:bg-emerald-600 hover:rounded-xl transition-all duration-200 text-emerald-400 hover:text-white group cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Botão Loja no Trilho */}
        <button
          onClick={onOpenStore}
          title="Loja de Cosméticos e Avatares"
          className="relative flex items-center justify-center w-12 h-12 rounded-3xl bg-[#313338] hover:bg-gradient-to-tr hover:from-pink-500 hover:to-indigo-500 hover:rounded-xl transition-all duration-200 text-pink-400 hover:text-white group cursor-pointer mt-auto"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
        </button>
      </div>

      {/* 2. Barra Lateral de Canais (Aura Channels Sidebar) */}
      <div className="w-60 bg-[#2b2d31] flex flex-col justify-between border-r border-[#1f2023] shrink-0">
        {/* Topo: Nome do Servidor */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-[#1f2023] shadow-sm font-bold text-white hover:bg-[#35373c] transition cursor-pointer">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="truncate font-orbitron tracking-wide text-sm">Aura Universe</span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>

        {/* Lista de Canais */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Seção Texto */}
          <div>
            <div className="px-2 mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Canais de Texto</span>
            </div>
            <div className="space-y-0.5">
              {textChannels.map((c) => {
                const isActive = currentChannel?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectChannel(c)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-[#35373c] text-white shadow-sm'
                        : 'text-slate-400 hover:bg-[#35373c]/50 hover:text-slate-200'
                    }`}
                  >
                    <Hash className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção Voz e Câmera */}
          <div>
            <div className="px-2 mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Canais de Voz & Câmera</span>
            </div>
            <div className="space-y-0.5">
              {voiceChannels.map((c) => {
                const isInThisVoice = activeVoiceChannel?.id === c.id;
                const participantsInChannel = voiceParticipants || [];

                return (
                  <div key={c.id}>
                    <button
                      onClick={() => onSelectChannel(c)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                        isInThisVoice
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:bg-[#35373c]/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Volume2
                          className={`w-4 h-4 shrink-0 ${
                            isInThisVoice ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] bg-[#1e1f22]/70 px-1.5 py-0.5 rounded text-slate-300">
                        <Video className="w-3 h-3 text-cyan-400" />
                        <span>HD</span>
                      </div>
                    </button>

                    {/* Exibe participantes conectados se estiver nessa sala de voz */}
                    {isInThisVoice && (
                      <div className="pl-6 py-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-emerald-300">
                          <img
                            src={user?.equippedAvatar}
                            className={`w-4 h-4 rounded-full border ${user?.borderEffect || 'border-cyan-400'}`}
                            alt=""
                          />
                          <span className="truncate font-semibold">{user?.username} (Você)</span>
                        </div>
                        {participantsInChannel.map((p, i) => (
                          <div key={p.socketId || i} className="flex items-center gap-2 text-xs text-slate-300">
                            <img
                              src={p.user?.equippedAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                              className={`w-4 h-4 rounded-full border ${p.user?.borderEffect || 'border-slate-500'}`}
                              alt=""
                            />
                            <span className="truncate">{p.user?.username || 'Conectado'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Painel de Conexão de Voz Ativa (Se Conectado) */}
        {activeVoiceChannel && (
          <div className="bg-[#111214] p-2.5 border-t border-[#1f2023] flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-emerald-400 leading-tight">Voz Conectada</div>
                <div className="text-[11px] text-slate-400 truncate">{activeVoiceChannel.name}</div>
              </div>
            </div>
            <button
              onClick={onLeaveVoice}
              title="Desconectar da Voz"
              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4. Rodapé do Usuário (Painel de Perfil Aura) */}
        <div className="bg-[#232428] px-2.5 py-2 flex items-center justify-between border-t border-[#1f2023]">
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2 flex-1 min-w-0 mr-1 p-1 rounded-lg hover:bg-[#35373c] transition cursor-pointer group"
          >
            <div className="relative shrink-0">
              <img
                src={user?.equippedAvatar}
                alt={user?.username}
                className={`w-9 h-9 rounded-full bg-slate-900 object-cover border-2 ${
                  user?.borderEffect || 'border-cyan-400'
                }`}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#232428]" />
            </div>

            <div className="truncate flex-1">
              <div
                className={`text-xs font-bold truncate ${user?.equippedColor || 'text-white'}`}
                style={{ fontFamily: user?.equippedFont || 'inherit' }}
              >
                {user?.username}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{user?.coins ?? 0} moedas</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex items-center gap-0.5 text-slate-400">
            {/* Mic */}
            <button
              onClick={onToggleMic}
              title={isMicMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                isMicMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                  : 'hover:bg-[#35373c] hover:text-white'
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Vídeo */}
            <button
              onClick={onToggleVideo}
              title={isVideoOff ? 'Ligar Câmera' : 'Desligar Câmera'}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                isVideoOff
                  ? 'hover:bg-[#35373c] hover:text-white text-slate-400'
                  : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>

            {/* Loja */}
            <button
              onClick={onOpenStore}
              title="Abrir Loja de Bonequinhos & Cosméticos"
              className="p-1.5 rounded-md hover:bg-[#35373c] hover:text-amber-400 transition cursor-pointer text-amber-400/90"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title="Desconectar Conta"
              className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer text-slate-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
