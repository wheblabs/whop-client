import type { Whop } from '@/client'
import { WhopAuthError, WhopForumError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	ForumCommentsListOptions,
	ForumCommentsResponse,
	ForumPost,
} from '@/types/forums'
import type { ForumBuilder } from './forum-builder'

/**
 * GraphQL response structure for ForumsFetchPostChildren
 */
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

/**
 * Comments collection for a specific post
 */
export class ForumComments {
	constructor(
		private readonly client: Whop,
		readonly _companyId: string,
		private readonly experienceId: string,
		private readonly postId: string,
		private readonly forumBuilder: ForumBuilder,
	) {}

	/**
	 * List comments for this post
	 *
	 * @param options - Pagination options
	 * @returns Paginated comments response
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopForumError} On forum-specific errors
	 *
	 * @example
	 * ```typescript
	 * const comments = await whop.company('biz_xxx')
	 *   .forum('exp_123')
	 *   .post('post_456')
	 *   .comments.list({ limit: 20 })
	 *
	 * console.log(`Found ${comments.posts.length} comments`)
	 * console.log(`Total: ${comments.totalCount}`)
	 *
	 * if (comments.pagination.hasNextPage) {
	 *   // Fetch next page
	 *   const nextPage = await post.comments.list({
	 *     limit: 20,
	 *     before: comments.pagination.nextBefore!
	 *   })
	 * }
	 * ```
	 */
	async list(
		options: ForumCommentsListOptions = {},
	): Promise<ForumCommentsResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const { limit = 20, before } = options

		// Get feedId
		const feedId = await this.forumBuilder.getFeedId()

		const query = `
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

		try {
			const variables: Record<string, unknown> = {
				feedId,
				postId: this.postId,
				limit,
			}

			if (before) {
				variables.before = BigInt(before)
			}

			const response = await graphqlRequest<PostChildrenResponse>(
				'ForumsFetchPostChildren',
				{
					query,
					variables,
					operationName: 'ForumsFetchPostChildren',
				},
				tokens,
				(newTokens) => this.client._updateTokens(newTokens),
			)

			// Map GraphQL response to ForumPost type
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
						signedStoryboardPlaybackToken: asset.signedStoryboardPlaybackToken,
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

			// Infer pagination
			const hasNextPage = comments.length === limit
			const nextBefore =
				hasNextPage && comments.length > 0
					? (
							BigInt(comments[comments.length - 1]?.createdAt ?? 0) - BigInt(1)
						).toString()
					: null

			// Calculate totalCount by paginating through all pages
			// For now, we'll estimate based on the first page
			// In a real implementation, you might want to cache this or fetch it separately
			const totalCount = hasNextPage ? comments.length + 1 : comments.length

			return {
				posts: comments,
				pagination: {
					hasNextPage,
					nextBefore,
				},
				totalCount,
			}
		} catch (error) {
			if (error instanceof WhopForumError) {
				throw error
			}
			throw new WhopForumError(
				`Failed to fetch comments for post ${this.postId}`,
				this.experienceId,
				feedId,
				this.postId,
				undefined,
				error as Error,
			)
		}
	}
}
