<?php

declare(strict_types=1);

namespace BountyApi;

/** Small JSON-response helper: one shape for success, one for errors. */
final class Response
{
    /**
     * @param mixed $data already JSON-serialisable payload
     */
    public static function json(mixed $data, int $status = 200, array $headers = []): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        foreach ($headers as $name => $value) {
            header("{$name}: {$value}");
        }
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public static function error(ApiException $e): void
    {
        $body = ['error' => ['code' => $e->errorCode, 'message' => $e->getMessage()]];
        if ($e->details !== []) {
            $body['error']['details'] = $e->details;
        }
        self::json($body, $e->status);
    }

    public static function noContent(): void
    {
        http_response_code(204);
    }
}
