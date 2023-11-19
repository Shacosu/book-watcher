import axios from "axios";
import { load } from "cheerio";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function getBooks() {
	const { data } = await axios.get("https://www.buscalibre.cl/v2/otros_1517264_l.html");
	const $ = load(data);
	const books = $(".contenedorProducto.producto").map((i, element) => {
		const $element = $(element);
		return {
			sku: $element.attr("data-id_producto"),
			title: $element.find(".titulo").text().trim().split("\n").filter((i, element) => element !== "\n")[0],
			price: Number($element.find(".precioAhora").text().trim().replace(/[.$]/g, "").trim()),
			image: $element.find(".portadaProducto img").attr("src"),
			link: $element.find(".portadaProducto a").attr("href"),
		};
	}
	).get();

	const booksDB = await prisma.book.findMany({});
	const booksDBSKUs = booksDB.map((book) => book.sku);
	const booksToCreate = books.filter((book) => !booksDBSKUs.includes(book.sku));
	const booksToDelete = booksDB.filter((book) => !books.map((book) => book.sku).includes(book.sku));

	for (let book of booksToCreate) {
		console.log(`Se ha añadido el libro ${book.title}`);
		await prisma.book.create({
			data: {
				sku: book.sku,
				details: {
					create: {
						title: book.title,
						image: book.image,
						link: book.link,
						stock: book.price === 0 ? 0 : 1,
						createdAt: new Date().toISOString(),
					}
			},
			}
		});
	}

	if (booksToDelete.length > 0) {
		console.log(booksToDelete)
		for (let book of booksToDelete) {
			console.log(`Se ha eliminado el libro ${book.sku}`);
			await prisma.bookDetail.delete({ where: { bookId: book.id } });
			await prisma.book.delete({ where: { id: book.id } });
		}
	}


	console.log(`Se han añadido ${booksToCreate.length} libros nuevos ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago"})}`);
}