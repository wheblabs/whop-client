/**
 * Financial dashboard types for Whop creator analytics
 */

/**
 * Time interval for financial data aggregation
 */
export type FinancialInterval = 'daily' | 'weekly' | 'monthly'

/**
 * Financial data categories
 */
export type FinancialCategory =
	| 'revenue'
	| 'fees'
	| 'users'
	| 'growth'
	| 'payments'
	| 'traffic'
	| 'affiliates'
	| 'top_performers'

/**
 * Parameters for fetching financial data
 */
export interface GetFinancialDataParams {
	/** Start date in YYYY-MM-DD format */
	start_date: string

	/** End date in YYYY-MM-DD format */
	end_date: string

	/** Time interval for data aggregation (default: "monthly") */
	interval?: FinancialInterval

	/** Categories to include. If omitted, returns all categories */
	categories?: FinancialCategory[]

	/** Currency code (default: "usd") */
	currency?: string

	/** IANA timezone (default: "Etc/UTC") */
	time_zone?: string

	/** Optional: Filter by specific access pass IDs */
	access_pass_ids?: string[]

	/** Week calculation mode (default: 0) */
	week_mode?: number
}

/**
 * Time-series data point
 */
export interface MetricDataPoint {
	/** Timestamp */
	t: string
	/** Value */
	v: number
}

/**
 * Metric with sum aggregation
 */
export interface MetricWithSum {
	sum: number
	min: number
	max: number
	data: MetricDataPoint[]
}

/**
 * Metric with last value
 */
export interface MetricWithLast {
	last: number
	min: number
	max: number
	data: MetricDataPoint[]
}

/**
 * Metric with average
 */
export interface MetricWithAvg {
	avg: number
	min: number
	max: number
	data: MetricDataPoint[]
}

/**
 * Payment status breakdown
 */
export interface PaymentStatus {
	status: string
	amount: number
}

/**
 * Split segment (for affiliate analysis)
 */
export interface SplitSegment {
	name: string
	value: number
}

/**
 * Split data with segments
 */
export interface SplitData {
	t: string
	segments: SplitSegment[]
}

/**
 * User profile picture for financial data
 */
export interface FinancialProfilePicture {
	original: string
	double: string
	isVideo: boolean
}

/**
 * User information
 */
export interface FinancialUser {
	id: string
	name: string
	username: string
	discordUsername: string
	profilePic40: FinancialProfilePicture
}

/**
 * Top performer (customer or affiliate)
 */
export interface TopPerformer {
	sales: number
	user: FinancialUser
}

/**
 * Revenue metrics
 */
export interface RevenueMetrics {
	gross_volume: number
	net_volume: number
	mrr: number
	arr: number
	churned_revenue: number
}

/**
 * Fee metrics
 */
export interface FeeMetrics {
	payment_processing: number
	whop_processing: number
	affiliate: number
	dispute: number
	tax_withheld: number
	refunded: number
	total_fees: number
}

/**
 * User metrics
 */
export interface UserMetrics {
	arppu: number
	arps: number
	churn_rate: number
	trial_conversion_rate: number
}

/**
 * Growth metrics
 */
export interface GrowthMetrics {
	new_users: number
	users_growth: number
}

/**
 * Payment metrics
 */
export interface PaymentMetrics {
	successful: number
	by_status: PaymentStatus[]
}

/**
 * Traffic metrics
 */
export interface TrafficMetrics {
	page_visits: number
}

/**
 * Affiliate metrics
 */
export interface AffiliateMetrics {
	new_users_split: SplitData[]
	revenue_split: SplitData[]
}

/**
 * Top performers data
 */
export interface TopPerformersMetrics {
	customers: Array<{
		name: string
		username: string
		sales: number
	}>
	affiliates: Array<{
		name: string
		username: string
		sales: number
	}>
}

/**
 * Financial data summary
 */
export interface FinancialDataSummary {
	revenue?: RevenueMetrics
	fees?: FeeMetrics
	users?: UserMetrics
	growth?: GrowthMetrics
	payments?: PaymentMetrics
	traffic?: TrafficMetrics
	affiliates?: AffiliateMetrics
	top_performers?: TopPerformersMetrics
}

/**
 * Time-series data for each category
 */
export interface FinancialTimeSeries {
	revenue?: {
		gross_volume?: MetricDataPoint[]
		net_volume?: MetricDataPoint[]
		mrr?: MetricDataPoint[]
		arr?: MetricDataPoint[]
		churned_revenue?: MetricDataPoint[]
	}
	fees?: {
		payment_processing?: MetricDataPoint[]
		whop_processing?: MetricDataPoint[]
		affiliate?: MetricDataPoint[]
		dispute?: MetricDataPoint[]
		tax_withheld?: MetricDataPoint[]
		refunded?: MetricDataPoint[]
	}
	users?: {
		arppu?: MetricDataPoint[]
		arps?: MetricDataPoint[]
		churn_rate?: MetricDataPoint[]
		trial_conversion_rate?: MetricDataPoint[]
	}
	growth?: {
		new_users?: MetricDataPoint[]
		users_growth?: MetricDataPoint[]
	}
	payments?: {
		successful?: MetricDataPoint[]
	}
	traffic?: {
		page_visits?: MetricDataPoint[]
	}
}

/**
 * Complete financial data response
 */
export interface FinancialData {
	summary: FinancialDataSummary
	time_series: FinancialTimeSeries
	details_available: boolean
}

/**
 * Raw GraphQL response structure
 */
export interface RawFinancialCharts {
	grossVolume?: MetricWithSum
	netVolume?: MetricWithSum
	mrr?: MetricWithLast
	arr?: MetricWithLast
	churnedRevenue?: MetricWithSum
	paymentProcessingFees?: MetricWithSum
	whopProcessingFees?: MetricWithSum
	affiliateFees?: MetricWithSum
	disputeFees?: MetricWithSum
	salesTaxWithheld?: MetricWithSum
	totalRefunded?: MetricWithSum
	averageRevenuePerPayingUser?: MetricWithLast
	averageRevenuePerSubscription?: MetricWithLast
	churnRate?: MetricWithAvg
	trialConversionRate?: MetricWithAvg
	newUsers?: MetricWithSum
	usersGrowth?: MetricWithLast
	successfulPayments?: MetricWithSum
	paymentsByStatus?: PaymentStatus[]
	pageVisits?: MetricWithSum
	newUsersSplit?: SplitData[]
	revenueSplit?: SplitData[]
	topCustomers?: TopPerformer[]
	topAffiliates?: TopPerformer[]
}

/**
 * GraphQL response wrapper
 */
export interface FinancialDashboardResponse {
	company: {
		id: string
		creatorDashboardCharts: RawFinancialCharts
	}
}
