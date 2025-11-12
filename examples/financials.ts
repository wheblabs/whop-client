import { Whop } from '../src/client'

const whop = new Whop()

/**
 * Example 1: Get all financial metrics
 */
async function _getAllMetrics() {
	const data = await whop.company('biz_xxx').financials.get({
		start_date: '2025-10-01',
		end_date: '2025-10-31',
	})

	console.log('Revenue:', data.summary.revenue)
	console.log('Fees:', data.summary.fees)
	console.log('Users:', data.summary.users)
	console.log('Growth:', data.summary.growth)
}

/**
 * Example 2: Get specific categories only
 */
async function _getRevenueAndFees() {
	const data = await whop.company('biz_xxx').financials.get({
		start_date: '2025-10-01',
		end_date: '2025-10-31',
		categories: ['revenue', 'fees'],
	})

	console.log('MRR:', data.summary.revenue?.mrr)
	console.log('Total Fees:', data.summary.fees?.total_fees)
}

/**
 * Example 3: Daily granularity with timezone
 */
async function _getDailyMetrics() {
	const data = await whop.company('biz_xxx').financials.get({
		start_date: '2025-11-01',
		end_date: '2025-11-30',
		interval: 'daily',
		time_zone: 'America/Los_Angeles',
		categories: ['revenue', 'growth'],
	})

	// Access time-series data for charting
	data.time_series.revenue?.gross_volume?.forEach((point) => {
		console.log(`${point.t}: $${point.v / 100}`)
	})
}

/**
 * Example 4: Get top performers
 */
async function _getTopPerformers() {
	const data = await whop.company('biz_xxx').financials.get({
		start_date: '2025-01-01',
		end_date: '2025-12-31',
		categories: ['top_performers'],
	})

	console.log('Top Customers:')
	data.summary.top_performers?.customers.forEach((customer) => {
		console.log(`  ${customer.name}: $${customer.sales / 100}`)
	})

	console.log('Top Affiliates:')
	data.summary.top_performers?.affiliates.forEach((affiliate) => {
		console.log(`  ${affiliate.name}: $${affiliate.sales / 100}`)
	})
}

/**
 * Example 5: Weekly metrics with affiliate analysis
 */
async function _getAffiliateAnalysis() {
	const data = await whop.company('biz_xxx').financials.get({
		start_date: '2025-10-01',
		end_date: '2025-10-31',
		interval: 'weekly',
		categories: ['affiliates', 'revenue'],
	})

	console.log('Revenue Split:')
	data.summary.affiliates?.revenue_split.forEach((split) => {
		console.log(`  ${split.t}:`)
		split.segments.forEach((segment) => {
			console.log(`    ${segment.name}: $${segment.value / 100}`)
		})
	})
}

/**
 * Example 6: User metrics and conversion rates
 */
async function _getUserMetrics() {
	const data = await whop.company('biz_xxx').financials.get({
		start_date: '2025-10-01',
		end_date: '2025-10-31',
		categories: ['users', 'growth'],
	})

	console.log('User Metrics:')
	console.log(`  ARPPU: $${data.summary.users?.arppu || 0 / 100}`)
	console.log(`  ARPS: $${data.summary.users?.arps || 0 / 100}`)
	console.log(`  Churn Rate: ${(data.summary.users?.churn_rate || 0) * 100}%`)
	console.log(
		`  Trial Conversion: ${(data.summary.users?.trial_conversion_rate || 0) * 100}%`,
	)
	console.log(`  New Users: ${data.summary.growth?.new_users}`)
}

/**
 * Example 7: Compare multiple time periods
 */
async function _comparePeriods() {
	const [current, previous] = await Promise.all([
		whop.company('biz_xxx').financials.get({
			start_date: '2025-11-01',
			end_date: '2025-11-30',
			categories: ['revenue'],
		}),
		whop.company('biz_xxx').financials.get({
			start_date: '2025-10-01',
			end_date: '2025-10-31',
			categories: ['revenue'],
		}),
	])

	const currentMRR = current.summary.revenue?.mrr || 0
	const previousMRR = previous.summary.revenue?.mrr || 0
	const growth = ((currentMRR - previousMRR) / previousMRR) * 100

	console.log(`Current MRR: $${currentMRR / 100}`)
	console.log(`Previous MRR: $${previousMRR / 100}`)
	console.log(`Growth: ${growth.toFixed(2)}%`)
}
