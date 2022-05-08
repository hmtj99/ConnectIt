import express from 'express';
import { CredentialModel } from '../models/credentials.model';
import { GoogleCalendarService } from '../services/googleCalendar.service';

export const CalendarRouter = express.Router();

CalendarRouter.get('/listCalendars', async (req,res) => {
	try {
		if(!req.isAuthenticated()){
			throw new Error('request is not authenticated');
		}

		const user = req.user as any;
		const {credentials} = await CredentialModel.findOne({userId: user._id, provider: 'googleCalendar'});
		const googleCalendarService = new GoogleCalendarService(credentials);
		
		const payload = await googleCalendarService.getCalendarList();
    
		return res.json(payload);
	} catch(error){
		res.status(500).send({success:'false', error: error.message})
	}
})