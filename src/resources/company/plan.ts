import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { Plan, UpdatePlanInput } from '@/types/plans'

/**
 * GraphQL response structure for updatePlan
 * Note: The API returns fields directly, not wrapped in plan
 */
interface UpdatePlanResponse {
	updatePlan: Plan
}

/**
 * Plan builder for a specific plan
 */
export class PlanBuilder {
	constructor(
		private readonly client: Whop,
		public readonly id: string,
	) {}

	/**
	 * Update this plan
	 *
	 * @param input - Plan update input
	 * @returns Updated plan
	 *
	 * @example
	 * ```typescript
	 * await whop
	 *   .company('biz_xxx')
	 *   .product('prod_xxx')
	 *   .plan('plan_xxx')
	 *   .update({ renewalPrice: '39.99' })
	 * ```
	 */
	async update(input: Omit<UpdatePlanInput, 'id'>): Promise<Plan> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updatePlan($input: UpdatePlanInput!) {
        updatePlan(input: $input) {
          id
          planType
          formattedPrice
          directLink
          visibility
          initialPrice
          renewalPrice
        }
      }
    `

		const variables = {
			input: {
				...input,
				id: this.id,
			},
		}

		const response = await graphqlRequest<UpdatePlanResponse>(
			'updatePlan',
			{ query: mutation, variables, operationName: 'updatePlan' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updatePlan // Returns Plan directly
	}
}
