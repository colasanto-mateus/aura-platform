const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const nodemailer = require('nodemailer');
const { getDB, saveDB } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'aura_platform_secret_key_2026';
const PORT = parseInt(process.env.PORT || '8080', 10);

const app = express();
app.use(cors());
app.use(express.json());

// Transporter Nodemailer (configurável via variáveis de ambiente)
let mailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendVerificationEmail(email, code) {
  const mailSubject = `${code} é seu código de verificação do Aura`;
  const mailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1e1f22; color: #dbdee1; padding: 32px; border-radius: 12px; max-width: 480px; margin: auto;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; margin: 0; font-size: 26px; letter-spacing: -0.5px;">AURA</h1>
        <p style="color: #949ba4; font-size: 13px; margin-top: 4px;">Sua voz, sua imagem, sua identidade</p>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #ffffff;">Olá,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #dbdee1;">Obrigado por criar sua conta no <strong>Aura</strong>! Para garantir a segurança e evitar bots, insira o código de 6 dígitos abaixo na tela de confirmação:</p>
      <div style="background-color: #2b2d31; border: 2px solid #6366f1; border-radius: 10px; padding: 18px; text-align: center; margin: 28px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace;">${code}</span>
      </div>
      <p style="font-size: 12px; color: #949ba4; line-height: 1.4;">Este código é válido por <strong>15 minutos</strong>. Se você não realizou esta solicitação, nenhuma ação adicional é necessária.</p>
    </div>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || '"Aura Segurança" <noreply@aura.app>',
        to: email,
        subject: mailSubject,
        html: mailHtml
      });
      console.log(`[E-mail Enviado] Código ${code} enviado para ${email}`);
    } catch (err) {
      console.error('[Erro E-mail SMTP]', err);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[Aura E-mail] Código de Confirmação para ${email}: ${code}`);
    console.log(`======================================================\n`);
  }
}

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
// ROTAS DE AUTENTICAÇÃO COM ALTA SEGURANÇA
// ==========================================

// 1. Etapa 1 do Cadastro: Validação dos dados + Captcha + Envio do Código por E-mail
app.post('/api/auth/register-init', (req, res) => {
  const { email, displayName, username, password, birthDate, captchaVerified } = req.body;

  // Validação do Captcha Anti-Bot
  if (!captchaVerified) {
    return res.status(400).json({ error: 'Verificação humana (Captcha) obrigatória para evitar robôs.' });
  }

  // Validação dos Campos Obrigatórios
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (E-mail, Usuário e Senha).' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  // Validação de formato de e-mail básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Por favor, insira um endereço de e-mail válido.' });
  }

  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'O nome de usuário deve ter no mínimo 3 caracteres.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
  }

  const db = getDB();

  // Verifica se o usuário ou e-mail já existe
  const existingUser = db.users.find(
    (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (existingUser) {
    return res.status(409).json({ error: 'Este e-mail ou nome de usuário já está cadastrado no Aura.' });
  }

  // Gera código numérico de 6 dígitos
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Criptografa senha com salt seguro
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Armazena cadastro pendente com expiração em 15 minutos
  if (!db.pendingRegistrations) db.pendingRegistrations = [];

  // Remove tentativas antigas do mesmo e-mail
  db.pendingRegistrations = db.pendingRegistrations.filter((p) => p.email !== cleanEmail);

  db.pendingRegistrations.push({
    email: cleanEmail,
    displayName: displayName ? displayName.trim() : cleanUsername,
    username: cleanUsername,
    passwordHash,
    birthDate: birthDate || null,
    code: verificationCode,
    expiresAt: Date.now() + 15 * 60 * 1000
  });

  saveDB(db);

  // Envia e-mail de confirmação
  sendVerificationEmail(cleanEmail, verificationCode);

  return res.json({
    success: true,
    message: `Código de verificação enviado para ${cleanEmail}!`,
    email: cleanEmail,
    devCode: verificationCode // Fornece o código no retorno para caso o servidor SMTP ainda não esteja configurado
  });
});

// 2. Etapa 2 do Cadastro: Confirmação do Código de 6 Dígitos do E-mail
app.post('/api/auth/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'E-mail e código de verificação são obrigatórios.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const db = getDB();
  if (!db.pendingRegistrations) db.pendingRegistrations = [];

  const pending = db.pendingRegistrations.find((p) => p.email === cleanEmail);

  if (!pending) {
    return res.status(404).json({ error: 'Nenhum cadastro pendente encontrado para este e-mail. Inicie o cadastro novamente.' });
  }

  if (Date.now() > pending.expiresAt) {
    db.pendingRegistrations = db.pendingRegistrations.filter((p) => p.email !== cleanEmail);
    saveDB(db);
    return res.status(400).json({ error: 'O código de verificação expirou. Solicite um novo código.' });
  }

  if (pending.code !== cleanCode) {
    return res.status(400).json({ error: 'Código de verificação incorreto. Verifique os 6 dígitos recebidos.' });
  }

  // Criação oficial do usuário confirmado
  const newUser = {
    id: uuidv4(),
    email: pending.email,
    displayName: pending.displayName,
    username: pending.username,
    passwordHash: pending.passwordHash,
    birthDate: pending.birthDate,
    coins: 600, // Bônus de boas-vindas
    equippedAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pending.username)}&backgroundColor=1e1b4b`,
    borderEffect: 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    equippedBackground: '',
    equippedColor: 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]',
    equippedFont: "'Inter', sans-serif",
    emailVerified: true,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Registro de transação do bônus
  db.transactions.push({
    id: uuidv4(),
    userId: newUser.id,
    amount: 600,
    type: 'BONUS_CADASTRO',
    description: 'Bônus de boas-vindas para personalização Aura',
    createdAt: new Date().toISOString()
  });

  // Limpa pendência
  db.pendingRegistrations = db.pendingRegistrations.filter((p) => p.email !== cleanEmail);
  saveDB(db);

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, ...safeUser } = newUser;

  return res.status(201).json({
    success: true,
    message: 'Conta criada e e-mail confirmado com sucesso!',
    user: safeUser,
    token
  });
});

// 3. Reenviar código de confirmação
app.post('/api/auth/resend-code', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail obrigatório' });

  const cleanEmail = email.trim().toLowerCase();
  const db = getDB();
  const pending = db.pendingRegistrations.find((p) => p.email === cleanEmail);

  if (!pending) {
    return res.status(404).json({ error: 'Nenhum cadastro pendente para este e-mail.' });
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  pending.code = newCode;
  pending.expiresAt = Date.now() + 15 * 60 * 1000;
  saveDB(db);

  sendVerificationEmail(cleanEmail, newCode);

  return res.json({
    success: true,
    message: 'Novo código de verificação enviado!',
    devCode: newCode
  });
});

// Cadastro de usuário legado / compatibilidade direta
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

// Inicialização vinculada a 0.0.0.0 (obrigatório para Docker e Railway)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Aura principal rodando na porta ${PORT} em 0.0.0.0`);
  console.log(`📡 Acesse a plataforma no seu navegador: http://localhost:${PORT}`);
});

// Suporte duplo a portas (caso a Railway roteie para 4000 ou 8080)
if (PORT !== 4000) {
  try {
    const secondaryServer = http.createServer(app);
    io.attach(secondaryServer);
    secondaryServer.listen(4000, '0.0.0.0', () => {
      console.log(`🚀 Servidor Aura secundário também ativo na porta 4000 em 0.0.0.0`);
    });
  } catch (err) {
    console.warn('Aviso porta 4000 secundária:', err.message);
  }
}
