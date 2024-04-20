
import {} from 'dotenv/config';
import { Resend } from 'resend';
import { IgApiClient } from 'instagram-private-api';
import pkg from 'request-promise';
const { get } = pkg;
import resumeContent from './resume.js';

const formatNumber = (number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(number);
const resend = new Resend(process.env.RESEND_API_KEY);
const ig = new IgApiClient();
ig.state.generateDevice('descuentolibros');

const sendMail = async (bookDetail, lastBook, discountPercentage, lastPrice, newBook) => {
	await resend.emails.send({
		from: 'Book Watcher <onboarding@resend.dev>',
		to: ['sh4c0p@gmail.com', 'ghislaine.2305@gmail.com'],
		subject: lastBook.stock === 1 ? `🔔¡Alerta! Descuento del ${discountPercentage}% en el libro ${bookDetail.title}` : `🔔¡Alerta! El libro ${bookDetail.title} esta ahora agotado! ❌`,
		html: `
		<div 
		style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px; text-align: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
		<img 
		src="${bookDetail.image}" 
		alt="${bookDetail.title}" 
		style="width: 100%; max-width: 230px; height: auto; margin: 0 auto 15px; display: block; border-radius: 5px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);" 
		/>
		${lastBook.stock === 1 ? 
			`<h2 style="color: #3498db; font-size: 24px; margin-bottom: 10px; font-weight: bold;">¡Alerta! Descuento del ${discountPercentage}% en el libro ${bookDetail.title}</h2>`
			: `<h2 style="color: #3498db; font-size: 24px; margin-bottom: 10px; font-weight: bold;">¡Alerta! El libro ${bookDetail.title} esta ahora agotado! ❌</h2>`
		}
		<p style="color: #333; font-size: 22px; margin-bottom: 10px; font-weight: bold;">Precio anterior: ${formatNumber(lastPrice)}</p>
		<p style="color: #333; font-size: 22px; margin-bottom: 10px; font-weight: bold;">Precio actual: ${formatNumber(newBook.price)}</p>
		<p style="color: #333; font-size: 22px; margin-bottom: 10px; font-weight: bold;">Stock: ${lastBook.stock === 1 ? "Disponible ✅" : "No disponible 😢"}</p>
		<p style="color: #333; font-size: 22px; margin-bottom: 20px;"> Fecha de actualización: ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago"})}</p>
		<p style="color: #333; font-size: 22px; margin-bottom: 20px;">
			<a href="${bookDetail.link}" style="display: inline-block; padding: 12px 24px; background-color: #3498db; color: #fff; text-decoration: none; border-radius: 5px; transition: background-color 0.3s; font-weight: bold;">Ver libro</a>
		</p>
		<p style="color: #555; font-size: 14px;">Creado por @Shacosu &copy; ${new Date().getFullYear()}</p>
	</div>
		`,
	});
	await uploadPost(bookDetail, lastBook, discountPercentage, lastPrice, newBook);
}

const imageToBuffer = async (url) => {
	const newURL = url.replace("150x230", "1080x1080") || url;
	const options = {
		url: newURL,
		encoding: null
	};
	const image = await get(options);
	return image;
}

const getCaption = async (title) => {
	return await resumeContent(title);
}

const uploadImage = async (buffer, title) => {
	let caption = await getCaption(title) || "No se pudo generar una descripción";
	await ig.publish.photo({
		file: buffer,
		caption,
	});
}

async function uploadPost(bookDetail, lastBook, discountPercentage, lastPrice, newBook) {
	try {
		await ig.simulate.preLoginFlow();
		await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
		const imageBuffer = await imageToBuffer(bookDetail.image);
		await uploadImage(imageBuffer, {
			titulo: bookDetail.title,
			precioAnterior: lastPrice,
			precioNuevo: newBook.price,
			descuento: discountPercentage,
			stock: lastBook.stock,
			link: bookDetail.link,
			updatedAt: new Date().toLocaleString("es-CL", { timeZone: "America/Santiago"})
		})
	} catch (error) {
		console.log(error);
	}
}

export default sendMail;