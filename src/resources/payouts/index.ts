import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	CreatePayoutTokenInput,
	CreateWithdrawalInput,
	CreditTransactionsConnection,
	LedgerAccount,
	LedgerBalance,
	ListCreditTransactionsOptions,
	PayoutToken,
	UpdateWithdrawalSettingsInput,
	Withdrawal,
	WithdrawalDestination,
	WithdrawalSettings,
} from './types'

/**
 * Ledger Account sub-resource
 */
export class PayoutLedgerAccount {
	constructor(private readonly client: Whop) {}

	/**
	 * Get a ledger account
	 */
	async get(accountId: string): Promise<LedgerAccount> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchLedgerAccount($id: ID!) {
        ledgerAccount(id: $id) {
          id
          balance {
            available
            pending
            reserved
            total
            currency
          }
          accountType
          createdAt
        }
      }
    `

		interface FetchAccountResponse {
			ledgerAccount: LedgerAccount
		}

		const response = await graphqlRequest<FetchAccountResponse>(
			'fetchLedgerAccount',
			{
				query,
				variables: { id: accountId },
				operationName: 'fetchLedgerAccount',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.ledgerAccount
	}

	/**
	 * Get ledger account balance
	 */
	async getBalance(accountId: string): Promise<LedgerBalance> {
		const account = await this.get(accountId)
		return account.balance
	}
}

/**
 * Credit Transactions sub-resource
 */
export class PayoutCreditTransactions {
	constructor(private readonly client: Whop) {}

	/**
	 * List credit transactions
	 */
	async list(
		options: ListCreditTransactionsOptions,
	): Promise<CreditTransactionsConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCreditTransactions($accountId: ID!, $first: Int, $after: String, $type: String) {
        ledgerAccount(id: $accountId) {
          creditTransactions(first: $first, after: $after, type: $type) {
            nodes {
              id
              type
              amount
              currency
              description
              createdAt
              balanceAfter
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `

		interface FetchTransactionsResponse {
			ledgerAccount: {
				creditTransactions: {
					nodes: CreditTransactionsConnection['transactions']
					pageInfo: CreditTransactionsConnection['pageInfo']
				}
			}
		}

		const response = await graphqlRequest<FetchTransactionsResponse>(
			'fetchCreditTransactions',
			{
				query,
				variables: {
					accountId: options.accountId,
					first: options.first || 50,
					after: options.after || null,
					type: options.type || null,
				},
				operationName: 'fetchCreditTransactions',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			transactions: response.ledgerAccount.creditTransactions.nodes,
			pageInfo: response.ledgerAccount.creditTransactions.pageInfo,
		}
	}
}

/**
 * Payout Tokens sub-resource
 */
export class PayoutTokens {
	constructor(private readonly client: Whop) {}

