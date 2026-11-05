<?php

declare(strict_types=1);

/**
 * Seed the database with six realistic bounties. Idempotent: does nothing
 * when the table already has rows.
 *
 *   php bin/seed.php
 */

use BountyApi\BountyRepository;
use BountyApi\Database;

require __DIR__ . '/../src/bootstrap.php';

$repo = new BountyRepository(Database::connection());

if ($repo->countAll() > 0) {
    echo "Database already has {$repo->countAll()} bounties — nothing seeded.\n";
    exit(0);
}

$seed = [
    [
        'title' => 'Build a Solana staking dashboard',
        'sponsor' => 'Solana Foundation',
        'description' => 'A read-only dashboard showing validator APY, stake distribution, and epoch progress, with charts and a mobile-friendly layout.',
        'reward_amount' => 2500.0,
        'reward_currency' => 'USDC',
        'skills' => ['React', 'TypeScript', 'Solana'],
        'deadline' => '2026-12-15',
    ],
    [
        'title' => 'Redesign wallet onboarding flow',
        'sponsor' => 'Phantom',
        'description' => 'Cut new-user drop-off in the first-run flow. Deliver Figma flows plus a working React prototype covering seed-phrase backup.',
        'reward_amount' => 1.5,
        'reward_currency' => 'SOL',
        'skills' => ['UI/UX Design', 'React'],
        'deadline' => '2026-11-28',
    ],
    [
        'title' => 'Token metadata indexer API',
        'sponsor' => 'Helius',
        'description' => 'A small service that indexes token metadata for a fixed watchlist and serves it over a paginated REST API with caching.',
        'reward_amount' => 1200.0,
        'reward_currency' => 'USDC',
        'skills' => ['Node.js', 'TypeScript'],
        'deadline' => '2026-11-20',
    ],
    [
        'title' => 'DEX aggregator routing explainer',
        'sponsor' => 'Jupiter',
        'description' => 'Write and illustrate a 1,500-word explainer on how Jupiter routes swaps across liquidity sources, aimed at new developers.',
        'reward_amount' => 800.0,
        'reward_currency' => 'USDC',
        'skills' => ['Content', 'Solana'],
        'deadline' => '2026-11-05',
    ],
    [
        'title' => 'Mobile wallet adapter SDK sample app',
        'sponsor' => 'Solana Mobile',
        'description' => 'A sample app using the Mobile Wallet Adapter that signs a transaction and displays the result, with a short video walkthrough.',
        'reward_amount' => 3.0,
        'reward_currency' => 'SOL',
        'skills' => ['Solana', 'TypeScript'],
        'deadline' => '2026-12-31',
    ],
    [
        'title' => 'Hackathon brand refresh',
        'sponsor' => 'Superteam',
        'description' => 'Refresh the hackathon brand kit: logo lockups, a social template set, and a one-page style guide as a PDF.',
        'reward_amount' => 600.0,
        'reward_currency' => 'USDC',
        'skills' => ['Graphic Design'],
        'deadline' => '2026-10-30',
    ],
];

foreach ($seed as $bounty) {
    $repo->create($bounty);
}

echo 'Seeded ' . count($seed) . " bounties.\n";
