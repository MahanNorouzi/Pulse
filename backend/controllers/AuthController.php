<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

class AuthController
{

    private User $user;

    public function __construct()
    {
        $this->user = new User();
    }

    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator();
        if (!$v->validate($data, [
            'username' => 'required|min:3|max:30',
            'email'    => 'required|email',
            'password' => 'required|min:8|max:64',
            'name'     => 'required|min:2|max:50',
        ])) {
            Response::error('Validation failed', 422, $v->getErrors());
        }

        if ($this->user->findByEmail($data['email'])) {
            Response::error('Email already taken', 409);
        }
        if ($this->user->findByUsername($data['username'])) {
            Response::error('Username already taken', 409);
        }

        $id = $this->user->create($data['username'], $data['email'], $data['password'], $data['name']);

        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $_SESSION['user_id'] = $id;

        Response::success(['id' => $id], 'Registered successfully', 201);
    }

    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator();
        if (!$v->validate($data, [
            'email'    => 'required|email',
            'password' => 'required',
        ])) {
            Response::error('Validation failed', 422, $v->getErrors());
        }

        $user = $this->user->findByEmail($data['email']);
        if (!$user || !password_verify($data['password'], $user['password'])) {
            Response::error('Invalid credentials', 401);
        }

        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $_SESSION['user_id'] = $user['id'];

        unset($user['password']);
        Response::success($user, 'Logged in');
    }

    public function logout(): void
    {
        session_start();
        session_destroy();
        Response::success(null, 'Logged out');
    }

    public function me(): void
    {
        session_start();
        if (empty($_SESSION['user_id'])) {
            Response::error('Unauthenticated', 401);
        }
        $user = $this->user->findById($_SESSION['user_id']);
        Response::success($user);
    }
}
