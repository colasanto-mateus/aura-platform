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
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : parseInt(process.env.SMTP_PORT || '465', 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('📧 Serviço de E-mail SMTP configurado com sucesso!');
} else {
  console.log('⚠️ Variáveis SMTP não configuradas. Configure SMTP_HOST, SMTP_USER e SMTP_PASS nas variáveis da Railway para envio real à caixa de entrada.');
}

async function sendVerificationEmail(email, code) {
  const mailSubject = `Seu código de verificação Aura: ${code}`;
  const mailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e2e8f0; margin: 0; padding: 40px 20px; }
        .card { max-width: 480px; margin: 0 auto; background: #13141f; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; padding: 36px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); text-align: center; }
        .logo { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #818cf8; margin-bottom: 6px; }
        .tagline { font-size: 13px; color: #94a3b8; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 28px; }
        .code-box { background: #1e1b4b; border: 2px solid #6366f1; border-radius: 12px; padding: 18px; margin: 24px 0; display: inline-block; width: 80%; }
        .code { font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; font-family: monospace; }
        .footer { font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">AURA</div>
        <div class="tagline">Sua voz, sua imagem, sua identidade</div>
        <div class="title">Confirme seu endereço de e-mail</div>
        <div class="text">
          Obrigado por criar sua conta no <strong>Aura</strong>. Para garantir a segurança da sua conta e proteger a comunidade contra contas automatizadas, insira o código abaixo no aplicativo:
        </div>
        <div class="code-box">
          <span class="code">${code}</span>
        </div>
        <div class="footer">
          Este código expira em <strong>15 minutos</strong>.<br>
          Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || `"Aura Segurança" <${process.env.SMTP_USER}>`,
        to: email,
        subject: mailSubject,
        html: mailHtml
      });
      console.log(`[E-mail Enviado com Sucesso] Código enviado para a caixa de entrada de ${email}`);
    } catch (err) {
      console.error('[Falha no Envio de E-mail SMTP]', err);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[Aura Notificação] Código enviado para ${email}: ${code}`);
    console.log(`[Aura Aviso] Para que o e-mail chegue diretamente à caixa de entrada do usuário em produção, adicione SMTP_HOST, SMTP_USER e SMTP_PASS nas variáveis da Railway.`);
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
    message: `Código de verificação enviado para o seu e-mail: ${cleanEmail}`,
    email: cleanEmail
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
    message: 'Novo código de verificação enviado para o seu e-mail!'
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

// ==========================================
// ROTAS DE PAGAMENTO & CHECKOUT SEGURO
// ==========================================

const COIN_PACKS = {
  pack_500: { id: 'pack_500', name: 'Pacote Básico', coins: 500, bonus: 0, priceBRL: 9.90, desc: 'Ideal para desbloquear bonequinhos ou fundos' },
  pack_1500: { id: 'pack_1500', name: 'Pacote Profissional (Mais Popular)', coins: 1500, bonus: 250, priceBRL: 24.90, desc: 'Bônus de +250 moedas! Ideal para avatares de carreiras' },
  pack_3500: { id: 'pack_3500', name: 'Pacote Elite Produtiva', coins: 3500, bonus: 700, priceBRL: 49.90, desc: 'Bônus de +700 moedas! Acesso a togas, jalecos e fundos 3D' },
  pack_8000: { id: 'pack_8000', name: 'Pacote Master Corporativo', coins: 8000, bonus: 2000, priceBRL: 99.90, desc: 'Bônus de +2.000 moedas! Poder total para customizações' }
};

// 1. Criar Ordem de Pagamento (PIX / Cartão)
app.post('/api/payment/create-order', authMiddleware, (req, res) => {
  const { packId, method } = req.body;
  const pack = COIN_PACKS[packId];
  if (!pack) {
    return res.status(400).json({ error: 'Pacote de moedas inválido' });
  }

  const db = getDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const orderId = `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalCoins = pack.coins + pack.bonus;
  const priceFormatted = pack.priceBRL.toFixed(2);

  // Gera chave e código PIX EMV Copia e Cola
  const pixKey = `pagamentos@aura.app`;
  const pixCode = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${priceFormatted}5802BR5917AURA PLATAFORMA6009SAO PAULO62140510${orderId}6304B7A9`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`;

  const order = {
    orderId,
    userId: user.id,
    packId: pack.id,
    packName: pack.name,
    totalCoins,
    priceBRL: pack.priceBRL,
    method: method || 'PIX',
    pixCode,
    qrCodeUrl,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 15 * 60 * 1000
  };

  if (!db.paymentOrders) db.paymentOrders = [];
  db.paymentOrders.push(order);
  saveDB(db);

  return res.json({
    success: true,
    order: {
      orderId,
      pack,
      totalCoins,
      priceBRL: pack.priceBRL,
      method: method || 'PIX',
      pixCode,
      qrCodeUrl,
      expiresAt: order.expiresAt
    }
  });
});

// 2. Confirmar Pagamento da Ordem (Simulação bancária / Webhook BACEN)
app.post('/api/payment/confirm-order', authMiddleware, (req, res) => {
  const { orderId } = req.body;
  const db = getDB();

  if (!db.paymentOrders) db.paymentOrders = [];
  const order = db.paymentOrders.find((o) => o.orderId === orderId && o.userId === req.userId);

  if (!order) {
    return res.status(404).json({ error: 'Ordem de pagamento não encontrada' });
  }

  if (order.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Este pagamento já foi aprovado e creditado anteriormente' });
  }

  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  // Credita as moedas
  user.coins += order.totalCoins;
  order.status = 'COMPLETED';
  order.completedAt = new Date().toISOString();

  // Registra recibo fiscal nas transações
  db.transactions.push({
    id: uuidv4(),
    userId: user.id,
    amount: order.totalCoins,
    type: 'PAGAMENTO_CHECKOUT',
    description: `Recarga aprovada: ${order.packName} (R$ ${order.priceBRL.toFixed(2)}) - Ref: ${order.orderId}`,
    createdAt: new Date().toISOString()
  });

  saveDB(db);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    success: true,
    message: `Pagamento de R$ ${order.priceBRL.toFixed(2)} confirmado com sucesso! Foram adicionadas +${order.totalCoins} moedas à sua conta Aura.`,
    user: safeUser,
    receipt: {
      orderId: order.orderId,
      amountCoins: order.totalCoins,
      paidBRL: order.priceBRL,
      date: order.completedAt
    }
  });
});

