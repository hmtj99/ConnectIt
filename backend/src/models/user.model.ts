import { Schema, model } from 'mongoose';
import { User } from '../interfaces';

const schema = new Schema<User>({
	name: { type: String, required: true },
	googleId: { type: String, required: true },
	email: {type: String, required: true}
});

export const UserModel = model<User>('User', schema);