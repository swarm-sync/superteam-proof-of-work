<?php

declare(strict_types=1);

namespace BountyApi;

/** HTTP handlers for the bounty endpoints. Pure functions over the repository. */
final class BountyController
{
    public function __construct(private readonly BountyRepository $repo)
    {
    }

    /** GET /api/bounties — list with filters + pagination. */
    public function list(array $params, array $query, ?array $body): array
    {
        $page = Validator::pagination($query);
        $status = isset($query['status']) && $query['status'] !== '' ? $query['status'] : null;
        $skill = isset($query['skill']) && $query['skill'] !== '' ? $query['skill'] : null;
        $q = isset($query['q']) && $query['q'] !== '' ? trim($query['q']) : null;

        $total = $this->repo->count($status, $skill, $q);
        $items = $this->repo->all($status, $skill, $q, $page['page'], $page['per_page']);

        return [200, [
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => $page['page'],
                'per_page' => $page['per_page'],
                'total_pages' => (int) ceil($total / $page['per_page']),
            ],
        ]];
    }

    /** GET /api/bounties/{id} */
    public function show(array $params, array $query, ?array $body): array
    {
        $bounty = $this->repo->find($params['id'])
            ?? throw ApiException::notFound('No bounty with id ' . $params['id'] . '.');
        return [200, ['data' => $bounty]];
    }

    /** POST /api/bounties — 201 with the created bounty. */
    public function create(array $params, array $query, ?array $body): array
    {
        if ($body === null) {
            throw ApiException::badRequest('Request body must be a JSON object.');
        }
        $data = Validator::bounty($body);
        return [201, ['data' => $this->repo->create($data)]];
    }

    /** PATCH /api/bounties/{id} — partial update; 404 when missing. */
    public function update(array $params, array $query, ?array $body): array
    {
        if ($body === null) {
            throw ApiException::badRequest('Request body must be a JSON object.');
        }
        $existing = $this->repo->find($params['id'])
            ?? throw ApiException::notFound('No bounty with id ' . $params['id'] . '.');
        if ($body === []) {
            return [200, ['data' => $existing]];
        }
        $data = Validator::bounty($body, partial: true);
        $updated = $this->repo->update($params['id'], $data);
        return [200, ['data' => $updated]];
    }

    /** DELETE /api/bounties/{id} — 204, no body. */
    public function delete(array $params, array $query, ?array $body): array
    {
        if (!$this->repo->delete($params['id'])) {
            throw ApiException::notFound('No bounty with id ' . $params['id'] . '.');
        }
        return [204, null];
    }
}
