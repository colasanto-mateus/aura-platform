import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('aura_token'));
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrega dados do usuário ao iniciar ou quando o token mudar
  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setUser(null);
      setInventory([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [token]);

  async function fetchProfile(authToken) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setInventory(data.inventory || []);
        setTransactions(data.transactions || []);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    } finally {
      setLoading(false);
    }
  }

  async function login(loginIdentifier, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginIdentifier, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao realizar login');
    }
    localStorage.setItem('aura_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  // Etapa 1 do Cadastro Seguro: Validação + Captcha + Envio de E-mail
  async function registerInit(formData) {
    const res = await fetch('/api/auth/register-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao processar cadastro');
    }
    return data;
  }

  // Etapa 2 do Cadastro Seguro: Confirmação do código de 6 dígitos
  async function verifyEmailCode(email, code) {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Código incorreto ou expirado');
    }
    localStorage.setItem('aura_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  // Reenviar código de verificação
  async function resendCode(email) {
    const res = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao reenviar código');
    }
    return data;
  }

  function logout() {
    localStorage.removeItem('aura_token');
    setToken(null);
    setUser(null);
    setInventory([]);
    setTransactions([]);
  }

  async function buyItem(itemId) {
    if (!token) throw new Error('Você precisa estar logado para comprar');
    const res = await fetch('/api/store/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ itemId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao comprar item');
    }
    setUser(data.user);
    setInventory((prev) => [...prev, data.item]);
    return data;
  }

  async function equipItem(itemId, action = 'equip', category = null) {
    if (!token) throw new Error('Você precisa estar logado');
    const res = await fetch('/api/store/equip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ itemId, action, category })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao equipar item');
    }
    setUser(data.user);
    return data;
  }

  async function rechargeCoins(amount, method = 'PIX') {
    if (!token) throw new Error('Você precisa estar logado');
    const res = await fetch('/api/wallet/recharge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount, method })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro na recarga');
    }
    setUser(data.user);
    return data;
  }

  // 1. Criar Ordem de Pagamento no Checkout Seguro (PIX / Cartão)
  async function createCheckoutOrder(packId, method = 'PIX') {
    if (!token) throw new Error('Você precisa estar logado para recarregar moedas');
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ packId, method })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao gerar ordem de pagamento');
    return data.order;
  }

  // 2. Confirmar Pagamento da Ordem (Liberação instantânea das moedas)
  async function confirmCheckoutOrder(orderId) {
    if (!token) throw new Error('Sessão expirada');
    const res = await fetch('/api/payment/confirm-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao validar pagamento');
    setUser(data.user);
    return data;
  }

  // 3. Salvar Avatar 3D Customizado do Estúdio
  async function saveCustomAvatar(avatarUrl, avatarConfig, animEffect) {
    if (!token) throw new Error('Você precisa estar logado');
    const res = await fetch('/api/avatar/save-custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ avatarUrl, avatarConfig, animEffect })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar avatar');
    setUser(data.user);
    return data;
  }

  // 4. Concluir Sessão de Foco / Pomodoro e Resgatar Moedas
  async function completeFocusSession(durationMinutes, mode, topic) {
    if (!token) throw new Error('Você precisa estar logado');
    const res = await fetch('/api/focus/complete-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ durationMinutes, mode, topic })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao resgatar recompensa');
    setUser(data.user);
    return data;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        inventory,
        transactions,
        loading,
        login,
        registerInit,
        verifyEmailCode,
        resendCode,
        logout,
        buyItem,
        equipItem,
        rechargeCoins,
        createCheckoutOrder,
        confirmCheckoutOrder,
        saveCustomAvatar,
        completeFocusSession,
        refreshUser: () => fetchProfile(token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
