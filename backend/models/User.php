<?php

require_once __DIR__ . '/../config/database.php';

class User
{
    private PDO $db;

    public function __construct()
    {
        $this->db = (new Database())->getConnection();
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT id, username, email, full_name AS name, bio, profile_image AS avatar, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function create(string $username, string $email, string $password, string $name): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$username, $email, password_hash($password, PASSWORD_BCRYPT), $name]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $fields): bool
    {
        $allowed = ['username', 'full_name', 'bio', 'profile_image', 'email'];
        $set = [];
        $values = [];
        foreach ($fields as $k => $v) {
            if (!in_array($k, $allowed)) continue;
            $set[] = "{$k} = ?";
            $values[] = $v;
        }
        if (empty($set)) return false;
        $values[] = $id;
        $sql = "UPDATE users SET " . implode(', ', $set) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($values);
        return $stmt->rowCount() > 0;
    }

    public function search(string $q, int $limit = 20, int $offset = 0): array
    {
        $like = '%' . $q . '%';
        // PDO may quote bound parameters which can break LIMIT/OFFSET in some drivers.
        // Cast to integers and inject directly into the SQL after validation.
        $limit = max(0, (int) $limit);
        $offset = max(0, (int) $offset);

        $sql = "SELECT id, username, full_name AS name, bio, profile_image AS avatar
                FROM users
                WHERE username LIKE ? OR full_name LIKE ?
                LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$like, $like]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
