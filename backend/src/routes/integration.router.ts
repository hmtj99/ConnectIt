import express from 'express';
import { integrationService } from '../services/integration.service';

export const IntegrationRouter = express.Router();

IntegrationRouter.post('/addTelegramTwitterPostIntegration', async (req,res) => {
	try {
		if(!req.isAuthenticated){
			throw new Error('request is not authenticated, Please login');
		}
		
		const {triggerPattern, replyPattern} = req.body;
		if(!triggerPattern || !replyPattern){
			throw new Error('Invalid input, Please try again');
		}

		const response = await integrationService.createIntegration({
			user: req.user,
			sourceProvider: 'telegram',
			targetProvider: 'twitter',
			type: 'telegramTwitterPost',
			metadata: {
				triggerPattern,
				replyPattern,
			}
		});

		return res.json(response);
	} catch (error){
		return res.json({success: false, error: error.message})
	}
});

IntegrationRouter.post('/addTelegramTwitterImagePostIntegration', async (req,res) => {
	try {
		if(!req.isAuthenticated){
			throw new Error('request is not authenticated, Please login');
		}
		
		const {triggerPattern, replyPattern} = req.body;
		if(!triggerPattern || !replyPattern){
			throw new Error('Invalid input, Please try again');
		}

		const response = await integrationService.createIntegration({
			user: req.user,
			sourceProvider: 'telegram',
			targetProvider: 'twitter',
			type: 'telegramTwitterImagePost',
			metadata: {
				triggerPattern,
				replyPattern,
			}
		});

		return res.json(response);
	} catch (error){
		return res.json({success: false, error: error.message})
	}
});
