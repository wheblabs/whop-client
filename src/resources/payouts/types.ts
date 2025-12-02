/**
 * Ledger account balance
 */
export interface LedgerBalance {
	available: number
	pending: number
	reserved: number
	total: number
	currency: string
}

/**
 * Ledger account
 */
export interface LedgerAccount {
	id: string
	balance: LedgerBalance
	accountType: 'creator' | 'affiliate'
	createdAt: string
}

/**
 * Credit transaction type
 */
export type CreditTransactionType =
	| 'credit'
	| 'debit'
	| 'withdrawal'
	| 'refund'
	| 'chargeback'
	| 'fee'
	| 'adjustment'

/**
 * Credit transaction
 */
export interface CreditTransaction {
	id: string
	type: CreditTransactionType
	amount: number
	currency: string
	description?: string
	createdAt: string
	balanceAfter: number
}

/**
 * Options for listing credit transactions
 */
export interface ListCreditTransactionsOptions {
	/** Ledger account ID */
	accountId: string
	/** Number of transactions to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
	/** Filter by transaction type */
	type?: CreditTransactionType
}

/**
 * Paginated credit transactions response
 */
export interface CreditTransactionsConnection {
	transactions: CreditTransaction[]
	pageInfo: {
		hasNextPage: boolean
		endCursor: string | null
	}
}

/**
 * Payout token
 */
export interface PayoutToken {
	id: string
	name: string
	createdAt: string
	lastUsedAt?: string
	prefix: string
}

/**
 * Input for creating a payout token
 */
export interface CreatePayoutTokenInput {
	/** Company ID */
	companyId: string
	/** Token name */
	name: string
}

/**
 * Withdrawal status
 */
export type WithdrawalStatus =
	| 'pending'
	| 'processing'
	| 'completed'
	| 'failed'
	| 'cancelled'

/**
 * Withdrawal destination type
 */
export type WithdrawalDestinationType = 'bank_account' | 'paypal' | 'crypto'

/**
 * Withdrawal destination
 */
export interface WithdrawalDestination {
	id: string
	type: WithdrawalDestinationType
	name: string
	last4?: string
}

/**
 * Withdrawal
 */
export interface Withdrawal {
	id: string
	amount: number
	currency: string
	fee: number
	netAmount: number
	status: WithdrawalStatus
	destination: WithdrawalDestination
	createdAt: string
	processedAt?: string
}

/**
 * Input for creating a withdrawal
 */
export interface CreateWithdrawalInput {
	/** Ledger account ID */
	accountId: string
	/** Amount to withdraw */
	amount: number
	/** Destination ID */
	destinationId: string
}

/**
 * Withdrawal settings
 */
export interface WithdrawalSettings {
	autoWithdrawal: boolean
	autoWithdrawalThreshold: number
	minimumWithdrawal: number
	defaultDestinationId?: string
}

/**
 * Input for updating withdrawal settings
 */
export interface UpdateWithdrawalSettingsInput {
	/** Ledger account ID */
	accountId: string
	/** Enable auto-withdrawal */
	autoWithdrawal?: boolean
	/** Auto-withdrawal threshold */
	autoWithdrawalThreshold?: number
	/** Default destination ID */
	defaultDestinationId?: string
}
