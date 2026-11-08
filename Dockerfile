# ==========================================
# ESTÁGIO 1: Build do Frontend React (Vite)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /build/client

# Instala dependências do frontend
COPY client/package*.json ./
RUN npm install

# Copia código do cliente e compila
COPY client/ ./
RUN npm run build

# ==========================================
# ESTÁGIO 2: Servidor Node.js de Produção
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Instala apenas dependências de produção do backend
COPY package*.json ./
RUN npm install --omit=dev

# Copia código do servidor
COPY server/ ./server/

# Copia a build do frontend gerada no estágio 1
COPY --from=builder /build/client/dist ./client/dist

# Cria diretório para persistência de dados
RUN mkdir -p /app/server

# Expõe a porta 4000 para acesso HTTP, WebSocket e WebRTC Signaling
EXPOSE 4000

# Verificação de Saúde do Container (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-4000}/api/health || exit 1

# Comando de inicialização
CMD ["node", "server/index.js"]
