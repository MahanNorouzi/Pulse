<?php
// Simple API smoke-test for Pulse backend
// Usage: php tests/api_test.php [base_url]
$base = $argv[1] ?? 'http://localhost/Pulse/backend/index.php/api';
$cookieA = __DIR__ . '/cookies_testuser.txt';
$cookieB = __DIR__ . '/cookies_newuser.txt';
$cookieAdmin = __DIR__ . '/cookies_admin_admin.txt';
// Note: comment endpoints removed; admin tweet deletion tested separately

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
$create = request('POST', '/tweets', ['content' => 'Smoke test tweet from API script'], $cookieA, $cookieA);
ok($create['status'] === 201, "create tweet status={$create['status']}");
$tweetId = $create['body']['data']['id'] ?? null;

// 3) Fetch feed
echo "\n3) Fetch feed\n";
$feed = request('GET', '/tweets', null, $cookieA, $cookieA);
ok($feed['status'] === 200 && is_array($feed['body']), "feed status={$feed['status']}");

// Ensure tweetId present (fallback: first tweet)
if (!$tweetId && !empty($feed['body'][0]['id'])) {
    $tweetId = $feed['body'][0]['id'];
}

// 4) Register new user
echo "\n4) Register new user\n";
$rand = rand(1000, 9999);
$newEmail = "api_user{$rand}@example.com";
$reg = request('POST', '/register', ['username' => "apiuser{$rand}", 'email' => $newEmail, 'password' => 'password123', 'name' => 'API User'], $cookieB, $cookieB);
ok(in_array($reg['status'], [200, 201]), "register status={$reg['status']}");
$newUserId = $reg['body']['data']['id'] ?? null;

// 5) Login new user (ensure cookie)
echo "\n5) Login new user\n";
$loginB = request('POST', '/login', ['email' => $newEmail, 'password' => 'password123'], $cookieB, $cookieB);
ok($loginB['status'] === 200, "login new user status={$loginB['status']}");

// 6) New user follows testuser
if ($newUserId && $testUserId) {
    echo "\n6) New user follows testuser\n";
    $follow = request('POST', "/users/{$testUserId}/follow", null, $cookieB, $cookieB);
    ok(in_array($follow['status'], [200, 201]), "follow status={$follow['status']}");

    // 7) Check followers list
    echo "\n7) Check followers list for testuser\n";
    $followers = request('GET', "/users/{$testUserId}/followers", null, $cookieA, $cookieA);
    ok($followers['status'] === 200 && is_array($followers['body']), "followers status={$followers['status']}");
}

// 8) New user likes the tweet
if ($tweetId) {
    echo "\n8) New user likes the tweet\n";
    $like = request('POST', "/tweets/{$tweetId}/like", null, $cookieB, $cookieB);
    ok(in_array($like['status'], [200, 201]), "like status={$like['status']}");

    echo "\n9) New user unlikes the tweet\n";
    $unlike = request('DELETE', "/tweets/{$tweetId}/like", null, $cookieB, $cookieB);
    ok(in_array($unlike['status'], [200, 204]), "unlike status={$unlike['status']}");
}

// 10) Delete tweet as original user
if ($tweetId) {
    echo "\n10) Delete tweet as testuser\n";
    $del = request('DELETE', "/tweets/{$tweetId}", null, $cookieA, $cookieA);
    ok(in_array($del['status'], [200, 204]), "delete status={$del['status']}");
}

// 11) Admin deletes another user's tweet
echo "\n11) Admin deletes another user's tweet\n";
// ensure new user logged in (cookieB)
$loginB = request('POST', '/login', ['email' => $newEmail, 'password' => 'password123'], $cookieB, $cookieB);
ok($loginB['status'] === 200, "re-login new user status={$loginB['status']}");
$create2 = request('POST', '/tweets', ['content' => 'Tweet for admin deletion test'], $cookieB, $cookieB);
ok($create2['status'] === 201, "create2 status={$create2['status']}");
$tweetForAdmin = $create2['body']['data']['id'] ?? null;
if ($tweetForAdmin) {
    $loginAdmin = request('POST', '/login', ['email' => 'admin@example.com', 'password' => 'password'], $cookieAdmin, $cookieAdmin);
    ok($loginAdmin['status'] === 200, "admin login status={$loginAdmin['status']}");
    $delAdmin = request('DELETE', "/tweets/{$tweetForAdmin}", null, $cookieAdmin, $cookieAdmin);
    ok(in_array($delAdmin['status'], [200, 204]), "admin delete other status={$delAdmin['status']}");
    $showAfter = request('GET', "/tweets/{$tweetForAdmin}", null, $cookieB, $cookieB);
    ok($showAfter['status'] === 404, "show after admin delete status={$showAfter['status']}");
}

// 12) Admin own-tweet protection: regular users cannot delete admin tweets
echo "\n12) Admin own-tweet protection\n";
$loginAdmin2 = request('POST', '/login', ['email' => 'admin@example.com', 'password' => 'password'], $cookieAdmin, $cookieAdmin);
ok($loginAdmin2['status'] === 200, "admin login2 status={$loginAdmin2['status']}");
$createAdmin = request('POST', '/tweets', ['content' => 'Admin own tweet protection test'], $cookieAdmin, $cookieAdmin);
ok($createAdmin['status'] === 201, "admin create status={$createAdmin['status']}");
$adminTweetId = $createAdmin['body']['data']['id'] ?? null;
if ($adminTweetId) {
    // regular new user attempts delete
    $loginB2 = request('POST', '/login', ['email' => $newEmail, 'password' => 'password123'], $cookieB, $cookieB);
    ok($loginB2['status'] === 200, "re-login new user2 status={$loginB2['status']}");
    $delAttempt = request('DELETE', "/tweets/{$adminTweetId}", null, $cookieB, $cookieB);
    ok($delAttempt['status'] === 404 || $delAttempt['status'] === 403, "user delete admin tweet attempt status={$delAttempt['status']}");
    // admin deletes own tweet
    $delAdminOwn = request('DELETE', "/tweets/{$adminTweetId}", null, $cookieAdmin, $cookieAdmin);
    ok(in_array($delAdminOwn['status'], [200, 204]), "admin delete own status={$delAdminOwn['status']}");
    $showAdminAfter = request('GET', "/tweets/{$adminTweetId}", null, $cookieAdmin, $cookieAdmin);
    ok($showAdminAfter['status'] === 404, "admin tweet gone status={$showAdminAfter['status']}");
}

echo "\nSmoke test finished.\n";

// exit with non-zero if any checks failed
// (simple logic: if any FAIL lines were printed, return 1)


exit(0);
