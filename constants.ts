export const PRICING_PACKAGES = [
  {
    id: 'free',
    name: 'Free Tier',
    price: '₹0',
    limit: '1 video / daily',
    features: [
      'Standard quality',
      'Community support',
      'Basic generation modes'
    ],
    color: 'gray'
  },
  {
    id: 'basic',
    name: 'Basic Production',
    price: '₹499',
    period: '/ month',
    limit: '10 videos / daily',
    features: [
      'HD Quality',
      'Priority support',
      'All generation modes',
      'Cloud persistence'
    ],
    color: 'blue',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro Factory',
    price: '₹1499',
    period: '/ month',
    limit: '50 videos / daily',
    features: [
      '4K Resolution',
      'Direct API access',
      'Custom aspect ratios',
      'Early access to new models'
    ],
    color: 'indigo'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹4999',
    period: '/ month',
    limit: 'Unlimited',
    features: [
      'Dedicated GPU instances',
      'Custom model fine-tuning',
      'SLA & 24/7 Support',
      'Team collaboration tools'
    ],
    color: 'purple'
  }
];

export const LOGIN_HIGHLIGHTS = [
  {
    title: "Cinematic AI Production",
    description: "Manufacture high-end videos from simple text or images."
  },
  {
    title: "Cloud Persistence",
    description: "Your production log is synced across all your devices."
  },
  {
    title: "Multi-mode Generation",
    description: "Text-to-Video, Image-to-Video, and Frame-based control."
  },
  {
    title: "High-Resolution Exports",
    description: "Export your creations in stunning quality for any platform."
  }
];
