"""Seed data: a small, realistic demo dataset of bounty listings."""

from __future__ import annotations

from datetime import date, timedelta

from .models import BountyCreate, BountySkill, BountyStatus


def _deadline(days: int) -> date:
    return date.today() + timedelta(days=days)


SEED_BOUNTIES: list[BountyCreate] = [
    BountyCreate(
        title="Build a Solana wallet balance dashboard",
        description="React + TypeScript dashboard showing SPL token balances, "
        "transaction history, and price charts for a connected wallet.",
        sponsor="Solana Labs",
        reward_usd=2500,
        deadline=_deadline(21),
        skills=[BountySkill.DEVELOPMENT],
    ),
    BountyCreate(
        title="Design system for a DeFi lending protocol",
        description="Figma design system: 40+ components, dark mode, and a "
        "landing page for a Solana lending protocol.",
        sponsor="MarginFi",
        reward_usd=1800,
        deadline=_deadline(14),
        skills=[BountySkill.DESIGN],
    ),
    BountyCreate(
        title="Write a guide to Solana validator ordering",
        description="Technical deep-dive on how Solana validators order "
        "transactions, with reproducible mainnet measurements.",
        sponsor="Superteam",
        reward_usd=800,
        deadline=_deadline(7),
        skills=[BountySkill.CONTENT, BountySkill.RESEARCH],
    ),
    BountyCreate(
        title="Growth campaign for a Solana NFT marketplace",
        description="Plan and run a two-week launch campaign: content calendar, "
        "influencer outreach, and weekly reporting.",
        sponsor="Tensor",
        reward_usd=1200,
        deadline=_deadline(30),
        skills=[BountySkill.MARKETING],
        status=BountyStatus.IN_REVIEW,
    ),
    BountyCreate(
        title="Audit a token vesting smart contract",
        description="Review an Anchor-based vesting contract for access-control "
        "and arithmetic issues; deliver a written findings report.",
        sponsor="Streamflow",
        reward_usd=4000,
        deadline=_deadline(10),
        skills=[BountySkill.DEVELOPMENT, BountySkill.RESEARCH],
    ),
]
