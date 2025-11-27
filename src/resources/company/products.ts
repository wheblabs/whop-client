import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	AccessPassesConnection,
	CreateAccessPassInput,
	CreatedAccessPass,
	ListAccessPassesOptions,
} from '@/types/access-passes'
import { ProductBuilder } from './product'

/**
 * GraphQL response structure for fetchCompanyAccessPasses
 */
interface FetchCompanyAccessPassesResponse {
	company: {
		accessPasses: {
			accessPasses: Array<{
				id: string
				title: string
				headline: string | null
				route: string
				visibility: string
				accessPassType: string
				activeMembersCount: number
				defaultPlan: {
					id: string
					formattedPrice: string
					directLink: string
				} | null
			}>
			pageInfo: {
				hasNextPage: boolean
				hasPreviousPage: boolean
				startCursor: string | null
				endCursor: string | null
			}
			totalCount: number
		}
	}
}

/**
 * GraphQL response structure for createAccessPass
 * Note: The API returns fields directly, not wrapped in accessPass
 */
interface CreateAccessPassResponse {
	createAccessPass: CreatedAccessPass
}

/**
 * Products collection for a specific company
 */
export class CompanyProducts {
	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
	) {}

	/**
	 * List products (access passes) for this company
	 *
	 * @param options - Filtering and pagination options
	 * @returns Products connection with pagination info
	 *
	 * @example
	 * ```typescript
	 * const result = await whop.company('biz_xxx').products.list()
	 * console.log(`Total: ${result.totalCount}`)
	 * for (const product of result.accessPasses) {
	 *   console.log(`${product.title} - ${product.activeMembersCount} members`)
	 * }
	 * ```
	 */
	async list(
		options?: ListAccessPassesOptions,
	): Promise<AccessPassesConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query coreFetchCompanyAccessPassesV2($companyId: String!, $accessPassTypes: [AccessPassType!], $first: Int, $after: String) {
        company(id: $companyId) {
          accessPasses(accessPassTypes: $accessPassTypes, first: $first, after: $after) {
            accessPasses {
              id
              title
              headline
              route
              visibility
              accessPassType
              activeMembersCount
              defaultPlan {
                id
                formattedPrice
                directLink
              }
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
    `

		const variables = {
			companyId: this.companyId,
			...(options?.accessPassTypes && {
				accessPassTypes: options.accessPassTypes,
			}),
			...(options?.first && { first: options.first }),
			...(options?.after && { after: options.after }),
		}

		const response = await graphqlRequest<FetchCompanyAccessPassesResponse>(
			'coreFetchCompanyAccessPassesV2',
			{ query, variables, operationName: 'coreFetchCompanyAccessPassesV2' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.accessPasses as unknown as AccessPassesConnection
	}

	/**
	 * Create a new product (access pass) for this company
	 *
	 * @param input - Product creation input
	 * @returns The created product
	 *
	 * @example
	 * ```typescript
	 * const product = await whop.company('biz_xxx').products.create({
	 *   title: 'Premium Membership',
	 *   headline: 'Get exclusive access',
	 *   visibility: 'visible',
	 *   planOptions: {
	 *     renewalPrice: 29.99,
	 *     billingPeriod: 30
	 *   }
	 * })
	 * ```
	 */
	async create(
		input: Omit<CreateAccessPassInput, 'companyId'>,
	): Promise<CreatedAccessPass> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation coreCreateAccessPass($input: CreateAccessPassInput!) {
        createAccessPass(input: $input) {
          id
          title
          headline
          route
          visibility
          defaultPlan {
            id
            formattedPrice
            directLink
          }
        }
      }
    `

		const variables = {
			input: {
				...input,
				companyId: this.companyId,
			},
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
	 * Get a specific product builder
	 *
	 * @param productId - Product ID
	 * @returns ProductBuilder instance
	 *
	 * @example
	 * ```typescript
	 * const product = whop.company('biz_xxx').product('prod_xxx')
	 * await product.update({ title: 'New Title' })
	 * ```
	 */
	product(productId: string): ProductBuilder {
		return new ProductBuilder(this.client, this.companyId, productId)
	}
}
