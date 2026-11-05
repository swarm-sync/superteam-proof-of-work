<?php

declare(strict_types=1);

namespace BountyApi;

/**
 * Minimal router: exact + {param} segment patterns, per-method dispatch.
 * Dispatch is deliberately testable: it takes method/path/query/body and
 * returns [status, payload] instead of echoing, so the test suite can run
 * the whole API in-process without a web server.
 */
final class Router
{
    /** @var array<int, array{method: string, pattern: string, handler: callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = ['method' => $method, 'pattern' => $pattern, 'handler' => $handler];
    }

    /**
     * @param array<string, string> $query
     * @param array<string, mixed>|null $body decoded JSON body (null = no body sent)
     * @return array{0: int, 1: mixed} [http status, payload array|null]
     */
    public function dispatch(string $method, string $path, array $query = [], ?array $body = null): array
    {
        $pathMatched = false;
        foreach ($this->routes as $route) {
            $params = $this->match($route['pattern'], $path);
            if ($params === null) {
                continue;
            }
            $pathMatched = true;
            if ($route['method'] !== $method) {
                continue;
            }
            return ($route['handler'])($params, $query, $body);
        }
        if ($pathMatched) {
            throw ApiException::methodNotAllowed();
        }
        throw ApiException::notFound('Route not found: ' . $method . ' ' . $path);
    }

    /** @return array<string, string>|null path params, or null when no match */
    private function match(string $pattern, string $path): ?array
    {
        $patternParts = explode('/', trim($pattern, '/'));
        $pathParts = explode('/', trim($path, '/'));
        if (count($patternParts) !== count($pathParts)) {
            return null;
        }
        $params = [];
        foreach ($patternParts as $i => $part) {
            if (str_starts_with($part, '{') && str_ends_with($part, '}')) {
                $params[trim($part, '{}')] = urldecode($pathParts[$i]);
            } elseif ($part !== $pathParts[$i]) {
                return null;
            }
        }
        return $params;
    }
}
