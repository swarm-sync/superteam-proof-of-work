<?php

declare(strict_types=1);

namespace BountyApi;

/**
 * Persistence for bounties. Skills are stored as a JSON array in one column
 * (simple and honest for this size of app); everything else is a plain
 * column with prepared statements throughout — no string-built SQL.
 */
final class BountyRepository
{
    public function __construct(private readonly \PDO $pdo)
    {
    }

    /** @return array<int, array<string, mixed>> decoded rows, newest first */
    public function all(?string $status, ?string $skill, ?string $query, int $page, int $perPage): array
    {
        [$where, $params] = $this->filters($status, $skill, $query);
        $sql = "SELECT * FROM bounties {$where} ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $name => $value) {
            $stmt->bindValue($name, $value);
        }
        $stmt->bindValue(':limit', $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', ($page - 1) * $perPage, \PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'decode'], $stmt->fetchAll());
    }

    public function count(?string $status, ?string $skill, ?string $query): int
    {
        [$where, $params] = $this->filters($status, $skill, $query);
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM bounties {$where}");
        foreach ($params as $name => $value) {
            $stmt->bindValue($name, $value);
        }
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM bounties WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $this->decode($row);
    }

    /** @param array<string, mixed> $data validated fields */
    public function create(array $data): array
    {
        $id = 'b-' . bin2hex(random_bytes(6));
        $stmt = $this->pdo->prepare(
            'INSERT INTO bounties
                (id, title, sponsor, description, reward_amount, reward_currency,
                 status, skills, submissions, deadline, created_at)
             VALUES
                (:id, :title, :sponsor, :description, :reward_amount, :reward_currency,
                 \'open\', :skills, 0, :deadline, :created_at)',
        );
        $stmt->execute([
            ':id' => $id,
            ':title' => $data['title'],
            ':sponsor' => $data['sponsor'],
            ':description' => $data['description'],
            ':reward_amount' => $data['reward_amount'],
            ':reward_currency' => $data['reward_currency'],
            ':skills' => json_encode($data['skills']),
            ':deadline' => $data['deadline'],
            ':created_at' => date('Y-m-d'),
        ]);
        return $this->find($id) ?? throw new \RuntimeException('Insert succeeded but row is missing.');
    }

    /**
     * @param array<string, mixed> $data validated fields (partial)
     * @return array<string, mixed>|null null when the id does not exist
     */
    public function update(string $id, array $data): ?array
    {
        if ($data === []) {
            return $this->find($id);
        }
        $sets = [];
        $params = [':id' => $id];
        foreach ($data as $field => $value) {
            if ($field === 'skills') {
                $value = json_encode($value);
            }
            $sets[] = "{$field} = :{$field}";
            $params[":{$field}"] = $value;
        }
        $stmt = $this->pdo->prepare(
            'UPDATE bounties SET ' . implode(', ', $sets) . ' WHERE id = :id',
        );
        $stmt->execute($params);
        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM bounties WHERE id = :id');
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function countAll(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM bounties')->fetchColumn();
    }

    /** Builds the shared WHERE clause for list + count. */
    private function filters(?string $status, ?string $skill, ?string $query): array
    {
        $clauses = [];
        $params = [];
        if ($status !== null && $status !== '') {
            if (!in_array($status, Validator::STATUSES, true)) {
                throw ApiException::badRequest('Invalid status filter.', [
                    'status' => 'Status must be one of: ' . implode(', ', Validator::STATUSES) . '.',
                ]);
            }
            $clauses[] = 'status = :status';
            $params[':status'] = $status;
        }
        if ($skill !== null && $skill !== '') {
            // Skills are a JSON array; match the exact quoted skill string.
            $clauses[] = 'skills LIKE :skill';
            $params[':skill'] = '%"' . str_replace(['%', '_', '"'], ['\\%', '\\_', '\\"'], $skill) . '"%';
        }
        if ($query !== null && $query !== '') {
            $clauses[] = '(title LIKE :q OR sponsor LIKE :q)';
            $params[':q'] = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        }
        $where = $clauses === [] ? '' : 'WHERE ' . implode(' AND ', $clauses);
        return [$where, $params];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function decode(array $row): array
    {
        $row['skills'] = json_decode((string) $row['skills'], true) ?? [];
        $row['reward_amount'] = (float) $row['reward_amount'];
        $row['submissions'] = (int) $row['submissions'];
        return $row;
    }
}
