import { Schema, model } from 'mongoose';
import { Credentials } from '../interfaces';

const schema = new Schema<Credentials>({
	userId: { type: Schema.Types.ObjectId, required: true },
	provider: { type: String, required: true },
	credentials: {type: Schema.Types.Mixed}
});

export const CredentialModel = model<Credentials>('Credentials', schema);