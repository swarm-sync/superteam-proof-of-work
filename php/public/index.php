<?php

declare(strict_types=1);

/**
 * Front controller. Run with the built-in server from the project root:
 *   php -S localhost:8080 -t public
 *
 * Requests are parsed here (method, path, query, JSON body) and handed to
 * the router; ApiException becomes a JSON error with the right status code.
 */

use BountyApi\ApiException;
use BountyApi\App;
use BountyApi\Response;

require __DIR__ . '/../src/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = rtrim($uri, '/') ?: '/';

$body = null;
$rawBody = file_get_contents('php://input');
if ($rawBody !== '' && $rawBody !== false) {
    $decoded = json_decode($rawBody, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        Response::error(ApiException::badRequest(
            'Request body is not valid JSON: ' . json_last_error_msg(),
        ));
        exit;
    }
    if (!is_array($decoded)) {
        Response::error(ApiException::badRequest('Request body must be a JSON object.'));
        exit;
    }
    $body = $decoded;
}

try {
    [$status, $payload] = App::router()->dispatch($method, $path, $_GET, $body);
    if ($status === 204 || $payload === null) {
        Response::noContent();
    } else {
        Response::json($payload, $status);
    }
} catch (ApiException $e) {
    Response::error($e);
} catch (\Throwable $e) {
    error_log('Bounty API error: ' . $e->getMessage());
    Response::error(new ApiException(500, 'Internal server error.', [], 'internal_error'));
}
