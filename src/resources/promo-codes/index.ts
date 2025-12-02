import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	CreatePromoCodeInput,
	ListPromoCodesOptions,
	PromoCode,
	PromoCodePlanOption,
	PromoCodesConnection,
	UpdatePromoCodeInput,
} from './types'

// GraphQL Fragment
const PROMO_CODE_FRAGMENT = `
  fragment CompanyPromoCode on PromoCode {
    plans(first: 1) {
      nodes {
        accessPass {
          title
        }
      }
      totalCount
    }
    id
    code
    numberOfIntervals
    uses
    stock
    status
    expirationDatetime
    createdAt
    newUsersOnly
    unlimitedStock
    onePerCustomer
    existingMembershipsOnly
    amountOff
    promoType
    baseCurrency
    affiliate {
      user {
        username
        profilePic
      }
    }
  }
`

/**
 * Promo Codes resource - Manage promotional codes for discounts
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List promo codes
 * const { promoCodes } = await whop.promoCodes.list({ companyId: 'biz_xxx' })
 *
 * // Create a 20% off promo code
 * const promo = await whop.promoCodes.create({
 *   companyId: 'biz_xxx',
 *   code: 'SAVE20',
 *   promoType: 'percent',
 *   amountOff: 20,
 *   planIds: ['plan_xxx']
 * })
 * ```
 */
export class PromoCodes {
	constructor(private readonly client: Whop) {}

