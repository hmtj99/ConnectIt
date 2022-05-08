import express from 'express';
import { integrationService } from '../services/integration.service';
import fs from 'fs';
import path from 'path';
import { CredentialModel } from '../models/credentials.model';
import { GoogleCalendarService } from '../services/googleCalendar.service';
import { getSubmissionLink } from './utils/getSubmissionLink.util';
import { GoogleClassroomService } from '../services/googleClassroom.service';
import { IntegrationModel } from '../models/integration.model';
import groupBy from 'lodash/groupBy';

export const IntegrationRouter = express.Router();

IntegrationRouter.get('/listIntegrations', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			throw new Error('request is not authenticated');
		}
		const integrationInfo = JSON.parse(fs.readFileSync(path.join(__dirname + '/../public/assets/json/integrations.json')).toString());
		return res.render('integrations', { integrationInfo });
	} catch (error) {
		console.log(error);
		return res.redirect('/');
	}
})

IntegrationRouter.post('/createIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			throw new Error('request is not authenticated');
		}
		console.log(req.body);
		const createIntegrationMetadata = { ...req.body };
		const integrationType = req.body.integrationType;
		const user = req.user as any;
		const formSubmissionLink = getSubmissionLink(integrationType);

		switch (integrationType) {
		case 'telegramTwitterPost':
		case 'telegramTwitterImagePost': {
			return res.render('integrationForms/twitterIntegrationForm', {metadata: createIntegrationMetadata, formSubmissionLink});
		}

		case 'telegramGoogleCalendarIntegration': {
			const {credentials} = await CredentialModel.findOne({userId: user._id, provider: 'googleCalendar'});
			const googleCalendarService = new GoogleCalendarService(credentials);
			const calendarList = await googleCalendarService.getCalendarList();
			createIntegrationMetadata['calendarList'] = calendarList.items ?? [];
			return res.render('integrationForms/calendarIntegrationForm', {metadata: createIntegrationMetadata, formSubmissionLink});
		}

		case 'telegramGoogleClassroomAnnouncementIntegration': {
			const {credentials} = await CredentialModel.findOne({userId: user._id, provider: 'googleClassroom'});
			const googleClassroomService = new GoogleClassroomService(credentials);
			const courseList = await googleClassroomService.listCourses();
			createIntegrationMetadata['courseList'] = courseList ?? [];
			return res.render('integrationForms/classroomIntegrationForm', {metadata: createIntegrationMetadata, formSubmissionLink});
		}

		case 'telegramGoogleDriveIntegration': {
			return res.render('integrationForms/driveIntegrationForm', {metadata: createIntegrationMetadata, formSubmissionLink});
		}
		case 'telegramRedditPost': {
			return res.render('integrationForms/redditIntegrationForm', {metadata: createIntegrationMetadata, formSubmissionLink});
		}
		}
		return res.render('integrationForm', { metadata: req.body });
	} catch (error) {
		console.log(error);
		return res.redirect('/');
	}
})

IntegrationRouter.get('/dashboard', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			throw new Error('request is not authenticated');
		}
		const user = req.user as any;
		const integrations = await IntegrationModel.find({userId: user._id}).lean();
		const integrationsGroupedByTargetProvider = groupBy(integrations, integration => integration.targetProvider)
		return res.render('dashboard', {integrations: integrationsGroupedByTargetProvider});
	} catch (error) {
		console.log(error);
		return res.redirect('/');
	}
})

IntegrationRouter.post('/addTelegramTwitterPostIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const { triggerPattern, replyPattern, name } = req.body;
		if (!triggerPattern || !replyPattern || !name) {
			throw new Error('Invalid input, Please try again');
		}

		const response = await integrationService.createIntegration({
			name,
			user: req.user,
			sourceProvider: 'telegram',
			targetProvider: 'twitter',
			type: 'telegramTwitterPost',
			metadata: {
				triggerPattern,
				replyPattern,
			}
		});

		return res.redirect('/integration/dashboard');
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});

