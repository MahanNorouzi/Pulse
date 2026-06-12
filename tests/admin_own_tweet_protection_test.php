<?php
$base = $argv[1] ?? 'http://localhost/Pulse/backend/index.php/api';
$cookieAdmin = __DIR__ . '/cookies_admin_admin.txt';
$cookieUser = __DIR__ . '/cookies_admin_testuser.txt';

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

// 1) Login admin
$loginAdmin = request('POST', '/login', ['email' => 'admin@example.com', 'password' => 'password'], $cookieAdmin, $cookieAdmin);
ok($loginAdmin['status'] === 200, "admin login status={$loginAdmin['status']}");
$adminId = $loginAdmin['body']['data']['id'] ?? null;

// 2) Admin creates a tweet
$createAdmin = request('POST', '/tweets', ['content' => 'Admin own tweet protection test'], $cookieAdmin, $cookieAdmin);
ok($createAdmin['status'] === 201, "admin create status={$createAdmin['status']}");
$adminTweetId = $createAdmin['body']['data']['id'] ?? null;

if (!$adminTweetId) {
    echo "no admin tweet id, aborting\n";
    exit(1);
}

// 3) Login as regular test user
$loginUser = request('POST', '/login', ['email' => 'test@example.com', 'password' => 'password'], $cookieUser, $cookieUser);
ok($loginUser['status'] === 200, "user login status={$loginUser['status']}");

// 4) Regular user attempts to delete admin's tweet (should fail)
$deleteAttempt = request('DELETE', "/tweets/{$adminTweetId}", null, $cookieUser, $cookieUser);
ok($deleteAttempt['status'] === 404 || $deleteAttempt['status'] === 403, "user delete admin tweet attempt status={$deleteAttempt['status']}");

// 5) Admin deletes own tweet (should succeed)
$deleteAdmin = request('DELETE', "/tweets/{$adminTweetId}", null, $cookieAdmin, $cookieAdmin);
ok(in_array($deleteAdmin['status'], [200, 204]), "admin delete own tweet status={$deleteAdmin['status']}");

// 6) Verify gone
$show = request('GET', "/tweets/{$adminTweetId}", null, $cookieAdmin, $cookieAdmin);
ok($show['status'] === 404, "admin tweet gone check status={$show['status']}");

echo "\nAdmin own-tweet protection test finished.\n";
exit(0);
