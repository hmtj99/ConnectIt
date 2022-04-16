import { classroom_v1, google } from 'googleapis';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { SendAnnouncementToGoogleClassroomInput } from '../interfaces';

export class GoogleClassroomService {
	private oauth2Client: OAuth2Client;
	private SCOPES;
	private classroom: classroom_v1.Classroom;

	constructor() {
		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			"http://localhost:3000/authorizeGoogle",
		)
		this.SCOPES = ['https://www.googleapis.com/auth/classroom.announcements','https://www.googleapis.com/auth/classroom.courses'];
		this.setAccessToken();
	}

	authorize() {
		const url = this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: this.SCOPES
		});
		console.log(`url to authenticate is ${url}`);
	}

	async setAccessToken(code?: any) {
		const tokens = await fs.readFileSync('classroomTokens.json').toString();
		if(tokens.length > 0){
			this.oauth2Client.setCredentials(JSON.parse(tokens));
			console.log('access token set');
			this.classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
		} else {
			const { tokens } = await this.oauth2Client.getToken(code);
			console.log('tokens - ', tokens);
			fs.writeFileSync('classroomTokens.json', JSON.stringify(tokens));

			// this.authorize();
			// const rl = readline.createInterface({
			// 	input: process.stdin,
			// 	output: process.stdout,
			// });
			// rl.question("Enter the code here:", async (code) => {
			// 	const { tokens } = await this.oauth2Client.getToken(code);
			// 	console.log('tokens - ', tokens);
			// 	fs.writeFileSync('calendarTokens.json', JSON.stringify(tokens));
			// 	this.oauth2Client.setCredentials(tokens);
			// 	console.log('access token set');
			// 	this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
			// })
		}
	}

	async sendAnnouncementToGoogleClassroom(sendAnnouncementToGoogleClassroomInput: SendAnnouncementToGoogleClassroomInput) {
		const {courseId, text} = sendAnnouncementToGoogleClassroomInput;
		console.log(`Sending announcement for courseId:${courseId}`);
		const res = await this.classroom.courses.announcements.create({
			courseId, 
			requestBody: {
				courseId,
				text,
			}
		});
		return res;
	}    

	async listCourses() {
		const payload = await this.classroom.courses.list();
		return payload.data.courses;
	}
}

export const googleClassroomService = new GoogleClassroomService();