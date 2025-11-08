import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { AppStoreResponse, QueryAppStoreOptions } from '@/types/app-store'

/**
 * App Store resource - query public apps from the Whop app store
 */
export class AppStore {
	constructor(private readonly client: Whop) {}

	/**
	 * Query public apps from the Whop app store
	 *
	 * @param options - Query options including pagination, filtering, sorting, and search
	 * @returns Paginated list of public apps
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * **Basic query (first page):**
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * const result = await whop.appStore.query({
	 *   first: 20,
	 *   orderBy: 'total_installs_last_30_days',
	 *   viewType: 'hub'
	 * })
	 *
	 * console.log(`Found ${result.nodes.length} apps`)
	 * console.log(`Total: ${result.totalCount}`)
	 * ```
	 *
	 * @example
	 * **Filter by category:**
	 * ```typescript
	 * const result = await whop.appStore.query({
	 *   first: 20,
	 *   category: 'ai',
	 *   orderBy: 'total_installs_last_30_days',
	 *   viewType: 'hub'
	 * })
	 * ```
	 *
	 * @example
	 * **Search query:**
	 * ```typescript
	 * const result = await whop.appStore.query({
	 *   first: 20,
	 *   query: 'analytics',
	 *   orderBy: 'discoverable_at',
	 *   viewType: 'hub'
	 * })
	 * ```
	 *
	 * @example
	 * **Pagination (next page):**
	 * ```typescript
	 * const firstPage = await whop.appStore.query({
	 *   first: 20,
	 *   viewType: 'hub'
	 * })
	 *
	 * if (firstPage.pageInfo.hasNextPage) {
	 *   const secondPage = await whop.appStore.query({
	 *     first: 20,
	 *     after: firstPage.pageInfo.endCursor,
	 *     viewType: 'hub'
	 *   })
	 * }
	 * ```
	 */
	async query(options: QueryAppStoreOptions = {}): Promise<AppStoreResponse> {
		// Check authentication
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const {
			first = 20,
			after,
			orderBy = 'total_installs_last_30_days',
			category,
			query,
			viewType = 'hub',
		} = options

		// GraphQL query
		const graphqlQuery = `
      query fetchDiscoverPublicApps(
        $first: Int
        $after: String
        $orderBy: AppOrder
        $category: ID
        $query: String
        $viewType: AppViewTypes
      ) {
        apps(
          first: $first
          after: $after
          order: $orderBy
          marketplaceCategoryRoute: $category
          query: $query
          viewType: $viewType
        ) {
          nodes {
            id
            internalIdentifier
            name
            description
            usingDefaultIcon
            icon {
              source(variant: s180) {
                url
              }
            }
            totalInstalls
            totalInstallsLast30Days
            stats {
              dau
              timeSpentLast24HoursInSeconds
            }
            status
            discoverableAt
            creator {
              id
              name
              username
              roles
              profilePicture {
                source(variant: s128) {
                  url
                }
              }
            }
          }
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `

		// Build variables
		const variables: Record<string, unknown> = {
			first,
			orderBy,
			viewType,
		}

		if (after) {
			variables.after = after
		}

		if (category) {
			variables.category = category
		}

		if (query) {
			variables.query = query
		}

		// Make request
		interface FetchDiscoverPublicAppsResponse {
			apps: AppStoreResponse
		}

		const response = await graphqlRequest<FetchDiscoverPublicAppsResponse>(
			'fetchDiscoverPublicApps',
			{
				query: graphqlQuery,
				variables,
				operationName: 'fetchDiscoverPublicApps',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.apps
	}
}
