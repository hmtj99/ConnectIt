import express from 'express';
import 'dotenv/config';
import { TelegramService } from './services/telegram.service';
import { mongoConnect } from './connection/mongoConnection';
import { UserModel } from './models/user.model';
import passport from 'passport';
import session from 'express-session';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from './interfaces';
import { CredentialModel } from './models/credentials.model';
import { TokenRouter } from './routes/token.router';
import { google } from 'googleapis';
import { tokenService } from './services/token.service';
import { IntegrationRouter } from './routes/integration.router';
import { CalendarRouter } from './routes/calendar.route';
import { ClassroomRouter } from './routes/classroom.route';
import path from 'path';
import { RedditService } from './services/reddit.service';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
	secret: 'cookie_secret',
	resave: true,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.join(__dirname, "public")));

passport.serializeUser((user: User, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: 'http://localhost:3000/redirectLogin',
	scope: ['profile', 'email'],
	state: true
},
async function (accessToken, refreshToken, profile, cb) {
	const user = await UserModel.findOne({ googleId: profile.id });
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
app.use('/calendar', CalendarRouter);
app.use('/classroom', ClassroomRouter);

app.get('/', (req, res) => {
	res.render('login');
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
	case 'https://www.googleapis.com/auth/classroom.courses https://www.googleapis.com/auth/classroom.announcements': {
		provider = 'googleClassroom';
		break;
	}
	default: {
		return res.json({ success: false, error: `Invalid scope: ${scope}` });
	}
	}

	const payload = await tokenService.setTokenForUser({
		creds: tokens,
		user: req.user,
		provider
	})
	return res.render('credentials');
})

app.get('/redirectLogin', passport.authenticate('google', {
	successReturnToOrRedirect: '/integration/dashboard',
	failureRedirect: '/login'
}))

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

async function startTelegramBots(): Promise<void> {
	try {
		const telegramCreds = await CredentialModel.find({ provider: 'telegram' }).lean().exec();
		for (const telegramCred of telegramCreds) {
			const { credentials, userId } = telegramCred;
			const user = await UserModel.findById(userId).lean();
			const telegramService = new TelegramService(credentials.token, user);
			telegramService.listen();
		}
	} catch (error) {
		throw new Error(`Unable to start telegram bots:${error.message}`);
	}
}

app.get('/login', passport.authenticate('google'));

app.listen(port, async () => {
	await mongoConnect();
	await startTelegramBots();
	return console.log(`Express is listening at http://localhost:${port}`);
});