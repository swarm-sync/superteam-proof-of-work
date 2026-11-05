<?php

declare(strict_types=1);

namespace BountyApi;

/**
 * Validation for bounty payloads. Rules (shared by create + update):
 *  - title: required, at least 5 characters
 *  - sponsor: required
 *  - description: required, at least 20 characters
 *  - reward_amount: required, number > 0
 *  - reward_currency: required, SOL or USDC
 *  - skills: required, non-empty array of non-empty strings
 *  - deadline: required, YYYY-MM-DD date strictly in the future
 *  - status: one of open / in-review / awarded / closed (updates only)
 *
 * Returns the cleaned values; throws ApiException(400) with per-field
 * details on the first problem found per field.
 */
final class Validator
{
    public const STATUSES = ['open', 'in-review', 'awarded', 'closed'];
    public const CURRENCIES = ['SOL', 'USDC'];

    /**
     * @param array<string, mixed> $input decoded JSON body
     * @param bool $partial true for PATCH: only validate fields that are present
     * @return array<string, mixed> cleaned values (only validated fields)
     */
    public static function bounty(array $input, bool $partial = false): array
    {
        $errors = [];
        $clean = [];

        $present = static fn (string $field): bool =>
            array_key_exists($field, $input) && $input[$field] !== null;

        // --- title ---
        if ($present('title') || !$partial) {
            $title = is_string($input['title'] ?? null) ? trim($input['title']) : '';
            if ($title === '') {
                $errors['title'] = 'Title is required.';
            } elseif (mb_strlen($title) < 5) {
                $errors['title'] = 'Title needs at least 5 characters.';
            } else {
                $clean['title'] = $title;
            }
        }

        // --- sponsor ---
        if ($present('sponsor') || !$partial) {
            $sponsor = is_string($input['sponsor'] ?? null) ? trim($input['sponsor']) : '';
            if ($sponsor === '') {
                $errors['sponsor'] = 'Sponsor is required.';
            } else {
                $clean['sponsor'] = $sponsor;
            }
        }

        // --- description ---
        if ($present('description') || !$partial) {
            $desc = is_string($input['description'] ?? null) ? trim($input['description']) : '';
            if ($desc === '') {
                $errors['description'] = 'Description is required.';
            } elseif (mb_strlen($desc) < 20) {
                $errors['description'] = 'Description needs at least 20 characters.';
            } else {
                $clean['description'] = $desc;
            }
        }

        // --- reward_amount ---
        if ($present('reward_amount') || !$partial) {
            $amount = $input['reward_amount'] ?? null;
            if (!is_numeric($amount)) {
                $errors['reward_amount'] = 'Reward amount must be a number.';
            } elseif ((float) $amount <= 0) {
                $errors['reward_amount'] = 'Reward amount must be more than 0.';
            } else {
                $clean['reward_amount'] = (float) $amount;
            }
        }

        // --- reward_currency ---
        if ($present('reward_currency') || !$partial) {
            $currency = $input['reward_currency'] ?? null;
            if (!in_array($currency, self::CURRENCIES, true)) {
                $errors['reward_currency'] = 'Reward currency must be SOL or USDC.';
            } else {
                $clean['reward_currency'] = $currency;
            }
        }

        // --- skills ---
        if ($present('skills') || !$partial) {
            $skills = $input['skills'] ?? null;
            if (!is_array($skills)) {
                $errors['skills'] = 'Skills must be an array.';
            } else {
                $cleaned = array_values(array_unique(array_filter(
                    array_map(static fn ($s) => is_string($s) ? trim($s) : '', $skills),
                    static fn (string $s): bool => $s !== '',
                )));
                if ($cleaned === []) {
                    $errors['skills'] = 'Pick at least one skill.';
                } else {
                    $clean['skills'] = $cleaned;
                }
            }
        }

        // --- deadline ---
        if ($present('deadline') || !$partial) {
            $deadline = is_string($input['deadline'] ?? null) ? trim($input['deadline']) : '';
            if ($deadline === '') {
                $errors['deadline'] = 'Deadline is required.';
            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadline)) {
                $errors['deadline'] = 'Deadline must be a YYYY-MM-DD date.';
            } elseif (!checkdate(
                (int) substr($deadline, 5, 2),
                (int) substr($deadline, 8, 2),
                (int) substr($deadline, 0, 4),
            )) {
                $errors['deadline'] = 'Deadline is not a real calendar date.';
            } elseif ($deadline <= date('Y-m-d')) {
                $errors['deadline'] = 'Deadline must be a future date.';
            } else {
                $clean['deadline'] = $deadline;
            }
        }

        // --- status (updates only; creation always starts as "open") ---
        if ($present('status')) {
            $status = $input['status'];
            if (!in_array($status, self::STATUSES, true)) {
                $errors['status'] = 'Status must be one of: ' . implode(', ', self::STATUSES) . '.';
            } else {
                $clean['status'] = $status;
            }
        }

        if ($errors !== []) {
            throw ApiException::badRequest('Validation failed.', $errors);
        }
        return $clean;
    }

    /**
     * Validates list-query pagination: page >= 1, 1 <= per_page <= 100.
     * @param array<string, string> $query
     * @return array{page: int, per_page: int}
     */
    public static function pagination(array $query): array
    {
        $page = isset($query['page']) ? (int) $query['page'] : 1;
        $perPage = isset($query['per_page']) ? (int) $query['per_page'] : 10;
        $errors = [];
        if ((string) ($query['page'] ?? '1') !== (string) $page || $page < 1) {
            $errors['page'] = 'Page must be a whole number of 1 or more.';
        }
        if ((string) ($query['per_page'] ?? '10') !== (string) $perPage || $perPage < 1 || $perPage > 100) {
            $errors['per_page'] = 'Per page must be a whole number between 1 and 100.';
        }
        if ($errors !== []) {
            throw ApiException::badRequest('Invalid pagination.', $errors);
        }
        return ['page' => $page, 'per_page' => $perPage];
    }
}
