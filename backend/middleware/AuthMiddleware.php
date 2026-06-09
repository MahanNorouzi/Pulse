<?php

require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware
{
    public static function handle(): bool
    {
        session_start();
        if (empty($_SESSION['user_id'])) {
            Response::error('Unauthenticated', 401);
        }
        return true;
    }
}
