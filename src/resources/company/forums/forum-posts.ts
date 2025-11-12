import type { Whop } from '@/client'
import { WhopAuthError, WhopForumError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	ForumPost,
	ForumPostsListOptions,
	ForumPostsResponse,
	ForumPostsWithCommentsResponse,
	PostWithComments,
} from '@/types/forums'
import type { ForumBuilder } from './forum-builder'
import { buildCommentTree } from './utils'

/**
 * GraphQL response structure for coreForumsFetchFeedPosts
 */
interface FeedPostsResponse {
	feedPosts: {
		posts: Array<{
			id: string
			createdAt: string
			title: string
			content: string
			richContent: string | null
			feedId: string
			userId: string
			parentId: string | null
			commentCount: number
			viewCount: number
			pinned: boolean
			isDeleted: boolean
			isEdited: boolean
			isPosterAdmin: boolean
			mentionedUserIds: string[]
			reactionCounts: Array<{
				reactionType: string
				userCount: number
				value: string
			}>
			ownReactions: {
				nodes: Array<{
					id: string
					value: string | number
					reactionType: string
				}>
			}
			gifs: Array<{
				originalUrl: string
				url: string
				previewUrl: string
				width: number
				height: number
				slug: string
				title: string
				provider: string
			}>
			lineItem: {
				id: string
				amount: number
				redirectUrl: string | null
				baseCurrency: string
			} | null
			poll: {
				options: Array<{
					id: string
					text: string
				}>
			} | null
			muxAssets: Array<{
				id: string
				status: string
				signedPlaybackId: string | null
				playbackId: string
				signedThumbnailPlaybackToken: string | null
				signedVideoPlaybackToken: string | null
				signedStoryboardPlaybackToken: string | null
				durationSeconds: number | null
			}>
			attachments: Array<{
				__typename: string
				id: string
				filename: string
				contentType: string
				byteSizeV2: number
				source: {
					url: string
				}
				height?: number
				width?: number
				blurhash?: string | null
				aspectRatio?: number | null
				duration?: number | null
				preview?: {
					url: string
				} | null
				waveformUrl?: string | null
			}>
			user: {
				id: string
				name: string
				username: string
				profilePicture: {
					source: {
						url: string
					}
				} | null
			}
		}>
	}
}

/**
 * Posts collection for a specific forum
 */
export class ForumPosts {
	constructor(
		private readonly client: Whop,
		readonly _companyId: string,
		private readonly experienceId: string,
		private readonly forumBuilder: ForumBuilder,
	) {}

	/**
	 * List posts in this forum
	 *
	 * @param options - Pagination and options including withComments
	 * @returns Paginated posts response (with or without comments)
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopForumError} On forum-specific errors
	 *
	 * @example
	 * ```typescript
	 * // List posts without comments
	 * const result = await whop.company('biz_xxx')
	 *   .forum('exp_123')
	 *   .posts.list({ limit: 20 })
	 *
	 * console.log(`Found ${result.posts.length} posts`)
	 * if (result.pagination.hasNextPage) {
	 *   // Fetch next page
	 *   const nextPage = await forum.posts.list({
	 *     limit: 20,
	 *     before: result.pagination.nextBefore!
	 *   })
	 * }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // List posts with comments
	 * const result = await whop.company('biz_xxx')
	 *   .forum('exp_123')
	 *   .posts.list({ limit: 20, withComments: true })
	 *
	 * for (const post of result.posts) {
	 *   console.log(`${post.title}: ${post.comments.length} comments`)
	 * }
	 * ```
	 */
	async list(
		options: ForumPostsListOptions = {},
	): Promise<ForumPostsResponse | ForumPostsWithCommentsResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const { limit = 20, before, withComments = false } = options

		// Get feedId
		const feedId = await this.forumBuilder.getFeedId()

