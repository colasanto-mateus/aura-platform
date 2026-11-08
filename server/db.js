const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

// Default Seed Catalog
const DEFAULT_STORE_ITEMS = [
  // --- BONEQUINHOS / AVATARES ---
  {
    id: 'avatar_cyber_ninja',
    name: 'Ninja Cyberpunk',
    category: 'avatar',
    price: 150,
    description: 'Um guerreiro cibernético com máscara luminosa e katanas de plasma.',
    preview: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja&backgroundColor=1e1b4b',
    assetValue: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja&backgroundColor=1e1b4b',
    borderEffect: 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.7)]'
  },
  {
    id: 'avatar_mecha_robot',
    name: 'Mecha Titã X-01',
    category: 'avatar',
    price: 200,
    description: 'Armadura pesada mecânica de alta tecnologia com núcleo de energia azul.',
    preview: 'https://api.dicebear.com/7.x/bottts/svg?seed=MechaTitan&backgroundColor=0f172a',
    assetValue: 'https://api.dicebear.com/7.x/bottts/svg?seed=MechaTitan&backgroundColor=0f172a',
    borderEffect: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.7)]'
  },
  {
    id: 'avatar_cat_gamer',
    name: 'Gato Gamer Pro',
    category: 'avatar',
    price: 250,
    description: 'Felino com fone de ouvido gamer com orelhas luminosas e óculos pixel.',
    preview: 'https://api.dicebear.com/7.x/bottts/svg?seed=CatGamer&backgroundColor=ec4899',
    assetValue: 'https://api.dicebear.com/7.x/bottts/svg?seed=CatGamer&backgroundColor=ec4899',
    borderEffect: 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.7)]'
  },
  {
    id: 'avatar_anime_mage',
    name: 'Mago Cósmico',
    category: 'avatar',
    price: 300,
    description: 'Conjurador arcano das estrelas cercado por constelações brilhantes.',
    preview: 'https://api.dicebear.com/7.x/bottts/svg?seed=CosmicMage&backgroundColor=581c87',
    assetValue: 'https://api.dicebear.com/7.x/bottts/svg?seed=CosmicMage&backgroundColor=581c87',
    borderEffect: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.7)] animate-pulse'
  },
  {
    id: 'avatar_golden_king',
    name: 'Rei Dourado Imperial',
    category: 'avatar',
    price: 500,
    description: 'Coroa de ouro puro 24k com aura brilhante lendária de realeza.',
    preview: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoldKing&backgroundColor=78350f',
    assetValue: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoldKing&backgroundColor=78350f',
    borderEffect: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-bounce'
  },
  {
    id: 'avatar_pixel_knight',
    name: 'Cavaleiro 8-Bit',
    category: 'avatar',
    price: 120,
    description: 'Personagem retrô pixelizado com elmo de ferro clássico.',
    preview: 'https://api.dicebear.com/7.x/bottts/svg?seed=PixelKnight&backgroundColor=15803d',
    assetValue: 'https://api.dicebear.com/7.x/bottts/svg?seed=PixelKnight&backgroundColor=15803d',
    borderEffect: 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
  },

  // --- FUNDOS DE TELA (WALLPAPERS / BANNERS) ---
  {
    id: 'bg_neon_tokyo',
    name: 'Metrópole Cyberpunk',
    category: 'background',
    price: 180,
    description: 'Arranha-céus iluminados por neons sob uma chuva noturna cinematográfica.',
    preview: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80',
    assetValue: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'bg_deep_space',
    name: 'Nebulosa Infinita',
    category: 'background',
    price: 220,
    description: 'Imensidão galáctica com estrelas cadentes e poeira estelar cintilante.',
    preview: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80',
    assetValue: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'bg_synthwave_sunset',
    name: 'Pôr do Sol Synthwave',
    category: 'background',
    price: 200,
    description: 'Grade retro-futurista dos anos 80 com sol neon violeta e laranjas vibrantes.',
    preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    assetValue: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'bg_lofi_cozy',
    name: 'Quarto Lo-Fi Noturno',
    category: 'background',
    price: 160,
    description: 'Ambiente aconchegante com lâmpadas quentes, plantas e café fumegante.',
    preview: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
    assetValue: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'bg_matrix_rain',
    name: 'Fluxo Matrix Digital',
    category: 'background',
    price: 190,
    description: 'Cascata de caracteres verdes luminosos em fundo preto puro de hacker.',
    preview: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
    assetValue: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80'
  },

  // --- CORES & EFEITOS DE CHAT ---
  {
    id: 'color_cyber_cyan',
    name: 'Ciano Elétrico',
    category: 'color',
    price: 90,
    description: 'Destaque o seu nome e balão com um ciano de neon puro reluzente.',
    preview: '#06b6d4',
    assetValue: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
  },
  {
    id: 'color_neon_pink',
    name: 'Rosa Choque Cyber',
    category: 'color',
    price: 90,
    description: 'Cor rosa chiclete futurista com leve reflexo brilhante.',
    preview: '#ec4899',
    assetValue: 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]'
  },
  {
    id: 'color_gold_legendary',
    name: 'Ouro Lendário',
    category: 'color',
    price: 250,
    description: 'Gradiente dourado real com brilho radiante de prestígio.',
    preview: '#fbbf24',
    assetValue: 'text-amber-300 font-extrabold drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]'
  },
  {
    id: 'color_matrix_green',
    name: 'Verde Terminal Hacker',
    category: 'color',
    price: 90,
    description: 'Verde fosforescente de monitores CRT e terminais de comando.',
    preview: '#22c55e',
    assetValue: 'text-emerald-400 font-mono drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]'
  },
  {
    id: 'color_fire_blaze',
    name: 'Fogo Infernal',
    category: 'color',
    price: 150,
    description: 'Cor em chamas alaranjadas e vermelhas vibrantes.',
    preview: '#f97316',
    assetValue: 'text-orange-500 font-bold drop-shadow-[0_0_10px_rgba(249,115,22,0.9)]'
  },
  {
    id: 'color_deep_purple',
    name: 'Aura Violeta Noturna',
    category: 'color',
    price: 110,
    description: 'Roxo cósmico profundo de alta elegância.',
    preview: '#a855f7',
    assetValue: 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
  },

  // --- LETRAS & FONTES TIPOGRÁFICAS ---
  {
    id: 'font_orbitron',
    name: 'Orbitron Sci-Fi',
    category: 'font',
    price: 110,
    description: 'Tipografia futurista inspirada em interfaces espaciais e cibernéticas.',
    preview: 'Orbitron',
    assetValue: "'Orbitron', sans-serif"
  },
  {
    id: 'font_pixel',
    name: 'Press Start Pixel 8-Bit',
    category: 'font',
    price: 140,
    description: 'Fonte clássica dos fliperamas e jogos retro dos anos 90.',
    preview: 'Press Start 2P',
    assetValue: "'Press Start 2P', monospace"
  },
  {
    id: 'font_fira',
    name: 'Fira Code Hacker',
    category: 'font',
    price: 80,
    description: 'Fonte de código limpa com estilo moderno de desenvolvedor.',
    preview: 'Fira Code',
    assetValue: "'Fira Code', monospace"
  },
  {
    id: 'font_comfortaa',
    name: 'Comfortaa Suave',
    category: 'font',
    price: 70,
    description: 'Curvas suaves e arredondadas para um visual amigável e descontraído.',
    preview: 'Comfortaa',
    assetValue: "'Comfortaa', cursive"
  },
  {
    id: 'font_bungee',
    name: 'Bungee Comic Impact',
    category: 'font',
    price: 130,
    description: 'Letras pesadas e chamativas estilo história em quadrinhos urbana.',
    preview: 'Bungee',
    assetValue: "'Bungee', sans-serif"
  }
];

