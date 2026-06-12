<?php
$base = $argv[1] ?? 'http://localhost/Pulse/backend/index.php/api';
$cookieA = __DIR__ . '/cookies_admin_testuser.txt';
$cookieAdmin = __DIR__ . '/cookies_admin_admin.txt';

// no helpers file needed

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

// 1) Login test user
$login = request('POST', '/login', ['email' => 'test@example.com', 'password' => 'password'], $cookieA, $cookieA);
ok($login['status'] === 200, "login status={$login['status']}");
$testUserId = $login['body']['data']['id'] ?? null;

// 2) Create a tweet as testuser
$create = request('POST', '/tweets', ['content' => 'Admin delete tweet test'], $cookieA, $cookieA);
ok($create['status'] === 201, "create tweet status={$create['status']}");
$tweetId = $create['body']['data']['id'] ?? null;

if (!$tweetId) {
    echo "no tweet id, aborting\n";
    exit(1);
}

// 3) Login admin
$loginAdmin = request('POST', '/login', ['email' => 'admin@example.com', 'password' => 'password'], $cookieAdmin, $cookieAdmin);
ok($loginAdmin['status'] === 200, "admin login status={$loginAdmin['status']}");

// 4) Admin deletes the tweet
$delete = request('DELETE', "/tweets/{$tweetId}", null, $cookieAdmin, $cookieAdmin);
ok(in_array($delete['status'], [200, 204]), "admin delete status={$delete['status']}");

// 5) Verify tweet gone
$show = request('GET', "/tweets/{$tweetId}", null, $cookieA, $cookieA);
ok($show['status'] === 404, "tweet show after deletion status={$show['status']}");

echo "\nAdmin tweet delete test finished.\n";
exit(0);
