import TelegramBot from 'node-telegram-bot-api';
import log from 'loglevel';
import Mustache from 'mustache';
import https from 'https';
import fs from 'fs';
import { GoogleDriveService } from './googleDrive.service';
import { googleCalendarService } from './googleCalendar.service';
import { googleClassroomService } from './googleClassroom.service';
import { TwitterService } from './twitter.service';
import { CredentialModel } from '../models/credentials.model';
import { IntegrationModel } from '../models/integration.model';

export class TelegramService {
	private token;
	private bot;
	private user;

	constructor(token:string, user:any) {
		// this.token = '5220315437:AAGY0e7RbUZqxpGW5_xNuTTmn1PrZjDLCiA';
		this.token = token;
		this.user = user;
		this.bot = new TelegramBot(this.token, { polling: true });
	}

	listen() {
		log.warn('listening on telegram bot');

		this.bot.on('message', async (msg) => {
			console.log('msg -', msg);
			const chatId = msg.chat.id;
			const messageText = msg.text;
			if (messageText) {
				console.log(`recevied message: ${messageText}`);
				this.customResponse2(chatId, messageText);
			}
			// drive integration
			const file = msg.document;
			if (file) {
				console.log(file.file_name, file.file_id);
				const downloadedFile = await this.bot.getFile(file.file_id);
				const downloadUrl = `https://api.telegram.org/file/bot${this.token}/${downloadedFile.file_path}`;
				const wfs = fs.createWriteStream(file.file_name);
				const request = https.get(downloadUrl, (response) => {
					response.pipe(wfs);
					wfs.on('finish', async () => {
						await wfs.close();  // close() is async, call cb after close completes.
						const credDoc = await CredentialModel.findOne({userId: this.user._id, provider: 'googleDrive'});
						if(!credDoc){
							throw new Error('No Google Drive credentials found for the user');
						}
						const googleDriveService = new GoogleDriveService(credDoc.credentials);
						await googleDriveService.uploadFileToGoogleDrive({ fileName: file.file_name, mimeType: file.mime_type });
					});
					// this.customResponse(chatId, msg.caption);
					this.bot.sendMessage(chatId, 'File uploaded to google drive');
				});

			}
			// log.warn(`recevied text from message: ${messageText}`);
			// send a message to the chat acknowledging receipt of their message
			// this.bot.sendMessage(chatId, 'Received your message');
		});
	}

	async customResponse(chatId: string, messageText: string, filename?: string) {
		const data = {};
		const splitLines = messageText.split(/\r?\n/);
		const pattern = splitLines[0];

		for (let i = 1; i < splitLines.length; i++) {
			const currentLine = splitLines[i];
			try {
				const keyValue = currentLine.split(/:(.+)/);
				data[keyValue[0]] = keyValue[1];
			} catch (error) {
				console.log('does not look like a valid line');
			}
		}

		// google calendar integration
		if(pattern === "EL 224 Lab Scheduling"){
			const eventsData = await googleCalendarService.getCalendarEvent({
				eventTitle: pattern,
				startTime: new Date(data["start"]).toISOString(),
				endTime: new Date(data["end"]).toISOString(),
				calendarId: 'hmtj99@gmail.com',})
			if(eventsData.items.length > 0){
				this.bot.sendMessage(chatId, 'An event is already scheduled in this time slot, Please choose another one');
				return;
			}
			const link = await googleCalendarService.createCalendarEvent({
				eventTitle: pattern,
				startTime: data["start"],
				endTime: data["end"],
				calendarId: 'hmtj99@gmail.com',
			});
			data["meetLink"] = link;
		}

		// google classroom integration
		if(pattern == "Google Classroom Announcement"){
			await googleClassroomService.sendAnnouncementToGoogleClassroom({courseId:data['courseId'], text: data['message']});
		}

		// if(pattern == "Twitter Message Demo"){
		// 	await twitterService.postTweet(data['message']);
		// }

		const replyPattern = {
			'SC220 Registration': 'Welcome to the class SC220 {{name}}, Your roll number is {{rollNo}} and you have been registered for the course',
			'EL223 Submission': 'Hello {{name}}, Your submission for EL223 has been recorded, Thank You',
			'EL 224 Lab Scheduling': 'Hello {{name}}, Your lab has been scheduled from {{start}} to {{end}} {{{<br>}}} Meet Link - {{{meetLink}}} {{{</br>}}}',
			'Google Classroom Announcement': 'Google classroom announcement for courseId:{{courseId}} sent to classroom',
			'Twitter Message Demo': 'Tweeted the message: {{message}}'
		}

		const reply = Mustache.render(replyPattern[pattern], data);
		this.bot.sendMessage(chatId, reply);
	}

