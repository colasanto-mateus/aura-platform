# Nexus - Plataforma de Comunicação Estilo Discord

Um aplicativo moderno de comunicação em tempo real com **chat de texto**, **canais de voz**, **chamadas com câmera (WebRTC)**, **sistema de autenticação** e uma **loja completa de personalização cosmética** (bonequinhos/avatares, fundos de perfil, cores e fontes de texto).

---

## 🚀 Como Iniciar a Aplicação

### Opção 1: Execução Rápida (Clique Duplo no Windows)
Basta dar dois cliques no arquivo:
```
iniciar_nexus.bat
```
Ele iniciará o servidor e abrirá o navegador automaticamente em `http://localhost:4000`.

### Opção 2: Via Linha de Comando (Terminal)
No diretório `discord_app`:

```bash
# Iniciar o servidor integrado (Frontend + Backend)
npm start
```

Abra o seu navegador em:
👉 **[http://localhost:4000](http://localhost:4000)**

---

## 🌟 Funcionalidades Implementadas

### 1. Autenticação e Contas de Usuário
- Criação de conta (Username, E-mail e Senha segura com criptografia `bcryptjs`).
- Login com JWT persistente.
- **Bônus de boas-vindas:** Cada novo usuário cadastrado recebe **600 moedas grátis** imediatamente para testar a loja!

### 2. Chat de Texto em Tempo Real
- Canais temáticos (`#geral`, `#jogos-e-animes`, `#musica-e-memes`).
- Indicador de digitação em tempo real ("Fulano está digitando...").
- Seletor de emojis rápidos.
- **Estilização Dinâmica:** As mensagens enviadas exibem o avatar personalizado, o nome na cor e brilho adquiridos e o texto na tipografia escolhida pelo autor!

### 3. Chamadas de Voz & Câmera (WebRTC HD)
- Salas de conferência de áudio e vídeo (`🔊 Voz & Câmera Geral`, `🔊 Jogando Juntos`, `🔊 Cinema & Resenha`).
- Transmissão de microfone com controle de Mudo / Desmudo.
- Transmissão de Webcam com botão para Ligar / Desligar câmera.
- Compartilhamento de tela (Screen Share) em alta definição.
- Indicador visual ao falar (anel verde dinâmico ao redor do participante).
- Grade adaptativa de participantes.

### 4. Loja de Personalização & Cosméticos (Shop)
- **🧸 Bonequinhos / Avatares:** Ninja Cyberpunk, Mecha Titã X-01, Gato Gamer Pro, Mago Cósmico, Rei Dourado Imperial e Cavaleiro 8-Bit com molduras luminosas animadas.
- **🖼️ Fundos de Tela (Banners & Wallpapers):** Metrópole Cyberpunk, Nebulosa Espacial, Synthwave 80s, Quarto Lo-Fi e Chuva Matrix.
- **🎨 Cores & Efeitos de Chat:** Ciano Elétrico, Rosa Choque, Ouro Lendário com brilho, Verde Terminal Hacker, Fogo Infernal e Aura Violeta.
- **🔤 Letras & Tipografias:** Orbitron Sci-Fi, Press Start Pixel 8-Bit, Fira Code Hacker, Comfortaa Suave e Bungee Comic.
- **Animacão de Comemoração:** Efeito de confetes (`canvas-confetti`) ao desbloquear itens.
- **Recarga de Moedas:** Modal interativo de recarga via PIX simulado com opções de pacotes de moedas.

### 5. Inventário e Perfil do Jogador
- Card de perfil completo com banner de fundo equipado.
- Gerenciamento de itens adquiridos com botões para Equipar e Remover a qualquer instante.
- Extrato com histórico de transações de moedas.

---

## 🛠️ Tecnologias Utilizadas
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express, Socket.io, WebRTC Signaling.
- **Segurança:** JSON Web Tokens (JWT), BcryptJS.
- **Persistência:** Database JSON atômica e portátil (sem dependências de compilação C++).
