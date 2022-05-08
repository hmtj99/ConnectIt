import snoowrap from "snoowrap";
import { PostToSubredditInput } from "../interfaces";

export class RedditService {
	private redditClient: snoowrap;
	constructor(credentials) {
		this.redditClient = new snoowrap({
			userAgent: 'connectIt',
			...credentials,
		})
	}

	//turn spam strength to low for bots from community settings

	async postToSubreddit(postToSubredditInput: PostToSubredditInput): Promise<void>{
		const {subreddit, title, text} = postToSubredditInput;
		this.redditClient.getSubreddit(subreddit).submitSelfpost({
			subredditName: subreddit,
			title,
			text
		}).then((submission) => {console.log(submission)}, (reason) => {console.log(reason)});
	}
}