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
 */
interface UpdateAccessPassResponse {
	updateAccessPass: {
		accessPass: UpdatedAccessPass
	}
}

/**
 * GraphQL response structure for listAccessPassPlans
 */
interface ListAccessPassPlansResponse {
	company: {
		accessPass: {
			plans: {
				plans: Array<{
					id: string
					planType: string
					formattedPrice: string
					directLink: string
					visibility: string
					activeMemberCount: number
				}>
				pageInfo: {
					endCursor: string | null
					startCursor: string | null
					hasNextPage: boolean
				}
			}
		}
	}
}

/**
 * GraphQL response structure for createPlan
 */
interface CreatePlanResponse {
	createPlan: {
		plan: Plan
	}
}

/**
 * Product builder for a specific product within a company
 */
export class ProductBuilder {
	public readonly plans: {
		list: (
			options?: ListAccessPassPlansOptions,
		) => Promise<AccessPassPlansConnection>
		create: (input: Omit<CreatePlanInput, 'productId'>) => Promise<Plan>
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
          accessPass {
            id
            title
            headline
            visibility
            route
          }
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

		return response.updateAccessPass.accessPass
	}

	/**
	 * List plans for this product
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

		const query = `
      query coreFetchAccessPassPlans($companyId: String!, $accessPassId: String!, $first: Int, $after: String) {
        company(id: $companyId) {
          accessPass(id: $accessPassId) {
            plans(first: $first, after: $after) {
              plans {
                id
                planType
                formattedPrice
                directLink
                visibility
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

		return response.company.accessPass
			.plans as unknown as AccessPassPlansConnection
	}

	/**
	 * Create a plan for this product
	 */
	private async createPlan(
		input: Omit<CreatePlanInput, 'productId'>,
	): Promise<Plan> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation createPlan($input: CreatePlanInput!) {
        createPlan(input: $input) {
          plan {
            id
            planType
            formattedPrice
            directLink
            visibility
          }
        }
      }
    `

		const variables = {
			input: {
				...input,
				productId: this.id,
			},
		}

		const response = await graphqlRequest<CreatePlanResponse>(
			'createPlan',
			{ query: mutation, variables, operationName: 'createPlan' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createPlan.plan
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
