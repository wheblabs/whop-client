import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { AppCredentials } from '@/types/app-credentials'
import type {
	AppDetails,
	Attachment,
	UpdateAppInput,
	UpdatedApp,
} from '@/types/apps'
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
      query fetchCompanyAppCredentials($companyId: ID!, $appId: ID!) {
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
            defaultAuthorizedApiKey {
              id
              name
              obfuscatedSecretKey
              createdAt
            }
            accessPass {
              id
              route
              title
              marketplaceStatus
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
              timeSpentLast24HoursInSeconds
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
				app:
					| (Omit<AppCredentials, 'agentUsers' | 'stats' | 'apiKey'> & {
							stats: {
								dau: number
								mau: number
								timeSpentLast24HoursInSeconds: number
								wau: number
							}
							agentUsers: { nodes: AppCredentials['agentUsers'] }
							defaultAuthorizedApiKey: {
								id: string
								name: string | null
								obfuscatedSecretKey: string | null
								createdAt: string
							} | null
					  })
					| null
			}
		}

		const response = await graphqlRequest<FetchCompanyAppResponse>(
			'fetchCompanyAppCredentials',
			{
				query,
				variables: { companyId, appId },
				operationName: 'fetchCompanyAppCredentials',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const app = response.company?.app
		if (!app) {
			throw new Error('App not found for the provided company/app id pair')
		}

		if (!app.defaultAuthorizedApiKey?.id) {
			throw new Error(
				'No authorized API key found for this app. Visit the developer dashboard to create one.',
			)
		}

		const apiKeyDetails = await this.retrieveAuthorizedApiKey(
			app.defaultAuthorizedApiKey.id,
			tokens,
		)

		if (!apiKeyDetails?.secretKey) {
			throw new Error(
				'Failed to retrieve the API key secret. Try regenerating the key from the developer dashboard.',
			)
		}

		const apiKey = {
			id: apiKeyDetails.id,
			token: apiKeyDetails.secretKey,
			obfuscatedSecretKey: apiKeyDetails.obfuscatedSecretKey ?? null,
			createdAt: new Date(apiKeyDetails.createdAt).getTime(),
		}

		return {
			id: app.id,
			name: app.name,
			description: app.description,
			baseUrl: app.baseUrl,
			baseDevUrl: app.baseDevUrl,
			domainId: app.domainId,
			status: app.status,
			verified: app.verified,
			usingDefaultIcon: app.usingDefaultIcon,
			icon: app.icon,
			experiencePath: app.experiencePath,
			discoverPath: app.discoverPath,
			dashboardPath: app.dashboardPath,
			apiKey,
			agentUsers: app.agentUsers.nodes,
			requestedPermissions: app.requestedPermissions,
			stats: {
				dau: app.stats.dau,
				mau: app.stats.mau,
				wau: app.stats.wau,
				timeSpentLast24Hours: app.stats.timeSpentLast24HoursInSeconds,
			},
			accessPass: app.accessPass ?? null,
		}
	}

	/**
	 * Create a new app for a company
	 *
	 * @param input - App creation parameters (name, companyId, optional baseUrl)
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
	 *
	 * @example
	 * ```typescript
	 * // Create app with base URL
	 * const app = await whop.apps.create({
	 *   name: 'My App',
	 *   companyId: 'biz_xxx',
	 *   baseUrl: 'https://myapp.com'
	 * })
	 * console.log('Base URL:', app.baseUrl)
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
        }
      }
    `

		interface CreateAppResponse {
			createApp: {
				id: string
			}
		}

		const response = await graphqlRequest<CreateAppResponse>(
			'createApp',
			{ query: mutation, variables: { input }, operationName: 'createApp' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const createdAppId = response.createApp.id

		// Fetch the latest credentials so consumers receive a fully-hydrated response
		const credentials = await this.getCredentials(createdAppId, input.companyId)

		return {
			id: credentials.id,
			name: credentials.name,
			description: credentials.description,
			baseUrl: credentials.baseUrl,
			baseDevUrl: credentials.baseDevUrl,
			status: credentials.status,
			apiKeys: [credentials.apiKey],
			agentUsers: credentials.agentUsers,
			company: {
				id: input.companyId,
			},
			accessPass: credentials.accessPass
				? { id: credentials.accessPass.id }
				: { id: '' },
		}
	}

	/**
	 * Update an existing app
	 *
	 * @param appId - App ID to update (e.g., 'app_...')
	 * @param input - Fields to update (all optional)
	 * @returns Updated app details
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // Update app name and status
	 * const app = await whop.apps.update('app_abc123', {
	 *   name: 'New App Name',
	 *   status: 'live'
	 * })
	 *
	 * console.log('Updated:', app.name)
	 * console.log('Status:', app.status)
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Update URLs and description
	 * const app = await whop.apps.update('app_abc123', {
	 *   description: 'An awesome new app',
	 *   baseUrl: 'https://myapp.com',
	 *   baseDevUrl: 'http://localhost:3000'
	 * })
	 * ```
	 */
	async update(appId: string, input: UpdateAppInput): Promise<UpdatedApp> {
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
      mutation updateAppV2($input: UpdateAppInput!) {
        updateAppV2(input: $input) {
          id
          name
          description
          domainId
          appStoreDescription
          baseUrl
          baseDevUrl
          basePreviewUrl
          experiencePath
          consumerViewUrlTemplate
          dashboardViewUrlTemplate
          discoverViewUrlTemplate
          status
          verified
          requiredScopes
          totalInstallsLast30Days
          count
          usingDefaultIcon
          icon {
            source(variant: s180) {
              url
            }
          }
          company {
            id
            title
          }
        }
      }
    `

		// Merge appId with input
		const variables = {
			input: {
				id: appId,
				...input,
			},
		}

		// Make request
		interface UpdateAppV2Response {
			updateAppV2: UpdatedApp
		}

		const response = await graphqlRequest<UpdateAppV2Response>(
			'updateAppV2',
			{ query: mutation, variables, operationName: 'updateAppV2' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateAppV2
	}

	/**
	 * Get the URL to access an app in the Whop dashboard
	 *
	 * @param appId - App ID (e.g., 'app_...')
	 * @param companyId - Company ID (e.g., 'biz_...')
	 * @returns URL to open the app in Whop dashboard
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {Error} If no experience found for the app
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * const url = await whop.apps.getUrl('app_xxx', 'biz_xxx')
	 * console.log(url) // https://whop.com/biz_xxx/app-name-123/app
	 * ```
	 */
	async getUrl(appId: string, companyId: string): Promise<string> {
		// Check authentication
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		// Get experiences for this app
		const { experiences } = await this.client.companies.listExperiences(
			companyId,
			{
				appId,
				first: 1,
			},
		)

		const experience = experiences[0]
		if (!experience) {
			throw new Error(
				`No experience found for app ${appId} in company ${companyId}`,
			)
		}

		const experienceId = experience.id.replace('exp_', '')
		const transformedAppName = experience.app.name
			.replace(/\s+/g, '-')
			.toLowerCase()

		return `https://whop.com/${companyId}/${transformedAppName}-${experienceId}/app`
	}

	private async retrieveAuthorizedApiKey(
		apiKeyId: string,
		tokens: NonNullable<ReturnType<Whop['getTokens']>>,
	): Promise<{
		id: string
		secretKey: string | null
		obfuscatedSecretKey: string | null
		createdAt: string
	}> {
		const query = `
      query coreRetrieveAuthorizedApiKey($id: ID!) {
        retrieveAuthorizedApiKey(id: $id) {
          id
          secretKey
          obfuscatedSecretKey
          createdAt
        }
      }
    `

		interface RetrieveAuthorizedApiKeyResponse {
			retrieveAuthorizedApiKey: {
				id: string
				secretKey: string | null
				obfuscatedSecretKey: string | null
				createdAt: string
			}
		}

		const response = await graphqlRequest<RetrieveAuthorizedApiKeyResponse>(
			'coreRetrieveAuthorizedApiKey',
			{
				query,
				variables: { id: apiKeyId },
				operationName: 'coreRetrieveAuthorizedApiKey',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.retrieveAuthorizedApiKey
	}
}
