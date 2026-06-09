<?php

require_once __DIR__ . '/../config/database.php';

class Follow
{
    private PDO $db;

    public function __construct()
    {
        $this->db = (new Database())->getConnection();
    }

    public function follow(int $followerId, int $followingId): bool
    {
        try {
            $stmt = $this->db->prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)");
            $stmt->execute([$followerId, $followingId]);
            return true;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                return false;
            }
            throw $e;
        }
    }

    public function unfollow(int $followerId, int $followingId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?");
        $stmt->execute([$followerId, $followingId]);
        return $stmt->rowCount() > 0;
    }

    public function isFollowing(int $followerId, int $followingId): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1");
        $stmt->execute([$followerId, $followingId]);
        return (bool) $stmt->fetchColumn();
    }

    public function getFollowers(int $userId, int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            "SELECT u.id, u.username, u.full_name AS name, u.profile_image AS avatar
             FROM follows f
             JOIN users u ON f.follower_id = u.id
             WHERE f.following_id = ?
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([$userId, $limit, $offset]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getFollowing(int $userId, int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            "SELECT u.id, u.username, u.full_name AS name, u.profile_image AS avatar
             FROM follows f
             JOIN users u ON f.following_id = u.id
             WHERE f.follower_id = ?
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([$userId, $limit, $offset]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
