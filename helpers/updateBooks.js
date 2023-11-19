import axios from 'axios';
import { load } from 'cheerio';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import {} from 'dotenv/config';
const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient();

const formatNumber = (number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(number);

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
      const bookDetail = booksToUpdateDetails.find((detail) => detail.bookId === book.id);
      if (bookDetail && bookDetail?.priceHistory.length > 0) {
        console.log(`Se ha actualizado el libro ${bookDetail.title}`);
        const lastPrice = bookDetail.priceHistory[0].price;
        // Verificar si hay un descuento del 15% o más
        const discountPercentage = ((lastPrice - newBook.price) / lastPrice) * 100;
        if (discountPercentage >= 15) {
          console.log(`¡Alerta! Descuento del ${discountPercentage.toFixed(0)}% en el libro ${bookDetail.title}`);
          // Enviar notificación
          await resend.emails.send({
            from: 'Book Watcher <onboarding@resend.dev>',
            to: ['sh4c0p@gmail.com', 'ghislaine.2305@gmail.com'],
            // to: ['sh4c0p@gmail.com'],
            subject: `🔔¡Alerta! Descuento del ${discountPercentage.toFixed(0)}% en el libro ${bookDetail.title}`,
            html: `
            <div style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px; text-align: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <img src="${bookDetail.image}" alt="${bookDetail.title}" style="width: 100%; max-width: 230px; height: auto; margin: 0 auto 15px; display: block; border-radius: 5px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);" />
            <h2 style="color: #3498db; font-size: 24px; margin-bottom: 10px; font-weight: bold;">¡Alerta! Descuento del ${discountPercentage.toFixed(0)}% en el libro ${bookDetail.title}</h2>
            <p style="color: #333; font-size: 22px; margin-bottom: 10px; font-weight: bold;">Precio anterior: ${formatNumber(lastPrice)}</p>
            <p style="color: #333; font-size: 22px; margin-bottom: 10px; font-weight: bold;">Precio actual: ${formatNumber(newBook.price)}</p>
            <p style="color: #333; font-size: 22px; margin-bottom: 10px; font-weight: bold;">Stock: ${bookDetail.stock === 1 ? "Disponible ✅" : "No disponible 😢"}</p>
            <p style="color: #333; font-size: 22px; margin-bottom: 20px;"> Fecha de actualización: ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago"})}</p>
            <p style="color: #333; font-size: 22px; margin-bottom: 20px;">
              <a href="${bookDetail.link}" style="display: inline-block; padding: 12px 24px; background-color: #3498db; color: #fff; text-decoration: none; border-radius: 5px; transition: background-color 0.3s; font-weight: bold;">Ver libro</a>
            </p>
            <p style="color: #555; font-size: 14px;">Creado por @Shacosu &copy; ${new Date().getFullYear()}</p>
          </div>
            `,
          });
      }

        // Actualizar detalles del libro y agregar al historial de precios

          
        if (bookDetail.priceHistory[0].price !== newBook.price) {
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
  
      } else {
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


    return booksToUpdate.length;
  } catch (error) {
    console.error("Error al actualizar los libros:", error);
    return 0;
  } finally {
    // Cerrar la conexión del PrismaClient
    await prisma.$disconnect();
  }
}