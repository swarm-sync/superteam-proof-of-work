<?php

declare(strict_types=1);

namespace BountyApi;

/**
 * Application wiring: builds the router with every route. Used by both the
 * front controller (public/index.php) and the test suite (tests/run_tests.php),
 * so tests exercise the exact same dispatch as the live server.
 */
final class App
{
    public static function router(): Router
    {
        $repo = new BountyRepository(Database::connection());
        $controller = new BountyController($repo);
        $router = new Router();

        $router->add('GET', '/health', static fn (): array => [200, [
            'status' => 'ok',
            'bounties' => $repo->countAll(),
        ]]);

        $router->add('GET', '/api/bounties', [$controller, 'list']);
        $router->add('POST', '/api/bounties', [$controller, 'create']);
        $router->add('GET', '/api/bounties/{id}', [$controller, 'show']);
        $router->add('PATCH', '/api/bounties/{id}', [$controller, 'update']);
        $router->add('DELETE', '/api/bounties/{id}', [$controller, 'delete']);

        return $router;
    }
}
