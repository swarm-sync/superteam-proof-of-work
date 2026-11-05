/** Ecosystem data — real Solana projects, curated for exploration. */

export type Category = "DeFi" | "Infra" | "NFTs" | "DePIN" | "Consumer";

export interface Project {
  id: string;
  name: string;
  glyph: string;
  tagline: string;
  category: Category;
  detail: string;
  tvl: string;
  users: string;
  founded: string;
}

export const CATEGORIES: ("All" | Category)[] = ["All", "DeFi", "Infra", "NFTs", "DePIN", "Consumer"];

export const PROJECTS: Project[] = [
  {
    id: "jupiter",
    name: "Jupiter",
    glyph: "JU",
    tagline: "Solana's liquidity aggregator — best-price swaps across every DEX.",
    category: "DeFi",
    detail:
      "Jupiter routes swaps through every Solana DEX and AMM to find the best price, and powers limit orders, DCA and perpetuals. Its JUP token launched one of the largest airdrops in crypto history, and the aggregator now clears billions in monthly volume.",
    tvl: "$2.1B routed / mo",
    users: "2M+ wallets",
    founded: "2021",
  },
  {
    id: "jito",
    name: "Jito",
    glyph: "JI",
    tagline: "MEV-powered liquid staking — stake SOL, earn yield + MEV tips.",
    category: "DeFi",
    detail:
      "JitoSOL is Solana's largest liquid staking token. Validators run Jito's MEV client, auctioning block space so stakers capture extra yield from transaction ordering — on top of base staking rewards — while keeping SOL liquid and composable in DeFi.",
    tvl: "$3.4B staked",
    users: "480K holders",
    founded: "2021",
  },
  {
    id: "kamino",
    name: "Kamino",
    glyph: "KA",
    tagline: "Automated liquidity, lending and leverage in one DeFi hub.",
    category: "DeFi",
    detail:
      "Kamino combines concentrated-liquidity vaults, lending, and leveraged positions into a single risk-managed product. Its vaults auto-rebalance CLMM ranges so liquidity providers earn fees without babysitting price bands.",
    tvl: "$1.8B",
    users: "310K wallets",
    founded: "2022",
  },
  {
    id: "drift",
    name: "Drift",
    glyph: "DR",
    tagline: "On-chain perpetuals and spot trading with cross-margin.",
    category: "DeFi",
    detail:
      "Drift is a fully on-chain perpetuals exchange on Solana with cross-collateral margin, borrow/lend, and a prediction-market layer. Trades settle in ~400ms slots, which is why perps that feel like a CEX can run entirely on-chain.",
    tvl: "$900M",
    users: "220K traders",
    founded: "2021",
  },
  {
    id: "pyth",
    name: "Pyth Network",
    glyph: "PY",
    tagline: "First-party price oracles — sub-second feeds from 90+ publishers.",
    category: "Infra",
    detail:
      "Pyth pulls prices directly from exchanges, market makers and trading firms — the first parties who actually trade — and publishes them on-chain in under a second. It secures hundreds of billions in DeFi value across 50+ chains.",
    tvl: "350+ feeds",
    users: "90+ publishers",
    founded: "2021",
  },
  {
    id: "helium",
    name: "Helium",
    glyph: "HE",
    tagline: "People-powered wireless — the largest decentralized network.",
    category: "DePIN",
    detail:
      "Helium migrated to Solana in 2023 and lets anyone run a hotspot that provides LoRaWAN or 5G coverage, earning HNT for proof-of-coverage. It is the flagship DePIN story: real-world infrastructure built by a crowd instead of a carrier.",
    tvl: "1M+ hotspots",
    users: "380K hotspots",
    founded: "2019",
  },
  {
    id: "render",
    name: "Render Network",
    glyph: "RN",
    tagline: "Decentralized GPU rendering for film, AI and 3D.",
    category: "DePIN",
    detail:
      "Render connects artists and AI builders who need GPU compute with node operators who have it idle. Jobs that once queued on a render farm clear on a distributed network, priced in RENDER and settled on Solana.",
    tvl: "40K+ jobs / mo",
    users: "12K node operators",
    founded: "2017",
  },
  {
    id: "magiceden",
    name: "Magic Eden",
    glyph: "ME",
    tagline: "The cross-chain NFT marketplace born on Solana.",
    category: "NFTs",
    detail:
      "Magic Eden started as Solana's dominant NFT marketplace and expanded cross-chain, adding Bitcoin Ordinals and Ethereum. Its launchpad has minted some of the ecosystem's biggest collections, and its wallet now anchors its consumer push.",
    tvl: "$4B+ volume",
    users: "1.2M traders",
    founded: "2021",
  },
  {
    id: "tensor",
    name: "Tensor",
    glyph: "TE",
    tagline: "Pro-grade NFT trading — the Bloomberg terminal for Solana NFTs.",
    category: "NFTs",
    detail:
      "Tensor built the trader-first NFT marketplace: floor sweeps, trait bids, AMM pools and real-time charts. It took the majority of Solana NFT volume by treating JPEGs like a real asset class with real tooling.",
    tvl: "$2B+ volume",
    users: "140K traders",
    founded: "2022",
  },
  {
    id: "squads",
    name: "Squads",
    glyph: "SQ",
    tagline: "Multisig and treasury management for teams and DAOs.",
    category: "Infra",
    detail:
      "Squads is the multisig standard on Solana: programmable treasury vaults, spending limits, and on-chain governance for teams. It secures billions across DAOs, funds and protocol treasuries.",
    tvl: "$10B+ secured",
    users: "35K squads",
    founded: "2021",
  },
  {
    id: "orca",
    name: "Orca",
    glyph: "OR",
    tagline: "The friendliest DEX — concentrated liquidity, human-first UX.",
    category: "DeFi",
    detail:
      "Orca's whirlpools bring concentrated liquidity to Solana with an interface a first-time user can actually understand. It consistently ranks among the top DEXs by volume while keeping the experience approachable.",
    tvl: "$350M",
    users: "900K wallets",
    founded: "2021",
  },
  {
    id: "hivemapper",
    name: "Hivemapper",
    glyph: "HI",
    tagline: "A global street-level map built by drivers, paid in HONEY.",
    category: "DePIN",
    detail:
      "Drivers mount a dashcam, map the roads they already drive, and earn HONEY tokens. The network now covers a meaningful share of the world's roads — a living map maintained by its users, not a single company.",
    tvl: "28% roads mapped",
    users: "150K contributors",
    founded: "2022",
  },
];

/** Baseline network telemetry (simulated live ticking around realistic values). */
export const TELEMETRY = {
  solPriceUsd: 178.42,
  tps: 3241,
  validators: 1417,
  blockTimeMs: 400,
  epochProgress: 0.62,
  uptimePct: 99.95,
  avgFeeSol: 0.00025,
  stakeApy: 6.8,
};
