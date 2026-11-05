<?php

declare(strict_types=1);

namespace BountyApi;

/**
 * A single JSON error carrying the HTTP status it should be answered with.
 * Controllers throw these; the front controller converts them to responses.
 */
final class ApiException extends \RuntimeException
{
    /** @var array<string, mixed> */
    public readonly array $details;

    /** Machine-readable error code, e.g. "validation_error" (NOT Exception::$code). */
    public readonly string $errorCode;

    /**
     * @param array<string, mixed> $details field-level errors, e.g. ['title' => '...']
     */
    public function __construct(
        public readonly int $status,
        string $message,
        array $details = [],
        string $code = 'error',
    ) {
        parent::__construct($message);
        $this->details = $details;
        $this->errorCode = $code;
    }

    public static function badRequest(string $message, array $details = []): self
    {
        return new self(400, $message, $details, 'validation_error');
    }

    public static function notFound(string $message = 'Resource not found'): self
    {
        return new self(404, $message, [], 'not_found');
    }

    public static function methodNotAllowed(string $message = 'Method not allowed'): self
    {
        return new self(405, $message, [], 'method_not_allowed');
    }
}
