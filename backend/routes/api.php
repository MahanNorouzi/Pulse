<?php

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/TweetController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/FollowController.php';
// comments removed: no longer supported
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$auth   = new AuthController();
$tweet  = new TweetController();
$user   = new UserController();
$follow = new FollowController();
$comment = null;
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
    // User tweets (by user)
    $method === 'GET'    && $userId !== null                 => $auth_() && $tweet->userTweets($userId),

    // User profile
    $method === 'GET'    && preg_match('#^api/users/(\d+)$#', $path, $p) => $user->show((int)$p[1]),
    $method === 'PUT'    && preg_match('#^api/users/(\d+)$#', $path, $p) => $auth_() && $user->update((int)$p[1]),

    // Follow/unfollow
    $method === 'POST'   && preg_match('#^api/users/(\d+)/follow$#', $path, $f) => $auth_() && $follow->follow((int)$f[1]),
    $method === 'DELETE' && preg_match('#^api/users/(\d+)/follow$#', $path, $f) => $auth_() && $follow->unfollow((int)$f[1]),

    // Followers / Following lists
    $method === 'GET'    && preg_match('#^api/users/(\d+)/followers$#', $path, $ff) => $user->followers((int)$ff[1]),
    $method === 'GET'    && preg_match('#^api/users/(\d+)/following$#', $path, $ff) => $user->following((int)$ff[1]),

    // Search
    $method === 'GET'    && $path === 'api/search'                     => $user->search(),

    // Comments removed - endpoints deprecated

    default => Response::error('Not found', 404),
};
