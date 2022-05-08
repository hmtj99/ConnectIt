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

	setAccessToken(credentials: any) {
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

	async uploadFileToGoogleDrive(uploadFileToGoogleDriveInput: UploadFileToGoogleDriveInput): Promise<any> {
		const {mimeType, fileName, parentFolderId} = uploadFileToGoogleDriveInput;
		const media = {
			mimeType,
			body: fs.createReadStream(fileName)
		};
		const fileMetadata = await this.drive.files.create({
			requestBody: {
				name: fileName,
				mimeType,
				parents: [parentFolderId]
			},
			media,
		});
		console.log('File uploaded successfully!');
		return fileMetadata;
	}

	async createClassroomFilesFolderAndUploaadFile(input:UploadFileToGoogleDriveInput): Promise<any> {
		const {mimeType, fileName} = input;
		const folderMetadata = await this.drive.files.create({
			requestBody: {
				name: 'ConnectIt Classroom Files',
				mimeType: 'application/vnd.google-apps.folder'
			},
			fields: 'id'
		});
		console.log(`folder created with id:${folderMetadata.data.id}`);

		const fileMetadata = await this.uploadFileToGoogleDrive({
			fileName,
			mimeType,
			parentFolderId: folderMetadata.data.id
		});

		console.log('fileMetadata - ', fileMetadata);
		return fileMetadata;
	}
}