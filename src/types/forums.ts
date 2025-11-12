/**
 * Forum types
 */

import type { Experience } from './experiences'

/**
 * Forum experience - same as Experience but guaranteed to be a forum
 */
export type ForumExperience = Experience

/**
 * Reaction count for a forum post
 */
export interface ReactionCount {
	reactionType: string
	userCount: number
	value: string
}

/**
 * Own reaction (emoji or vote)
 */
export interface OwnReaction {
	id: string
	value: string | number
	reactionType: string
}

/**
 * GIF attachment
 */
export interface GifAttachment {
	originalUrl: string
	url: string
	previewUrl: string
	width: number
	height: number
	slug: string
	title: string
	provider: string
}

/**
 * Mux video asset
 */
export interface MuxAsset {
	id: string
	status: string
	playbackId: string
	signedPlaybackId: string | null
	signedThumbnailPlaybackToken: string | null
	signedVideoPlaybackToken: string | null
	signedStoryboardPlaybackToken: string | null
	durationSeconds: number | null
}

/**
 * File attachment base (forum-specific)
 */
export interface ForumAttachment {
	__typename: string
	id: string
	filename: string
	contentType: string
	byteSizeV2: number
	source: {
		url: string
	}
}

/**
 * Image attachment
 */
export interface ImageAttachment extends ForumAttachment {
	__typename: 'ImageAttachment'
	height: number
	width: number
	blurhash: string | null
	aspectRatio: number | null
}

/**
 * Video attachment
 */
export interface VideoAttachment extends ForumAttachment {
	__typename: 'VideoAttachment'
	height: number
	width: number
	duration: number | null
	aspectRatio: number | null
	preview: {
		url: string
	} | null
}

/**
 * Audio attachment
 */
export interface AudioAttachment extends ForumAttachment {
	__typename: 'AudioAttachment'
	duration: number | null
	waveformUrl: string | null
}

/**
 * Line item (purchase)
 */
export interface LineItem {
	id: string
	amount: number
	redirectUrl: string | null
	baseCurrency: string
}

/**
 * Poll option
 */
export interface PollOption {
	id: string
	text: string
}

/**
 * Poll
 */
export interface Poll {
	options: PollOption[]
}

/**
 * User profile
 */
export interface ForumUser {
	id: string
	name: string
	username: string
	profilePicture: {
		source: {
			url: string
		}
	} | null
}

/**
 * Forum post (UniversalForumPost fragment)
 */
export interface ForumPost {
	id: string
	createdAt: string // BigInt as string (milliseconds since epoch)
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
	reactionCounts: ReactionCount[]
	ownReactions: OwnReaction[]
	gifs: GifAttachment[]
	muxAssets: MuxAsset[]
	attachments: (
		| ForumAttachment
		| ImageAttachment
		| VideoAttachment
		| AudioAttachment
	)[]
	user: ForumUser
	lineItem: LineItem | null
	poll: Poll | null
	mentionedUserIds: string[]
}

/**
 * Tree post with nested children
 */
export interface TreePost extends ForumPost {
	depth: number
	children: TreePost[]
	isOrphan: boolean
	isChildLess: boolean
}

/**
 * Post with nested comments
 */
export interface PostWithComments extends ForumPost {
	comments: TreePost[]
}

/**
 * Pagination info (inferred from response)
 */
export interface ForumPaginationInfo {
	hasNextPage: boolean
	nextBefore: string | null // BigInt timestamp for next page
}

/**
 * Forum posts response
 */
export interface ForumPostsResponse {
	posts: ForumPost[]
	pagination: ForumPaginationInfo
}

/**
 * Forum posts response with comments
 */
export interface ForumPostsWithCommentsResponse {
	posts: PostWithComments[]
	pagination: ForumPaginationInfo
}

/**
 * Forum comments response
 */
export interface ForumCommentsResponse {
	posts: ForumPost[] // Comments are also ForumPost type
	pagination: ForumPaginationInfo
	totalCount: number
}

/**
 * Options for listing forum posts
 */
export interface ForumPostsListOptions {
	/** Maximum number of posts to return per page */
	limit?: number
	/** Timestamp (milliseconds since epoch) to fetch posts created before this time */
	before?: string
	/** Include comments for each post (fetched separately) */
	withComments?: boolean
}

/**
 * Options for listing forum comments
 */
export interface ForumCommentsListOptions {
	/** Maximum number of comments to return per page */
	limit?: number
	/** Timestamp (milliseconds since epoch) to fetch comments created before this time */
	before?: string
}
