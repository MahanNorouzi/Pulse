<?php
$url = 'http://localhost/Pulse/backend/index.php/api/login';
$data = json_encode(['email' => 'admin@example.com', 'password' => 'password']);
$opts = ['http' => [
    'method' => 'POST',
    'header' => "Content-Type: application/json\r\nAccept: application/json\r\n",
    'content' => $data,
]];
$context = stream_context_create($opts);
$res = @file_get_contents($url, false, $context);
if ($res === false) {
    $err = error_get_last();
    echo "Request failed: ";
    print_r($err);
    exit(1);
}
echo $res;