const DEFAULT_CHANNELS = [
  { id: 'canal-geral', name: 'geral', type: 'text', description: 'Canal de texto principal para conversar com a comunidade' },
  { id: 'canal-jogos', name: 'jogos-e-animes', type: 'text', description: 'Discussões de games, clipes e novidades' },
  { id: 'canal-musica', name: 'musica-e-memes', type: 'text', description: 'Compartilhe suas músicas e memes favoritos' },
  { id: 'voz-geral', name: 'Voz & Câmera Geral', type: 'voice', description: 'Canal de voz aberto com suporte a webcam' },
  { id: 'voz-jogando', name: 'Jogando Juntos', type: 'voice', description: 'Call para jogar e transmitir vídeo/áudio' },
  { id: 'voz-cinema', name: 'Cinema & Resenha', type: 'voice', description: 'Sala de conferência para assistir e bater papo' }
];

function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      pendingRegistrations: [],
      channels: DEFAULT_CHANNELS,
      messages: [
        {
          id: 'welcome-1',
          channelId: 'canal-geral',
          userId: 'system',
          username: 'Aura',
          content: 'Boas-vindas à comunidade Aura! Conecte-se com seus amigos em salas de voz e vídeo HD, participe dos canais de texto e explore a Loja de Customizações para desbloquear avatares exclusivos, fundos, cores e fontes.',
          userColor: 'text-indigo-400 font-bold drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]',
          userFont: "'Inter', sans-serif",
          userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AuraOfficial&backgroundColor=4f46e5',
          borderEffect: 'border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.7)]',
          createdAt: new Date().toISOString()
        }
      ],
      storeItems: DEFAULT_STORE_ITEMS,
      inventory: [],
      transactions: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (!data.pendingRegistrations) data.pendingRegistrations = [];
    return data;
  } catch (err) {
    console.error('Erro ao ler DB, recriando...', err);
    return null;
  }
}

function getDB() {
  return initDB();
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  getDB,
  saveDB,
  DEFAULT_STORE_ITEMS,
  DEFAULT_CHANNELS
};
