import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Zap, Shield, Star, Crown } from 'lucide-react';
import { SubscriptionStatus } from '../types';

interface PricingPlan {
  id: SubscriptionStatus;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  buttonText: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: SubscriptionStatus.FREE,
    name: 'Free',
    price: '$0',
    description: 'Perfect for exploring the power of Veo',
    features: [
      '5 generations per day',
      '720p resolution',
      'Standard processing speed',
      'Community support',
    ],
    icon: <Zap className="w-6 h-6" />,
    color: 'var(--muted)',
    buttonText: 'Current Plan',
  },
  {
    id: SubscriptionStatus.PRO,
    name: 'Pro',
    price: '$29',
    description: 'For creators who need more power',
    features: [
      'Unlimited generations',
      '1080p resolution',
      'Priority processing',
      'Advanced camera controls',
      'Email support',
    ],
    icon: <Star className="w-6 h-6" />,
    color: 'var(--google-blue)',
    buttonText: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: SubscriptionStatus.ENTERPRISE,
    name: 'Enterprise',
    price: 'Custom',
    description: 'Scale your production with custom solutions',
    features: [
      '4K resolution support',
      'Custom model fine-tuning',
      'API access',
      'Dedicated account manager',
      'SLA guarantees',
    ],
    icon: <Crown className="w-6 h-6" />,
    color: 'var(--google-yellow)',
    buttonText: 'Contact Sales',
  },
];

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: SubscriptionStatus;
  onUpgrade: (planId: SubscriptionStatus) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onUpgrade,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-[var(--bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--card-border)] bg-[var(--card-bg)]/50">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--fg)]">
                  Upgrade Your Production
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1 font-medium uppercase tracking-widest">
                  Choose the plan that fits your creative needs
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors rounded-full hover:bg-[var(--card-bg)]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                      plan.popular 
                        ? 'border-[var(--google-blue)] bg-[var(--google-blue)]/5 shadow-lg shadow-[var(--google-blue)]/10 scale-105 z-10' 
                        : 'border-[var(--card-border)] bg-[var(--card-bg)]/30'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--google-blue)] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-[var(--card-bg)] text-[var(--fg)]" style={{ color: plan.color }}>
                        {plan.icon}
                      </div>
                      <h3 className="text-lg font-bold text-[var(--fg)]">{plan.name}</h3>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[var(--fg)]">{plan.price}</span>
                        {plan.price !== 'Custom' && (
                          <span className="text-xs text-[var(--muted)] font-medium uppercase tracking-widest">/ month</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex-grow space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-0.5 p-0.5 rounded-full bg-[var(--google-green)]/20 text-[var(--google-green)]">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-xs text-[var(--muted)] leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => onUpgrade(plan.id)}
                      disabled={currentStatus === plan.id}
                      className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        currentStatus === plan.id
                          ? 'bg-[var(--card-bg)] text-[var(--muted)] cursor-default'
                          : plan.popular
                            ? 'bg-[var(--google-blue)] text-white hover:bg-[var(--google-blue)]/90 shadow-lg shadow-[var(--google-blue)]/20 active:scale-95'
                            : 'bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 active:scale-95'
                      }`}
                    >
                      {currentStatus === plan.id ? 'Current Plan' : plan.buttonText}
                    </button>
                  </div>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="mt-12 pt-8 border-t border-[var(--card-border)] flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-50 grayscale">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Instant Activation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Premium Models</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-[var(--card-bg)]/30 text-center border-t border-[var(--card-border)]">
              <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest font-medium">
                All plans include access to our latest Veo 3.1 models. Prices are in USD.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
