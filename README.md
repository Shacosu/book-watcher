# Aplicación de Seguimiento de Precios de Libros

## Descripción

La aplicación de seguimiento de precios de libros es una herramienta diseñada para monitorear una lista de deseos de libros y notificar a los usuarios cuando los precios de los libros deseados cambian. La aplicación se encarga de verificar periódicamente la lista de deseos y, en caso de cambios en los precios, envía notificaciones por correo electrónico a los usuarios.

## Funcionalidades Principales

1. **Verificación Automática:**
   - La aplicación utiliza una tarea cron para ejecutar la verificación de la lista de deseos a intervalos regulares.

2. **Notificaciones por Correo Electrónico:**
   - Cuando se detecta un cambio en el precio de un libro, la aplicación utiliza el paquete Nodemailer para enviar automáticamente un correo electrónico al usuario notificando sobre la actualización.

## Tecnologías Utilizadas

- **Node.js:** La aplicación está construida utilizando Node.js para el entorno de ejecución del servidor.

- **`node-cron`:** Se utiliza el paquete `node-cron` (v3.0.3) para programar tareas cron y ejecutar la verificación de precios periódicamente.

- **Nodemailer:** La aplicación utiliza Nodemailer para enviar notificaciones por correo electrónico.

- **Prisma:** La aplicación utiliza Prisma (v5.6.0) como ORM (Object-Relational Mapping) para interactuar con la base de datos PostgreSQL.

- **Axios:** Se utiliza el paquete Axios (v1.6.2) para realizar solicitudes HTTP, por ejemplo, para obtener información de la lista de deseos.

- **Cheerio:** El paquete Cheerio (v1.0.0-rc.12) se utiliza para analizar y manipular HTML, lo cual podría ser útil al extraer información de la página web de la lista de deseos.

- **Dotenv:** Se utiliza Dotenv (v16.3.1) para la carga de variables de entorno desde un archivo `.env`.

- **Express:** La aplicación utiliza Express (v4.18.2) como framework web para gestionar rutas y solicitudes HTTP.

- **PG:** El paquete PG (v8.11.3) es un controlador de PostgreSQL para Node.js.

- **Resend:** Se utiliza Resend (v2.0.0) para alguna funcionalidad específica de reenvío de correos electrónicos.

## Configuración y Uso

1. **Instalación de Dependencias:**
   ```bash
   pnpm install
   ```
2. **Ejecutar el programa:**
   ```bash
   node .
   ```
## Authors

- [@octokatherine](https://www.github.com/octokatherine)