	async customResponse2(chatId: string, messageText: string, filename?: string) {
		const data = {};
		const splitLines = messageText.split(/\r?\n/);
		const pattern = splitLines[0];

		for (let i = 1; i < splitLines.length; i++) {
			const currentLine = splitLines[i];
			try {
				const keyValue = currentLine.split(/:(.+)/);
				data[keyValue[0]] = keyValue[1];
			} catch (error) {
				console.log('does not look like a valid line');
			}
		}

		const telegramIntegrations = await this.getTelegramPatterns();
		console.log('telegramIntegrations - ',telegramIntegrations);
		const messageIntegration = telegramIntegrations.find(integration => integration.metadata.triggerPattern === pattern);
		console.log('messageIntegration - ',messageIntegration);

		switch(messageIntegration.type){
		case 'telegramTwitterPost': {
			await this.postTweetsToTwitter(data['message']);
			break;
		}
		case 'telegramTwitterImagePost': {
			await this.postTweetsToTwitter(data['message']);
			break;
		}
		default: {
			throw new Error('TelegramService.customResponse2: Integration Type not supported');
		}
		}



		// google calendar integration
		// if(pattern === "EL 224 Lab Scheduling"){
		// 	const eventsData = await googleCalendarService.getCalendarEvent({
		// 		eventTitle: pattern,
		// 		startTime: new Date(data["start"]).toISOString(),
		// 		endTime: new Date(data["end"]).toISOString(),
		// 		calendarId: 'hmtj99@gmail.com',})
		// 	if(eventsData.items.length > 0){
		// 		this.bot.sendMessage(chatId, 'An event is already scheduled in this time slot, Please choose another one');
		// 		return;
		// 	}
		// 	const link = await googleCalendarService.createCalendarEvent({
		// 		eventTitle: pattern,
		// 		startTime: data["start"],
		// 		endTime: data["end"],
		// 		calendarId: 'hmtj99@gmail.com',
		// 	});
		// 	data["meetLink"] = link;
		// }

		// google classroom integration
		// if(pattern == "Google Classroom Announcement"){
		// 	await googleClassroomService.sendAnnouncementToGoogleClassroom({courseId:data['courseId'], text: data['message']});
		// }

		// if(pattern == "Twitter Message Demo"){
		// 	await twitterService.postTweet(data['message']);
		// }

		// const replyPattern = {
		// 	'SC220 Registration': 'Welcome to the class SC220 {{name}}, Your roll number is {{rollNo}} and you have been registered for the course',
		// 	'EL223 Submission': 'Hello {{name}}, Your submission for EL223 has been recorded, Thank You',
		// 	'EL 224 Lab Scheduling': 'Hello {{name}}, Your lab has been scheduled from {{start}} to {{end}} {{{<br>}}} Meet Link - {{{meetLink}}} {{{</br>}}}',
		// 	'Google Classroom Announcement': 'Google classroom announcement for courseId:{{courseId}} sent to classroom',
		// 	'Twitter Message Demo': 'Tweeted the message: {{message}}'
		// }

		const reply = Mustache.render(messageIntegration.metadata.replyPattern, data);
		this.bot.sendMessage(chatId, reply);
	}

	async uploadAndReplyBasedOnCaption(file: any, msg) {
		console.log(file.file_name, file.file_id);
		const downloadedFile = await this.bot.getFile(file.file_id);
		const downloadUrl = `https://api.telegram.org/file/bot${this.token}/${downloadedFile.file_path}`;
		const wfs = fs.createWriteStream(file.file_name);
		const request = https.get(downloadUrl, (response) => {
			response.pipe(wfs);
			wfs.on('finish', async () => {
				await wfs.close();  // close() is async, call cb after close completes.
				const googleDriveService = new GoogleDriveService(this.user);
				await googleDriveService.uploadFileToGoogleDrive({ fileName: file.file_name, mimeType: file.mime_type });
			});
			this.customResponse(msg.chat.id, msg.caption);
		});
	}

	async getTelegramPatterns(): Promise<Array<any>> {
		const telegramIntegrations = await IntegrationModel.find({userId: this.user._id, sourceProvider: 'telegram'});
		// const patterns = telegramIntegrations.map(integration => integration.metadata.triggerPattern);
		// const replys = telegramIntegrations.map(integration => integration.metadata.replyPattern);
		// return {
		// 	patterns,
		// 	replys
		// }
		return telegramIntegrations;
	}

	async postTweetsToTwitter(message:string): Promise<any> {
		const {credentials} = await CredentialModel.findOne({userId: this.user._id, provider:'twitter'});
		const twitterService = new TwitterService(credentials);
		const response = await twitterService.postTweet(message);
		return response;
	}

}

// export const telegramService = new TelegramService(token);