const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getDB, saveDB } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'aura_platform_secret_key_2026';
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de Saúde para Docker e Cloud Load Balancers
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'aura-communication-platform', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware de Autenticação JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido ou inválido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessão expirada ou token inválido' });
  }
}

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

// Cadastro de usuário
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Preencha nome de usuário, e-mail e senha' });
  }

  const db = getDB();
  const existingUser = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
  );

  if (existingUser) {
    return res.status(409).json({ error: 'Nome de usuário ou e-mail já cadastrado' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: uuidv4(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    coins: 600, // Bônus de boas-vindas para testar a loja!
    equippedAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}&backgroundColor=1e1b4b`,
    borderEffect: 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    equippedBackground: '',
    equippedColor: 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]',
    equippedFont: "'Inter', sans-serif",
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Registro de transação do bônus
  db.transactions.push({
    id: uuidv4(),
    userId: newUser.id,
    amount: 600,
    type: 'BONUS_CADASTRO',
    description: 'Bônus de boas-vindas para personalização',
    createdAt: new Date().toISOString()
  });

  saveDB(db);

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, ...safeUser } = newUser;

  return res.status(201).json({
    message: 'Conta criada com sucesso! Você ganhou 600 moedas de bônus.',
    user: safeUser,
    token
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Informe login (usuário ou e-mail) e senha' });
  }

  const db = getDB();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === login.toLowerCase() || u.username.toLowerCase() === login.toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, ...safeUser } = user;

  return res.json({
    message: 'Login realizado com sucesso',
    user: safeUser,
    token
  });
});

// Dados do usuário logado + inventário
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const db = getDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const userInventory = db.inventory.filter((inv) => inv.userId === req.userId);
  const ownedItemIds = userInventory.map((i) => i.itemId);
  const ownedItems = db.storeItems.filter((item) => ownedItemIds.includes(item.id));
  const userTransactions = db.transactions
    .filter((t) => t.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    user: safeUser,
    inventory: ownedItems,
    transactions: userTransactions
  });
});

// ==========================================
// ROTAS DE CANAIS E MENSAGENS
// ==========================================

// Lista todos os canais (texto e voz)
app.get('/api/channels', (req, res) => {
  const db = getDB();
  return res.json({ channels: db.channels });
});

// Mensagens de um canal
app.get('/api/channels/:id/messages', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const messages = db.messages
    .filter((m) => m.channelId === id)
    .slice(-100);
  return res.json({ messages });
});

// ==========================================
// ROTAS DA LOJA E INVENTÁRIO (COSMÉTICOS)
// ==========================================

// Listar catálogo da loja
app.get('/api/store/items', (req, res) => {
  const db = getDB();
  return res.json({ items: db.storeItems });
});

// Comprar item da loja
app.post('/api/store/buy', authMiddleware, (req, res) => {
  const { itemId } = req.body;
  const db = getDB();

  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const item = db.storeItems.find((i) => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item não encontrado na loja' });

  // Checa se já possui
  const alreadyOwns = db.inventory.some((inv) => inv.userId === req.userId && inv.itemId === itemId);
  if (alreadyOwns) {
    return res.status(400).json({ error: 'Você já possui este item em seu inventário' });
  }

  // Checa saldo de moedas
  if (user.coins < item.price) {
    return res.status(400).json({
      error: `Saldo insuficiente! Este item custa ${item.price} moedas e você tem ${user.coins} moedas. Recarregue suas moedas na loja!`
    });
  }

  // Deduz moedas e adiciona ao inventário
  user.coins -= item.price;
  db.inventory.push({
    id: uuidv4(),
    userId: req.userId,
    itemId: item.id,
    acquiredAt: new Date().toISOString()
  });

  db.transactions.push({
    id: uuidv4(),
    userId: req.userId,
    amount: -item.price,
    type: 'COMPRA_ITEM',
    description: `Compra do item: ${item.name}`,
    createdAt: new Date().toISOString()
  });

  saveDB(db);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    message: `Parabéns! Você adquiriu "${item.name}" por ${item.price} moedas.`,
    user: safeUser,
    item
  });
});

// Equipar item do inventário
app.post('/api/store/equip', authMiddleware, (req, res) => {
  const { itemId, action } = req.body; // action: 'equip' | 'unequip'
  const db = getDB();

  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  // Se for desequipar
  if (action === 'unequip') {
    const { category } = req.body;
    if (category === 'background') user.equippedBackground = '';
    if (category === 'color') user.equippedColor = 'text-slate-100';
    if (category === 'font') user.equippedFont = "'Inter', sans-serif";
    if (category === 'avatar') {
      user.equippedAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=1e1b4b`;
      user.borderEffect = 'border-cyan-400';
    }
    saveDB(db);
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ message: 'Item desequipado com sucesso', user: safeUser });
  }

  const item = db.storeItems.find((i) => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });

  // Valida posse
  const owns = db.inventory.some((inv) => inv.userId === req.userId && inv.itemId === itemId);
  if (!owns) {
    return res.status(403).json({ error: 'Você precisa comprar este item antes de equipar' });
  }

  // Aplica conforme categoria
  if (item.category === 'avatar') {
    user.equippedAvatar = item.assetValue;
    user.borderEffect = item.borderEffect || 'border-cyan-400';
  } else if (item.category === 'background') {
    user.equippedBackground = item.assetValue;
  } else if (item.category === 'color') {
    user.equippedColor = item.assetValue;
  } else if (item.category === 'font') {
    user.equippedFont = item.assetValue;
  }

  saveDB(db);
  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    message: `Item "${item.name}" equipado com sucesso!`,
    user: safeUser
  });
});

