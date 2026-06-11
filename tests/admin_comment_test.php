<?php
$base = $argv[1] ?? 'http://localhost/Pulse/backend/index.php/api';
$cookieA = __DIR__ . '/cookie_admin_tweet.txt';
$cookieB = __DIR__ . '/cookie_admin_commenter.txt';
$cookieAdmin = __DIR__ . '/cookie_admin_admin.txt';

function request($method, $path, $data = null, $cookieJar = null, $cookieFile = null)
{
    global $base;
    $url = rtrim($base, '/') . '/' . ltrim($path, '/');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    $headers = ['Accept: application/json'];
    if ($data !== null) {
        $json = json_encode($data);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        $headers[] = 'Content-Type: application/json';
    }
    if ($cookieJar) curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieJar);
    if ($cookieFile) curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    if ($res === false) {
        $err = curl_error($ch);
        curl_close($ch);
        return ['status' => 0, 'error' => $err];
    }
    $info = curl_getinfo($ch);
    $http = $info['http_code'] ?? 0;
    curl_close($ch);
    $body = json_decode($res, true);
    return ['status' => $http, 'body' => $body, 'raw' => $res];
}

function ok($cond, $msg)
{
    if ($cond) {
        echo "[OK] $msg\n";
        return true;
    }
    echo "[FAIL] $msg\n";
    return false;
}

echo "Base URL: $base\n";

// 1) Login test user
echo "\n1) Login test user\n";
$login = request('POST', '/login', ['email' => 'test@example.com', 'password' => 'password'], $cookieA, $cookieA);
ok($login['status'] === 200, "login status={$login['status']}");
$testUserId = $login['body']['data']['id'] ?? null;

// 2) Create a tweet as testuser
echo "\n2) Create a tweet as testuser\n";
$create = request('POST', '/tweets', ['content' => 'Admin deletion test tweet'], $cookieA, $cookieA);
ok($create['status'] === 201, "create tweet status={$create['status']}");
$tweetId = $create['body']['data']['id'] ?? null;

if (!$tweetId) {
    echo "No tweet id, aborting\n";
    exit(1);
}

// 3) Register commenter
echo "\n3) Register commenter\n";
$rand = rand(1000, 9999);
$newEmail = "commenter{$rand}@example.com";
$reg = request('POST', '/register', ['username' => "commenter{$rand}", 'email' => $newEmail, 'password' => 'password123', 'name' => 'Commenter'], $cookieB, $cookieB);
ok(in_array($reg['status'], [200, 201]), "register status={$reg['status']}");

// 4) Create comment as commenter
echo "\n4) Create comment as commenter\n";
$comment = request('POST', "/tweets/{$tweetId}/comments", ['content' => 'Comment for admin deletion test'], $cookieB, $cookieB);
ok(in_array($comment['status'], [200, 201, 201]), "create comment status={$comment['status']}");
$commentId = $comment['body']['data']['id'] ?? null;

if (!$commentId) {
    echo "No comment id, aborting\n";
    exit(1);
}

// 5) Login admin
echo "\n5) Login admin\n";
$loginA = request('POST', '/login', ['email' => 'admin@example.com', 'password' => 'password'], $cookieAdmin, $cookieAdmin);
ok($loginA['status'] === 200, "admin login status={$loginA['status']}");

// 6) Admin deletes comment
echo "\n6) Admin deletes comment\n";
$del = request('DELETE', "/comments/{$commentId}", null, $cookieAdmin, $cookieAdmin);
ok(in_array($del['status'], [200, 204]), "admin delete status={$del['status']}");

// 7) Verify deletion
echo "\n7) Verify deletion\n";
$after = request('GET', "/tweets/{$tweetId}/comments", null, $cookieB, $cookieB);
$exists = false;
if ($after['status'] === 200 && is_array($after['body'])) {
    foreach ($after['body'] as $c) {
        if (isset($c['id']) && $c['id'] == $commentId) {
            $exists = true;
            break;
        }
    }
}
ok(!$exists, "comment absent after deletion (exists={$exists})");

echo "\nAdmin comment deletion test finished.\n";
exit(0);
