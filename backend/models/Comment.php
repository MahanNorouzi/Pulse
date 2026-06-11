<?php

require_once __DIR__ . '/../config/database.php';

class Comment
{
    private PDO $db;

    public function __construct()
    {
        $this->db = (new Database())->getConnection();
    }

    public function create(int $userId, int $tweetId, string $content): int
    {
        $stmt = $this->db->prepare("INSERT INTO comments (user_id, tweet_id, content) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $tweetId, $content]);
        return (int) $this->db->lastInsertId();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT c.*, u.username, u.full_name AS name, u.profile_image AS avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function findByTweet(int $tweetId): array
    {
        $stmt = $this->db->prepare("SELECT c.*, u.username, u.full_name AS name, u.profile_image AS avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.tweet_id = ? ORDER BY c.created_at ASC");
        $stmt->execute([$tweetId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM comments WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
