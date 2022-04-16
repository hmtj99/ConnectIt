import express from 'express';
import 'dotenv/config';
import { TelegramService } from './services/telegram.service';
import { googleCalendarService } from './services/googleCalendar.service';
import { googleClassroomService } from './services/googleClassroom.service';
import { mongoConnect } from './connection/mongoConnection';
import { UserModel } from './models/user.model';
import passport from 'passport';
import session from 'express-session';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from './interfaces';
import mongoose from 'mongoose';
import { CredentialModel } from './models/credentials.model';
// import { twitterService } from './services/twitter.service';
import { TokenRouter } from './routes/token.router';
import { google } from 'googleapis';
import { tokenService } from './services/token.service';
import { IntegrationRouter } from './routes/integration.router';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(session({
	secret: 'cookie_secret',
	resave: true,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: User, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	console.log(obj);
	done(null, obj);
	// UserModel.find({email:obj.email}).then(user => {
	// 	done(null, user);
	// });
});

passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: 'http://localhost:3000/redirectLogin',
	scope: ['profile', 'email'],
	state: true
},
async function (accessToken, refreshToken, profile, cb) {
	// console.log(accessToken);
	// console.log(refreshToken);
	// console.log(profile);

	const user = await UserModel.findOne({ googleId: profile.id });
	console.log('user found - ', user);
	if (!user) {
		console.log(`User with id:${profile.id} not found`);
		const userDoc = new UserModel({
			name: profile.displayName,
			email: profile.emails[0].value,
			googleId: profile.id
		});
		await userDoc.save();
		return cb(null, userDoc);
	}
	return cb(null, user);
}));

app.use('/token', TokenRouter);
app.use('/integration', IntegrationRouter);

app.get('/', (req, res) => {
	console.log(req.user);
	console.log(req.isAuthenticated);
	res.sendFile('/Users/hemantjain/Desktop/connectIt/frontend/index.html');
});

app.get('/generateAuthUrl', (req, res) => {
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
	return res.json({ url });
})

app.get('/setGoogleToken', async (req, res) => {
	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		"http://localhost:3000/setGoogleToken",
	)
	console.log('/setGoogleToken endpoint hit with body ', req.body);
	const code = req.query.code as any;
	const { tokens } = await oauth2Client.getToken(code);
	const { scope } = tokens;
	let provider;

	switch (scope) {
	case 'https://www.googleapis.com/auth/drive': {
		provider = 'googleDrive';
		break;
	}
	case 'https://www.googleapis.com/auth/calendar': {
		provider = 'googleCalendar';
		break;
	}
	case 'https://www.googleapis.com/auth/classroom.announcements https://www.googleapis.com/auth/classroom.courses': {
		provider = 'googleClassroom';
		break;
	}
	default: {
		return res.json({success:false, error: 'Invalid scope'});
	}
	}

	const payload = await tokenService.setTokenForUser({
		creds: tokens,
		user: req.user,
		provider
	})
	return res.json(payload);
})

app.get('/redirectLogin', passport.authenticate('google', {
	successReturnToOrRedirect: '/',
	failureRedirect: '/login'
}))

// app.post('/uploadFile', async (req,res) => {
// 	console.log("uploading image");
// 	await googleDriveService.uploadFile();
// 	return res.send('File uploaded successfully');
// })

app.post('/courses', async (req, res) => {
	console.log(req.user);
	const courses = await googleClassroomService.listCourses();
	return res.json({ courses });
})

app.post('/createUser', async (req, res) => {
	const { email, name } = req.body;
	const doc = new UserModel({
		email,
		name
	});
	const response = await doc.save();
	return res.json(response);
})

app.post('/addTelegramCredentials', async (req, res) => {
	const creds = req.body;
	const user = req.user as any;
	const credsDoc = new CredentialModel({
		userId: user._id,
		provider: 'telegram',
		credentials: {
			token: creds.token
		}
	});
	await credsDoc.save();
	return res.json(credsDoc);
});

app.post('/startTelegramBot', async (req, res) => {
	const user = req.user as any;
	console.log('/startTelegramBot signed user - ', user);
	const creds = await CredentialModel.findOne({ userId: user._id, provider: 'telegram' });
	console.log('fetched creds = ', creds);
	const telegramService = new TelegramService(creds.credentials.token, req.user);
	telegramService.listen();
	return res.send("Telegram bot listening!!!");
})

// app.get('/getUser', async (req, res) => {
// 	const user = await twitterService.getUser();
// 	return res.json(user);
// })

// app.get('/postTweet', async (req,res) => {
// 	const payload = await twitterService.postTweet();
// 	return res.json(payload);
// })

app.get('/login', passport.authenticate('google'));

app.listen(port, async () => {
	// telegramService.listen();
	await mongoConnect();
	// googleDriveService.authorize(); 
	// googleCalendarService.authorize();
	// googleClassroomService.authorize();
	return console.log(`Express is listening at http://localhost:${port}`);
});