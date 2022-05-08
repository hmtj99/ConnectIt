import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { CreateCalendarEventInput } from '../interfaces';
import { nanoid } from 'nanoid';

export class GoogleCalendarService {
	private oauth2Client: OAuth2Client;
	private SCOPES;
	private calendar: calendar_v3.Calendar;

	constructor(credentials) {
		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			"http://localhost:3000/authorizeGoogle",
		)
		this.SCOPES = ['https://www.googleapis.com/auth/calendar'];
		this.setAccessToken(credentials);
		this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
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
		console.log(`Google Calendar access tokens have been set`);
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

	async getCalendarList(){
		try{
			const calendars = await this.calendar.calendarList.list();
			console.log(calendars);
			return calendars.data;
		} catch(error){
			throw new Error(`Error while listing calendars: ${error.message}`);
		}
	}
}