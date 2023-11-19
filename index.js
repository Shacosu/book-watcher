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

main();