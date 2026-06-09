<?php
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    echo "✅";
} else {
    echo "❌";
}
