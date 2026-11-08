import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Camera,
  Upload,
  Check,
  X,
  Smile,
  Briefcase,
  Layers,
  Image as ImageIcon,
  RotateCcw,
  Zap,
  Download,
  AlertCircle
} from 'lucide-react';

export default function AvatarStudioModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { user, saveCustomAvatar } = useAuth();

  // Estados de customização
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [selectedGender, setSelectedGender] = useState('male'); // 'male' | 'female'
  const [selectedExpression, setSelectedExpression] = useState('happy'); // 'original' | 'happy' | 'focused' | 'shocked' | 'confident' | 'serious'
  const [selectedProfession, setSelectedProfession] = useState('lawyer'); // 'judge' | 'lawyer' | 'prosecutor' | 'police' | 'doctor' | 'dentist' | 'tech' | 'student'
  const [selectedBackground, setSelectedBackground] = useState('court'); // 'court' | 'clinic' | 'techhub' | 'library' | 'cosmic'
  const [selectedEffect, setSelectedEffect] = useState('border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.7)]');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Mapeamento de Expressões (como na interface do Media.io)
  const expressions = [
    { id: 'original', label: 'Original', icon: '👤', eyeType: 'default', mouthType: 'default' },
    { id: 'happy', label: 'Sorrindo (Happy)', icon: '😄', eyeType: 'happy', mouthType: 'smile' },
    { id: 'focused', label: 'Focado / Analítico', icon: '🧐', eyeType: 'squint', mouthType: 'serious' },
    { id: 'shocked', label: 'Surpreso (Shocked)', icon: '😮', eyeType: 'surprised', mouthType: 'screaming' },
    { id: 'confident', label: 'Confiante / Líder', icon: '😎', eyeType: 'hearts', mouthType: 'twinkle' },
    { id: 'serious', label: 'Sério / Firme', icon: '😐', eyeType: 'side', mouthType: 'default' }
  ];

  // Profissões Temáticas (Direito, Saúde, Tech, Concursos)
  const professions = [
    {
      id: 'judge',
      label: 'Juiz(a) / Magistrado',
      icon: '⚖️',
      clothing: 'blazerAndSweater',
      clothesColor: '262e33',
      badge: 'Toga com Martelo da Justiça',
      glow: 'border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.8)]'
    },
    {
      id: 'lawyer',
      label: 'Advogado(a) Corporativo',
      icon: '👔',
      clothing: 'blazerAndShirt',
      clothesColor: '3c4f5e',
      badge: 'Terno Executivo & Pasta',
      glow: 'border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.7)]'
    },
    {
      id: 'prosecutor',
      label: 'Promotor(a) de Justiça',
      icon: '🏛️',
      clothing: 'blazerAndShirt',
      clothesColor: '25557c',
      badge: 'Ministério Público',
      glow: 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.7)]'
    },
    {
      id: 'police',
      label: 'Delegado(a) de Polícia',
      icon: '🚓',
      clothing: 'collarAndSweater',
      clothesColor: '262e33',
      badge: 'Distintivo Dourado no Peito',
      glow: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.75)]'
    },
    {
      id: 'doctor',
      label: 'Médico(a) Especialista',
      icon: '🩺',
      clothing: 'overall',
      clothesColor: 'ffffff',
      badge: 'Jaleco Cirúrgico & Estetoscópio',
      glow: 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.75)]'
    },
    {
      id: 'dentist',
      label: 'Cirurgião(ã) Dentista',
      icon: '🦷',
      clothing: 'collarAndSweater',
      clothesColor: '65c9ff',
      badge: 'Traje Clínico Ciano',
      glow: 'border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.7)]'
    },
    {
      id: 'tech',
      label: 'Dev Lead / Cyber Hacker',
      icon: '💻',
      clothing: 'hoodie',
      clothesColor: '1f2937',
      badge: 'Moletom Dark & Matriz de Código',
      glow: 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.75)]'
    },
    {
      id: 'student',
      label: 'Estudante & Concurseiro',
      icon: '📚',
      clothing: 'graphicShirt',
      clothesColor: '4f46e5',
      badge: 'Café Expresso & Fone de Foco',
      glow: 'border-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.7)]'
    }
  ];

  // Cenários / Fundos
  const backgrounds = [
    { id: 'court', label: 'Tribunal de Justiça', color: 'from-amber-950/70 to-slate-900', img: '⚖️' },
    { id: 'clinic', label: 'Clínica & Hospital', color: 'from-cyan-950/70 to-slate-900', img: '🩺' },
    { id: 'techhub', label: 'Setup Tech & Data Center', color: 'from-emerald-950/70 to-slate-900', img: '💻' },
    { id: 'library', label: 'Biblioteca Universitária', color: 'from-stone-900 to-amber-950/40', img: '📚' },
    { id: 'cosmic', label: 'Aura Cósmica Neon', color: 'from-indigo-950/80 to-purple-950/80', img: '🌌' }
  ];

  // Gera URL do Avatar renderizado com Dicebear 3D Personas
  function generateRenderedAvatarUrl() {
    const prof = professions.find((p) => p.id === selectedProfession) || professions[0];
    const expr = expressions.find((e) => e.id === selectedExpression) || expressions[0];
    const seedBase = photoPreview ? 'UserUploadedPhotoAura' : (user?.username || 'AuraCreator');

    const topHair = selectedGender === 'female' ? 'longCurly' : 'shortFlat';

    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seedBase)}_${selectedProfession}_${selectedExpression}&clothing=${prof.clothing}&clothesColor=${prof.clothesColor}&top=${topHair}&eyes=${expr.eyeType}&mouth=${expr.mouthType}&accessories=${selectedProfession === 'lawyer' || selectedProfession === 'student' ? 'round' : 'none'}`;
  }

  // Upload e Conversão da Foto do Usuário
  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, envie um arquivo de imagem válido (JPG ou PNG).');
      return;
    }

    setError('');
    setIsProcessingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
      // Simula algoritmo de IA estilizando a face para 3D Pixar
      setTimeout(() => {
        setIsProcessingPhoto(false);
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 }
        });
      }, 1200);
    };
    reader.readAsDataURL(file);
  }

  // Salvar e Equipar Avatar
  async function handleSaveAvatar() {
    setError('');
    setSaving(true);
    const finalAvatarUrl = generateRenderedAvatarUrl();
    const prof = professions.find((p) => p.id === selectedProfession);

    try {
      await saveCustomAvatar(finalAvatarUrl, {
        gender: selectedGender,
        expression: selectedExpression,
        profession: selectedProfession,
        background: selectedBackground,
        badge: prof?.badge
      }, prof?.glow || selectedEffect);

      setSavedSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Erro ao salvar avatar.');
    } finally {
      setSaving(false);
    }
  }

  const currentAvatarUrl = generateRenderedAvatarUrl();
  const currentProf = professions.find((p) => p.id === selectedProfession);
  const currentBg = backgrounds.find((b) => b.id === selectedBackground);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-[920px] bg-[#0c0d15] border border-cyan-500/30 rounded-3xl shadow-[0_0_80px_rgba(34,211,238,0.2)] p-6 sm:p-8 text-white z-10 animate-in zoom-in-95 my-auto">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[2px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0c0d15] rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-orbitron tracking-wide text-white">
              ESTÚDIO DE AVATAR 3D AURA
            </h2>
            <p className="text-xs text-slate-400">
              Transforme sua imagem em um bonequinho 3D estilizado com trajes profissionais e expressões
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ======================================================== */}
          {/* COLUNA ESQUERDA: PREVIEW ANIMADO DO AVATAR 3D */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between p-5 rounded-3xl bg-[#121422] border border-slate-800 relative overflow-hidden shadow-inner">
            {/* Fundo do Avatar */}
            <div className={`absolute inset-0 bg-gradient-to-b ${currentBg?.color} opacity-40 pointer-events-none transition-all duration-500`} />

            {/* Tag do Traje */}
            <div className="relative z-10 w-full flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-slate-700/60">
              <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                <span>{currentProf?.icon}</span>
                <span>{currentProf?.label}</span>
              </span>
              <span className="text-[10px] uppercase font-mono bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-cyan-300">
                3D ANIMADO
              </span>
            </div>

            {/* Bonequinho Renderizado (com animação de respiração / breathe) */}
            <div className="relative z-10 my-6 flex flex-col items-center">
              <div className="relative group">
                {/* Efeito de Aura Luminosa */}
                <div className={`absolute -inset-2 rounded-full opacity-70 blur-md ${currentProf?.glow} animate-pulse`} />

                <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-cyan-400/80 bg-slate-900 shadow-2xl flex items-center justify-center">
                  {isProcessingPhoto ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[11px] text-cyan-300 font-bold animate-pulse">
                        Estilizando face em 3D Pixar...
                      </span>
                    </div>
                  ) : (
                    <img
                      src={currentAvatarUrl}
                      alt="Avatar 3D Preview"
                      className="w-full h-full object-cover animate-[bounce_4s_infinite_ease-in-out] hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>

                {/* Badge de Expressão */}
                <div className="absolute bottom-1 right-2 bg-[#0c0d15] border border-cyan-400/60 text-base p-1.5 rounded-full shadow-lg">
                  {expressions.find((e) => e.id === selectedExpression)?.icon}
                </div>
              </div>

              <div className="mt-4 text-center">
                <div className="text-sm font-bold text-white font-orbitron">{user?.displayName || user?.username}</div>
                <div className="text-[11px] text-cyan-400/90 font-mono mt-0.5">{currentProf?.badge}</div>
              </div>
            </div>

            {/* Upload de Foto / Selfie (Igual ao Media.io) */}
            <div className="relative z-10 w-full pt-3 border-t border-slate-700/60">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 bg-[#1a1c2e] hover:bg-[#23263d] border border-cyan-500/40 text-cyan-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{photoPreview ? 'Trocar Minha Foto' : 'Enviar Minha Foto (Estilizar em 3D)'}</span>
              </button>

              {photoPreview && (
                <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-400 px-1">
                  <span>Foto carregada com sucesso!</span>
                  <button
                    onClick={() => setPhotoPreview(null)}
                    className="text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUNA DIREITA: PERSONALIZADOR (ROUPAS, EXPRESSÕES, FUNDO) */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            {/* 1. Seleção de Expressão (como na imagem do Media.io) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-cyan-400" />
                <span>Expressão Facial do Avatar</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {expressions.map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setSelectedExpression(exp.id)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      selectedExpression === exp.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/15'
                        : 'bg-[#151726] border-slate-700/80 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-xl">{exp.icon}</span>
                    <span className="text-[10px] font-semibold truncate w-full">{exp.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Traje Profissional & Carreira */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Profissão & Traje Temático</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[170px] overflow-y-auto pr-1">
                {professions.map((prof) => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setSelectedProfession(prof.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedProfession === prof.id
                        ? 'bg-gradient-to-r from-indigo-900/60 to-purple-900/50 border-cyan-400 text-white shadow-md'
                        : 'bg-[#151726] border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    <span className="text-xl shrink-0">{prof.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{prof.label}</div>
                      <div className="text-[9px] text-slate-400 truncate">{prof.badge}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Cenário & Fundo de Trabalho/Estudos */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Cenário de Fundo</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setSelectedBackground(bg.id)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      selectedBackground === bg.id
                        ? 'bg-purple-600/20 border-purple-400 text-purple-200 shadow-md'
                        : 'bg-[#151726] border-slate-700/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{bg.img}</span>
                    <span className="text-[10px] font-bold truncate w-full">{bg.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Gênero / Base */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#151726] border border-slate-700/80">
              <span className="text-xs font-bold text-slate-300">Base do Bonequinho:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGender('male')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedGender === 'male' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Masculino
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGender('female')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedGender === 'female' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Feminino
                </button>
              </div>
            </div>

            {/* Botão de Salvar e Equipar */}
            <button
              onClick={handleSaveAvatar}
              disabled={saving || savedSuccess}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando e aplicando no seu perfil...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>Avatar 3D Equipado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Salvar e Equipar Meu Avatar 3D</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
