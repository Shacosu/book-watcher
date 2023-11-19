import cron from 'node-cron';
import getBooks from "./helpers/getBooks.js";
import updateBooks from "./helpers/updateBooks.js";

async function main() {
    console.log(`Se ha iniciado el proceso de actualización ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago"})}`);
    await getBooks();
    console.log(`
    ----------------------------------------
    | Comienzo de actualización de precios |
    ----------------------------------------
    `)
    const booksUpdated = await updateBooks();
    console.log(`Se ha finalizado el proceso de actualización con ${booksUpdated} libros actualizados ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago"})}`);
}

// Ejecutar la función `main` cada 10 minutos con la zona horaria de America/Santiago
cron.schedule('*/10 * * * *', () => {
    main();
}, {
    timezone: "America/Santiago"
});