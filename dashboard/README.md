# Procrastinator

GitHub Pages sirve el panel desde la raíz del repositorio. Abre el sitio y sigue el enlace al panel. La versión pública usa exclusivamente ejemplos escritos en demo.js. Permite explorar estudiantes, actividades, filtros y exportaciones sin acceso a los registros del bot.

## Activar la consulta privada en el hosting

1. Instala el panel en un servidor HTTPS con PHP 7.3 o superior y PDO MySQL, con acceso a la MariaDB del bot. Despliega los archivos versionados. Conserva el respaldo SQL y data.js fuera de cualquier directorio público.
2. Protege la carpeta del panel con la autenticación del servidor web y limita el acceso al personal autorizado. El servidor debe establecer REMOTE_USER tras autenticar al usuario. Ambos archivos PHP rechazan peticiones sin esta identidad.
3. Configura PROCRAST_DB_USER y PROCRAST_DB_PASSWORD en el entorno privado de PHP. Usa una cuenta de solo lectura sobre estudiantes, aplicaciones, actividades_plan, planes y catalogo_intervenciones de unisalud_PROCRAST_IA. PROCRAST_DB_HOST es opcional y por defecto vale localhost. Si la base está en otra máquina, usa un enlace privado seguro.
4. Abre dashboard/live.php. Cada recarga lee los datos de la base en una transacción. El indicador MariaDB aparece tras una consulta correcta. dashboard/index.html abre siempre la demostración.

Para Pages, selecciona la rama main y la carpeta raíz en Settings > Pages > Deploy from a branch.

## Acceso y diseño móvil

El panel privado solicita usuario y contraseña en su formulario. Las credenciales se conservan únicamente en memoria y las consultas no reutilizan credenciales guardadas por el navegador. Cerrar sesión elimina las credenciales y los registros visibles, cierra los detalles y detiene las consultas periódicas; las respuestas pendientes se descartan. Al recargar hay que iniciar sesión de nuevo. La autenticación HTTP del hosting sigue protegiendo los archivos PHP de forma independiente.

En celular, el menú se despliega desde la cabecera y los listados de estudiantes y actividades se presentan como tarjetas. La vista previa de exportación mantiene desplazamiento horizontal para comparar columnas.

Validación: `node dashboard/tools/check.cjs`. Con Playwright y Microsoft Edge instalados, `node dashboard/tools/check-mobile.cjs` comprueba seis pantallas a 320, 375, 390, 768 y 1280 px, navegación móvil y cierre de sesión con una consulta pendiente, usando datos ficticios. `SCREENSHOT_PATH` permite guardar una captura opcional.
