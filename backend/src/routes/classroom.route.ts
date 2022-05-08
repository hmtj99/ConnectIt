import express from 'express';
import { CredentialModel } from '../models/credentials.model';
import { GoogleClassroomService } from '../services/googleClassroom.service';

export const ClassroomRouter = express.Router();

ClassroomRouter.get('/listCourses', async (req,res) => {
	try {
		if(!req.isAuthenticated()){
			throw new Error('request is not authenticated');
		}

		const user = req.user as any;
		const {credentials} = await CredentialModel.findOne({userId: user._id, provider: 'googleClassroom'});
		console.log(credentials);
		const googleClassroomService = new GoogleClassroomService(credentials);
		
		const payload = await googleClassroomService.listCourses();
    
		return res.json({success: true, payload});
	} catch(error){
		res.status(500).send({success:'false', error: error.message})
	}
})