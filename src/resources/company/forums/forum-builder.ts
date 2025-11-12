import type { Whop } from '@/client'
import { WhopAuthError, WhopForumError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import { ForumPostBuilder } from './forum-post-builder'
import { ForumPosts } from './forum-posts'

/**
 * GraphQL response structure for FetchForumFeed
 */
interface FetchForumFeedResponse {
	publicExperience: {
		forumFeed: {
			id: string
			isDeleted: boolean
		} | null
	}
}

/**
 * Forum builder - provides access to a specific forum's posts and comments
 */
export class ForumBuilder {
	private _feedId: string | null = null

	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
		public readonly experienceId: string,
	) {}

	/**
	 * Get the feed ID for this forum (fetches if not already cached)
	 */
	async getFeedId(): Promise<string> {
		if (this._feedId) {
			return this._feedId
		}

		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query FetchForumFeed($publicExperienceId: ID!) {
        publicExperience(id: $publicExperienceId) {
          forumFeed {
            id
            isDeleted
          }
        }
      }
    `

		try {
			const response = await graphqlRequest<FetchForumFeedResponse>(
				'FetchForumFeed',
				{
					query,
					variables: { publicExperienceId: this.experienceId },
					operationName: 'FetchForumFeed',
				},
				tokens,
				(newTokens) => this.client._updateTokens(newTokens),
			)

			if (!response.publicExperience.forumFeed) {
				throw new WhopForumError(
					`Forum feed not found for experience ${this.experienceId}. This may not be a forum experience.`,
					this.experienceId,
				)
			}

			if (response.publicExperience.forumFeed.isDeleted) {
				throw new WhopForumError(
					`Forum feed for experience ${this.experienceId} has been deleted`,
					this.experienceId,
					response.publicExperience.forumFeed.id,
				)
			}

			this._feedId = response.publicExperience.forumFeed.id
			return this._feedId
		} catch (error) {
			if (error instanceof WhopForumError) {
				throw error
			}
			throw new WhopForumError(
				`Failed to fetch forum feed ID for experience ${this.experienceId}`,
				this.experienceId,
				undefined,
				undefined,
				undefined,
				error as Error,
			)
		}
	}

	/**
	 * Access posts in this forum
	 */
	get posts(): ForumPosts {
		return new ForumPosts(this.client, this.companyId, this.experienceId, this)
	}

	/**
	 * Access a specific post in this forum
	 *
	 * @param postId - The post ID
	 * @returns ForumPostBuilder for the specified post
	 */
	post(postId: string): ForumPostBuilder {
		return new ForumPostBuilder(
			this.client,
			this.companyId,
			this.experienceId,
			postId,
			this,
		)
	}
}
