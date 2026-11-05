<?php

declare(strict_types=1);

namespace BountyApi;

/**
 * PDO/SQLite wiring: creates the database file and schema on first use.
 * The path comes from BOUNTY_DB_PATH so tests can point at a throwaway file.
 */
final class Database
{
    private static ?\PDO $pdo = null;

    public static function connection(): \PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $path = getenv('BOUNTY_DB_PATH') ?: __DIR__ . '/../data/bounties.sqlite';
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $pdo = new \PDO('sqlite:' . $path, options: [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS bounties (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                sponsor TEXT NOT NULL,
                description TEXT NOT NULL,
                reward_amount REAL NOT NULL CHECK (reward_amount > 0),
                reward_currency TEXT NOT NULL CHECK (reward_currency IN ('SOL', 'USDC')),
                status TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in-review', 'awarded', 'closed')),
                skills TEXT NOT NULL DEFAULT '[]',
                submissions INTEGER NOT NULL DEFAULT 0 CHECK (submissions >= 0),
                deadline TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            SQL);
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties (status)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_bounties_created ON bounties (created_at DESC)');

        self::$pdo = $pdo;
        return $pdo;
    }

    /** Test support: drop the cached connection so a new path can be used. */
    public static function reset(): void
    {
        self::$pdo = null;
    }
}
