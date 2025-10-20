import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	AccessPassesConnection,
	CreateAccessPassInput,
	CreatedAccessPass,
	ListAccessPassesOptions,
	UpdateAccessPassInput,
	UpdatedAccessPass,
} from '@/types/access-passes'
import type {
	Experience,
	ExperienceAccessPass,
	InstallAppOptions,
} from '@/types/apps'
import type { App, AppsConnection, Company } from '@/types/companies'
import type {
	ExperiencesConnection,
	ListExperiencesOptions,
} from '@/types/experiences'
import type {
	AccessPassPlansConnection,
	CreatePlanInput,
	ListAccessPassPlansOptions,
	Plan,
	UpdatePlanInput,
} from '@/types/plans'

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

	/**
	 * List experiences for a company
	 *
	 * @param companyId - Company ID (e.g., 'biz_...')
	 * @param options - Optional filters and pagination
	 * @returns Paginated experiences list
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // List all experiences for a company
	 * const result = await whop.companies.listExperiences('biz_xxx')
	 * console.log(`Total: ${result.totalCount}`)
	 * for (const exp of result.experiences) {
	 *   console.log(`${exp.name} - ${exp.app.name}`)
	 * }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Filter by specific app
	 * const result = await whop.companies.listExperiences('biz_xxx', {
	 *   appId: 'app_xxx'
	 * })
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Paginate through experiences
	 * let cursor: string | null = null
	 * do {
	 *   const result = await whop.companies.listExperiences('biz_xxx', {
	 *     first: 50,
	 *     after: cursor
	 *   })
	 *   // Process result.experiences...
	 *   cursor = result.pageInfo.hasNextPage ? result.pageInfo.endCursor : null
	 * } while (cursor)
	 * ```
	 */
	async listExperiences(
		companyId: string,
		options?: ListExperiencesOptions,
	): Promise<ExperiencesConnection> {
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
      query listExperiences(
        $after: String
        $first: Int
        $accessPassId: ID
        $appId: ID
        $onAccessPass: Boolean
        $companyId: ID!
      ) {
        company(id: $companyId) {
          experiencesV2(
            after: $after
            first: $first
            filter: {
              appId: $appId
              onAccessPass: $onAccessPass
              accessPassId: $accessPassId
            }
          ) {
            nodes {
              id
              name
              description
              logo: imageSrcset(style: s80) {
                sourceUrl: original
              }
              app {
                id
                name
                icon {
                  sourceUrl
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
            totalCount
          }
        }
      }
    `

		// Build variables
		const variables = {
			companyId,
			first: options?.first ?? 100,
			after: options?.after ?? null,
			appId: options?.appId ?? null,
			accessPassId: options?.accessPassId ?? null,
			onAccessPass: options?.onAccessPass ?? null,
		}

		// Make request
		interface ListExperiencesResponse {
			company: {
				experiencesV2: {
					nodes: ExperiencesConnection['experiences']
					pageInfo: ExperiencesConnection['pageInfo']
					totalCount: number
				}
			}
		}

		const response = await graphqlRequest<ListExperiencesResponse>(
			'listExperiences',
			{ query, variables, operationName: 'listExperiences' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		// Transform nodes to experiences
		return {
			experiences: response.company.experiencesV2.nodes,
			pageInfo: response.company.experiencesV2.pageInfo,
			totalCount: response.company.experiencesV2.totalCount,
		}
	}

	/**
	 * List access passes for a company
	 *
	 * @param companyId - Company ID (e.g., 'biz_...')
	 * @param options - Optional pagination options
	 * @returns Paginated access passes list
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // List all access passes
	 * const result = await whop.companies.listAccessPasses('biz_xxx')
	 * console.log(`Total: ${result.totalCount}`)
	 * for (const pass of result.accessPasses) {
	 *   console.log(`${pass.title} - ${pass.activeMembersCount} members`)
	 *   console.log(`Price: ${pass.defaultPlan?.formattedPrice || 'N/A'}`)
	 * }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Paginate through access passes
	 * let cursor: string | null = null
	 * do {
	 *   const result = await whop.companies.listAccessPasses('biz_xxx', {
	 *     first: 50,
	 *     after: cursor
	 *   })
	 *   // Process result.accessPasses...
	 *   cursor = result.pageInfo.hasNextPage ? result.pageInfo.endCursor : null
	 * } while (cursor)
	 * ```
	 */
	async listAccessPasses(
		companyId: string,
		options?: ListAccessPassesOptions,
	): Promise<AccessPassesConnection> {
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
      query coreFetchCompanyAccessPassesV2($companyId: ID!, $first: Int, $after: String, $before: String) {
        company(id: $companyId) {
          accessPassesV2(first: $first, after: $after, before: $before, order: active_memberships_count) {
            nodes {
              id
              title
              activeMembersCount
              defaultPlan {
                formattedPrice
              }
            }
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              endCursor
              startCursor
            }
          }
        }
      }
    `

		// Build variables
		const variables = {
			companyId,
			first: options?.first ?? 100,
			after: options?.after ?? null,
			before: options?.before ?? null,
		}

		// Make request
		interface FetchCompanyAccessPassesResponse {
			company: {
				accessPassesV2: {
					nodes: AccessPassesConnection['accessPasses']
					pageInfo: AccessPassesConnection['pageInfo']
					totalCount: number
				}
			}
		}

		const response = await graphqlRequest<FetchCompanyAccessPassesResponse>(
			'coreFetchCompanyAccessPassesV2',
			{ query, variables, operationName: 'coreFetchCompanyAccessPassesV2' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		// Transform nodes to accessPasses
		return {
			accessPasses: response.company.accessPassesV2.nodes,
			pageInfo: response.company.accessPassesV2.pageInfo,
			totalCount: response.company.accessPassesV2.totalCount,
		}
	}

	/**
	 * Create a new access pass (product) for a company
	 *
	 * @param input - Access pass creation parameters
	 * @returns Created access pass details
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // Create a basic product
	 * const pass = await whop.companies.createAccessPass({
	 *   title: 'My Premium Community',
	 *   companyId: 'biz_xxx'
	 * })
	 * console.log(`Created: ${pass.title} at /${pass.route}`)
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Create with custom options and auto-generated plan
	 * const pass = await whop.companies.createAccessPass({
	 *   title: 'VIP Membership',
	 *   companyId: 'biz_xxx',
	 *   headline: 'Exclusive access to our community',
	 *   description: 'Join our VIP community',
	 *   visibility: 'visible',
	 *   businessType: 'community',
	 *   planOptions: {
	 *     baseCurrency: 'USD',
	 *     renewalPrice: 29.99,
	 *     planType: 'renewal',
	 *     billingPeriod: 30
	 *   }
	 * })
	 * ```
	 */
	async createAccessPass(
		input: CreateAccessPassInput,
	): Promise<CreatedAccessPass> {
		// Check authentication
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		// Auto-generate route from title if not provided
		const route =
			input.route ||
			input.title
				.toLowerCase()
				.replace(/[^\w\s-]/g, '') // Remove special characters
				.replace(/\s+/g, '-') // Replace spaces with hyphens
				.replace(/-+/g, '-') // Replace multiple hyphens with single
				.replace(/^-+|-+$/g, '') // Trim hyphens from start/end

		// GraphQL mutation
		const mutation = `
      mutation coreCreateAccessPass($input: CreateAccessPassInput!) {
        createAccessPass(input: $input) {
          id
          route
          title
          visibility
          createdAt
          activeMembersCount
          defaultPlan {
            formattedPrice
          }
        }
      }
    `

		// Build input with generated route
		const variables = {
			input: {
				...input,
				route,
			},
		}

		// Make request
		interface CreateAccessPassResponse {
			createAccessPass: CreatedAccessPass
		}

		const response = await graphqlRequest<CreateAccessPassResponse>(
			'coreCreateAccessPass',
			{ query: mutation, variables, operationName: 'coreCreateAccessPass' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createAccessPass
	}

	/**
	 * Update an existing access pass (product)
	 *
	 * @param input - Access pass update parameters (id is required)
	 * @returns Updated access pass details
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // Update product title and visibility
	 * const pass = await whop.companies.updateAccessPass({
	 *   id: 'prod_xxx',
	 *   title: 'New Product Name',
	 *   visibility: 'visible'
	 * })
	 * console.log(`Updated: ${pass.name} at /${pass.route}`)
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Update checkout settings
	 * const pass = await whop.companies.updateAccessPass({
	 *   id: 'prod_xxx',
	 *   redirectPurchaseUrl: 'https://checkout.example.com',
	 *   customCta: 'Buy Now',
	 *   customCtaUrl: 'https://example.com/buy',
	 *   showMemberCount: true
	 * })
	 * ```
	 */
	async updateAccessPass(
		input: UpdateAccessPassInput,
	): Promise<UpdatedAccessPass> {
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
      mutation updateAccessPass($pass: UpdateAccessPassInput!) {
        updateAccessPass(input: $pass) {
          id
          name
          visibility
          customCta
          customCtaUrl
          redirectPurchaseUrl
          showMemberCount
          route
        }
      }
    `

		// Make request
		interface UpdateAccessPassResponse {
			updateAccessPass: UpdatedAccessPass
		}

		const response = await graphqlRequest<UpdateAccessPassResponse>(
			'updateAccessPass',
			{
				query: mutation,
				variables: { pass: input },
				operationName: 'updateAccessPass',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateAccessPass
	}

	/**
	 * Create a new plan for an access pass (product)
	 *
	 * @param input - Plan creation parameters
	 * @returns Created plan details including checkout link
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // Create a one-time payment plan
	 * const plan = await whop.companies.createPlan({
	 *   productId: 'prod_xxx',
	 *   title: 'Lifetime Access',
	 *   planType: 'one_time',
	 *   visibility: 'visible',
	 *   currency: 'USD',
	 *   renewalPrice: '99.00'
	 * })
	 * console.log(`Checkout link: ${plan.directLink}`)
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Create a monthly subscription
	 * const plan = await whop.companies.createPlan({
	 *   productId: 'prod_xxx',
	 *   title: 'Monthly Membership',
	 *   planType: 'renewal',
	 *   visibility: 'visible',
	 *   currency: 'USD',
	 *   renewalPrice: '29.99',
	 *   billingPeriod: 30,
	 *   trialPeriodDays: 7
	 * })
	 * ```
	 */
	async createPlan(input: CreatePlanInput): Promise<Plan> {
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
      mutation createPlan($input: CreatePlanInput!) {
        createPlan(input: $input) {
          id
          directLink
          releaseMethod
          visibility
          free
          accessPass {
            id
            route
          }
          company {
            id
          }
          initialPrice
          renewalPrice
          offerCancelDiscount
          cancelDiscountPercentage
          cancelDiscountIntervals
        }
      }
    `

		// Make request
		interface CreatePlanResponse {
			createPlan: Plan
		}

		const response = await graphqlRequest<CreatePlanResponse>(
			'createPlan',
			{ query: mutation, variables: { input }, operationName: 'createPlan' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createPlan
	}

	/**
	 * Update an existing plan
	 *
	 * @param input - Plan update parameters (id is required)
	 * @returns Updated plan details
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // Update plan price
	 * const plan = await whop.companies.updatePlan({
	 *   id: 'plan_xxx',
	 *   renewalPrice: '39.99',
	 *   visibility: 'visible'
	 * })
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Add trial period and set as default
	 * const plan = await whop.companies.updatePlan({
	 *   id: 'plan_xxx',
	 *   trialPeriodDays: 14,
	 *   setAsDefault: true
	 * })
	 * ```
	 */
	async updatePlan(input: UpdatePlanInput): Promise<Plan> {
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
      mutation updatePlan($input: UpdatePlanInput!) {
        updatePlan(input: $input) {
          id
          directLink
          releaseMethod
          visibility
          free
          accessPass {
            id
            route
          }
          company {
            id
          }
          initialPrice
          renewalPrice
          offerCancelDiscount
          cancelDiscountPercentage
          cancelDiscountIntervals
        }
      }
    `

		// Make request
		interface UpdatePlanResponse {
			updatePlan: Plan
		}

		const response = await graphqlRequest<UpdatePlanResponse>(
			'updatePlan',
			{ query: mutation, variables: { input }, operationName: 'updatePlan' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updatePlan
	}

	/**
	 * List plans for a specific access pass
	 *
	 * @param companyId - Company ID (e.g., 'biz_...')
	 * @param accessPassId - Access pass ID (e.g., 'prod_...')
	 * @param options - Optional pagination
	 * @returns Paginated plans list
	 * @throws {WhopAuthError} If not authenticated
	 * @throws {WhopNetworkError} On network failures
	 * @throws {WhopHTTPError} On HTTP errors or GraphQL errors
	 *
	 * @example
	 * ```typescript
	 * const whop = new Whop()
	 *
	 * // List plans for a specific product
	 * const result = await whop.companies.listAccessPassPlans(
	 *   'biz_xxx',
	 *   'prod_xxx'
	 * )
	 * for (const plan of result.plans) {
	 *   console.log(`${plan.planType} - ${plan.formattedPrice}`)
	 *   console.log(`Active members: ${plan.activeMemberCount}`)
	 * }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Paginate through plans
	 * let cursor: string | null = null
	 * do {
	 *   const result = await whop.companies.listAccessPassPlans(
	 *     'biz_xxx',
	 *     'prod_xxx',
	 *     { first: 50, after: cursor }
	 *   )
	 *   // Process result.plans...
	 *   cursor = result.pageInfo.hasNextPage ? result.pageInfo.endCursor : null
	 * } while (cursor)
	 * ```
	 */
	async listAccessPassPlans(
		companyId: string,
		accessPassId: string,
		options?: ListAccessPassPlansOptions,
	): Promise<AccessPassPlansConnection> {
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
      query coreFetchAccessPassPlans($companyId: ID!, $accessPassId: ID!, $after: String) {
        company(id: $companyId) {
          accessPass(id: $accessPassId) {
            id
            title
            plans(order: active_members_count, direction: desc, first: 50, after: $after) {
              nodes {
                id
                initialPrice
                formattedPrice
                baseCurrency
                expirationDays
                trialPeriodDays
                visibility
                internalNotes
                releaseMethod
                planType
                activeMemberCount
              }
              pageInfo {
                endCursor
                startCursor
                hasNextPage
              }
            }
          }
        }
      }
    `

		// Build variables
		const variables = {
			companyId,
			accessPassId,
			after: options?.after ?? null,
		}

		// Make request
		interface ListAccessPassPlansResponse {
			company: {
				accessPass: {
					plans: {
						nodes: AccessPassPlansConnection['plans']
						pageInfo: AccessPassPlansConnection['pageInfo']
					}
				}
			}
		}

		const response = await graphqlRequest<ListAccessPassPlansResponse>(
			'coreFetchAccessPassPlans',
			{
				query,
				variables,
				operationName: 'coreFetchAccessPassPlans',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			plans: response.company.accessPass.plans.nodes,
			pageInfo: response.company.accessPass.plans.pageInfo,
		}
	}
}
