<?php

require_once __DIR__ . '/../config/database.php';

class Tweet
{
    private PDO $db;

    public function __construct()
    {
        $this->db = (new Database())->getConnection();
    }

    public function create(int $userId, string $content): int
    {
        $stmt = $this->db->prepare("INSERT INTO tweet (user_id, content) VALUES (?, ?)");
        $stmt->execute([$userId, $content]);
        return (int) $this->db->lastInsertId();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT t.*, u.username, u.full_name AS name, u.profile_image AS avatar,
                   (SELECT COUNT(*) FROM likes WHERE tweet_id = t.id) as likes_count,
                   EXISTS(SELECT 1 FROM likes WHERE tweet_id = t.id AND user_id = ?) as is_liked
            FROM tweet t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?"
        );
        $stmt->bindValue(1, ($_SESSION['user_id'] ?? 0), PDO::PARAM_INT);
        $stmt->bindValue(2, $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function delete(int $id, int $userId, bool $isAdmin = false): bool
    {
        if ($isAdmin) {
            $stmt = $this->db->prepare("DELETE FROM tweet WHERE id = ?");
            $stmt->execute([$id]);
        } else {
            $stmt = $this->db->prepare("DELETE FROM tweet WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
        }
        return $stmt->rowCount() > 0;
    }

    public function getFeed(int $limit = 20, int $offset = 0): array
    {
        $sql = "SELECT t.*, u.username, u.full_name AS name, u.profile_image AS avatar,
                   (SELECT COUNT(*) FROM likes WHERE tweet_id = t.id) as likes_count,
                   EXISTS(SELECT 1 FROM likes WHERE tweet_id = t.id AND user_id = ?) as is_liked
            FROM tweet t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, ($_SESSION['user_id'] ?? 0), PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUserTweets(int $userId, int $limit = 20, int $offset = 0): array
    {
        $sql = "SELECT t.*, u.username, u.full_name AS name, u.profile_image AS avatar,
                   (SELECT COUNT(*) FROM likes WHERE tweet_id = t.id) as likes_count,
                   EXISTS(SELECT 1 FROM likes WHERE tweet_id = t.id AND user_id = ?) as is_liked
            FROM tweet t
            JOIN users u ON t.user_id = u.id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, ($_SESSION['user_id'] ?? 0), PDO::PARAM_INT);
        $stmt->bindValue(2, $userId, PDO::PARAM_INT);
        $stmt->bindValue(3, $limit, PDO::PARAM_INT);
        $stmt->bindValue(4, $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function like(int $tweetId, int $userId): bool
    {
        try {
            $stmt = $this->db->prepare("INSERT INTO likes (tweet_id, user_id) VALUES (?, ?)");
            $stmt->execute([$tweetId, $userId]);
            return true;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                return false;
            }
            throw $e;
        }
    }

    public function unlike(int $tweetId, int $userId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM likes WHERE tweet_id = ? AND user_id = ?");
        $stmt->execute([$tweetId, $userId]);
        return $stmt->rowCount() > 0;
    }
}
