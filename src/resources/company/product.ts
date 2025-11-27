import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	UpdateAccessPassInput,
	UpdatedAccessPass,
} from '@/types/access-passes'
import type {
	AccessPassPlansConnection,
	CreatePlanInput,
	ListAccessPassPlansOptions,
	Plan,
} from '@/types/plans'
import { PlanBuilder } from './plan'

/**
 * GraphQL response structure for updateAccessPass
 * Note: The API returns fields directly, not wrapped in accessPass
 */
interface UpdateAccessPassResponse {
	updateAccessPass: UpdatedAccessPass
}

/**
 * GraphQL response structure for listAccessPassPlans
 * Updated to match Whop's actual schema from fe-monorepo
 */
interface ListAccessPassPlansResponse {
	company: {
		accessPass: {
			plans: {
				nodes: Array<{
					id: string
					planType: string
					formattedPrice: string
					initialPrice: string | null
					baseCurrency: string
					visibility: string
					releaseMethod: string
					activeMemberCount: number
					expirationDays: number | null
					trialPeriodDays: number | null
					internalNotes: string | null
				}>
				pageInfo: {
					endCursor: string | null
					hasNextPage: boolean
				}
			}
		}
	}
}

/**
 * GraphQL response structure for createPlan
 * Note: The API returns fields directly, not wrapped in plan
 */
interface CreatePlanResponse {
	createPlan: Plan
}

/**
 * Product builder for a specific product within a company
 */
export class ProductBuilder {
	public readonly plans: {
		list: (
			options?: ListAccessPassPlansOptions,
		) => Promise<AccessPassPlansConnection>
		create: (
			input: Omit<CreatePlanInput, 'productId' | 'companyId'>,
		) => Promise<Plan>
	}

	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
		public readonly id: string,
	) {
		this.plans = {
			list: (options) => this.listPlans(options),
			create: (input) => this.createPlan(input),
		}
	}

	/**
	 * Update this product
	 *
	 * @param input - Product update input
	 * @returns Updated product
	 *
	 * @example
	 * ```typescript
	 * await whop.company('biz_xxx').product('prod_xxx').update({
	 *   title: 'New Product Name',
	 *   visibility: 'visible'
	 * })
	 * ```
	 */
	async update(
		input: Omit<UpdateAccessPassInput, 'id'>,
	): Promise<UpdatedAccessPass> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updateAccessPass($input: UpdateAccessPassInput!) {
        updateAccessPass(input: $input) {
          id
          title
          headline
          visibility
          route
        }
      }
    `

		const variables = {
			input: {
				...input,
				id: this.id,
			},
		}

		const response = await graphqlRequest<UpdateAccessPassResponse>(
			'updateAccessPass',
			{ query: mutation, variables, operationName: 'updateAccessPass' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateAccessPass // Returns directly
	}

	/**
	 * List plans for this product
	 * Updated to match Whop's actual GraphQL schema from fe-monorepo
	 */
	private async listPlans(
		options?: ListAccessPassPlansOptions,
	): Promise<AccessPassPlansConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		// Updated to match Whop's actual GraphQL schema
		// See: fe-monorepo/packages/gql/client-operations/creator-dashboard/promo-codes/fetch-access-pass-plans.graphql
		const query = `
      query coreFetchAccessPassPlans($companyId: ID!, $accessPassId: ID!, $first: Int, $after: String) {
        company(id: $companyId) {
          accessPass(id: $accessPassId) {
            plans(order: active_members_count, direction: desc, first: $first, after: $after) {
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
                hasNextPage
              }
            }
          }
        }
      }
    `

		const variables = {
			companyId: this.companyId,
			accessPassId: this.id,
			...(options?.first && { first: options.first }),
			...(options?.after && { after: options.after }),
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

		// Map 'nodes' to 'plans' for backward compatibility
		const plansData = response.company.accessPass.plans
		return {
			plans: plansData.nodes.map((node) => ({
				id: node.id,
				initialPrice: node.initialPrice,
				formattedPrice: node.formattedPrice,
				baseCurrency: node.baseCurrency,
				expirationDays: node.expirationDays ?? null,
				trialPeriodDays: node.trialPeriodDays ?? null,
				visibility: node.visibility,
				internalNotes: node.internalNotes ?? null,
				releaseMethod: node.releaseMethod,
				planType: node.planType,
				activeMemberCount: node.activeMemberCount,
			})),
			pageInfo: plansData.pageInfo,
		}
	}

	/**
	 * Create a plan for this product
	 */
	private async createPlan(
		input: Omit<CreatePlanInput, 'productId' | 'companyId'>,
	): Promise<Plan> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		// Updated to match Whop's actual GraphQL schema
		// See: fe-monorepo/packages/gql/server-operations/company/create-plan.graphql
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

		const variables = {
			input: {
				...input,
				companyId: this.companyId,
				productId: this.id,
			},
		}

		const response = await graphqlRequest<CreatePlanResponse>(
			'createPlan',
			{ query: mutation, variables, operationName: 'createPlan' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createPlan // Returns Plan directly, not wrapped
	}

	/**
	 * Get a specific plan builder
	 *
	 * @param planId - Plan ID
	 * @returns PlanBuilder instance
	 *
	 * @example
	 * ```typescript
	 * const plan = whop.company('biz_xxx').product('prod_xxx').plan('plan_xxx')
	 * await plan.update({ renewalPrice: '39.99' })
	 * ```
	 */
	plan(planId: string): PlanBuilder {
		return new PlanBuilder(this.client, planId)
	}
}
