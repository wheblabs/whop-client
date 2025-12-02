import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	CreateTransferInput,
	ListTransfersOptions,
	Transfer,
	TransferListResponse,
} from './types'

export * from './types'

/**
 * Transfers resource for managing payouts
 *
 * @remarks
 * Transfers represent payouts from Whop to your connected payout account.
 * You can view transfer history and request new payouts.
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List transfers
 * const { transfers } = await whop.transfers.list('biz_xxx')
 *
 * // Get transfer details
 * const transfer = await whop.transfers.get('transfer_xxx')
 *
 * // Request a payout
 * const transfer = await whop.transfers.create('biz_xxx', {
 *   amount: 10000, // $100.00
 *   reference: 'Monthly payout'
 * })
 * ```
 */
export class Transfers {
	constructor(private readonly client: Whop) {}

	/**
	 * List transfers for a company
	 *
	 * @param companyId - Company ID
	 * @param options - List options
	 * @returns Paginated list of transfers
	 */
	async list(
		companyId: string,
		options?: ListTransfersOptions,
	): Promise<TransferListResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchCompanyTransfers($id: ID!, $first: Int, $after: String, $status: [String!]) {
				company(id: $id) {
					transfers(first: $first, after: $after, status: $status) {
						nodes {
							id
							createdAt
							completedAt
							status
							formattedAmount
							formattedFee
							formattedNetAmount
							currency
							method
							destination
							reference
							periodStart
							periodEnd
							failureReason
						}
						totalCount
						pageInfo {
							endCursor
							hasNextPage
						}
					}
				}
			}
		`

		const statusFilter = options?.status
			? Array.isArray(options.status)
				? options.status
				: [options.status]
			: undefined

		const variables = {
			id: companyId,
			first: options?.first ?? 25,
			after: options?.after,
			status: statusFilter,
		}

		const response = await graphqlRequest<{
			company: {
				transfers: {
					nodes: Transfer[]
					totalCount: number
					pageInfo: {
						endCursor?: string
						hasNextPage: boolean
					}
				}
			}
		}>(
			'fetchCompanyTransfers',
			{ query, variables, operationName: 'fetchCompanyTransfers' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const { nodes, totalCount, pageInfo } = response.company.transfers

		return {
			transfers: nodes,
			totalCount,
			pageInfo,
		}
	}

	/**
	 * Get a specific transfer by ID
	 *
	 * @param transferId - Transfer ID
	 * @returns Transfer details
	 */
	async get(transferId: string): Promise<Transfer> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchTransfer($id: ID!) {
				transfer(id: $id) {
					id
					createdAt
					completedAt
					status
					formattedAmount
					formattedFee
					formattedNetAmount
					currency
					method
					destination
					reference
					periodStart
					periodEnd
					failureReason
				}
			}
		`

		const variables = { id: transferId }

		const response = await graphqlRequest<{
			transfer: Transfer
		}>(
			'fetchTransfer',
			{ query, variables, operationName: 'fetchTransfer' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.transfer
	}

	/**
	 * Request a payout/transfer
	 *
	 * @param companyId - Company ID
	 * @param input - Transfer details
	 * @returns Created transfer
	 */
	async create(
		companyId: string,
		input: CreateTransferInput,
	): Promise<Transfer> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
			mutation requestTransfer($input: RequestTransferInput!) {
				requestTransfer(input: $input) {
					id
					createdAt
					status
					formattedAmount
					formattedFee
					formattedNetAmount
					currency
					method
					reference
				}
			}
		`

		const variables = {
			input: {
				companyId,
				amount: input.amount,
				currency: input.currency || 'USD',
				method: input.method,
				reference: input.reference,
			},
		}

		const response = await graphqlRequest<{
			requestTransfer: Transfer
		}>(
			'requestTransfer',
			{ query: mutation, variables, operationName: 'requestTransfer' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.requestTransfer
	}

	/**
	 * Get transfer summary/balance for a company
	 *
	 * @param companyId - Company ID
	 * @returns Balance summary
	 */
	async getBalance(companyId: string): Promise<{
		availableBalance: number
		formattedAvailableBalance: string
		pendingBalance: number
		formattedPendingBalance: string
		currency: string
	}> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
			query fetchCompanyBalance($id: ID!) {
				company(id: $id) {
					balance {
						availableBalance
						formattedAvailableBalance
						pendingBalance
						formattedPendingBalance
						currency
					}
				}
			}
		`

		const variables = { id: companyId }

		const response = await graphqlRequest<{
			company: {
				balance: {
					availableBalance: number
					formattedAvailableBalance: string
					pendingBalance: number
					formattedPendingBalance: string
					currency: string
				}
			}
		}>(
			'fetchCompanyBalance',
			{ query, variables, operationName: 'fetchCompanyBalance' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.balance
	}
}
