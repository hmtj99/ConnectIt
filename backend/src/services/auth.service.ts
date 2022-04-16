import passport from "passport";

import { UserModel } from "../models/user.model";

// passport.serializeUser((user, done) => {
// 	done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
// 	UserModel.findById(id).then(user => {
// 		done(null, user);
// 	});
// });

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login');
}