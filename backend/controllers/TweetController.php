<?php

require_once __DIR__ . '/../models/Tweet.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

class TweetController
{
    private Tweet $tweet;

    public function __construct()
    {
        $this->tweet = new Tweet();
    }

    public function clearAll(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        if (empty($_SESSION['user_id'])) {
            Response::error('Unauthorized', 401);
        }

        require_once __DIR__ . '/../models/User.php';
        $uModel = new User();
        $u = $uModel->findById($_SESSION['user_id']);
        if (!isset($u['role']) || $u['role'] !== 'admin') {
            Response::error('Forbidden', 403);
        }

        // perform safe deletes
        $this->tweet->clearAll();
        Response::success(null, 'All tweets deleted');
    }

    public function create(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator();
        if (!$v->validate($data, ['content' => 'required|min:1|max:280'])) {
            Response::error('Validation failed', 422, $v->getErrors());
        }

        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $id = $this->tweet->create($_SESSION['user_id'], $data['content']);
        Response::success(['id' => $id], 'Tweet created', 201);
    }

    public function delete(int $id): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();

        // ensure tweet exists
        $tweet = $this->tweet->findById($id);
        if (!$tweet) {
            Response::error('Tweet not found', 404);
        }

        // determine current user and role
        $currentUserId = $_SESSION['user_id'] ?? null;
        $isAdmin = false;
        if ($currentUserId) {
            require_once __DIR__ . '/../models/User.php';
            $uModel = new User();
            $u = $uModel->findById($currentUserId);
            $isAdmin = isset($u['role']) && $u['role'] === 'admin';
        }

        // permission: admin can delete any tweet; user can delete only own tweets
        if (!$isAdmin && $tweet['user_id'] != $currentUserId) {
            Response::error('Forbidden', 403);
        }

        if (!$this->tweet->delete($id, (int)($currentUserId ?? 0), $isAdmin)) {
            Response::error('Tweet not found or unauthorized', 404);
        }

        Response::success(null, 'Tweet deleted');
    }

    public function show(int $id): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $tweet = $this->tweet->findById($id);
        if (!$tweet) {
            Response::error('Tweet not found', 404);
        }
        Response::success($tweet);
    }

    public function feed(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));
        $tweets = $this->tweet->getFeed($limit, $offset);
        Response::success($tweets);
    }

    public function userTweets(int $userId): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));
        $tweets = $this->tweet->getUserTweets($userId, $limit, $offset);
        Response::success($tweets);
    }

    public function like(int $id): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        if (!$this->tweet->like($id, $_SESSION['user_id'])) {
            Response::error('Already liked', 409);
        }
        Response::success(null, 'Liked');
    }

    public function unlike(int $id): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        if (!$this->tweet->unlike($id, $_SESSION['user_id'])) {
            Response::error('Not liked yet', 404);
        }
        Response::success(null, 'Unliked');
    }
}
