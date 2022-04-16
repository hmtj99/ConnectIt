import { CreateIntegrationInput, RemoveIntegrationInput } from "../interfaces";
import { IntegrationModel } from "../models/integration.model";

class IntegrationService {
	async createIntegration(createIntegrationInput: CreateIntegrationInput): Promise<any> {
		try {
			const {user, metadata, sourceProvider, targetProvider, type} = createIntegrationInput;
			const integrationDoc = new IntegrationModel({
				userId: user._id,
				sourceProvider,
				targetProvider,
				metadata,
				type,
			});
			const response = await integrationDoc.save();
			return response;
		} catch (error) {
			console.log('IntegrationService.createIntegration: error occured while creating integration', error.message);
			throw error;
		}
	}

	async removeIntegration(removeIntgrationInput: RemoveIntegrationInput): Promise<any> {
		try {
			const {integrationId} = removeIntgrationInput;
			const response = await IntegrationModel.findByIdAndRemove(integrationId);
			return response;
		} catch (error) {
			console.log('IntegrationService.removeIntegration: error occured while removing integration', error.message);
			throw error;
		}
	}
}

export const integrationService = new IntegrationService();