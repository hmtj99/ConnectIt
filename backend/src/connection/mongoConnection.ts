import mongoose from "mongoose";

const mongoURI = process.env.MONGO_URI;

export async function mongoConnect(): Promise<void> {
	try {
		if (!mongoURI) {
			throw new Error('MongoURI is not set in env')
		}
		await mongoose.connect("mongodb+srv://hemant:hemant123@firstcluster.exdxe.mongodb.net/connectIt?retryWrites=true&w=majority");
		console.log('Connection to mongodb successfull');
	} catch (error) {
		console.log(`Error while connecting to mongodb: ${error.message}`)
		process.exit(0);
	}
}
  
// If the Node process ends, close the Mongoose connection
process.on('SIGINT', async () => {
	await mongoose.connection.close();
	console.log('Mongoose default connection disconnected through app termination');
	process.exit(0);
});