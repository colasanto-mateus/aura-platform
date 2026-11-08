import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Coins,
  QrCode,
  CreditCard,
  Check,
  Copy,
  Clock,
  ShieldCheck,
  Sparkles,
  X,
  AlertCircle,
  FileText,
  ArrowRight
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { createCheckoutOrder, confirmCheckoutOrder } = useAuth();

  // 'select_pack' | 'checkout' | 'success'
  const [step, setStep] = useState('select_pack');
  const [selectedPack, setSelectedPack] = useState('pack_1500');
  const [paymentMethod, setPaymentMethod] = useState('PIX'); // 'PIX' | 'CREDIT_CARD'

  // Dados da ordem
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  // Dados do Cartão (Simulação / Gateway)
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Timer de 15 minutos para expiração do PIX
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    let timer;
    if (step === 'checkout' && paymentMethod === 'PIX' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, paymentMethod, timeLeft]);

  const packs = [
    {
      id: 'pack_500',
      name: 'Pacote Básico',
      coins: 500,
      bonus: 0,
      price: 'R$ 9,90',
      priceNum: 9.90,
      desc: 'Ideal para 2 bonequinhos ou itens da loja',
      tag: null
    },
    {
      id: 'pack_1500',
      name: 'Pacote Profissional',
      coins: 1500,
      bonus: 250,
      price: 'R$ 24,90',
      priceNum: 24.90,
      desc: 'Mais popular! Desbloqueie avatares de carreiras e togas',
      tag: 'Mais Popular'
    },
    {
      id: 'pack_3500',
      name: 'Pacote Elite Produtiva',
      coins: 3500,
      bonus: 700,
      price: 'R$ 49,90',
      priceNum: 49.90,
      desc: 'Acesso a jalecos, consultórios e fundos 3D animados',
      tag: 'Melhor Custo-Benefício'
    },
    {
      id: 'pack_8000',
      name: 'Pacote Master Corporativo',
      coins: 8000,
      bonus: 2000,
      price: 'R$ 99,90',
      priceNum: 99.90,
      desc: 'Poder máximo para equipes, estudos e itens lendários',
      tag: 'VIP'
    }
  ];

  async function handleProceedToCheckout() {
    setError('');
    setLoading(true);
    try {
      const created = await createCheckoutOrder(selectedPack, paymentMethod);
      setOrder(created);
      setTimeLeft(15 * 60);
      setStep('checkout');
    } catch (err) {
      setError(err.message || 'Erro ao gerar ordem de pagamento');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyPix() {
    if (!order?.pixCode) return;
    navigator.clipboard.writeText(order.pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleConfirmPayment() {
    if (!order) return;
    setVerifying(true);
    setError('');

    try {
      const res = await confirmCheckoutOrder(order.orderId);
      setReceipt(res.receipt);
      setStep('success');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (err) {
      setError(err.message || 'Erro ao validar pagamento');
    } finally {
      setVerifying(false);
    }
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-[560px] bg-[#0f111a] border border-indigo-500/30 rounded-3xl shadow-[0_0_60px_rgba(79,70,229,0.25)] p-6 sm:p-8 text-white z-10 animate-in zoom-in-95 duration-200">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* ETAPA 1: ESCOLHA DO PACOTE & MÉTODO DE PAGAMENTO */}
        {/* ======================================================== */}
        {step === 'select_pack' && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-[2px] shadow-lg shadow-amber-500/20 mb-2.5">
                <div className="w-full h-full bg-[#0f111a] rounded-2xl flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white font-orbitron tracking-wide">
                AURA CHECKOUT & RECARGA
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Adquira moedas para desbloquear bonequinhos de carreiras, roupas 3D e fundos
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Lista de Pacotes */}
            <div className="space-y-2.5 mb-5 max-h-[290px] overflow-y-auto pr-1">
              {packs.map((p) => {
                const isSelected = selectedPack === p.id;
                const totalCoins = p.coins + p.bonus;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPack(p.id)}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/50'
                        : 'bg-[#151726]/80 border-slate-700/70 hover:border-slate-500'
                    }`}
                  >
                    {p.tag && (
                      <span className="absolute -top-2 right-4 bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                        {p.tag}
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>{totalCoins.toLocaleString('pt-BR')} Moedas</span>
                          {p.bonus > 0 && (
                            <span className="text-[10px] font-extrabold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                              +{p.bonus} BÔNUS
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-cyan-300">{p.price}</div>
                      <div className="text-[10px] text-slate-400">À vista</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Seleção do Método de Pagamento */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PIX')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs transition cursor-pointer ${
                    paymentMethod === 'PIX'
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-[#151726] border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>PIX Instantâneo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs transition cursor-pointer ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'bg-indigo-500/15 border-indigo-400 text-indigo-300 shadow-md shadow-indigo-500/10'
                      : 'bg-[#151726] border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>
            </div>

            {/* Botão de Avançar */}
            <button
              onClick={handleProceedToCheckout}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Prosseguir para o Pagamento</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 2: CHECKOUT PIX OU CARTÃO */}
        {/* ======================================================== */}
        {step === 'checkout' && order && (
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Aura Pay • Checkout Seguro</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Pedido: {order.orderId}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Total a Pagar</div>
                <div className="text-lg font-black text-cyan-300">R$ {order.priceBRL.toFixed(2)}</div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {paymentMethod === 'PIX' ? (
              <div className="space-y-4">
                {/* QR Code PIX */}
                <div className="bg-[#151726] border border-emerald-500/30 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-bold mb-3">
                    <Clock className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Expira em: {formatTimer(timeLeft)}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl inline-block shadow-lg mx-auto mb-3">
                    <img
                      src={order.qrCodeUrl}
                      alt="QR Code PIX"
                      className="w-44 h-44 object-contain"
                    />
                  </div>

                  <p className="text-[11px] text-slate-300 max-w-sm mx-auto">
                    Abra o app do seu banco ou carteira digital, selecione <strong>Pagar com PIX</strong> e aponte a câmera para o QR Code acima.
                  </p>
                </div>

                {/* Chave Pix Copia e Cola */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Código PIX Copia e Cola
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={order.pixCode}
                      className="w-full bg-[#161824] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Botão de Simulação / Confirmação de Pagamento */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={verifying}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validando compensação bancária...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Já realizei o pagamento • Liberar Moedas</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Formulário Cartão de Crédito */
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    className="w-full bg-[#161824] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nome Impresso no Cartão
                  </label>
                  <input
                    type="text"
                    placeholder="NOME COMO NO CARTÃO"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="w-full bg-[#161824] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Validade (MM/AA)
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-[#161824] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      CVV / Código
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#161824] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={verifying}
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processando cobrança segura...</span>
                    </>
                  ) : (
                    <span>Pagar R$ {order.priceBRL.toFixed(2)} com Cartão</span>
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep('select_pack')}
              className="mt-3 text-xs text-slate-400 hover:text-white transition w-full text-center"
            >
              ← Voltar e escolher outro pacote
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 3: SUCESSO & RECIBO */}
        {/* ======================================================== */}
        {step === 'success' && receipt && (
          <div className="text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/20">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <h3 className="text-2xl font-black text-white font-orbitron">
              PAGAMENTO APROVADO!
            </h3>
            <p className="text-xs text-slate-300 mt-1 mb-5">
              Suas moedas já estão disponíveis na sua carteira Aura.
            </p>

            {/* Recibo Fiscal Detalhado */}
            <div className="bg-[#151726] border border-slate-700/80 rounded-2xl p-4 text-left mb-6 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-700/60 pb-2">
                <span>Comprovante de Recarga</span>
                <span className="text-emerald-400 font-bold">STATUS: APROVADO</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-1">
                <span>Código da Transação:</span>
                <span className="text-cyan-300 font-bold">{receipt.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Moedas Creditadas:</span>
                <span className="text-amber-400 font-bold">+{receipt.amountCoins.toLocaleString('pt-BR')} Moedas</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Valor Pago:</span>
                <span className="text-white font-bold">R$ {receipt.paidBRL.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              Explorar a Loja & Customizar Avatar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
