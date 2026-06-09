<?php

require_once __DIR__ . '/../controllers/AuthController.php';

$auth = new AuthController();
$method = $_SERVER['REQUEST_METHOD'];
$path   = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

match ("$method $path") {
    'POST api/register' => $auth->register(),
    'POST api/login'    => $auth->login(),
    'POST api/logout'   => $auth->logout(),
    'GET api/me'        => $auth->me(),
    default             => Response::error('Not found', 404),
};
