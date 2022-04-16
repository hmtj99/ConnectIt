import { Schema, model } from 'mongoose';
import { Integration } from '../interfaces';

const schema = new Schema<Integration>({
	userId: { type: Schema.Types.ObjectId, required: true },
	targetProvider: { type: String, required: true },
	sourceProvider: { type: String, required: true },
	metadata: {type: Schema.Types.Mixed},
	type: { type: String, required: true }
});

export const IntegrationModel = model<Integration>('Integration', schema);