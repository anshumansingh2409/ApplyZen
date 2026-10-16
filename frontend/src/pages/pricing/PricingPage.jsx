import React, { useState, useEffect } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PricingPage() {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState('Free');
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState(user?.full_name || 'Anshuman Singh');
  const [upiId, setUpiId] = useState('applicant@okhdfcbank');
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscriptions/plans');
        setPlans(res.data);
        if (user?.subscription_plan) {
          setActivePlan(user.subscription_plan);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [user]);

  const handleOpenCheckout = (plan) => {
    setSelectedPlanForCheckout(plan);
    setPaymentSuccessData(null);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    setUpgrading(true);
    try {
      const res = await api.post('/subscriptions/checkout', {
        plan_id: selectedPlanForCheckout.id,
        payment_method: paymentMethod,
        cardholder_name: cardName,
        last4: cardNumber.slice(-4) || '4242',
        upi_id: paymentMethod === 'upi' ? upiId : null
      });

      const upgradedPlanName = res.data.plan || 'Pro';
      setActivePlan(upgradedPlanName);
      if (updateUser) {
        updateUser({ subscription_plan: upgradedPlanName });
      }

      setPaymentSuccessData({
        transaction_id: res.data.transaction_id || `PAY-${Date.now().toString(16).toUpperCase()}`,
        plan: upgradedPlanName,
        amount: selectedPlanForCheckout.price
      });
    } catch (err) {
      console.error(err);
      alert('Payment processing failed. Please check your credentials.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#05603a]">Transparent Career Automation</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Invest in Your Career Velocity
        </h2>
        <p className="text-sm text-gray-600">
          Scale your opportunity discovery and eliminate repetitive form-filling while keeping sensitive career decisions under your command.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((p) => {
          const isCurrent = activePlan.toLowerCase() === p.name.toLowerCase().split(' ')[0];
          return (
            <div
              key={p.id}
              className={`rounded-2xl p-7 flex flex-col justify-between transition-all bg-white ${
                p.popular
                  ? 'border-2 border-[#05603a] shadow-xl relative'
                  : 'border border-gray-200 shadow-xs'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#05603a] text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-xs">
                  Most Popular Copilot
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.description}</p>

                <div className="mt-5 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{p.price}</span>
                  <span className="text-xs text-gray-500 font-medium ml-1">/ {p.period}</span>
                </div>

                <ul className="space-y-3 text-xs text-gray-700">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#05603a] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleOpenCheckout(p)}
                  disabled={upgrading || isCurrent}
                  className={`w-full py-3 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    p.popular
                      ? 'bg-[#05603a] hover:bg-[#034a27] text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{isCurrent ? 'Current Active Plan' : `Upgrade to ${p.name}`}</span>
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Checkout Modal */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-200">
            {paymentSuccessData ? (
              /* Success Receipt View */
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold animate-bounce">
                  ✓
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                    PRO COPILOT ACTIVATED
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">Payment Successful!</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Your account has been upgraded to {paymentSuccessData.plan} Plan. Unlimited job opportunity detection and zero-hallucination form filling are now live.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID:</span>
                    <span className="font-mono font-bold text-gray-900">{paymentSuccessData.transaction_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Charged:</span>
                    <span className="font-bold text-emerald-800">{paymentSuccessData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Billing Profile:</span>
                    <span className="text-gray-700">{user?.email}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanForCheckout(null);
                    setPaymentSuccessData(null);
                  }}
                  className="w-full py-3 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              /* Checkout & Card Entry View */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Checkout & Upgrade</span>
                    <h3 className="text-lg font-bold text-gray-900">{selectedPlanForCheckout.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedPlanForCheckout(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Plan Summary Strip */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-950">Subscription Total</p>
                    <p className="text-[11px] text-emerald-700">Renews monthly • Cancel anytime</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#05603a]">{selectedPlanForCheckout.price}</span>
                    <span className="text-xs text-gray-500">/mo</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>💳 Credit / Debit Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>⚡ UPI / Razorpay</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleProcessPayment} className="space-y-3.5">
                  {paymentMethod === 'card' ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full text-xs font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Expiration (MM/YY)</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full text-xs font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">CVC / CVV</label>
                          <input
                            type="password"
                            maxLength="4"
                            required
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full text-xs font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a]"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Virtual Payment Address (VPA / UPI ID)</label>
                      <input
                        type="text"
                        required
                        placeholder="yourname@okaxis or mobile@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full text-xs font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a]"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Accepts Google Pay, PhonePe, Paytm, and BHIM UPI.</p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">🔒 256-bit Bank Grade Encryption</span>
                    <span>Instant Activation</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanForCheckout(null)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={upgrading}
                      className="flex-1 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {upgrading ? 'Processing Payment...' : `Pay ${selectedPlanForCheckout.price} & Upgrade`}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
