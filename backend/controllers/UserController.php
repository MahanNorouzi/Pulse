<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/Response.php';

class UserController
{
    private User $user;

    public function __construct()
    {
        $this->user = new User();
    }

    public function show(int $id): void
    {
        $u = $this->user->findById($id);
        if (!$u) {
            Response::error('User not found', 404);
        }
        Response::success($u);
    }

    public function showByUsername(string $username): void
    {
        $u = $this->user->findByUsername($username);
        if (!$u) {
            Response::error('User not found', 404);
        }
        Response::success($u);
    }

    public function update(int $id): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $me = $_SESSION['user_id'] ?? null;
        if (!$me || $me !== $id) {
            Response::error('Unauthorized', 401);
        }
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $allowed = [];
        if (isset($data['name'])) $allowed['full_name'] = $data['name'];
        if (isset($data['bio'])) $allowed['bio'] = $data['bio'];
        if (isset($data['profile_image'])) $allowed['profile_image'] = $data['profile_image'];
        if (isset($data['username'])) $allowed['username'] = $data['username'];
        if (empty($allowed)) {
            Response::error('Nothing to update', 422);
        }
        if ($this->user->update($id, $allowed)) {
            Response::success(null, 'Profile updated');
        }
        Response::error('Update failed', 400);
    }

    public function followers(int $id): void
    {
        $limit = (int) ($_GET['limit'] ?? 50);
        $offset = (int) ($_GET['offset'] ?? 0);
        $followers = (new Follow())->getFollowers($id, $limit, $offset);
        Response::success($followers);
    }

    public function following(int $id): void
    {
        $limit = (int) ($_GET['limit'] ?? 50);
        $offset = (int) ($_GET['offset'] ?? 0);
        $following = (new Follow())->getFollowing($id, $limit, $offset);
        Response::success($following);
    }

    public function search(): void
    {
        $q = $_GET['q'] ?? '';
        if ($q === '') {
            Response::error('Query required', 422);
        }
        $limit = (int) ($_GET['limit'] ?? 20);
        $offset = (int) ($_GET['offset'] ?? 0);
        $results = $this->user->search($q, $limit, $offset);
        Response::success($results);
    }
}
