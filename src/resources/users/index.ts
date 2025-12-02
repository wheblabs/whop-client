import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { PublicUser, User } from './types'

export * from './types'

/**
 * Users resource for looking up users
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // Get user by ID
 * const user = await whop.users.get('user_xxx')
 *
 * // Get user by username
 * const user = await whop.users.getByUsername('johndoe')
 * ```
 */
export class Users {
	constructor(private readonly client: Whop) {}

	/**
	 * Get a user by ID
	 *
	 * @param userId - User ID
	 * @returns User details
	 */
	async get(userId: string): Promise<User> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchUser($id: ID!) {
				user(id: $id) {
					id
					email
					name
					username
					profilePicUrl
					bio
					city
					countryName
					stateName
					createdAt
					isVerified
					discord {
						username
						id
					}
					telegramAccount {
						telegramUsername
						telegramAccountId
					}
					twitterAccount {
						username
					}
				}
			}
		`

		const variables = { id: userId }

		const response = await graphqlRequest<{
			user: User
		}>(
			'fetchUser',
			{ query, variables, operationName: 'fetchUser' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.user
	}

	/**
	 * Get a user by username
	 *
	 * @param username - Username (without @)
	 * @returns User details (public fields only)
	 */
	async getByUsername(username: string): Promise<PublicUser> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		// Remove @ if present
		const cleanUsername = username.replace(/^@/, '')

		const query = `
			query fetchUserByUsername($username: String!) {
				userByUsername(username: $username) {
					id
					name
					username
					profilePicUrl
					bio
					isVerified
				}
			}
		`

		const variables = { username: cleanUsername }

		const response = await graphqlRequest<{
			userByUsername: PublicUser
		}>(
			'fetchUserByUsername',
			{ query, variables, operationName: 'fetchUserByUsername' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.userByUsername
	}

	/**
	 * Check if a username exists
	 *
	 * @param username - Username to check
	 * @returns True if username exists
	 */
	async exists(username: string): Promise<boolean> {
		try {
			await this.getByUsername(username)
			return true
		} catch {
			return false
		}
	}
}
