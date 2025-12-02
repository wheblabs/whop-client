/**
 * Time range presets for analytics
 */
export type TimeRangePreset =
	| 'today'
	| 'yesterday'
	| 'last_7_days'
	| 'last_30_days'
	| 'last_90_days'
	| 'this_month'
	| 'last_month'
	| 'this_year'
	| 'all_time'

/**
 * Chart data point
 */
export interface ChartDataPoint {
	/** Timestamp (Unix or ISO string) */
	t: string | number
	/** Value */
	v: number
}

/**
 * Base chart response
 */
export interface ChartResponse {
	/** Last/current value */
	last: number
	/** Minimum value in range */
	min: number
	/** Maximum value in range */
	max: number
	/** Time series data points */
	data: ChartDataPoint[]
}

/**
 * Analytics configuration input
 */
export interface AnalyticsConfig {
	/** Time range preset */
	timeRange?: TimeRangePreset
	/** Custom start date (ISO string) */
	startDate?: string
	/** Custom end date (ISO string) */
	endDate?: string
	/** Granularity (day, week, month) */
	granularity?: 'day' | 'week' | 'month'
	/** Access pass ID to filter by */
	accessPassId?: string
	/** Plan ID to filter by */
	planId?: string
}

/**
 * Top affiliate analytics
 */
export interface TopAffiliate {
	id: string
	username: string
	profilePic?: string
	totalReferrals: number
	totalEarnings: number
	mrr: number
}

/**
 * Top customer analytics
 */
export interface TopCustomer {
	id: string
	username: string
	profilePic?: string
	totalSpent: number
	membershipCount: number
	firstPurchase: string
}

/**
 * Payments breakdown item
 */
export interface PaymentsBreakdownItem {
	type: string
	count: number
	amount: number
}

/**
 * Overview stats response
 */
export interface OverviewStats {
	mrr: number
	arr: number
	grossVolume: number
	netVolume: number
	newUsers: number
	activeMembers: number
	churnRate: number
	trialConversionRate: number
}
