import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	Experience,
	ExperienceAccessPass,
	InstallAppOptions,
} from '@/types/apps'
import type { App, AppsConnection, Company } from '@/types/companies'

/**
 * GraphQL response structure for fetchMyCompanies
 */
interface FetchMyCompaniesResponse {
	viewer: {
		user: {
			companies: Company[]
		}
	}
}

/**
 * Companies resource - manage Whop companies/businesses
 */
export class Companies {
	constructor(private readonly client: Whop) {}

	/**
	 * List all companies owned by the authenticated user
	 *
	 * @returns Array of companies
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 * const companies = await whop.companies.list()
	 *
	 * for (const company of companies) {
	 *   console.log(`${company.title} (${company.id})`)
	 * }
	 * ```
	 */
	async list(): Promise<Company[]> {
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
      query fetchMyCompanies {
        viewer {
          user {
            companies {
              id
              title
              image: imageSrcset(style: s64, allowAnimation: false) {
                original
                isVideo
              }
              staticImage: imageSrcset(style: s64, allowAnimation: false) {
                original
                isVideo
              }
            }
          }
        }
      }
    `

		// Make request with token refresh callback
		const response = await graphqlRequest<FetchMyCompaniesResponse>(
			'fetchMyCompanies',
			{ query, operationName: 'fetchMyCompanies' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.viewer.user.companies
	}

	/**
	 * List all apps for a specific company
	 *
	 * @param companyId - Company ID (e.g., 'biz_...')
	 * @returns Array of all apps for the company
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * const apps = await whop.companies.listApps('biz_aiWHMLzz1Dg9yl')
	 *
	 * console.log(`Total: ${apps.length}`)
	 * for (const app of apps) {
	 *   console.log(`${app.name} - DAU: ${app.stats.dau}`)
	 * }
	 * ```
	 */
	async listApps(companyId: string): Promise<App[]> {
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
      query fetchCompanyApps($id: ID!, $first: Int, $last: Int, $before: String, $after: String) {
        company(id: $id) {
          apps(first: $first, last: $last, before: $before, after: $after) {
            nodes {
              ...CompanyAppWithStats
            }
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      }

      fragment CompanyAppStats on App {
        stats {
          dau
          wau
          mau
          timeSpentLast24HoursInSeconds
        }
      }

      

      fragment CompanyApp on App {
        id
        name
      }

      fragment CompanyAppWithStats on App {
        ...CompanyApp
        ...CompanyAppStats
      }
    `

		// Fetch all apps (500 should be more than enough)
		const variables = { id: companyId, first: 500 }

		// Make request
		interface FetchCompanyAppsResponse {
			company: {
				apps: AppsConnection
			}
		}

		const response = await graphqlRequest<FetchCompanyAppsResponse>(
			'fetchCompanyApps',
			{ query, variables, operationName: 'fetchCompanyApps' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.apps.nodes
	}

	/**
	 * Install an app to a company
	 *
	 * @param companyId - Company ID to install to (e.g., 'biz_...')
	 * @param appId - App ID to install (e.g., 'app_...')
	 * @param options - Installation options
	 * @returns Created experience details
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * const experience = await whop.companies.installApp(
	 *   'biz_vMCkGz8Czh1yaA',
	 *   'app_bhbFiP9TB526F7'
	 * )
	 *
	 * console.log(`Created: ${experience.name} (${experience.id})`)
	 * console.log(`Company: ${experience.company.id}`)
	 * ```
	 */
	async installApp(
		companyId: string,
		appId: string,
		options?: InstallAppOptions,
	): Promise<Experience> {
		// Check authentication
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		// GraphQL mutation
		const mutation = `
      mutation installApp($input: InstallAppInput!) {
        installApp(input: $input) {
          createdExperience {
            id
            name
            company {
              id
            }
            accessPasses(first: 10) {
              nodes {
                id
              }
            }
          }
        }
      }
    `

		// Build input with defaults
		const input = {
			appId,
			companyId,
			shouldCreateExperience: options?.shouldCreateExperience ?? true,
			shouldAddExperienceToAccessPass:
				options?.shouldAddExperienceToAccessPass ?? true,
			sectionId: options?.sectionId ?? null,
			permissions: options?.permissions ?? { statements: [] },
		}

		// Make request
		interface InstallAppResponse {
			installApp: {
				createdExperience: Omit<Experience, 'accessPasses'> & {
					accessPasses: { nodes: ExperienceAccessPass[] }
				}
			}
		}

		const response = await graphqlRequest<InstallAppResponse>(
			'installApp',
			{ query: mutation, variables: { input }, operationName: 'installApp' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		// Transform nodes wrapper
		const exp = response.installApp.createdExperience
		return {
			...exp,
			accessPasses: exp.accessPasses.nodes,
		}
	}
}