		// Build GraphQL query
		const query = `
      query coreForumsFetchFeedPosts(
        $experienceId: ID
        $limit: Int
        $before: BigInt
        $includeChildren: Boolean
      ) {
        feedPosts(
          experienceId: $experienceId
          feedType: forum_feed
          limit: $limit
          before: $before
          includeReactions: false
          includeChildren: $includeChildren
          includeDeleted: false
        ) {
          posts {
            ... on ForumPost {
              id
              createdAt
              title
              content
              richContent
              feedId
              userId
              parentId
              commentCount
              viewCount
              pinned
              isDeleted
              isEdited
              isPosterAdmin
              mentionedUserIds
              reactionCounts {
                reactionType
                userCount
                value
              }
              ownReactions(first: 10) {
                nodes {
                  id
                  value
                  reactionType
                }
              }
              gifs {
                originalUrl
                url
                previewUrl
                width
                height
                slug
                title
                provider
              }
              lineItem {
                id
                amount
                redirectUrl
                baseCurrency
              }
              poll {
                options {
                  id
                  text
                }
              }
              muxAssets {
                id
                status
                signedPlaybackId
                playbackId
                signedThumbnailPlaybackToken
                signedVideoPlaybackToken
                signedStoryboardPlaybackToken
                durationSeconds
              }
              attachments {
                __typename
                id
                filename
                contentType
                byteSizeV2
                source(variant: original) {
                  url
                }
                ... on ImageAttachment {
                  height
                  width
                  blurhash
                  aspectRatio
                }
                ... on VideoAttachment {
                  height
                  width
                  duration
                  aspectRatio
                  preview(variant: original) {
                    url
                  }
                }
                ... on AudioAttachment {
                  duration
                  waveformUrl
                }
              }
              user {
                id
                name
                username
                profilePicture {
                  source(variant: s32) {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `

