<?php

require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware
{
    public static function handle(): void
    {
        session_start();
        if (empty($_SESSION['user_id'])) {
            Response::error('Unauthenticated', 401);
        }
    }
}
