import { drive_v3, google } from 'googleapis';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { UploadFileToGoogleDriveInput } from '../interfaces';

export class GoogleDriveService {
	private oauth2Client: OAuth2Client;
	private SCOPES;
	private drive: drive_v3.Drive;

	constructor(credentials) {
		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			"http://localhost:3000/authorizeGoogle",
		)
		this.SCOPES = ['https://www.googleapis.com/auth/drive'];
		this.setAccessToken(credentials);
		this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
	}

	authorize() {
		const url = this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: this.SCOPES
		});
		console.log(`url to authenticate is ${url}`);
	}

	setAccessToken(credentials?: any) {
		// const { tokens } = await this.oauth2Client.getToken(code);
		// console.log('tokens - ', tokens);
		// fs.writeFileSync('tokens.txt', JSON.stringify(tokens));
		// const credDoc = await CredentialModel.findOne({userId: user._id, provider: 'googleDrive'});
		// if(!credDoc){
		// 	throw new Error('No Google Drive credentials found for the user');
		// }
		// console.log(credDoc);
		this.oauth2Client.setCredentials(credentials);
		console.log(`Google Drive access tokens have been set`);
	}

	async uploadFile() {
		const media = {
			mimeType: 'image/jpeg',
			body: fs.createReadStream('files/photo.jpg')
		};
		const res = await this.drive.files.create({
			requestBody: {
				name: 'newTest/testUpload.png',
				mimeType: 'image/png',
				parents: ["1sdf5rU1knvVubKQLFiJZ2N1uQaG7AGoa"]
			},
			media,
		});
		console.log(res);
	}

	async uploadFileToGoogleDrive(uploadFileToGoogleDriveInput: UploadFileToGoogleDriveInput) {
		const {mimeType, fileName} = uploadFileToGoogleDriveInput;
		const media = {
			mimeType,
			body: fs.createReadStream(fileName)
		};
		const res = await this.drive.files.create({
			requestBody: {
				name: fileName,
				mimeType,
				parents: ["1sdf5rU1knvVubKQLFiJZ2N1uQaG7AGoa"]
			},
			media,
		});
		console.log('File uploaded successfully!');
	}
}