/* eslint-disable no-useless-catch */
import { SetTokenForUserInput } from "../interfaces";
import { CredentialModel } from "../models/credentials.model";

class TokenService {
	async setTokenForUser(setTokenForUserInput: SetTokenForUserInput): Promise<any>{
		try {
			const {creds,user,provider} = setTokenForUserInput;
			
			// if already token exists, update it
			const credentialDoc = await CredentialModel.findOne({userId: user._id, provider});
			if(credentialDoc){
				const res = await CredentialModel.updateOne(
					{
						userId: user._id,
						provider,
					},
					{
						$set: {credentials: creds}
					}
				)

				return res;
			}

			const credsDoc = new CredentialModel({
				userId: user._id,
				provider,
				credentials: creds
			});
			const res = await credsDoc.save();
			return res;
		} catch (error){
			throw error;
		}
	}
}

export const tokenService = new TokenService();