	/**
	 * List promo codes for a company
	 *
	 * @param options - Filtering and pagination options
	 * @returns Paginated promo codes list
	 *
	 * @example
	 * ```typescript
	 * const { promoCodes, totalCount } = await whop.promoCodes.list({
	 *   companyId: 'biz_xxx'
	 * })
	 *
	 * for (const promo of promoCodes) {
	 *   console.log(`${promo.code} - ${promo.uses} uses`)
	 * }
	 * ```
	 */
	async list(options: ListPromoCodesOptions): Promise<PromoCodesConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyPromoCodes($id: ID!, $filters: JSON!, $first: Int, $after: String) {
        company(id: $id) {
          creatorDashboardTable(tableFilters: $filters) {
            promoCodes(first: $first, after: $after) {
              nodes {
                ...CompanyPromoCode
              }
              totalCount
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      }
      ${PROMO_CODE_FRAGMENT}
    `

		const filters: Record<string, unknown> = {}
		if (options.status) {
			filters.status = options.status
		}
		if (options.search) {
			filters.search = options.search
		}

		interface FetchPromoCodesResponse {
			company: {
				creatorDashboardTable: {
					promoCodes: {
						nodes: PromoCode[]
						totalCount: number
						pageInfo: { hasNextPage: boolean; endCursor: string | null }
					}
				}
			}
		}

		const response = await graphqlRequest<FetchPromoCodesResponse>(
			'fetchCompanyPromoCodes',
			{
				query,
				variables: {
					id: options.companyId,
					first: options.first || 50,
					after: options.after || null,
					filters,
				},
				operationName: 'fetchCompanyPromoCodes',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const data = response.company.creatorDashboardTable.promoCodes
		return {
			promoCodes: data.nodes,
			totalCount: data.totalCount,
			pageInfo: data.pageInfo,
		}
	}

	/**
	 * Get a specific promo code
	 *
	 * @param companyId - Company ID
	 * @param promoCodeId - Promo code ID
	 * @returns Promo code details
	 *
	 * @example
	 * ```typescript
	 * const promo = await whop.promoCodes.get('biz_xxx', 'promo_xxx')
	 * console.log(`Code: ${promo.code}, Uses: ${promo.uses}`)
	 * ```
	 */
	async get(companyId: string, promoCodeId: string): Promise<PromoCode> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchPromoCode($companyId: ID!, $promoCodeId: ID!) {
        company(id: $companyId) {
          promoCode(id: $promoCodeId) {
            ...CompanyPromoCode
          }
        }
      }
      ${PROMO_CODE_FRAGMENT}
    `

		interface FetchPromoCodeResponse {
			company: {
				promoCode: PromoCode
			}
		}

		const response = await graphqlRequest<FetchPromoCodeResponse>(
			'fetchPromoCode',
			{
				query,
				variables: { companyId, promoCodeId },
				operationName: 'fetchPromoCode',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.promoCode
	}

	/**
	 * Create a new promo code
	 *
	 * @param input - Promo code creation input
	 * @returns Created promo code
	 *
	 * @example
	 * ```typescript
	 * // Create a 20% off promo code
	 * const promo = await whop.promoCodes.create({
	 *   companyId: 'biz_xxx',
	 *   code: 'SAVE20',
	 *   promoType: 'percent',
	 *   amountOff: 20,
	 *   planIds: ['plan_xxx'],
	 *   unlimitedStock: true
	 * })
	 *
	 * // Create a $10 off promo code with limited uses
	 * const fixedPromo = await whop.promoCodes.create({
	 *   companyId: 'biz_xxx',
	 *   code: 'SAVE10',
	 *   promoType: 'fixed_amount',
	 *   amountOff: 10,
	 *   baseCurrency: 'usd',
	 *   planIds: ['plan_xxx'],
	 *   stock: 100
	 * })
	 *
	 * // Create a free trial promo
	 * const trialPromo = await whop.promoCodes.create({
	 *   companyId: 'biz_xxx',
	 *   code: 'FREETRIAL',
	 *   promoType: 'free_trial',
	 *   numberOfIntervals: 1,
	 *   planIds: ['plan_xxx']
	 * })
	 * ```
	 */
	async create(input: CreatePromoCodeInput): Promise<PromoCode> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation createPromoCode($input: CreatePromoCodeInput!) {
        createPromoCode(input: $input) {
          ...CompanyPromoCode
        }
      }
      ${PROMO_CODE_FRAGMENT}
    `

		interface CreatePromoCodeResponse {
			createPromoCode: PromoCode
		}

		const response = await graphqlRequest<CreatePromoCodeResponse>(
			'createPromoCode',
			{
				query: mutation,
				variables: { input },
				operationName: 'createPromoCode',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createPromoCode
	}

	/**
	 * Update a promo code
	 *
	 * @param promoCodeId - Promo code ID
	 * @param input - Update input
	 * @returns Updated promo code
	 *
	 * @example
	 * ```typescript
	 * await whop.promoCodes.update('promo_xxx', {
	 *   stock: 50,
	 *   status: 'active'
	 * })
	 * ```
	 */
	async update(
		promoCodeId: string,
		input: Omit<UpdatePromoCodeInput, 'id'>,
	): Promise<PromoCode> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updatePromoCode($input: UpdatePromoCodeInput!) {
        updatePromoCode(input: $input) {
          ...CompanyPromoCode
        }
      }
      ${PROMO_CODE_FRAGMENT}
    `

		interface UpdatePromoCodeResponse {
			updatePromoCode: PromoCode
		}

		const response = await graphqlRequest<UpdatePromoCodeResponse>(
			'updatePromoCode',
			{
				query: mutation,
				variables: { input: { ...input, id: promoCodeId } },
				operationName: 'updatePromoCode',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updatePromoCode
	}

	/**
	 * Delete a promo code
	 *
	 * @param promoCodeId - Promo code ID
	 * @returns True if deleted
	 *
	 * @example
	 * ```typescript
	 * await whop.promoCodes.delete('promo_xxx')
	 * ```
	 */
	async delete(promoCodeId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation deletePromoCode($id: ID!) {
        deletePromoCode(input: { id: $id })
      }
    `

		interface DeletePromoCodeResponse {
			deletePromoCode: boolean
		}

		const response = await graphqlRequest<DeletePromoCodeResponse>(
			'deletePromoCode',
			{
				query: mutation,
				variables: { id: promoCodeId },
				operationName: 'deletePromoCode',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deletePromoCode
	}

	/**
	 * List plans available for promo code attachment
	 *
	 * @param companyId - Company ID
	 * @returns Array of plan options
	 *
	 * @example
	 * ```typescript
	 * const plans = await whop.promoCodes.listPlans('biz_xxx')
	 * console.log('Available plans:', plans.map(p => p.accessPass.title))
	 * ```
	 */
	async listPlans(companyId: string): Promise<PromoCodePlanOption[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyCreatePromoCodeOptions($id: ID!) {
        company(id: $id) {
          promoCodePlanOptions {
            id
            formattedPrice
            accessPass {
              id
              title
            }
          }
        }
      }
    `

		interface FetchPlansResponse {
			company: {
				promoCodePlanOptions: PromoCodePlanOption[]
			}
		}

		const response = await graphqlRequest<FetchPlansResponse>(
			'fetchCompanyCreatePromoCodeOptions',
			{
				query,
				variables: { id: companyId },
				operationName: 'fetchCompanyCreatePromoCodeOptions',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.promoCodePlanOptions
	}
}

export * from './types'
