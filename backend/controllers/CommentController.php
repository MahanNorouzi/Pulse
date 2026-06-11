<?php

require_once __DIR__ . '/../models/Comment.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/Response.php';

class CommentController
{
    private Comment $comment;
    private User $userModel;

    public function __construct()
    {
        $this->comment = new Comment();
        $this->userModel = new User();
    }

    public function create(int $tweetId): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $me = $_SESSION['user_id'] ?? null;
        if (!$me) Response::error('Unauthenticated', 401);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($data['content'])) Response::error('Content required', 422);
        $id = $this->comment->create($me, $tweetId, $data['content']);
        Response::success(['id' => $id], 'Comment created', 201);
    }

    public function list(int $tweetId): void
    {
        $list = $this->comment->findByTweet($tweetId);
        Response::success($list);
    }

    public function delete(int $commentId): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $me = $_SESSION['user_id'] ?? null;
        if (!$me) Response::error('Unauthenticated', 401);
        $c = $this->comment->findById($commentId);
        if (!$c) Response::error('Comment not found', 404);
        $meUser = $this->userModel->findById($me);
        $isAdmin = isset($meUser['role']) && in_array($meUser['role'], ['admin', 'verified_admin']);
        if ($c['user_id'] !== $me && !$isAdmin) Response::error('Forbidden', 403);
        if ($this->comment->delete($commentId)) Response::success(null, 'Deleted');
        Response::error('Delete failed', 400);
    }
}
