import { classroom_v1, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { SendAnnouncementToGoogleClassroomInput } from '../interfaces';

export class GoogleClassroomService {
	private oauth2Client: OAuth2Client;
	private SCOPES;
	private classroom: classroom_v1.Classroom;

	constructor(credentials) {
		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			"http://localhost:3000/authorizeGoogle",
		)
		this.SCOPES = ['https://www.googleapis.com/auth/classroom.announcements','https://www.googleapis.com/auth/classroom.courses'];
		this.setAccessToken(credentials);
		this.classroom = google.classroom({version: 'v1', auth: this.oauth2Client});
	}

	authorize() {
		const url = this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: this.SCOPES
		});
		console.log(`url to authenticate is ${url}`);
	}

	async setAccessToken(credentials: any) {
		this.oauth2Client.setCredentials(credentials);
		console.log(`Google Classroom access tokens have been set`);
	}

	async sendAnnouncementToGoogleClassroom(sendAnnouncementToGoogleClassroomInput: SendAnnouncementToGoogleClassroomInput) {
		const {courseId, text, materials} = sendAnnouncementToGoogleClassroomInput;
		console.log(`Sending announcement for courseId:${courseId}`);
		const res = await this.classroom.courses.announcements.create({
			courseId, 
			requestBody: {
				courseId,
				text,
				materials
			}
		});
		return res;
	}    

	async listCourses() {
		const payload = await this.classroom.courses.list();
		return payload.data.courses;
	}
} 