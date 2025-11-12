import type { Whop } from '@/client'
import type { ForumBuilder } from './forum-builder'
import { ForumComments } from './forum-comments'

/**
 * Post builder - provides access to a specific post's comments
 */
export class ForumPostBuilder {
	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
		private readonly experienceId: string,
		public readonly postId: string,
		private readonly forumBuilder: ForumBuilder,
	) {}

	/**
	 * Access comments for this post
	 */
	get comments(): ForumComments {
		return new ForumComments(
			this.client,
			this.companyId,
			this.experienceId,
			this.postId,
			this.forumBuilder,
		)
	}
}
