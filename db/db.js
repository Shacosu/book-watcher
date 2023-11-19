import {} from "dotenv/config";
import { Client } from "pg";


const client = new Client({
	connectionString: process.env.DATABASE_URL,
	ssl: true
});

const connect = async () => {
	try {
		const clientDB = await client.connect();
		console.log("Connected to DB");
		return clientDB;
	} catch (error) {
		console.log("Error connecting to DB", error);
	}
};

export default connect;