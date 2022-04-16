import TwitterApi from 'twitter-api-v2';

export class TwitterService {
	private twitterClient: TwitterApi;
	constructor(credentials) {
		this.twitterClient = new TwitterApi(credentials);
	}

	async getUser(): Promise<any>{
		const user = await this.twitterClient.currentUserV2();
		console.log('Current user is -> ', user);
		return user;
	}

	async postTweet(message: string): Promise<any> {
		const res = await this.twitterClient.v1.tweet(message);
		return res;
	}

	async postTweetWithImages(message: string, filePaths: string[]): Promise<any> {
		const imageUploadPromises = filePaths.map(path => this.twitterClient.v1.uploadMedia(path));
		const mediaIds = await Promise.all(imageUploadPromises);
		const res = await this.twitterClient.v1.tweet(message, {media_ids: mediaIds});
		return res;
	}
}

// export const twitterService = new TwitterService();