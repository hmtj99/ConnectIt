import express from 'express';
import { google } from 'googleapis';
import { tokenService } from '../services/token.service';

export const TokenRouter = express.Router();

TokenRouter.post('/setTokenForUser', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			throw new Error('request is not authenticated');
		}

		const payload = await tokenService.setTokenForUser({
			creds: req.body.creds,
			user: req.user,
			provider: req.body.provider
		});

		return res.render('credentials');
	} catch (error) {
		res.status(500).send({ success: 'false', error: error.message })
	}
})

TokenRouter.get('/redirectToDrivePermission', (req, res) => {
	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		"http://localhost:3000/setGoogleToken",
	)
	const SCOPES = ['https://www.googleapis.com/auth/drive'];
	const url = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	return res.redirect(url);
})

TokenRouter.get('/redirectToCalendarPermission', (req, res) => {
	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		"http://localhost:3000/setGoogleToken",
	)
	const SCOPES = ['https://www.googleapis.com/auth/calendar'];
	const url = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	return res.redirect(url);
})

TokenRouter.get('/redirectToClassroomPermission', (req, res) => {
	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		"http://localhost:3000/setGoogleToken",
	)
	const SCOPES = ['https://www.googleapis.com/auth/classroom.announcements', 'https://www.googleapis.com/auth/classroom.courses'];
	const url = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	return res.redirect(url);
})

TokenRouter.post('/setTelegramToken', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			throw new Error('request is not authenticated');
		}
		console.log('body - ', req.body);
		const payload = await tokenService.setTokenForUser({
			creds: { token: req.body.telegramToken },
			user: req.user,
			provider: 'telegram'
		});

		return res.render('credentials');
	} catch (error) {
		res.status(500).send({ success: 'false', error: error.message })
	}
})

TokenRouter.post('/setTwitterToken', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			throw new Error('request is not authenticated');
		}
		console.log('body - ', req.body);
		const payload = await tokenService.setTokenForUser({
			creds: req.body,
			user: req.user,
			provider: 'twitter'
		});

		return res.render('credentials');
	} catch (error) {
		res.status(500).send({ success: 'false', error: error.message })
	}
})

TokenRouter.post('/setRedditToken', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			throw new Error('request is not authenticated');
		}
		console.log('body - ', req.body);
		const payload = await tokenService.setTokenForUser({
			creds: req.body,
			user: req.user,
			provider: 'reddit'
		});

		return res.render('credentials');
	} catch (error) {
		res.status(500).send({ success: 'false', error: error.message })
	}
})

TokenRouter.get('/tokenPage', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			throw new Error('request is not authenticated');
		}
		return res.render('credentials');
	} catch (error){
		return res.redirect('/');
	}
})