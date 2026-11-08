import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Hash,
  Send,
  Smile,
  PlusCircle,
  Sparkles,
  ShoppingBag,
  Volume2,
  Video
} from 'lucide-react';

export default function ChatArea({
  channel,
  messages,
  onSendMessage,
  onTyping,
  typingUsers,
  onOpenStore,
  onJoinVoice
}) {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  const emojis = ['🔥', '✨', '🚀', '🎮', '👾', '💎', '👑', '🎉', '🤖', '💜', '⚡', '😎'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  }

  function handleInputChange(e) {
    setInputText(e.target.value);
    onTyping();
  }

  function addEmoji(emoji) {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#313338] relative overflow-hidden">
      {/* Fundo Personalizado do Usuário (Se Equipado) */}
      {user?.equippedBackground && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${user.equippedBackground})` }}
        />
      )}

      {/* 1. Header do Canal */}
      <div className="h-12 px-6 flex items-center justify-between border-b border-[#232428] bg-[#313338]/90 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Hash className="w-6 h-6 text-slate-400" />
          <h3 className="font-bold text-white text-base tracking-wide">{channel?.name}</h3>
          <span className="text-xs text-slate-400 ml-2 hidden sm:inline border-l border-slate-700 pl-3">
            {channel?.description || 'Canal de comunicação'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão Atalho para Loja */}
          <button
            onClick={onOpenStore}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 text-pink-300 text-xs font-semibold rounded-full transition cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-pink-400" />
            <span>Loja de Avatares & Cores</span>
          </button>
        </div>
      </div>

      {/* 2. Lista de Mensagens */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 z-10">
        {/* Banner de Boas-Vindas do Canal */}
        <div className="pt-6 pb-4 border-b border-slate-700/50 mb-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-indigo-400 shadow-inner">
            <Hash className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-white">Boas-vindas a #{channel?.name}!</h2>
          <p className="text-sm text-slate-400 mt-1">
            Este é o início do canal #{channel?.name}. Converse com seus amigos, personalize seus textos e mostre seus cosméticos!
          </p>
        </div>

        {/* Mensagens Renderizadas */}
        {messages.map((m) => {
          const isMe = m.userId === user?.id;
          return (
            <div
              key={m.id}
              className="flex items-start gap-4 p-2 -mx-2 rounded-lg hover:bg-[#2b2d31]/50 transition group"
            >
              {/* Avatar do Autor com Borda Personalizada da Loja */}
              <div className="relative shrink-0 mt-0.5">
                <img
                  src={m.userAvatar}
                  alt={m.username}
                  className={`w-10 h-10 rounded-full bg-slate-900 object-cover border-2 shadow-sm ${
                    m.borderEffect || 'border-slate-600'
                  }`}
                />
              </div>

              {/* Conteúdo da Mensagem */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-semibold text-sm cursor-pointer hover:underline ${
                      m.userColor || 'text-white'
                    }`}
                    style={{ fontFamily: m.userFont || 'inherit' }}
                  >
                    {m.username}
                  </span>

                  {isMe && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-medium">
                      Você
                    </span>
                  )}

                  <span className="text-[11px] text-slate-500">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Texto da mensagem renderizado na fonte estilizada */}
                <p
                  className="text-sm text-slate-200 mt-1 break-words select-text"
                  style={{ fontFamily: m.userFont || 'inherit' }}
                >
                  {m.content}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Indicador de Digitação */}
      <div className="h-5 px-6 text-xs text-slate-400 italic flex items-center z-10 shrink-0">
        {typingUsers && typingUsers.length > 0 && (
          <span className="flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'estão digitando...' : 'está digitando...'}
          </span>
        )}
      </div>

      {/* 4. Barra de Envio de Mensagens */}
      <div className="px-6 pb-6 pt-1 z-10 shrink-0">
        <form
          onSubmit={handleSend}
          className="relative flex items-center bg-[#383a40] rounded-xl px-4 py-2.5 shadow-md border border-slate-700/60 focus-within:border-indigo-500/80 transition"
        >
          {/* Emojis Rápidos / Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded-full text-slate-400 hover:text-amber-300 transition cursor-pointer mr-2"
              title="Inserir Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Popover de Emojis */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 bg-[#2b2d31] border border-slate-700 rounded-xl p-2 shadow-2xl flex flex-wrap gap-2 w-48 z-50">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="text-lg hover:scale-125 transition cursor-pointer p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campo de Texto */}
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Conversar em #${channel?.name}...`}
            className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
            style={{ fontFamily: user?.equippedFont || 'inherit' }}
          />

          {/* Botão Enviar */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="ml-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white transition cursor-pointer"
            title="Enviar Mensagem (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