IntegrationRouter.post('/addTelegramTwitterImagePostIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const { triggerPattern, replyPattern, name } = req.body;
		if (!triggerPattern || !replyPattern || !name) {
			throw new Error('Invalid input, Please try again');
		}

		const response = await integrationService.createIntegration({
			name,
			user: req.user,
			sourceProvider: 'telegram',
			targetProvider: 'twitter',
			type: 'telegramTwitterImagePost',
			metadata: {
				triggerPattern,
				replyPattern,
			}
		});

		return res.redirect('/integration/dashboard');
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});


IntegrationRouter.post('/addTelegramGoogleCalendarIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const { triggerPattern, replyPattern, calendarId, name } = req.body;
		if (!triggerPattern || !replyPattern || !calendarId || !name) {
			throw new Error('Invalid input, Please try again');
		}

		console.log(req.body);

		const response = await integrationService.createIntegration({
			name,
			user: req.user,
			sourceProvider: 'telegram',
			targetProvider: 'googleCalendar',
			type: 'telegramGoogleCalendarIntegration',
			metadata: {
				triggerPattern,
				replyPattern,
				calendarId,
			}
		});

		return res.redirect('/integration/dashboard');
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});

IntegrationRouter.post('/addTelegramGoogleClassroomAnnouncementIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const { triggerPattern, replyPattern, courseId, name } = req.body;
		if (!triggerPattern || !replyPattern || !courseId || !name) {
			throw new Error('Invalid input, Please try again');
		}

		const response = await integrationService.createIntegration({
			name,
			user: req.user,
			sourceProvider: 'telegram',
			targetProvider: 'googleClassroom',
			type: 'telegramGoogleClassroomAnnouncementIntegration',
			metadata: {
				triggerPattern,
				replyPattern,
				courseId,
			}
		});

		return res.redirect('/integration/dashboard');
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});

IntegrationRouter.post('/addTelegramGoogleDriveIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const { triggerPattern, replyPattern, folderId, name } = req.body;
		if (!triggerPattern || !replyPattern || !folderId || !name) {
			throw new Error('Invalid input, Please try again');
		}

		const response = await integrationService.createIntegration({
			name,
			user: req.user,
			sourceProvider: 'telegram',
			targetProvider: 'googleDrive',
			type: 'telegramGoogleDriveIntegration',
			metadata: {
				triggerPattern,
				replyPattern,
				folderId,
			}
		});

		return res.redirect('/integration/dashboard');
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});

IntegrationRouter.post('/addTelegramRedditPostIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const { triggerPattern, replyPattern, subreddit, name } = req.body;
		if (!triggerPattern || !replyPattern || !subreddit || !name) {
			throw new Error('Invalid input, Please try again');
		}

		const response = await integrationService.createIntegration({
			name,
			user: req.user,
			sourceProvider: 'telegram',
			targetProvider: 'reddit',
			type: 'telegramRedditPost',
			metadata: {
				triggerPattern,
				replyPattern,
				subreddit
			}
		});

		return res.redirect('/integration/dashboard');
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});

IntegrationRouter.get('/removeIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const {integrationId} = req.query;

		await integrationService.removeIntegration({
			integrationId: integrationId as string,
		});

		return res.redirect('/integration/dashboard');
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});

IntegrationRouter.get('/editIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const {integrationId} = req.query;

		const integration = await IntegrationModel.findById(integrationId);
		return res.render('integrationForms/editIntegrationForm', {integration});
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});

IntegrationRouter.post('/updateIntegration', async (req, res) => {
	try {
		if (!req.isAuthenticated) {
			throw new Error('request is not authenticated, Please login');
		}

		const {integrationId, name, triggerPattern, replyPattern} = req.body;
		await IntegrationModel.updateOne(
			{_id: integrationId},
			{$set: {
				name,
				'metadata.triggerPattern': triggerPattern,
				'metadata.replyPattern': replyPattern,
			}}
		)
		return res.redirect('/integration/dashboard');
	} catch (error) {
		return res.json({ success: false, error: error.message })
	}
});