	/**
	 * List payout tokens for a company
	 */
	async list(companyId: string): Promise<PayoutToken[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchPayoutTokens($id: ID!) {
        company(id: $id) {
          payoutTokens {
            id
            name
            createdAt
            lastUsedAt
            prefix
          }
        }
      }
    `

		interface FetchTokensResponse {
			company: {
				payoutTokens: PayoutToken[]
			}
		}

		const response = await graphqlRequest<FetchTokensResponse>(
			'fetchPayoutTokens',
			{
				query,
				variables: { id: companyId },
				operationName: 'fetchPayoutTokens',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.payoutTokens
	}

	/**
	 * Create a payout token
	 */
	async create(
		input: CreatePayoutTokenInput,
	): Promise<{ token: string; prefix: string }> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation createPayoutToken($input: CreatePayoutTokenInput!) {
        createPayoutToken(input: $input) {
          token
          prefix
        }
      }
    `

		interface CreateTokenResponse {
			createPayoutToken: { token: string; prefix: string }
		}

		const response = await graphqlRequest<CreateTokenResponse>(
			'createPayoutToken',
			{
				query: mutation,
				variables: { input },
				operationName: 'createPayoutToken',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createPayoutToken
	}

	/**
	 * Rename a payout token
	 */
	async rename(tokenId: string, name: string): Promise<PayoutToken> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation renamePayoutToken($id: ID!, $name: String!) {
        renamePayoutToken(input: { id: $id, name: $name }) {
          id
          name
          createdAt
          lastUsedAt
          prefix
        }
      }
    `

		interface RenameTokenResponse {
			renamePayoutToken: PayoutToken
		}

		const response = await graphqlRequest<RenameTokenResponse>(
			'renamePayoutToken',
			{
				query: mutation,
				variables: { id: tokenId, name },
				operationName: 'renamePayoutToken',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.renamePayoutToken
	}

	/**
	 * Delete a payout token
	 */
	async delete(tokenId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation deletePayoutToken($id: ID!) {
        deletePayoutToken(input: { id: $id })
      }
    `

		interface DeleteTokenResponse {
			deletePayoutToken: boolean
		}

		const response = await graphqlRequest<DeleteTokenResponse>(
			'deletePayoutToken',
			{
				query: mutation,
				variables: { id: tokenId },
				operationName: 'deletePayoutToken',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deletePayoutToken
	}
}

/**
 * Withdrawal sub-resource
 */
export class PayoutWithdrawal {
	constructor(private readonly client: Whop) {}

	/**
	 * Create a withdrawal
	 */
	async create(input: CreateWithdrawalInput): Promise<Withdrawal> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation createWithdrawal($input: CreateWithdrawalInput!) {
        createWithdrawal(input: $input) {
          id
          amount
          currency
          fee
          netAmount
          status
          destination {
            id
            type
            name
            last4
          }
          createdAt
        }
      }
    `

		interface CreateWithdrawalResponse {
			createWithdrawal: Withdrawal
		}

		const response = await graphqlRequest<CreateWithdrawalResponse>(
			'createWithdrawal',
			{
				query: mutation,
				variables: { input },
				operationName: 'createWithdrawal',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createWithdrawal
	}

	/**
	 * Get withdrawal settings
	 */
	async getSettings(accountId: string): Promise<WithdrawalSettings> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchWithdrawalSettings($id: ID!) {
        ledgerAccount(id: $id) {
          withdrawalSettings {
            autoWithdrawal
            autoWithdrawalThreshold
            minimumWithdrawal
            defaultDestinationId
          }
        }
      }
    `

		interface FetchSettingsResponse {
			ledgerAccount: {
				withdrawalSettings: WithdrawalSettings
			}
		}

		const response = await graphqlRequest<FetchSettingsResponse>(
			'fetchWithdrawalSettings',
			{
				query,
				variables: { id: accountId },
				operationName: 'fetchWithdrawalSettings',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.ledgerAccount.withdrawalSettings
	}

	/**
	 * Update withdrawal settings
	 */
	async updateSettings(
		input: UpdateWithdrawalSettingsInput,
	): Promise<WithdrawalSettings> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updateWithdrawalSettings($input: UpdateWithdrawalSettingsInput!) {
        updateWithdrawalSettings(input: $input) {
          autoWithdrawal
          autoWithdrawalThreshold
          minimumWithdrawal
          defaultDestinationId
        }
      }
    `

		interface UpdateSettingsResponse {
			updateWithdrawalSettings: WithdrawalSettings
		}

		const response = await graphqlRequest<UpdateSettingsResponse>(
			'updateWithdrawalSettings',
			{
				query: mutation,
				variables: { input },
				operationName: 'updateWithdrawalSettings',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateWithdrawalSettings
	}
}

/**
 * Payouts resource - Manage payouts, ledger accounts, and withdrawals
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // Get ledger account balance
 * const balance = await whop.payouts.ledgerAccount.getBalance('ledger_xxx')
 *
 * // List credit transactions
 * const { transactions } = await whop.payouts.creditTransactions.list({
 *   accountId: 'ledger_xxx'
 * })
 *
 * // Create a withdrawal
 * const withdrawal = await whop.payouts.withdrawal.create({
 *   accountId: 'ledger_xxx',
 *   amount: 10000,
 *   destinationId: 'dest_xxx'
 * })
 * ```
 */
export class Payouts {
	public readonly ledgerAccount: PayoutLedgerAccount
	public readonly creditTransactions: PayoutCreditTransactions
	public readonly tokens: PayoutTokens
	public readonly withdrawal: PayoutWithdrawal

	constructor(private readonly client: Whop) {
		this.ledgerAccount = new PayoutLedgerAccount(client)
		this.creditTransactions = new PayoutCreditTransactions(client)
		this.tokens = new PayoutTokens(client)
		this.withdrawal = new PayoutWithdrawal(client)
	}

	/**
	 * Get available withdrawal destinations for a company
	 */
	async availableDestinations(
		companyId: string,
	): Promise<WithdrawalDestination[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchAvailableDestinations($id: ID!) {
        company(id: $id) {
          withdrawalDestinations {
            id
            type
            name
            last4
          }
        }
      }
    `

		interface FetchDestinationsResponse {
			company: {
				withdrawalDestinations: WithdrawalDestination[]
			}
		}

		const response = await graphqlRequest<FetchDestinationsResponse>(
			'fetchAvailableDestinations',
			{
				query,
				variables: { id: companyId },
				operationName: 'fetchAvailableDestinations',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.withdrawalDestinations
	}
}

export * from './types'
