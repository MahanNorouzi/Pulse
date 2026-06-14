<?php
// CLI script to clear all tweets (likes and tweets) using app DB connection.
require_once __DIR__ . '/../models/Tweet.php';
require_once __DIR__ . '/../config/database.php';

function countTweets()
{
    $db = (new Database())->getConnection();
    $stmt = $db->query('SELECT COUNT(*) AS c FROM tweet');
    $r = $stmt->fetch(PDO::FETCH_ASSOC);
    return (int)($r['c'] ?? 0);
}

echo "Starting clear tweets script...\n";
$before = countTweets();
echo "Tweets before: $before\n";

$t = new Tweet();
try {
    $t->clearAll();
    $after = countTweets();
    echo "Cleared tweets. Tweets after: $after\n";
    exit(0);
} catch (Exception $e) {
    echo "Error clearing tweets: " . $e->getMessage() . "\n";
    exit(2);
}
