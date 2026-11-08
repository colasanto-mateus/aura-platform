import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import io from 'socket.io-client';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VoiceVideoPanel from './components/VoiceVideoPanel';
import StoreModal from './components/StoreModal';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import PaymentModal from './components/PaymentModal';
import AvatarStudioModal from './components/AvatarStudioModal';
import FocusModeModal from './components/FocusModeModal';

export default function App() {
  const { user, loading } = useAuth();

  // Canais e Estado do Chat
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  // Estado de Voz e Vídeo (WebRTC)
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true); // Começa com câmera desligada por padrão
  const [voiceParticipants, setVoiceParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  // Modais
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);

  // Refs de Comunicação
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const typingTimeoutRef = useRef(null);

  // 1. Inicializa o Socket.io
  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Conectado ao servidor Aura!');
    });

    // Receber nova mensagem no chat
    socket.on('new-message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Indicador de digitação
    socket.on('user-typing', ({ username }) => {
      setTypingUsers((prev) => (prev.includes(username) ? prev : [...prev, username]));
    });

    socket.on('user-stopped-typing', ({ username }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    });

    // --- SINAIS DE SALA DE VOZ E VÍDEO ---
    socket.on('voice-users-list', async ({ users, channelId }) => {
      setVoiceParticipants(users);
      // Para cada usuário já presente na sala, inicia oferta WebRTC
      users.forEach((p) => {
        createPeerOffer(p.socketId, socket);
      });
    });

    socket.on('voice-user-joined', (participant) => {
      setVoiceParticipants((prev) => {
        if (prev.some((p) => p.socketId === participant.socketId)) return prev;
        return [...prev, participant];
      });
    });

    socket.on('voice-user-left', ({ socketId }) => {
      setVoiceParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    socket.on('voice-user-mute-state', ({ socketId, isMuted }) => {
      setVoiceParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isMuted } : p))
      );
    });

    socket.on('voice-user-video-state', ({ socketId, isVideoOff }) => {
      setVoiceParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isVideoOff } : p))
      );
    });

    // Sinais WebRTC P2P
    socket.on('voice-signal-receive', async ({ signal, callerId, user: remoteUser }) => {
      const pc = getOrCreatePeerConnection(callerId, socket);
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice-signal-returning', { callerId, signal: answer });
    });

    socket.on('voice-signal-returned', async ({ signal, id }) => {
      const pc = peerConnectionsRef.current[id];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      }
    });

    socket.on('voice-ice-candidate-receive', async ({ candidate, sender }) => {
      const pc = peerConnectionsRef.current[sender];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Erro ao adicionar ICE:', err);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 2. Carrega lista de canais da API
  useEffect(() => {
    async function fetchChannels() {
      try {
        const res = await fetch('/api/channels');
        if (res.ok) {
          const data = await res.json();
          setChannels(data.channels || []);
          if (data.channels.length > 0 && !currentChannel) {
            // Seleciona o primeiro canal de texto por padrão
            const defaultChan = data.channels.find((c) => c.type === 'text') || data.channels[0];
            selectChannel(defaultChan);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar canais:', err);
      }
    }
    fetchChannels();
  }, []);

  // 3. Selecionar Canal (Texto ou Voz)
  async function selectChannel(channel) {
    if (!channel) return;

    if (channel.type === 'voice') {
      // Se clicou em canal de voz, conecta na conferência WebRTC
      joinVoiceChannel(channel);
    } else {
      // Canal de texto
      setCurrentChannel(channel);
      if (socketRef.current) {
        socketRef.current.emit('join-channel', channel.id);
      }
      try {
        const res = await fetch(`/api/channels/${channel.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
      }
    }
  }

  // 4. Entrar em Canal de Voz & Vídeo
  async function joinVoiceChannel(channel) {
    if (activeVoiceChannel?.id === channel.id) {
      setCurrentChannel(channel);
      return;
    }

    // Fecha conexão de voz anterior se houver
    leaveVoiceChannel();

    setActiveVoiceChannel(channel);
    setCurrentChannel(channel);

    // Solicita permissão para microfone e câmera
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      // Inicia com vídeo pausado por padrão até o usuário ligar a câmera explicitamente
      stream.getVideoTracks().forEach((track) => (track.enabled = false));
      setLocalStream(stream);
      setIsVideoOff(true);
      setIsMicMuted(false);
    } catch (err) {
      console.warn('Aviso: microfone ou webcam não disponíveis diretamente:', err);
      // Tenta apenas áudio
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(stream);
        setIsVideoOff(true);
        setIsMicMuted(false);
      } catch (e) {
        console.warn('Modo apenas espectador ativo.');
      }
    }

    if (socketRef.current) {
      socketRef.current.emit('voice-join', {
        channelId: channel.id,
        user: {
          id: user?.id,
          username: user?.username,
          equippedAvatar: user?.equippedAvatar,
          borderEffect: user?.borderEffect,
          equippedColor: user?.equippedColor,
          equippedFont: user?.equippedFont
        },
        isMuted: false,
        isVideoOff: true
      });
    }
  }

  // 5. Sair do Canal de Voz
  function leaveVoiceChannel() {
    if (activeVoiceChannel && socketRef.current) {
      socketRef.current.emit('voice-leave', { channelId: activeVoiceChannel.id });
    }
    // Para todas as tracks de áudio/vídeo locais
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    // Fecha peer connections
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};
    setRemoteStreams({});
    setVoiceParticipants([]);
    setActiveVoiceChannel(null);

    // Se estávamos visualizando a sala de voz, volta para o canal geral de texto
    if (currentChannel?.type === 'voice') {
      const defaultTextChannel = channels.find((c) => c.type === 'text');
      if (defaultTextChannel) selectChannel(defaultTextChannel);
    }
  }

  // 6. Configuração WebRTC Peer Connection (com suporte a STUN/TURN para Produção)
  function getOrCreatePeerConnection(peerSocketId, socket) {
    if (peerConnectionsRef.current[peerSocketId]) {
      return peerConnectionsRef.current[peerSocketId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    });

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice-ice-candidate', {
          target: peerSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [peerSocketId]: event.streams[0]
      }));
    };

    peerConnectionsRef.current[peerSocketId] = pc;
    return pc;
  }

  async function createPeerOffer(peerSocketId, socket) {
    const pc = getOrCreatePeerConnection(peerSocketId, socket);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('voice-signal-send', {
      userToSignal: peerSocketId,
      callerId: socket.id,
      signal: offer,
      user
    });
  }

  // 7. Controles de Mídia: Microfone e Câmera
  function handleToggleMic() {
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
    if (activeVoiceChannel && socketRef.current) {
      socketRef.current.emit('voice-mute-toggle', {
        channelId: activeVoiceChannel.id,
        isMuted: nextState
      });
    }
  }

  function handleToggleVideo() {
    const nextState = !isVideoOff;
    setIsVideoOff(nextState);
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
    if (activeVoiceChannel && socketRef.current) {
      socketRef.current.emit('voice-video-toggle', {
        channelId: activeVoiceChannel.id,
        isVideoOff: nextState
      });
    }
  }

  // 8. Envio de Mensagem no Chat
  function handleSendMessage(content) {
    if (!currentChannel || !socketRef.current || !user) return;
    socketRef.current.emit('send-message', {
      channelId: currentChannel.id,
      userId: user.id,
      content
    });
    // Limpa estado de digitação
    socketRef.current.emit('typing-stop', {
      channelId: currentChannel.id,
      username: user.username
    });
  }

  function handleTyping() {
    if (!currentChannel || !socketRef.current || !user) return;
    socketRef.current.emit('typing-start', {
      channelId: currentChannel.id,
      username: user.username
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing-stop', {
        channelId: currentChannel.id,
        username: user.username
      });
    }, 2500);
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1f22] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide font-orbitron">Carregando Aura...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1e1f22]">
      {/* Modal de Autenticação se não estiver logado */}
      <AuthModal isOpen={!user} />

      {/* Sidebar com Servidores, Canais e Perfil do Usuário */}
      <Sidebar
        channels={channels}
        currentChannel={currentChannel}
        onSelectChannel={selectChannel}
        activeVoiceChannel={activeVoiceChannel}
        onLeaveVoice={leaveVoiceChannel}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
        onOpenAvatarStudio={() => setIsAvatarStudioOpen(true)}
        onOpenPayment={() => setIsPaymentOpen(true)}
        isMicMuted={isMicMuted}
        onToggleMic={handleToggleMic}
        isVideoOff={isVideoOff}
        onToggleVideo={handleToggleVideo}
        voiceParticipants={voiceParticipants}
      />

      {/* Área Central: Painel de Voz/Vídeo OU Área de Chat de Texto */}
      {currentChannel?.type === 'voice' ? (
        <VoiceVideoPanel
          channel={currentChannel}
          onLeave={leaveVoiceChannel}
          isMicMuted={isMicMuted}
          onToggleMic={handleToggleMic}
          isVideoOff={isVideoOff}
          onToggleVideo={handleToggleVideo}
          voiceParticipants={voiceParticipants}
          localStream={localStream}
          remoteStreams={remoteStreams}
        />
      ) : (
        <ChatArea
          channel={currentChannel}
          messages={messages}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          typingUsers={typingUsers}
          onOpenStore={() => setIsStoreOpen(true)}
          onJoinVoice={(voiceChan) => selectChannel(voiceChan)}
        />
      )}

      {/* Modal da Loja de Cosméticos (Bonequinhos, Fundos, Cores e Letras) */}
      <StoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        onOpenAvatarStudio={() => setIsAvatarStudioOpen(true)}
      />

      {/* Modal de Checkout & Plataforma de Pagamento Segura (PIX / Cartão) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />

      {/* Estúdio de Criação de Avatar 3D (A partir de foto / customizador de trajes) */}
      <AvatarStudioModal
        isOpen={isAvatarStudioOpen}
        onClose={() => setIsAvatarStudioOpen(false)}
      />

      {/* Modo Foco & Pomodoro para Estudo / Trabalho */}
      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
      />

      {/* Modal de Perfil e Inventário */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenStore={() => setIsStoreOpen(true)}
      />
    </div>
  );
}
