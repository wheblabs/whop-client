/**
 * User types for the Whop client
 */

/**
 * Discord account info
 */
export interface UserDiscordAccount {
	username: string
	id: string
}

/**
 * Telegram account info
 */
export interface UserTelegramAccount {
	telegramUsername: string
	telegramAccountId: string
}

/**
 * Twitter account info
 */
export interface UserTwitterAccount {
	username: string
}

/**
 * A Whop user
 */
export interface User {
	id: string
	email?: string
	name?: string
	username?: string
	profilePicUrl?: string
	bio?: string
	city?: string
	countryName?: string
	stateName?: string
	createdAt?: string
	discord?: UserDiscordAccount
	telegramAccount?: UserTelegramAccount
	twitterAccount?: UserTwitterAccount
	isVerified?: boolean
	isOnboarded?: boolean
}

/**
 * User with public-only fields (when viewing another user)
 */
export interface PublicUser {
	id: string
	name?: string
	username?: string
	profilePicUrl?: string
	bio?: string
	isVerified?: boolean
}