		try {
			const variables: Record<string, unknown> = {
				experienceId: this.experienceId,
				limit,
				includeChildren: false, // Always fetch posts separately, then comments if needed
			}

			if (before) {
				variables.before = BigInt(before)
			}

			const response = await graphqlRequest<FeedPostsResponse>(
				'coreForumsFetchFeedPosts',
				{
					query,
					variables,
					operationName: 'coreForumsFetchFeedPosts',
				},
				tokens,
				(newTokens) => this.client._updateTokens(newTokens),
			)

			// Map GraphQL response to ForumPost type
			const posts: ForumPost[] = response.feedPosts.posts
				.filter((post) => post.parentId === null) // Only top-level posts
				.map((post) => ({
					id: post.id,
					createdAt: post.createdAt,
					title: post.title,
					content: post.content,
					richContent: post.richContent,
					feedId: post.feedId,
					userId: post.userId,
					parentId: post.parentId,
					commentCount: post.commentCount,
					viewCount: post.viewCount,
					pinned: post.pinned,
					isDeleted: post.isDeleted,
					isEdited: post.isEdited,
					isPosterAdmin: post.isPosterAdmin,
					mentionedUserIds: post.mentionedUserIds,
					reactionCounts: post.reactionCounts,
					ownReactions: post.ownReactions.nodes,
					gifs: post.gifs,
					lineItem: post.lineItem,
					poll: post.poll,
					muxAssets: post.muxAssets.map((asset) => ({
						id: asset.id,
						status: asset.status,
						playbackId: asset.playbackId,
						signedPlaybackId: asset.signedPlaybackId,
						signedThumbnailPlaybackToken: asset.signedThumbnailPlaybackToken,
						signedVideoPlaybackToken: asset.signedVideoPlaybackToken,
						signedStoryboardPlaybackToken: asset.signedStoryboardPlaybackToken,
						durationSeconds: asset.durationSeconds,
					})),
					attachments: post.attachments.map((att) => ({
						__typename: att.__typename,
						id: att.id,
						filename: att.filename,
						contentType: att.contentType,
						byteSizeV2: att.byteSizeV2,
						source: att.source,
						...(att.__typename === 'ImageAttachment' && {
							height: att.height!,
							width: att.width!,
							blurhash: att.blurhash ?? null,
							aspectRatio: att.aspectRatio ?? null,
						}),
						...(att.__typename === 'VideoAttachment' && {
							height: att.height!,
							width: att.width!,
							duration: att.duration ?? null,
							aspectRatio: att.aspectRatio ?? null,
							preview: att.preview ?? null,
						}),
						...(att.__typename === 'AudioAttachment' && {
							duration: att.duration ?? null,
							waveformUrl: att.waveformUrl ?? null,
						}),
					})) as ForumPost['attachments'],
					user: post.user,
				}))

			// Infer pagination
			const hasNextPage = posts.length === limit
			const nextBefore =
				hasNextPage && posts.length > 0
					? // biome-ignore lint/style/noNonNullAssertion: length check guarantees element exists
						(BigInt(posts[posts.length - 1]!.createdAt) - BigInt(1)).toString()
					: null

			const pagination = {
				hasNextPage,
				nextBefore,
			}

			// If withComments is true, fetch comments for all posts
			if (withComments) {
				const postsWithComments = await this.fetchPostsWithComments(
					posts,
					feedId,
					tokens,
				)

				return {
					posts: postsWithComments,
					pagination,
				} satisfies ForumPostsWithCommentsResponse
			}

			return {
				posts,
				pagination,
			} satisfies ForumPostsResponse
		} catch (error) {
			if (error instanceof WhopForumError) {
				throw error
			}
			// Try to get feedId for error context, but don't fail if it errors
			let feedId: string | undefined
			try {
				feedId = await this.forumBuilder.getFeedId()
			} catch {
				// Ignore feedId fetch errors in error handler
			}
			throw new WhopForumError(
				`Failed to fetch posts for forum ${this.experienceId}`,
				this.experienceId,
				feedId,
				undefined,
				undefined,
				error as Error,
			)
		}
	}

	/**
	 * Fetch comments for all posts in parallel
	 */
	private async fetchPostsWithComments(
		posts: ForumPost[],
		feedId: string,
		tokens: import('@/types/auth').AuthTokens,
	): Promise<PostWithComments[]> {
		const commentQuery = `
      query ForumsFetchPostChildren(
        $feedId: ID!
        $postId: ID!
        $limit: Int
        $before: BigInt
      ) {
        postChildren(
          feedId: $feedId
          feedType: forum_feed
          postId: $postId
          limit: $limit
          before: $before
          includeReactions: true
          includeDeleted: false
        ) {
          posts {
            ... on ForumPost {
              id
              createdAt
              title
              content
              richContent
              feedId
              userId
              parentId
              commentCount
              viewCount
              pinned
              isDeleted
              isEdited
              isPosterAdmin
              mentionedUserIds
              reactionCounts {
                reactionType
                userCount
                value
              }
              ownReactions(first: 10) {
                nodes {
                  id
                  value
                  reactionType
                }
              }
              gifs {
                originalUrl
                url
                previewUrl
                width
                height
                slug
                title
                provider
              }
              lineItem {
                id
                amount
                redirectUrl
                baseCurrency
              }
              poll {
                options {
                  id
                  text
                }
              }
              muxAssets {
                id
                status
                signedPlaybackId
                playbackId
                signedThumbnailPlaybackToken
                signedVideoPlaybackToken
                signedStoryboardPlaybackToken
                durationSeconds
              }
              attachments {
                __typename
                id
                filename
                contentType
                byteSizeV2
                source(variant: original) {
                  url
                }
                ... on ImageAttachment {
                  height
                  width
                  blurhash
                  aspectRatio
                }
                ... on VideoAttachment {
                  height
                  width
                  duration
                  aspectRatio
                  preview(variant: original) {
                    url
                  }
                }
                ... on AudioAttachment {
                  duration
                  waveformUrl
                }
              }
              user {
                id
                name
                username
                profilePicture {
                  source(variant: s32) {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `

		// Response structure for postChildren is different from feedPosts
		interface PostChildrenResponse {
			postChildren: {
				posts: Array<{
					id: string
					createdAt: string
					title: string
					content: string
					richContent: string | null
					feedId: string
					userId: string
					parentId: string | null
					commentCount: number
					viewCount: number
					pinned: boolean
					isDeleted: boolean
					isEdited: boolean
					isPosterAdmin: boolean
					mentionedUserIds: string[]
					reactionCounts: Array<{
						reactionType: string
						userCount: number
						value: string
					}>
					ownReactions: {
						nodes: Array<{
							id: string
							value: string | number
							reactionType: string
						}>
					}
					gifs: Array<{
						originalUrl: string
						url: string
						previewUrl: string
						width: number
						height: number
						slug: string
						title: string
						provider: string
					}>
					lineItem: {
						id: string
						amount: number
						redirectUrl: string | null
						baseCurrency: string
					} | null
					poll: {
						options: Array<{
							id: string
							text: string
						}>
					} | null
					muxAssets: Array<{
						id: string
						status: string
						signedPlaybackId: string | null
						playbackId: string
						signedThumbnailPlaybackToken: string | null
						signedVideoPlaybackToken: string | null
						signedStoryboardPlaybackToken: string | null
						durationSeconds: number | null
					}>
					attachments: Array<{
						__typename: string
						id: string
						filename: string
						contentType: string
						byteSizeV2: number
						source: {
							url: string
						}
						height?: number
						width?: number
						blurhash?: string | null
						aspectRatio?: number | null
						duration?: number | null
						preview?: {
							url: string
						} | null
						waveformUrl?: string | null
					}>
					user: {
						id: string
						name: string
						username: string
						profilePicture: {
							source: {
								url: string
							}
						} | null
					}
				}>
			}
		}

		// Fetch comments for all posts in parallel
		const commentPromises = posts.map(async (post) => {
			try {
				const response = await graphqlRequest<PostChildrenResponse>(
					'ForumsFetchPostChildren',
					{
						query: commentQuery,
						variables: {
							feedId,
							postId: post.id,
							limit: 20, // Limit comments per post
						},
						operationName: 'ForumsFetchPostChildren',
					},
					tokens,
					(newTokens) => this.client._updateTokens(newTokens),
				)

				// Map GraphQL response to ForumPost type (same mapping as posts)
				const comments: ForumPost[] = response.postChildren.posts.map(
					(comment) => ({
						id: comment.id,
						createdAt: comment.createdAt,
						title: comment.title,
						content: comment.content,
						richContent: comment.richContent,
						feedId: comment.feedId,
						userId: comment.userId,
						parentId: comment.parentId,
						commentCount: comment.commentCount,
						viewCount: comment.viewCount,
						pinned: comment.pinned,
						isDeleted: comment.isDeleted,
						isEdited: comment.isEdited,
						isPosterAdmin: comment.isPosterAdmin,
						mentionedUserIds: comment.mentionedUserIds,
						reactionCounts: comment.reactionCounts,
						ownReactions: comment.ownReactions.nodes,
						gifs: comment.gifs,
						lineItem: comment.lineItem,
						poll: comment.poll,
						muxAssets: comment.muxAssets.map((asset) => ({
							id: asset.id,
							status: asset.status,
							playbackId: asset.playbackId,
							signedPlaybackId: asset.signedPlaybackId,
							signedThumbnailPlaybackToken: asset.signedThumbnailPlaybackToken,
							signedVideoPlaybackToken: asset.signedVideoPlaybackToken,
							signedStoryboardPlaybackToken:
								asset.signedStoryboardPlaybackToken,
							durationSeconds: asset.durationSeconds,
						})),
						attachments: comment.attachments.map((att) => ({
							__typename: att.__typename,
							id: att.id,
							filename: att.filename,
							contentType: att.contentType,
							byteSizeV2: att.byteSizeV2,
							source: att.source,
							...(att.__typename === 'ImageAttachment' && {
								height: att.height!,
								width: att.width!,
								blurhash: att.blurhash ?? null,
								aspectRatio: att.aspectRatio ?? null,
							}),
							...(att.__typename === 'VideoAttachment' && {
								height: att.height!,
								width: att.width!,
								duration: att.duration ?? null,
								aspectRatio: att.aspectRatio ?? null,
								preview: att.preview ?? null,
							}),
							...(att.__typename === 'AudioAttachment' && {
								duration: att.duration ?? null,
								waveformUrl: att.waveformUrl ?? null,
							}),
						})) as ForumPost['attachments'],
						user: comment.user,
					}),
				)

				const commentTree = buildCommentTree(comments, post.id)

				return {
					...post,
					comments: commentTree,
				} satisfies PostWithComments
			} catch (error) {
				throw new WhopForumError(
					`Failed to fetch comments for post ${post.id}`,
					this.experienceId,
					feedId,
					post.id,
					undefined,
					error as Error,
				)
			}
		})

		return Promise.all(commentPromises)
	}
}
