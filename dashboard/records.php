<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
$check = isset($_GET['conexion']) && $_GET['conexion'] === '1';
if ($check) {
    header('Access-Control-Allow-Origin: https://xdpromagnun.github.io');
}
if (!$check && empty($_SERVER['REMOTE_USER'])) {
    http_response_code(403);
    echo '{"error":"Acceso restringido"}';
    exit;
}
try {
    $user = getenv('PROCRAST_DB_USER');
    $password = getenv('PROCRAST_DB_PASSWORD');
    if (!$user && !$password) {
        $keyPath = dirname(__DIR__, 2) . '/procrast-panel-db.key';
        $user = 'unisalud_panel_lectura';
        $password = is_readable($keyPath) ? trim(file_get_contents($keyPath)) : '';
    }
    if (!$user || !$password) {
        throw new RuntimeException('Configuracion incompleta');
    }
    $host = getenv('PROCRAST_DB_HOST') ?: 'localhost';
    $db = new PDO("mysql:host=$host;dbname=unisalud_PROCRAST_IA;charset=utf8mb4", $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_STRINGIFY_FETCHES => true
    ]);
    if ($check) {
        $db->query('SELECT id FROM estudiantes LIMIT 0');
        echo '{"conectada":true}';
        exit;
    }
    $db->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    $db->beginTransaction();
    $data = [
        'source' => 'MariaDB / unisalud_PROCRAST_IA',
        'students' => $db->query('SELECT id, activo, consentimiento, creado_en FROM estudiantes ORDER BY id')->fetchAll(),
        'assessments' => $db->query('SELECT id, estudiante_id, tipo, estado, inicio, fin, emocional, conductual, cognitiva, global_score, dimension_predominante FROM aplicaciones ORDER BY id')->fetchAll(),
        'activities' => $db->query('SELECT a.id, p.estudiante_id, a.plan_id, a.numero_semana, a.fecha_programada, a.estado,
            a.minutos_realizados, a.distractor, a.observacion, a.respondido_en, a.instrucciones, c.dimension
            FROM actividades_plan a LEFT JOIN planes p ON p.id = a.plan_id
            LEFT JOIN catalogo_intervenciones c ON c.id = a.intervencion_id ORDER BY a.id')->fetchAll()
    ];
    $db->commit();
    echo json_encode($data, JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    http_response_code(503);
    echo '{"error":"Consulta no disponible"}';
}
