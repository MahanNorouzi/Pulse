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
        $isAdmin = false;
        // fetch user role
        if (!empty($_SESSION['user_id'])) {
            require_once __DIR__ . '/../models/User.php';
            $uModel = new User();
            $u = $uModel->findById($_SESSION['user_id']);
            $isAdmin = isset($u['role']) && $u['role'] === 'admin';
        }

        if (!$this->tweet->delete($id, $_SESSION['user_id'] ?? 0, $isAdmin)) {
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
        $limit = (int) ($_GET['limit'] ?? 20);
        $offset = (int) ($_GET['offset'] ?? 0);
        $tweets = $this->tweet->getFeed($limit, $offset);
        Response::success($tweets);
    }

    public function userTweets(int $userId): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $limit = (int) ($_GET['limit'] ?? 20);
        $offset = (int) ($_GET['offset'] ?? 0);
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
