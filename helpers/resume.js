import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

const resumeContent = async (content) => {
  const completion = await openai.chat.completions.create({
    messages: 
		[
			{ role: "system", content: "Crea una descripcion llamativa (puedes utilizar emoticonos) a partir del titulo del siguiente libro que no supere los 400 caracteres e incluye hashtags sobre el libro ademas explica el descuento que se efectuo con su precio anterior y el actual y finalmente con su debido link de referencia y fecha de actualizacion. NO INVENTES NADA SOLO PRESENTA EL LIBRO POR SU PORTADA. DEVUELVE EL STRING SIN COMILLAS AL INICIO NI TAMPOCO AL FINAL." }, 
			{ role: "user", content: JSON.stringify(content) }
		],
		temperature: 0.8,
    model: "gpt-3.5-turbo",
  });
	return completion.choices[0].message.content;
}

export default resumeContent;