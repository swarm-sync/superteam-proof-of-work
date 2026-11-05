<?php

declare(strict_types=1);

/**
 * Plain-PHP test suite — no PHPUnit required (PHPUnit is not installed in
 * this environment; the same assertions run with zero dependencies).
 *
 *   php tests/run_tests.php
 *
 * Tests run the real router in-process against a throwaway SQLite file
 * (BOUNTY_DB_PATH), so they exercise the exact dispatch, validation, and
 * persistence the live server uses. Exit code 0 = all pass.
 */

use BountyApi\App;
use BountyApi\Database;

require __DIR__ . '/../src/bootstrap.php';

$tmpDb = sys_get_temp_dir() . '/bounty-api-test-' . getmypid() . '.sqlite';
putenv('BOUNTY_DB_PATH=' . $tmpDb);
Database::reset();

$passed = 0;
$failed = 0;
$failures = [];

function check(string $name, bool $condition, string $detail = ''): void
{
    global $passed, $failed, $failures;
    if ($condition) {
        $passed++;
        echo "  PASS {$name}\n";
    } else {
        $failed++;
        $failures[] = $name . ($detail !== '' ? " — {$detail}" : '');
        echo "  FAIL {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    }
}

/** @return array{0: int, 1: mixed} */
function callApi(string $method, string $path, array $query = [], ?array $body = null): array
{
    try {
        return App::router()->dispatch($method, $path, $query, $body);
    } catch (\BountyApi\ApiException $e) {
        $payload = ['error' => ['code' => $e->errorCode, 'message' => $e->getMessage()]];
        if ($e->details !== []) {
            $payload['error']['details'] = $e->details;
        }
        return [$e->status, $payload];
    }
}

function validBounty(array $overrides = []): array
{
    return array_merge([
        'title' => 'Build a staking dashboard',
        'sponsor' => 'Solana Foundation',
        'description' => 'A read-only dashboard showing validator APY and stake distribution.',
        'reward_amount' => 2500,
        'reward_currency' => 'USDC',
        'skills' => ['React', 'Solana'],
        'deadline' => '2030-12-15',
    ], $overrides);
}

echo "Bounty API tests (DB: {$tmpDb})\n";

// --- health ---
echo "health\n";
[$status, $payload] = callApi('GET', '/health');
check('GET /health returns 200 ok', $status === 200 && ($payload['status'] ?? null) === 'ok', json_encode($payload));

// --- create ---
echo "create\n";
[$status, $payload] = callApi('POST', '/api/bounties', [], validBounty());
check('POST valid bounty returns 201 with an id', $status === 201 && isset($payload['data']['id']), json_encode($payload));
$createdId = $payload['data']['id'] ?? '';
check('created bounty starts open with 0 submissions',
    ($payload['data']['status'] ?? null) === 'open' && ($payload['data']['submissions'] ?? null) === 0);

[$status, $payload] = callApi('POST', '/api/bounties', [], validBounty(['title' => 'x']));
check('POST short title returns 400 with field detail',
    $status === 400 && isset($payload['error']['details']['title']), json_encode($payload));

[$status, $payload] = callApi('POST', '/api/bounties', [], validBounty(['reward_amount' => 0]));
check('POST zero reward returns 400', $status === 400 && isset($payload['error']['details']['reward_amount']));

[$status, $payload] = callApi('POST', '/api/bounties', [], validBounty(['reward_currency' => 'BTC']));
check('POST bad currency returns 400', $status === 400 && isset($payload['error']['details']['reward_currency']));

[$status, $payload] = callApi('POST', '/api/bounties', [], validBounty(['deadline' => '2020-01-01']));
check('POST past deadline returns 400', $status === 400 && isset($payload['error']['details']['deadline']));

[$status, $payload] = callApi('POST', '/api/bounties', [], validBounty(['deadline' => '2026-02-30']));
check('POST impossible date returns 400', $status === 400 && isset($payload['error']['details']['deadline']));

[$status, $payload] = callApi('POST', '/api/bounties', [], validBounty(['skills' => []]));
check('POST empty skills returns 400', $status === 400 && isset($payload['error']['details']['skills']));

[$status, $payload] = callApi('POST', '/api/bounties', [], null);
check('POST with no body returns 400', $status === 400);

// --- read ---
echo "read\n";
[$status, $payload] = callApi('GET', '/api/bounties/' . $createdId);
check('GET existing bounty returns 200', $status === 200 && $payload['data']['id'] === $createdId);

[$status, $payload] = callApi('GET', '/api/bounties/does-not-exist');
check('GET missing bounty returns 404 not_found',
    $status === 404 && ($payload['error']['code'] ?? null) === 'not_found', json_encode($payload));

// --- list, filter, paginate ---
echo "list\n";
callApi('POST', '/api/bounties', [], validBounty(['title' => 'Indexer API work', 'sponsor' => 'Helius', 'reward_currency' => 'SOL', 'reward_amount' => 2, 'skills' => ['Node.js']]));
callApi('POST', '/api/bounties', [], validBounty(['title' => 'Brand refresh job', 'sponsor' => 'Superteam', 'skills' => ['Graphic Design']]));
[$status, $payload] = callApi('GET', '/api/bounties');
check('GET list returns 3 items with meta', $status === 200 && count($payload['data']) === 3 && $payload['meta']['total'] === 3, json_encode($payload['meta'] ?? []));

[$status, $payload] = callApi('GET', '/api/bounties', ['q' => 'helius']);
check('filter q=helius returns 1', count($payload['data']) === 1 && $payload['data'][0]['sponsor'] === 'Helius');

[$status, $payload] = callApi('GET', '/api/bounties', ['skill' => 'Graphic Design']);
check('filter skill returns 1', count($payload['data']) === 1);

[$status, $payload] = callApi('GET', '/api/bounties', ['page' => '1', 'per_page' => '2']);
check('pagination page 1 returns 2 of 3, total_pages 2',
    count($payload['data']) === 2 && $payload['meta']['total_pages'] === 2, json_encode($payload['meta'] ?? []));
[$status, $payload] = callApi('GET', '/api/bounties', ['page' => '2', 'per_page' => '2']);
check('pagination page 2 returns the remaining 1', count($payload['data']) === 1);

[$status, $payload] = callApi('GET', '/api/bounties', ['status' => 'bogus']);
check('invalid status filter returns 400', $status === 400);

[$status, $payload] = callApi('GET', '/api/bounties', ['per_page' => '101']);
check('per_page over 100 returns 400', $status === 400);

[$status, $payload] = callApi('GET', '/api/bounties', ['page' => '0']);
check('page 0 returns 400', $status === 400);

// --- update ---
echo "update\n";
[$status, $payload] = callApi('PATCH', '/api/bounties/' . $createdId, [], ['status' => 'in-review']);
check('PATCH status to in-review returns 200', $status === 200 && $payload['data']['status'] === 'in-review');

[$status, $payload] = callApi('PATCH', '/api/bounties/' . $createdId, [], ['status' => 'bogus']);
check('PATCH bad status returns 400', $status === 400);

[$status, $payload] = callApi('PATCH', '/api/bounties/' . $createdId, [], ['reward_amount' => -5]);
check('PATCH negative reward returns 400', $status === 400);

[$status, $payload] = callApi('PATCH', '/api/bounties/does-not-exist', [], ['status' => 'closed']);
check('PATCH missing bounty returns 404', $status === 404);

// --- delete + routing errors ---
echo "delete / routing\n";
[$status] = callApi('DELETE', '/api/bounties/' . $createdId);
check('DELETE existing bounty returns 204', $status === 204);
[$status] = callApi('GET', '/api/bounties/' . $createdId);
check('deleted bounty is gone (404)', $status === 404);

[$status] = callApi('DELETE', '/api/bounties/does-not-exist');
check('DELETE missing bounty returns 404', $status === 404);

[$status, $payload] = callApi('GET', '/nope');
check('unknown route returns 404', $status === 404);
[$status, $payload] = callApi('PUT', '/api/bounties');
check('wrong method on known path returns 405', $status === 405, json_encode($payload));

echo "\n{$passed} passed, {$failed} failed\n";
@unlink($tmpDb);
exit($failed === 0 ? 0 : 1);
