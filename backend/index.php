<?php
// Load .env manually (no library needed)
$lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (str_starts_with(trim($line), '#')) continue;
    [$key, $value] = explode('=', $line, 2);
    $_ENV[trim($key)] = trim($value);
}

// Harden session cookie settings from env
$secure = filter_var($_ENV['SESSION_SECURE'] ?? false, FILTER_VALIDATE_BOOLEAN);
$httponly = true;
$samesite = $_ENV['SESSION_SAMESITE'] ?? 'Lax';
session_set_cookie_params([
    'lifetime' => (int)($_ENV['SESSION_LIFETIME'] ?? 0),
    'path' => '/',
    'domain' => $_ENV['SESSION_DOMAIN'] ?? '',
    'secure' => $secure,
    'httponly' => $httponly,
    'samesite' => $samesite,
]);

require_once 'routes/api.php';
