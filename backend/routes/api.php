<?php

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/TweetController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$auth   = new AuthController();
$tweet  = new TweetController();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$uri        = $_SERVER['REQUEST_URI'] ?? '/';
$path       = trim(parse_url($uri, PHP_URL_PATH), '/');
$scriptDir  = trim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');

if ($scriptDir !== '' && str_starts_with($path, $scriptDir)) {
    $path = ltrim(substr($path, strlen($scriptDir)), '/');
}
$path = preg_replace('#^index\.php/?#i', '', $path);
$path = trim($path, '/');

preg_match('#^api/tweets/(\d+)(?:/(.+))?$#', $path, $m);
$tweetId = isset($m[1]) ? (int)$m[1] : null;
$action  = $m[2] ?? null;

preg_match('#^api/users/(\d+)/tweets$#', $path, $u);
$userId = isset($u[1]) ? (int)$u[1] : null;

$auth_ = fn() => AuthMiddleware::handle();

match (true) {
    $method === 'POST' && $path === 'api/register' => $auth->register(),
    $method === 'POST' && $path === 'api/login'    => $auth->login(),
    $method === 'POST' && $path === 'api/logout'   => $auth->logout(),
    $method === 'GET'  && $path === 'api/me'       => $auth->me(),

    $method === 'POST'   && $path === 'api/tweets'           => $auth_() && $tweet->create(),
    $method === 'GET'    && $path === 'api/tweets'           => $auth_() && $tweet->feed(),
    $method === 'GET'    && $tweetId && !$action             => $auth_() && $tweet->show($tweetId),
    $method === 'DELETE' && $tweetId && !$action             => $auth_() && $tweet->delete($tweetId),
    $method === 'POST'   && $tweetId && $action === 'like'   => $auth_() && $tweet->like($tweetId),
    $method === 'DELETE' && $tweetId && $action === 'like'   => $auth_() && $tweet->unlike($tweetId),
    $method === 'GET'    && $userId !== null                 => $auth_() && $tweet->userTweets($userId),

    default => Response::error('Not found', 404),
};
