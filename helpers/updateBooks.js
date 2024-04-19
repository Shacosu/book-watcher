import axios from 'axios';
import { load } from 'cheerio';
import { PrismaClient } from '@prisma/client';
import sendMail from './functions.js';

const prisma = new PrismaClient();

export default async function updateBooks() {
  try {
    // Obtener libros existentes
    const books = await prisma.book.findMany({
      include: {
        details: {
          include: {
            priceHistory: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    });

    // Obtener nuevos libros
    const { data } = await axios.get('https://www.buscalibre.cl/v2/otros_1517264_l.html');
    const $ = load(data);

    const newBooks = $('.contenedorProducto.producto').map((i, element) => {
      const $element = $(element);

      return {
        sku: $element.attr('data-id_producto'),
        title: $element.find('.titulo').text().trim().split('\n').filter((i, element) => element !== '\n')[0],
        price: Number($element.find('.precioAhora').text().trim().replace(/[.$]/g, '').trim()),
        image: $element.find('.portadaProducto img').attr('src'),
        link: $element.find('.portadaProducto a').attr('href'),
      };
    }).get();

    // Filtrar libros que necesitan ser actualizados
    const newBooksSKUs = newBooks.map((book) => book.sku);
    const booksToUpdate = books.filter((book) => newBooksSKUs.includes(book.sku));

    // Filtrar detalles de los libros que necesitan ser actualizados
    const booksToUpdateDetails = await prisma.bookDetail.findMany({
      where: {
        bookId: { in: booksToUpdate.map((book) => book.id) },
      },
      include: {
        priceHistory: {
          select: {
            price: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Tomar solo el último registro
        },
      },
    });

    // Realizar operaciones de actualización
    for (let book of booksToUpdate) {
      const newBook = newBooks.find((newBook) => newBook.sku === book.sku);
      const bookDetail = booksToUpdateDetails.find((detail) => detail.bookId === book?.id);

      // Actualizar el precio del libro si es distinto al último registrado
     
      if (bookDetail?.priceHistory[0]?.price !== newBook?.price ) {
        try {
          await prisma.bookDetail.update({
            where: { id: bookDetail.id },
            data: {
              stock: newBook.price !== 0 ? 1 : 0,
              updatedAt: new Date().toISOString(),
              priceHistory: {
                create: {
                  price: newBook.price,
                },
              },
            },
          });

          if (bookDetail && bookDetail?.priceHistory.length > 0) {
            console.log(`Se ha actualizado el libro ${bookDetail.title}`);
            // Obtener el último precio registrado
            const lastBook = await prisma.bookDetail.findUnique({ where: { id: bookDetail.id }, include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 1 } } });
            const lastPrice = bookDetail.priceHistory[0].price;
            // Calcular el porcentaje de descuento
            const discountPercentage = ((lastPrice - lastBook.priceHistory[0].price) / lastPrice) * 100;
            if (discountPercentage >= 15 && lastBook.stock === 1) {
              console.log(`¡Alerta! Descuento del ${discountPercentage.toFixed(0)}% en el libro ${bookDetail.title}`);
              await sendMail(bookDetail, lastBook, discountPercentage, lastPrice, newBook)
          }

          } else {
            if (bookDetail) {
              console.log(`Se ha actualizado el libro ${bookDetail.title}`);
              await prisma.bookDetail.update({
                where: { id: bookDetail.id },
                data: {
                  updatedAt: new Date().toISOString(),
                  priceHistory: {
                    create: {
                      price: newBook.price,
                    },
                  },
                },
              });
            }
    
          }
        } catch (error) {
          console.log(error)
        }
    
      }
     
    }


    return booksToUpdate.length;
  } catch (error) {
    console.error("Error al actualizar los libros:", error);
    return 0;
  } finally {
    // Cerrar la conexión del PrismaClient
    await prisma.$disconnect();
  }
}