// Recarregar moedas (Simulação com PIX / Cartão)
app.post('/api/wallet/recharge', authMiddleware, (req, res) => {
  const { amount, method } = req.body;
  const numAmount = parseInt(amount, 10);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valor de recarga inválido' });
  }

  const db = getDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  user.coins += numAmount;

  db.transactions.push({
    id: uuidv4(),
    userId: req.userId,
    amount: numAmount,
    type: 'RECARGA_MOEDAS',
    description: `Recarga de moedas via ${method || 'PIX Instantâneo'}`,
    createdAt: new Date().toISOString()
  });

  saveDB(db);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    message: `Recarga de +${numAmount} moedas confirmada com sucesso via ${method || 'PIX'}!`,
    user: safeUser
  });
});

// ==========================================
// SOCKET.IO: CHAT EM TEMPO REAL & WEBRTC
// ==========================================

// Mapeamento de usuários conectados em salas de voz: { [channelId]: [ { socketId, user, isMuted, isVideoOff } ] }
const voiceRooms = {};

io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  // Entrar em canal de texto
  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
  });

  // Enviar mensagem de texto
  socket.on('send-message', (data) => {
    const { channelId, userId, content } = data;
    if (!channelId || !content || !content.trim()) return;

    const db = getDB();
    const user = db.users.find((u) => u.id === userId);

    const message = {
      id: uuidv4(),
      channelId,
      userId: user ? user.id : 'anon',
      username: user ? user.username : 'Convidado',
      content: content.trim(),
      userColor: user ? user.equippedColor : 'text-slate-100',
      userFont: user ? user.equippedFont : "'Inter', sans-serif",
      userAvatar: user
        ? user.equippedAvatar
        : 'https://api.dicebear.com/7.x/bottts/svg?seed=guest&backgroundColor=334155',
      borderEffect: user ? user.borderEffect : 'border-slate-500',
      createdAt: new Date().toISOString()
    };

    db.messages.push(message);
    saveDB(db);

    io.to(channelId).emit('new-message', message);
  });

  // Indicador de digitação
  socket.on('typing-start', ({ channelId, username }) => {
    socket.to(channelId).emit('user-typing', { username });
  });

  socket.on('typing-stop', ({ channelId, username }) => {
    socket.to(channelId).emit('user-stopped-typing', { username });
  });

  // --- WEBRTC / SALAS DE VOZ & VÍDEO ---
  socket.on('voice-join', ({ channelId, user, isMuted, isVideoOff }) => {
    if (!voiceRooms[channelId]) {
      voiceRooms[channelId] = [];
    }

    // Remove se já estava
    voiceRooms[channelId] = voiceRooms[channelId].filter((u) => u.socketId !== socket.id);

    const participant = {
      socketId: socket.id,
      user,
      isMuted: isMuted || false,
      isVideoOff: isVideoOff !== undefined ? isVideoOff : true
    };

    // Retorna todos os outros que já estavam na sala para o novo participante
    const existingUsers = voiceRooms[channelId].map((p) => ({
      socketId: p.socketId,
      user: p.user,
      isMuted: p.isMuted,
      isVideoOff: p.isVideoOff
    }));

    socket.emit('voice-users-list', { users: existingUsers, channelId });

    // Adiciona o novo e notifica os outros
    voiceRooms[channelId].push(participant);
    socket.join(`voice-${channelId}`);
    socket.to(`voice-${channelId}`).emit('voice-user-joined', participant);

    console.log(`[Voz] Usuário ${user.username} entrou na sala ${channelId}`);
  });

  // Sinalização WebRTC (Oferta de Conexão Peer-to-Peer)
  socket.on('voice-signal-send', ({ userToSignal, callerId, signal, user }) => {
    io.to(userToSignal).emit('voice-signal-receive', {
      signal,
      callerId,
      user
    });
  });

  // Resposta à Oferta de Conexão
  socket.on('voice-signal-returning', ({ callerId, signal }) => {
    io.to(callerId).emit('voice-signal-returned', {
      signal,
      id: socket.id
    });
  });

  // Candidato ICE
  socket.on('voice-ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('voice-ice-candidate-receive', {
      candidate,
      sender: socket.id
    });
  });

  // Atualizar estado de áudio (mudo / desmudo)
  socket.on('voice-mute-toggle', ({ channelId, isMuted }) => {
    if (voiceRooms[channelId]) {
      const p = voiceRooms[channelId].find((u) => u.socketId === socket.id);
      if (p) p.isMuted = isMuted;
    }
    socket.to(`voice-${channelId}`).emit('voice-user-mute-state', { socketId: socket.id, isMuted });
  });

  // Atualizar estado de vídeo (câmera on / off)
  socket.on('voice-video-toggle', ({ channelId, isVideoOff }) => {
    if (voiceRooms[channelId]) {
      const p = voiceRooms[channelId].find((u) => u.socketId === socket.id);
      if (p) p.isVideoOff = isVideoOff;
    }
    socket.to(`voice-${channelId}`).emit('voice-user-video-state', { socketId: socket.id, isVideoOff });
  });

  // Sair de sala de voz
  socket.on('voice-leave', ({ channelId }) => {
    if (voiceRooms[channelId]) {
      voiceRooms[channelId] = voiceRooms[channelId].filter((u) => u.socketId !== socket.id);
      socket.leave(`voice-${channelId}`);
      socket.to(`voice-${channelId}`).emit('voice-user-left', { socketId: socket.id });
    }
  });

  // Desconexão geral
  socket.on('disconnect', () => {
    for (const channelId in voiceRooms) {
      const wasInRoom = voiceRooms[channelId].some((u) => u.socketId === socket.id);
      if (wasInRoom) {
        voiceRooms[channelId] = voiceRooms[channelId].filter((u) => u.socketId !== socket.id);
        io.to(`voice-${channelId}`).emit('voice-user-left', { socketId: socket.id });
      }
    }
    console.log(`[Socket] Desconectado: ${socket.id}`);
  });
});

// Serve arquivos estáticos da build do cliente (React) se disponível
const clientDistPath = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Inicialização
server.listen(PORT, () => {
  console.log(`🚀 Servidor Aura rodando na porta ${PORT}`);
  console.log(`📡 Acesse a plataforma no seu navegador: http://localhost:${PORT}`);
});
