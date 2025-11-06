import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { CurrentUser } from '@/types/user'
import { MeCompanies } from './companies'

/**
 * Me resource - get current authenticated user information
 */
export class Me {
	public readonly companies: MeCompanies

	constructor(private readonly client: Whop) {
		this.companies = new MeCompanies(client)
	}

	/**
	 * Get current authenticated user information
	 *
	 * @returns Current user details including email, username, and profile pictures
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * const user = await whop.me.get()
	 *
	 * console.log(`Logged in as: ${user.username}`)
	 * console.log(`Email: ${user.email}`)
	 * console.log(`User ID: ${user.id}`)
	 * console.log(`Profile pic: ${user.profilePic48.original}`)
	 * ```
	 */
	async get(): Promise<CurrentUser> {
		// Check authentication
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		// GraphQL query
		const query = `
      query fetchMe {
        viewer {
          user {
            email
            id
            profilePic16: profilePicSrcset(style: s16, allowAnimation: true) {
              original
              double
              isVideo
            }
            profilePic48: profilePicSrcset(style: s48, allowAnimation: true) {
              original
              double
              isVideo
            }
            username
          }
        }
      }
    `

		// Make request
		interface FetchMeResponse {
			viewer: {
				user: CurrentUser
			}
		}

		const response = await graphqlRequest<FetchMeResponse>(
			'fetchMe',
			{ query, operationName: 'fetchMe' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.viewer.user
	}
}
