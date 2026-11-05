export type BountyStatus = 'open' | 'in-review' | 'closed'
export type BountyCategory = 'Design' | 'Development' | 'Content' | 'Growth' | 'Research'

export interface Bounty {
  id: string
  title: string
  sponsor: string
  category: BountyCategory
  rewardUsd: number
  status: BountyStatus
  deadline: string // ISO date
  submissions: number
  skills: string[]
  description: string
  /** USDC paid out on Solana, in whole dollars */
  paidOutUsd: number
}

export const BOUNTIES: Bounty[] = [
  {
    id: 'bty-001',
    title: 'Build a Solana validator ordering explainer',
    sponsor: 'Superteam Ukraine',
    category: 'Research',
    rewardUsd: 2500,
    status: 'open',
    deadline: '2026-11-05',
    submissions: 67,
    skills: ['Solana', 'Research', 'Rust'],
    description:
      'Explain how Solana validators order transactions, with real mainnet measurements across at least six validators and a one-command reproduction repo.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-002',
    title: 'Design a wallet onboarding flow for a DeFi app',
    sponsor: 'Jupiter',
    category: 'Design',
    rewardUsd: 1800,
    status: 'open',
    deadline: '2026-11-12',
    submissions: 41,
    skills: ['Figma', 'UX', 'DeFi'],
    description:
      'A three-step onboarding flow that gets a first-time user from install to first swap in under two minutes, with mobile and desktop frames.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-003',
    title: 'Anchor program audit checklist generator',
    sponsor: 'Solana Foundation',
    category: 'Development',
    rewardUsd: 3200,
    status: 'in-review',
    deadline: '2026-10-28',
    submissions: 23,
    skills: ['Anchor', 'Rust', 'Security'],
    description:
      'A CLI that scans an Anchor program and produces a prioritized audit checklist covering account validation, CPI safety, and signer checks.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-004',
    title: 'Write the definitive guide to compressed NFTs',
    sponsor: 'Metaplex',
    category: 'Content',
    rewardUsd: 900,
    status: 'open',
    deadline: '2026-11-20',
    submissions: 12,
    skills: ['Writing', 'NFTs', 'Solana'],
    description:
      'A 3,000-word guide with working code samples covering state compression, Merkle trees, and when cNFTs beat regular NFTs.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-005',
    title: 'Referral growth loop for a Solana payments app',
    sponsor: 'Sphere',
    category: 'Growth',
    rewardUsd: 1500,
    status: 'open',
    deadline: '2026-11-15',
    submissions: 29,
    skills: ['Growth', 'Analytics', 'Payments'],
    description:
      'Design and prototype a referral loop with fraud-resistant invite codes, tracked in a live dashboard mock with real cohort numbers.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-006',
    title: 'Blinks action for tipping creators in USDC',
    sponsor: 'Dialect',
    category: 'Development',
    rewardUsd: 2200,
    status: 'closed',
    deadline: '2026-10-15',
    submissions: 58,
    skills: ['TypeScript', 'Blinks', 'Solana'],
    description:
      'A Solana Action (Blink) that lets anyone tip a creator in USDC from any client that renders actions, with a signed transaction preview.',
    paidOutUsd: 2200,
  },
  {
    id: 'bty-007',
    title: 'Validator uptime dashboard, open source',
    sponsor: 'Helius',
    category: 'Development',
    rewardUsd: 4000,
    status: 'in-review',
    deadline: '2026-10-30',
    submissions: 34,
    skills: ['React', 'TypeScript', 'RPC'],
    description:
      'An open-source dashboard tracking validator uptime, skip rate, and vote credits, fed by live RPC data with a 60-second refresh.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-008',
    title: 'Community meme campaign for a memecoin launch',
    sponsor: 'Bonk',
    category: 'Growth',
    rewardUsd: 600,
    status: 'closed',
    deadline: '2026-10-08',
    submissions: 112,
    skills: ['Memes', 'Social', 'Community'],
    description:
      'A week-long meme campaign with daily prompts, a leaderboard, and a wrap-up thread. Winners picked by engagement, not follower count.',
    paidOutUsd: 600,
  },
  {
    id: 'bty-009',
    title: 'Solana Pay checkout plugin for Shopify',
    sponsor: 'Solana Pay',
    category: 'Development',
    rewardUsd: 5000,
    status: 'open',
    deadline: '2026-12-01',
    submissions: 19,
    skills: ['TypeScript', 'Shopify', 'Solana Pay'],
    description:
      'A production-ready Shopify plugin accepting Solana Pay at checkout, with refund handling and a merchant settings page.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-010',
    title: 'Explainer video: how stake-weighted QoS works',
    sponsor: 'Jito',
    category: 'Content',
    rewardUsd: 1200,
    status: 'open',
    deadline: '2026-11-25',
    submissions: 8,
    skills: ['Video', 'Motion', 'Solana'],
    description:
      'A 90-second animated explainer of stake-weighted quality of service, aimed at developers who have never run a validator.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-011',
    title: 'Mobile wallet deep-link test harness',
    sponsor: 'Phantom',
    category: 'Development',
    rewardUsd: 2750,
    status: 'in-review',
    deadline: '2026-11-02',
    submissions: 15,
    skills: ['React Native', 'Testing', 'Mobile'],
    description:
      'An automated harness that exercises wallet deep links across iOS and Android, reporting failures with device and OS version.',
    paidOutUsd: 0,
  },
  {
    id: 'bty-012',
    title: 'Design system audit for a Solana explorer',
    sponsor: 'Solscan',
    category: 'Design',
    rewardUsd: 1400,
    status: 'closed',
    deadline: '2026-09-30',
    submissions: 47,
    skills: ['Figma', 'Design Systems', 'Accessibility'],
    description:
      'A full audit of the explorer design system with a WCAG 2.1 AA contrast report and a token-level fix list.',
    paidOutUsd: 1400,
  },
]

export const CATEGORIES: BountyCategory[] = [
  'Design',
  'Development',
  'Content',
  'Growth',
  'Research',
]

export const STATUSES: BountyStatus[] = ['open', 'in-review', 'closed']

export const STATUS_LABELS: Record<BountyStatus, string> = {
  open: 'Open',
  'in-review': 'In Review',
  closed: 'Closed',
}
