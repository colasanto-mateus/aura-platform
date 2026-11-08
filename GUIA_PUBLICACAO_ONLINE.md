# Guia Completo: Publicando a Plataforma Aura Online

Este guia explica, passo a passo, como colocar a plataforma **Aura** no ar na internet com suporte a conexões seguras HTTPS (obrigatório para microfone e câmera WebRTC), WebSockets persistentes e banco de dados.

---

## 📋 Pré-requisito Único: Subir o Projeto para o GitHub

Para fazer o deploy em qualquer serviço de nuvem moderna, o primeiro passo é criar um repositório no GitHub:

1. No terminal da pasta `discord_app`:
   ```bash
   git init
   git add .
   git commit -m "feat: lancamento inicial da plataforma Aura"
   ```
2. Crie um novo repositório no [GitHub.com](https://github.com/new) (pode ser Público ou Privado).
3. Conecte e envie o código:
   ```bash
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/aura-platform.git
   git push -u origin main
   ```

---

## 🚀 Método 1: Deploy com 1 Clique na Railway (Recomendado)

A **Railway** é a forma mais rápida de publicar aplicações com Docker e WebSockets, fornecendo automaticamente o certificado SSL HTTPS obrigatório.

1. Acesse **[railway.app](https://railway.app)** e faça login com sua conta do GitHub.
2. Clique em **`+ New Project`** -> **`Deploy from GitHub repo`**.
3. Selecione o repositório `aura-platform`.
4. A Railway detectará automaticamente o **`Dockerfile`** que preparamos e iniciará a compilação.
5. Quando o deploy finalizar:
   - Clique no serviço -> aba **`Settings`**.
   - Na seção **`Networking`**, clique em **`Generate Domain`**.
6. **Pronto!** Você terá um link público seguro (ex: `https://aura-production.up.railway.app`) que você já pode enviar para qualquer pessoa criar conta, abrir a câmera e conversar!

---

## 🌐 Método 2: Deploy no Render.com

O **Render** também aceita Dockerfiles nativamente:

1. Acesse **[render.com](https://render.com)** e clique em **`New +`** -> **`Web Service`**.
2. Conecte seu repositório do GitHub.
3. No campo **Runtime**, selecione **`Docker`**.
4. Defina a porta de entrada para **`4000`**.
5. Clique em **`Create Web Service`**.
6. O Render compilará a imagem e gerará uma URL `https://aura.onrender.com`.

---

## 🖥️ Método 3: Deploy em Servidor VPS Próprio (Docker Compose)

Se você tem um servidor Linux (Ubuntu/Debian) na **DigitalOcean**, **Hetzner**, **AWS Lightsail** ou **Oracle Cloud**:

1. Conecte ao seu servidor via SSH:
   ```bash
   ssh root@seu_ip_do_servidor
   ```
2. Instale o Docker caso ainda não tenha:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Clone o projeto e entre na pasta:
   ```bash
   git clone https://github.com/SEU_USUARIO/aura-platform.git
   cd aura-platform
   ```
4. Inicie o container em segundo plano:
   ```bash
   docker compose up -d --build
   ```
5. Para apontar seu domínio próprio (ex: `aura.seusite.com.br`) com SSL gratuito:
   - Use o Caddy Server (configuração de 2 linhas):
     ```caddyfile
     aura.seusite.com.br {
         reverse_proxy localhost:4000
     }
     ```
   - O Caddy gera o certificado SSL Let's Encrypt de forma automática!

---

## 🎥 Dica Fundamental sobre Câmera e Áudio (WebRTC) na Internet

- **Em conexões normais (Wi-Fi de casa, etc.):** O Aura já vem com 5 servidores **STUN públicos do Google** configurados. A conexão P2P de vídeo e voz funciona automaticamente.
- **Em conexões restritas (4G/5G de celular ou redes de empresas com firewall estrito):** Usuários atrás de roteadores restritivos precisam de um servidor **TURN** (revezador).
  - Recomendamos o serviço gratuito **[Metered.ca](https://www.metered.ca/tools/openrelay/)**, que oferece **50 GB/mês de TURN gratuito** sem precisar cadastrar cartão de crédito.
  - Para adicionar suas credenciais TURN, basta adicionar as URLs no arquivo `client/src/App.jsx` na lista de `iceServers`.

---

## 💾 Onde os Dados Ficam Salvos?
- No Docker, o banco de dados (`database.json` com contas, moedas e inventários) está mapeado para a pasta `./data` da máquina hospedeira. Mesmo que o container seja atualizado ou reiniciado, **nenhuma conta ou compra é perdida**.
