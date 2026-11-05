<?php
// Servir esta entrada desde el directorio protegido del hosting PHP.
header('Cache-Control: private, no-store');
if (empty($_SERVER['REMOTE_USER'])) {
    http_response_code(403);
    exit;
}
$html = file_get_contents(__DIR__ . '/index.html');
echo str_replace(
    ['<html lang="es">', '<script defer src="demo.js"></script>'],
    ['<html lang="es" data-source="mariadb">', ''],
    $html
);
