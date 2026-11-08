import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  X,
  Sparkles,
  Coins,
  History,
  Bot,
  Image as ImageIcon,
  Palette,
  Type,
  Check,
  RotateCcw
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, onOpenStore }) {
  if (!isOpen) return null;

  const { user, inventory, transactions, equipItem } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'history'
  const [invFilter, setInvFilter] = useState('all');

  const filteredInventory =
    invFilter === 'all'
      ? inventory
      : inventory.filter((item) => item.category === invFilter);

  async function handleUnequip(category) {
    await equipItem(null, 'unequip', category);
  }

  async function handleEquip(item) {
    await equipItem(item.id, 'equip');
  }

  function isItemEquipped(item) {
    if (item.category === 'avatar') return user?.equippedAvatar === item.assetValue;
    if (item.category === 'background') return user?.equippedBackground === item.assetValue;
    if (item.category === 'color') return user?.equippedColor === item.assetValue;
    if (item.category === 'font') return user?.equippedFont === item.assetValue;
    return false;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-[80vh] bg-[#313338] rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden">
        {/* Banner do Perfil (Mostra o fundo de tela que o usuário equipou) */}
        <div className="h-32 bg-slate-800 relative overflow-hidden shrink-0">
          {user?.equippedBackground ? (
            <img
              src={user.equippedBackground}
              alt="Banner de Fundo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900" />
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações Principais do Usuário */}
        <div className="px-6 pb-4 bg-[#2b2d31] border-b border-slate-700/80 relative shrink-0">
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="relative">
              <img
                src={user?.equippedAvatar}
                alt={user?.username}
                className={`w-24 h-24 rounded-full bg-slate-900 object-cover border-4 ${
                  user?.borderEffect || 'border-cyan-400'
                } shadow-2xl`}
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#2b2d31]" />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenStore();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ir para a Loja</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-xl font-bold ${user?.equippedColor || 'text-white'}`}
                style={{ fontFamily: user?.equippedFont || 'inherit' }}
              >
                {user?.username}
              </h3>
              {user?.isMinor ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  🛡️ CONTA JOVEM (10-17 ANOS) • MODO PROTEGIDO
                </span>
              ) : (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  🛡️ MAIORIDADE VERIFICADA (+18)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5 bg-[#1e1f22] px-3 py-1 rounded-lg border border-amber-500/30 text-amber-300 font-semibold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{user?.coins ?? 0} Moedas</span>
            </div>
            <div className="text-slate-400">
              Conta criada em: {new Date(user?.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Abas: Inventário vs Histórico */}
        <div className="flex items-center px-6 gap-2 bg-[#2b2d31]/50 border-b border-slate-700/60 shrink-0">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Meu Inventário ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Histórico de Transações
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'inventory' && (
            <div>
              {/* Filtros de Categoria do Inventário */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
                {['all', 'avatar', 'background', 'color', 'font'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setInvFilter(cat)}
                    className={`px-3 py-1 rounded-full font-medium transition capitalize cursor-pointer shrink-0 ${
                      invFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'all'
                      ? 'Todos'
                      : cat === 'avatar'
                      ? 'Bonequinhos'
                      : cat === 'background'
                      ? 'Fundos'
                      : cat === 'color'
                      ? 'Cores'
                      : 'Fontes'}
                  </button>
                ))}
              </div>

              {filteredInventory.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bot className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">Nenhum item nesta categoria</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Você pode usar suas moedas de boas-vindas para adquirir novos itens na loja!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredInventory.map((item) => {
                    const equipped = isItemEquipped(item);
                    return (
                      <div
                        key={item.id}
                        className={`p-3 bg-[#2b2d31] rounded-xl border flex items-center justify-between gap-3 ${
                          equipped ? 'border-emerald-500/80' : 'border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          {item.category === 'avatar' && (
                            <img
                              src={item.assetValue}
                              alt=""
                              className={`w-12 h-12 rounded-full border-2 ${
                                item.borderEffect || 'border-cyan-400'
                              } object-cover shrink-0`}
                            />
                          )}
                          {item.category === 'background' && (
                            <img
                              src={item.preview}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                          )}
                          {item.category === 'color' && (
                            <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                              <span className={`text-base font-bold ${item.assetValue}`}>Aa</span>
                            </div>
                          )}
                          {item.category === 'font' && (
                            <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                              <span
                                className="text-sm font-bold text-indigo-400"
                                style={{ fontFamily: item.assetValue }}
                              >
                                F
                              </span>
                            </div>
                          )}

                          <div className="truncate">
                            <div className="font-bold text-white text-sm truncate">{item.name}</div>
                            <div className="text-[11px] text-slate-400 capitalize">
                              {item.category}
                            </div>
                          </div>
                        </div>

                        <div>
                          {equipped ? (
                            <button
                              onClick={() => handleUnequip(item.category)}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="Desequipar"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Remover</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEquip(item)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Equipar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhuma transação registrada ainda.</p>
                </div>
              ) : (
                transactions.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-[#2b2d31] rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{t.description}</div>
                      <div className="text-slate-400 text-[11px]">
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div
                      className={`font-bold flex items-center gap-1 ${
                        t.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>
                        {t.amount > 0 ? `+${t.amount}` : t.amount} moedas
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