// 3. Salvar Avatar 3D Customizado do Estúdio
app.post('/api/avatar/save-custom', authMiddleware, (req, res) => {
  const { avatarUrl, avatarConfig, animEffect } = req.body;
  if (!avatarUrl) {
    return res.status(400).json({ error: 'URL ou imagem do avatar não fornecida' });
  }

  const db = getDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  user.equippedAvatar = avatarUrl;
  user.avatarConfig = avatarConfig || null;
  if (animEffect) {
    user.borderEffect = animEffect;
  }

  saveDB(db);
  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    success: true,
    message: 'Avatar Aura 3D salvo e equipado com sucesso!',
    user: safeUser
  });
});

// 4. Modo Foco: Concluir Sessão & Resgatar Moedas de Produtividade
app.post('/api/focus/complete-session', authMiddleware, (req, res) => {
  const { durationMinutes, mode, topic } = req.body;
  const minutes = parseInt(durationMinutes, 10) || 25;

  // Gamificação: 25 min = 25 moedas; 50 min = 60 moedas; 15 min = 15 moedas
  let rewardCoins = Math.max(10, Math.floor(minutes * 1.1));
  if (minutes >= 50) rewardCoins = 60;

  const db = getDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  user.coins += rewardCoins;

  if (!db.focusSessions) db.focusSessions = [];
  const sessionRecord = {
    id: uuidv4(),
    userId: user.id,
    minutes,
    mode: mode || 'Pomodoro 25m',
    topic: topic || 'Sessão de Estudos & Trabalho',
    rewardCoins,
    completedAt: new Date().toISOString()
  };
  db.focusSessions.push(sessionRecord);

  db.transactions.push({
    id: uuidv4(),
    userId: user.id,
    amount: rewardCoins,
    type: 'RECOMPENSA_FOCO',
    description: `Recompensa por foco produtivo (${minutes} min): ${topic || 'Foco'}`,
    createdAt: new Date().toISOString()
  });

  saveDB(db);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    success: true,
    message: `Incrível! Você concluiu ${minutes} minutos de foco em "${topic || 'Sua meta'}" e conquistou +${rewardCoins} Moedas Aura!`,
    coinsEarned: rewardCoins,
    user: safeUser,
    session: sessionRecord
  });
});

// Recarregar moedas legado (Simulação com PIX / Cartão)
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
