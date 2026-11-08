import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Sparkles,
  X,
  Check,
  CreditCard,
  QrCode,
  Coins,
  ChevronRight,
  Palette,
  Type,
  Image as ImageIcon,
  Bot
} from 'lucide-react';

export default function StoreModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { user, inventory, buyItem, equipItem, rechargeCoins } = useAuth();
  const [activeTab, setActiveTab] = useState('avatar'); // 'avatar' | 'background' | 'color' | 'font'
  const [storeItems, setStoreItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Busca itens da loja
  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch('/api/store/items');
        if (res.ok) {
          const data = await res.json();
          setStoreItems(data.items || []);
        }
      } catch (err) {
        console.error('Erro ao carregar loja:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, []);

  const ownedItemIds = inventory.map((inv) => inv.id);

  const filteredItems = storeItems.filter((item) => item.category === activeTab);

  async function handleBuy(item) {
    setPurchasingId(item.id);
    try {
      await buyItem(item.id);
      // Efeito de celebração com confetes
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setFeedbackMsg({
        type: 'success',
        text: `Você desbloqueou "${item.name}"! Deseja equipar agora?`
      });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setPurchasingId(null);
    }
  }

  async function handleEquip(item) {
    try {
      await equipItem(item.id, 'equip');
      setFeedbackMsg({ type: 'success', text: `"${item.name}" equipado com sucesso!` });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  }

  async function handleRecharge(amount, packName) {
    try {
      await rechargeCoins(amount, 'PIX Instantâneo');
      setShowRechargeModal(false);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 }
      });
      setFeedbackMsg({
        type: 'success',
        text: `Recarga de +${amount} moedas realizada com sucesso!`
      });
    } catch (err) {
      alert('Erro na recarga: ' + err.message);
    }
  }

  function isEquipped(item) {
    if (item.category === 'avatar') return user?.equippedAvatar === item.assetValue;
    if (item.category === 'background') return user?.equippedBackground === item.assetValue;
    if (item.category === 'color') return user?.equippedColor === item.assetValue;
    if (item.category === 'font') return user?.equippedFont === item.assetValue;
    return false;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-[#313338] rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden">
        {/* 1. Header da Loja */}
        <div className="h-16 px-6 bg-[#2b2d31] border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-pink-500 to-indigo-600 rounded-xl text-white shadow-md shadow-pink-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Loja de Cosméticos Aura</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">
                  Exclusivo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalize seus bonequinhos, fundos de perfil, cores e fontes de texto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Saldo de Moedas */}
            <div className="flex items-center gap-2 bg-[#1e1f22] px-3.5 py-1.5 rounded-xl border border-amber-500/30 shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-300 text-sm">{user?.coins ?? 0}</span>
              <span className="text-xs text-slate-400">moedas</span>
            </div>

            {/* Botão de Recarga */}
            <button
              onClick={() => setShowRechargeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Recarregar</span>
            </button>

            {/* Fechar Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Feedback Banner (Sucesso / Erro) */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-200 border-b border-emerald-500/30'
                : 'bg-red-500/20 text-red-200 border-b border-red-500/30'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. Abas de Categorias */}
        <div className="flex items-center px-6 gap-2 bg-[#2b2d31]/50 border-b border-slate-700/60 shrink-0">
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'avatar'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Bonequinhos & Avatares</span>
          </button>

          <button
            onClick={() => setActiveTab('background')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'background'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Fundos de Tela</span>
          </button>

          <button
            onClick={() => setActiveTab('color')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'color'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Cores & Efeitos</span>
          </button>

          <button
            onClick={() => setActiveTab('font')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'font'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Letras & Fontes</span>
          </button>
        </div>

        {/* 4. Grade de Itens da Loja */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const isOwned = ownedItemIds.includes(item.id);
                const equipped = isEquipped(item);
                const canAfford = (user?.coins ?? 0) >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`bg-[#2b2d31] rounded-2xl p-4 border flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:scale-[1.01] ${
                      equipped
                        ? 'border-emerald-500/80 shadow-emerald-500/10'
                        : isOwned
                        ? 'border-indigo-500/50'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {/* Preview Visual do Item */}
                    <div>
                      <div className="relative aspect-video rounded-xl bg-[#1e1f22] overflow-hidden flex items-center justify-center border border-slate-700/50 mb-3 group">
                        {item.category === 'avatar' && (
                          <div className="relative">
                            <img
                              src={item.assetValue}
                              alt={item.name}
                              className={`w-20 h-20 rounded-full bg-slate-900 object-cover border-4 ${
                                item.borderEffect || 'border-cyan-400'
                              } group-hover:scale-110 transition duration-300`}
                            />
                          </div>
                        )}

                        {item.category === 'background' && (
                          <img
                            src={item.preview}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        )}

                        {item.category === 'color' && (
                          <div className="text-center p-3">
                            <span
                              className={`text-xl font-bold tracking-wider ${item.assetValue}`}
                            >
                              {user?.username || 'NomeEstilizado'}
                            </span>
                            <span className="block text-[11px] text-slate-400 mt-1">
                              Visual no chat e na chamada
                            </span>
                          </div>
                        )}

                        {item.category === 'font' && (
                          <div className="text-center p-3">
                            <span
                              className="text-lg font-bold text-white block truncate"
                              style={{ fontFamily: item.assetValue }}
                            >
                              {item.name}
                            </span>
                            <span
                              className="text-xs text-indigo-300 mt-1 block"
                              style={{ fontFamily: item.assetValue }}
                            >
                              "O futuro da comunicação!"
                            </span>
                          </div>
                        )}

                        {/* Tag de Equipado ou Preço */}
                        {equipped && (
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3" />
                            <span>Equipado</span>
                          </div>
                        )}
                      </div>

                      {/* Título e Descrição */}
                      <h4 className="text-base font-bold text-white flex items-center justify-between">
                        <span>{item.name}</span>
                        {!isOwned && (
                          <span className="text-amber-400 text-sm font-extrabold flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            {item.price}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    {/* Botões de Ação */}
                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                      {isOwned ? (
                        equipped ? (
                          <button
                            disabled
                            className="w-full py-2 bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-default"
                          >
                            <Check className="w-4 h-4" />
                            <span>Em Uso Atualmente</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(item)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
                          >
                            Equipar Agora
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford || purchasingId === item.id}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {purchasingId === item.id ? (
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          ) : canAfford ? (
                            <>
                              <Coins className="w-3.5 h-3.5" />
                              <span>Comprar por {item.price} Moedas</span>
                            </>
                          ) : (
                            <span>Moedas Insuficientes</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE RECARGA DE MOEDAS (PIX & SIMULAÇÃO) */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#2b2d31] rounded-2xl border border-emerald-500/40 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-lg">Recarga de Moedas Aura</h3>
              </div>
              <button
                onClick={() => setShowRechargeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 mb-4">
              Escolha um pacote para desbloquear imediatamente novos bonequinhos, fundos e fontes exclusivas via PIX Instantâneo.
            </p>

            <div className="space-y-3">
              {/* Pacote 1 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1e1f22] border border-slate-700 hover:border-emerald-500 transition">
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>500 Moedas</span>
                  </div>
                  <div className="text-xs text-slate-400">Ideal para 2 bonequinhos</div>
                </div>
                <button
                  onClick={() => handleRecharge(500, '500 Moedas')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  R$ 9,90 (PIX)
                </button>
              </div>

              {/* Pacote 2 (Mais Popular) */}
              <div className="relative flex items-center justify-between p-3.5 rounded-xl bg-[#1e1f22] border-2 border-emerald-500 shadow-md shadow-emerald-500/10">
                <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.2 rounded-full uppercase">
                  Mais Popular
                </span>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>1.200 Moedas</span>
                  </div>
                  <div className="text-xs text-emerald-400">+200 Moedas Bônus</div>
                </div>
                <button
                  onClick={() => handleRecharge(1200, '1200 Moedas')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  R$ 19,90 (PIX)
                </button>
              </div>

              {/* Pacote 3 (Lendário) */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1e1f22] border border-amber-500/50 hover:border-amber-400 transition">
                <div>
                  <div className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>3.000 Moedas</span>
                  </div>
                  <div className="text-xs text-slate-400">Desbloqueie todo o catálogo</div>
                </div>
                <button
                  onClick={() => handleRecharge(3000, '3000 Moedas')}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-lg transition cursor-pointer"
                >
                  R$ 39,90 (PIX)
                </button>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-[#1e1f22] text-center border border-slate-700/60">
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Simulação interativa imediata de pagamento PIX</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
