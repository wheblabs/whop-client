import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { AppCredentials } from '@/types/app-credentials'
import type { AppDetails, Attachment } from '@/types/apps'
import type { CreateAppInput, CreatedApp } from '@/types/create-app'

/**
 * Apps resource - manage and query Whop apps
 */
export class Apps {
	constructor(private readonly client: Whop) {}

	/**
	 * Get detailed information about a specific app
	 *
	 * @param appId - App ID (e.g., 'app_...')
	 * @returns Full app details including description, icon, creator, access pass, etc.
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * const app = await whop.apps.get('app_MfwK7l9Mh8bmW0')
	 *
	 * console.log(app.name)
	 * console.log(app.description)
	 * console.log(`Total Installs: ${app.totalInstalls}`)
	 * console.log(`Verified: ${app.verified}`)
	 *
	 * if (app.icon) {
	 *   console.log(`Icon URL: ${app.icon.source.url}`)
	 * }
	 *
	 * console.log(`Creator: ${app.creator.name} (@${app.creator.username})`)
	 * ```
	 */
	async get(appId: string): Promise<AppDetails> {
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
      query FetchAppDetails($appId: ID!) {
        app(id: $appId) {
          id
          name
          description
          appStoreDescription
          internalIdentifier
          totalInstalls
          verified
          icon {
            source(variant: s180) {
              url
            }
          }
          stats {
            mau
          }
          accessPass {
            id
            route
            title
            headline
            description
            shortenedDescription
            attachments(category: gallery_images) {
              nodes {
                id
                contentType
                analyzed
                source {
                  url
                  doubleUrl
                }
                ... on ImageAttachment {
                  blurhash
                }
                ... on VideoAttachment {
                  blurhash
                }
              }
            }
            marketplaceCategory(level: 1) {
              route
            }
          }
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
      }
    `

		// Make request
		interface GraphQLFetchAppDetailsResponse {
			app: Omit<AppDetails, 'accessPass'> & {
				accessPass:
					| (Omit<AppDetails['accessPass'], 'attachments'> & {
							attachments: { nodes: Attachment[] }
					  })
					| null
			}
		}

		const response = await graphqlRequest<GraphQLFetchAppDetailsResponse>(
			'FetchAppDetails',
			{ query, variables: { appId }, operationName: 'FetchAppDetails' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		// Transform response to flatten attachments.nodes → attachments
		const app = response.app

		if (!app.accessPass) {
			return {
				...app,
				accessPass: null,
			} as AppDetails
		}

		const transformedAccessPass = {
			...app.accessPass,
			attachments: app.accessPass.attachments.nodes,
		}

		return {
			...app,
			accessPass: transformedAccessPass,
		} as AppDetails
	}

	/**
	 * Get app credentials and configuration
	 *
	 * @param appId - App ID (e.g., 'app_...')
	 * @param companyId - Company ID (e.g., 'biz_...')
	 * @returns App credentials including API key, URLs, stats, agent users, and permissions
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * const creds = await whop.apps.getCredentials(
	 *   'app_yfqJLYjjfKLJtI',
	 *   'biz_vMCkGz8Czh1yaA'
	 * )
	 *
	 * console.log('API Key:', creds.apiKey.token)
	 * console.log('Dev URL:', creds.baseDevUrl)
	 * console.log('Agent:', creds.agentUsers[0]?.username)
	 * ```
	 */
	async getCredentials(
		appId: string,
		companyId: string,
	): Promise<AppCredentials> {
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
      query fetchCompanyApp($companyId: ID!, $appId: ID!) {
        company(id: $companyId) {
          app(id: $appId) {
            id
            name
            description
            baseUrl
            baseDevUrl
            domainId
            status
            verified
            usingDefaultIcon
            icon {
              source {
                url
              }
            }
            experiencePath: viewPath(viewType: hub)
            discoverPath: viewPath(viewType: discover)
            dashboardPath: viewPath(viewType: dashboard)
            apiKey {
              id
              token
              createdAt
            }
            requestedPermissions {
              permissionAction {
                action
                name
              }
              isRequired
              justification
            }
            stats {
              dau
              mau
              timeSpentLast24Hours: timeSpentLast24HoursInSeconds
              wau
            }
            agentUsers {
              nodes {
                id
                name
                username
              }
              totalCount
            }
          }
        }
      }
    `

		// Make request
		interface FetchCompanyAppResponse {
			company: {
				app: Omit<AppCredentials, 'agentUsers'> & {
					agentUsers: { nodes: AppCredentials['agentUsers'] }
				}
			}
		}

		const response = await graphqlRequest<FetchCompanyAppResponse>(
			'fetchCompanyApp',
			{
				query,
				variables: { companyId, appId },
				operationName: 'fetchCompanyApp',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		// Transform agentUsers.nodes → agentUsers
		return {
			...response.company.app,
			agentUsers: response.company.app.agentUsers.nodes,
		}
	}

	/**
	 * Create a new app for a company
	 *
	 * @param input - App creation parameters (name, companyId, description)
	 * @returns Created app with API keys, agent users, and access pass
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * const app = await whop.apps.create({
	 *   name: 'My New App',
	 *   companyId: 'biz_vMCkGz8Czh1yaA'
	 * })
	 *
	 * console.log('Created:', app.name)
	 * console.log('API Key:', app.apiKeys[0].token)
	 * console.log('Agent:', app.agentUsers[0].username)
	 * ```
	 */
	async create(input: CreateAppInput): Promise<CreatedApp> {
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
      mutation createApp($input: CreateAppInput!) {
        createApp(input: $input) {
          id
          name
          description
          baseUrl
          baseDevUrl
          status
          apiKeys {
            nodes {
              id
              token
              createdAt
            }
          }
          agentUsers {
            nodes {
              id
              name
              username
            }
          }
          company {
            id
          }
          accessPass {
            id
          }
        }
      }
    `

		// Make request
		interface CreateAppResponse {
			createApp: Omit<CreatedApp, 'apiKeys' | 'agentUsers'> & {
				apiKeys: { nodes: CreatedApp['apiKeys'] }
				agentUsers: { nodes: CreatedApp['agentUsers'] }
			}
		}

		const response = await graphqlRequest<CreateAppResponse>(
			'createApp',
			{ query: mutation, variables: { input }, operationName: 'createApp' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		// Transform nodes wrappers
		return {
			...response.createApp,
			apiKeys: response.createApp.apiKeys.nodes,
			agentUsers: response.createApp.agentUsers.nodes,
		}
	}
}
