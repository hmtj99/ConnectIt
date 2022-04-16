import { calendar_v3, google } from 'googleapis';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { CreateCalendarEventInput } from '../interfaces';
import { nanoid } from 'nanoid';

export class GoogleCalendarService {
	private oauth2Client: OAuth2Client;
	private SCOPES;
	private calendar: calendar_v3.Calendar;

	constructor() {
		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			"http://localhost:3000/authorizeGoogle",
		)
		this.SCOPES = ['https://www.googleapis.com/auth/calendar'];
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
		const tokens = await fs.readFileSync('calendarTokens.json').toString();
		if(tokens.length > 0){
			this.oauth2Client.setCredentials(JSON.parse(tokens));
			console.log('access token set');
			this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
		} else {
			const { tokens } = await this.oauth2Client.getToken(code);
			console.log('tokens - ', tokens);
			fs.writeFileSync('calendarTokens.json', JSON.stringify(tokens));

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

	async getCalendarEvent(createCalendarEventInput: CreateCalendarEventInput){
		const {startTime, endTime, calendarId} = createCalendarEventInput;
		const {data} = await this.calendar.events.list({calendarId, timeMin: startTime, timeMax: endTime, timeZone: 'Asia/Calcutta'})
		return data;
	}

	async createCalendarEvent(createCalendarEventInput: CreateCalendarEventInput){
		const {eventTitle, startTime, endTime, calendarId} = createCalendarEventInput;
		const event: calendar_v3.Schema$Event = {
			'summary': eventTitle,
			'start': {
				'dateTime': startTime,
				'timeZone': 'Asia/Calcutta',
			},
			'end': {
				'dateTime': endTime,
				'timeZone': 'Asia/Calcutta',
			},
			'reminders': {
				'useDefault': false,
				'overrides': [
					{'method': 'email', 'minutes': 24 * 60},
					{'method': 'popup', 'minutes': 10},
				],
			},
			'conferenceData': {
				createRequest: {requestId: nanoid()}
			}
		}

		const res = await this.calendar.events.insert({calendarId, requestBody:event, conferenceDataVersion:1});
		console.log(res);
		return res.data.hangoutLink;
	}
}

export const googleCalendarService = new GoogleCalendarService();