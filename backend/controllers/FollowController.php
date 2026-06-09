<?php

require_once __DIR__ . '/../models/Follow.php';
require_once __DIR__ . '/../utils/Response.php';

class FollowController
{
    private Follow $follow;

    public function __construct()
    {
        $this->follow = new Follow();
    }

    public function follow(int $userId): void
    {
        session_start();
        $me = $_SESSION['user_id'] ?? null;
        if (!$me) {
            Response::error('Unauthenticated', 401);
        }
        if ($me === $userId) {
            Response::error('Cannot follow yourself', 400);
        }
        if (!$this->follow->follow($me, $userId)) {
            Response::error('Already following', 409);
        }
        Response::success(null, 'Followed');
    }

    public function unfollow(int $userId): void
    {
        session_start();
        $me = $_SESSION['user_id'] ?? null;
        if (!$me) {
            Response::error('Unauthenticated', 401);
        }
        if (!$this->follow->unfollow($me, $userId)) {
            Response::error('Not following', 404);
        }
        Response::success(null, 'Unfollowed');
    }

    public function followers(int $userId): void
    {
        $limit = (int) ($_GET['limit'] ?? 50);
        $offset = (int) ($_GET['offset'] ?? 0);
        $list = $this->follow->getFollowers($userId, $limit, $offset);
        Response::success($list);
    }

    public function following(int $userId): void
    {
        $limit = (int) ($_GET['limit'] ?? 50);
        $offset = (int) ($_GET['offset'] ?? 0);
        $list = $this->follow->getFollowing($userId, $limit, $offset);
        Response::success($list);
    }
}
