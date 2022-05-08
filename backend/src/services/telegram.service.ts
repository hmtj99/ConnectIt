import TelegramBot from 'node-telegram-bot-api';
import log from 'loglevel';
import Mustache from 'mustache';
import https from 'https';
import fs from 'fs';
import { GoogleDriveService } from './googleDrive.service';
import { TwitterService } from './twitter.service';
import { CredentialModel } from '../models/credentials.model';
import { IntegrationModel } from '../models/integration.model';
import { GoogleCalendarService } from './googleCalendar.service';
import { DateTime } from "luxon";
import { GoogleClassroomService } from './googleClassroom.service';
import { unlink } from 'fs/promises';
import { RedditService } from './reddit.service';
export class TelegramService {
	private token;
	private bot;
	private user;

	constructor(token: string, user: any) {
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
			const file = msg.document;
			const caption = msg.caption;
			if (file) {
				console.log(file.file_name, file.file_id);
				this.fileResponse(chatId, file, caption);
			}
		});
	}

	async customResponse2(chatId: string, messageText: string, filename?: string) {
		let data = {};
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
		console.log('telegramIntegrations - ', telegramIntegrations);
		const messageIntegration = telegramIntegrations.find(integration => integration.metadata.triggerPattern === pattern);
		console.log('messageIntegration - ', messageIntegration);

		switch (messageIntegration.type) {
		case 'telegramTwitterPost': {
			await this.postTweetsToTwitter(data['message']);
			break;
		}
		case 'telegramTwitterImagePost': {
			await this.postTweetsToTwitter(data['message']);
			break;
		}
		case 'telegramGoogleCalendarIntegration': {
			data['start'] = data['start'].trim();
			data['end'] = data['end'].trim();
			const payload = await this.scheduleGoogleCalendarEvent(pattern, data, messageIntegration, chatId);
			data = payload.data;
			if (!payload.success) {
				return;
			}
			break;
		}
		case 'telegramGoogleClassroomAnnouncementIntegration': {
			await this.classroomAnnouncement(messageIntegration.metadata.courseId, data['message']);
			break;
		}
		case 'telegramRedditPost': {
			await this.makeRedditPost(messageIntegration.metadata.subreddit, data['text'], data['title']);
			break;
		}
		default: {
			throw new Error('TelegramService.customResponse2: Integration Type not supported');
		}
		}

		const reply = Mustache.render(messageIntegration.metadata.replyPattern, data);
		this.bot.sendMessage(chatId, reply);
	}

	async fileResponse(chatId: string, file: any, caption: string): Promise<void> {
		const data = {};
		const splitLines = caption.split(/\r?\n/);
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
		const messageIntegration = telegramIntegrations.find((integration) => integration.metadata.triggerPattern === pattern);
		const downloadedFile = await this.bot.getFile(file.file_id);
		const downloadUrl = `https://api.telegram.org/file/bot${this.token}/${downloadedFile.file_path}`;
		const wfs = fs.createWriteStream(file.file_name);
		const request = https.get(downloadUrl, (response) => {
			response.pipe(wfs);
			wfs.on('finish', async () => {
				await wfs.close();  // close() is async, call cb after close completes.
				switch (messageIntegration.type) {
				case 'telegramGoogleDriveIntegration': {
					await this.uploadFileToGoogleDrive(file,messageIntegration.metadata.folderId, chatId);
					break;
				}
				case 'telegramTwitterImagePost': {
					await this.postTweetsWithImageToTwitter(file, data['message'], chatId);
					break;
				}
				case 'telegramGoogleClassroomAnnouncementIntegration': {
					await this.sendAnnouncementWithFiles(file, messageIntegration.metadata.courseId , data['message'], chatId);
					break;
				}
				default: {
					break;
				}
				}
				await unlink(file.file_name);
			});
		});
	}

	async getTelegramPatterns(): Promise<Array<any>> {
		const telegramIntegrations = await IntegrationModel.find({ userId: this.user._id, sourceProvider: 'telegram' });
		return telegramIntegrations;
	}

	async postTweetsToTwitter(message: string): Promise<any> {
		const { credentials } = await CredentialModel.findOne({ userId: this.user._id, provider: 'twitter' });
		const twitterService = new TwitterService(credentials);
		const response = await twitterService.postTweet(message);
		return response;
	}

	async postTweetsWithImageToTwitter(file: any, message: string, chatId:string): Promise<any> {
		const { credentials } = await CredentialModel.findOne({ userId: this.user._id, provider: 'twitter' });
		const twitterService = new TwitterService(credentials);
		await twitterService.postTweetWithImages(message, [file.file_name]);
		this.bot.sendMessage(chatId, "Tweet with image has been posted!");
	}

	async scheduleGoogleCalendarEvent(pattern: string, data: any, messageIntegration, chatId: string): Promise<any> {
		const { credentials } = await CredentialModel.findOne({ userId: this.user._id, provider: 'googleCalendar' });
		const googleCalendarService = new GoogleCalendarService(credentials);
		const startDate = DateTime.fromFormat(data['start'], "d/M/yyyy H:mm");
		const endDate = DateTime.fromFormat(data['end'], "d/M/yyyy H:mm");
		const eventsData = await googleCalendarService.getCalendarEvent({
			eventTitle: data['title'],
			startTime: startDate.toISO({ suppressMilliseconds: true }),
			endTime: endDate.toISO({ suppressMilliseconds: true }),
			calendarId: messageIntegration.metadata.calendarId,
		})
		if (eventsData.items.length > 0) {
			this.bot.sendMessage(chatId, 'An event is already scheduled in this time slot, Please choose another one');
			return { success: false, data };
		}
		const link = await googleCalendarService.createCalendarEvent({
			eventTitle: pattern,
			startTime: startDate.toISO({ suppressMilliseconds: true }),
			endTime: endDate.toISO({ suppressMilliseconds: true }),
			calendarId: messageIntegration.metadata.calendarId
		});
		data["meetLink"] = link;
		return { success: true, data };
	}

	async classroomAnnouncement(courseId: string, announcementText: string, materials?: any[]): Promise<void> {
		const { credentials } = await CredentialModel.findOne({ userId: this.user._id, provider: 'googleClassroom' });
		const googleClassroomService = new GoogleClassroomService(credentials);
		await googleClassroomService.sendAnnouncementToGoogleClassroom({ courseId, text: announcementText, materials });
	}

	async makeRedditPost(subreddit: string, text: string, title: string): Promise<void> {
		const { credentials } = await CredentialModel.findOne({ userId: this.user._id, provider: 'reddit' });
		const redditService = new RedditService(credentials);
		await redditService.postToSubreddit({
			subreddit,
			text,
			title
		})
	}

	async uploadFileToGoogleDrive(file:any, parentFolderId: string, chatId: string): Promise<void> {
		const credDoc = await CredentialModel.findOne({ userId: this.user._id, provider: 'googleDrive' });
		if (!credDoc) {
			await unlink(file.name);
			throw new Error('No Google Drive credentials found for the user');
		}
		const googleDriveService = new GoogleDriveService(credDoc.credentials);
		await googleDriveService.uploadFileToGoogleDrive({ fileName: file.file_name, mimeType: file.mime_type, parentFolderId });
		this.bot.sendMessage(chatId, 'File uploaded to google drive');
	}

	async sendAnnouncementWithFiles(file:any, courseId:string, announcementText: string, chatId): Promise<void> {
		const credDoc = await CredentialModel.findOne({ userId: this.user._id, provider: 'googleDrive' });
		if (!credDoc) {
			await unlink(file.name);
			throw new Error('No Google Drive credentials found for the user');
		}
		const googleDriveService = new GoogleDriveService(credDoc.credentials);
		const fileMetadata = await googleDriveService.createClassroomFilesFolderAndUploaadFile({ fileName: file.file_name, mimeType: file.mime_type });
		const materials = [{driveFile: {driveFile: {id: fileMetadata.data.id, title: fileMetadata.data.name}}}]
		await this.classroomAnnouncement(courseId, announcementText, materials);
		this.bot.sendMessage(chatId, 'Announcement has been made on the classroom');
	}
}
