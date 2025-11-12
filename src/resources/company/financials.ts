import type { Whop } from '@/client'
import type {
	FinancialCategory,
	FinancialDashboardResponse,
	FinancialData,
	GetFinancialDataParams,
	RawFinancialCharts,
} from '@/types/financials'

/**
 * Category to GraphQL fields mapping
 * Maps each category to its corresponding GraphQL query fields
 */
const CATEGORY_FIELDS: Record<FinancialCategory, string> = {
	revenue: `
    grossVolume { sum min max data { t v } }
    netVolume { sum min max data { t v } }
    mrr { last min max data { t v } }
    arr { last min max data { t v } }
    churnedRevenue { sum min max data { t v } }
  `,

	fees: `
    paymentProcessingFees: stripeFees { sum min max data { t v } }
    whopProcessingFees { sum min max data { t v } }
    affiliateFees { sum min max data { t v } }
    disputeFees { sum min max data { t v } }
    salesTaxWithheld { sum min max data { t v } }
    totalRefunded { sum min max data { t v } }
  `,

	users: `
    averageRevenuePerPayingUser { last min max data { t v } }
    averageRevenuePerSubscription { last min max data { t v } }
    churnRate { avg min max data { t v } }
    trialConversionRate { avg min max data { t v } }
  `,

	growth: `
    newUsers { sum min max data { t v } }
    usersGrowth { last min max data { t v } }
  `,

	payments: `
    successfulPayments { sum min max data { t v } }
    paymentsByStatus { status amount }
  `,

	traffic: `
    pageVisits { sum min max data { t v } }
  `,

	affiliates: `
    newUsersSplit { t segments { name value } }
    revenueSplit { t segments { name value } }
  `,

	top_performers: `
    topCustomers {
      sales
      user {
        id
        name
        username
        discordUsername
        profilePic40: profilePicSrcset(style: s40, allowAnimation: true) {
          original
          double
          isVideo
        }
      }
    }
    topAffiliates {
      sales
      user {
        id
        name
        username
        discordUsername
        profilePic40: profilePicSrcset(style: s40, allowAnimation: true) {
          original
          double
          isVideo
        }
      }
    }
  `,
}

/**
 * All available categories
 */
const ALL_CATEGORIES: FinancialCategory[] = [
	'revenue',
	'fees',
	'users',
	'growth',
	'payments',
	'traffic',
	'affiliates',
	'top_performers',
]

/**
 * Company financials resource - provides access to financial dashboard data
 */
export class CompanyFinancials {
	constructor(
		private readonly client: Whop,
		private readonly companyId: string,
	) {}

	/**
	 * Fetch financial dashboard data for the company
	 *
	 * @param params - Query parameters
	 * @returns Formatted financial data with summary and time-series
	 *
	 * @example
	 * ```typescript
	 * // Get all financial data for October 2025
	 * const data = await whop.company('biz_xxx').financials.get({
	 *   start_date: '2025-10-01',
	 *   end_date: '2025-10-31'
	 * })
	 *
	 * console.log(data.summary.revenue.mrr)
	 * console.log(data.summary.fees.total_fees)
	 * ```
	 *
	 * @example
	 * **Get specific categories only:**
	 * ```typescript
	 * const data = await whop.company('biz_xxx').financials.get({
	 *   start_date: '2025-10-01',
	 *   end_date: '2025-10-31',
	 *   categories: ['revenue', 'fees']
	 * })
	 * ```
	 *
	 * @example
	 * **Daily granularity with timezone:**
	 * ```typescript
	 * const data = await whop.company('biz_xxx').financials.get({
	 *   start_date: '2025-11-01',
	 *   end_date: '2025-11-30',
	 *   interval: 'daily',
	 *   time_zone: 'America/Los_Angeles'
	 * })
	 * ```
	 */
	async get(params: GetFinancialDataParams): Promise<FinancialData> {
		// Convert ISO dates to Unix timestamps (seconds)
		const from = Math.floor(
			new Date(`${params.start_date}T00:00:00Z`).getTime() / 1000,
		)
		const to = Math.floor(
			new Date(`${params.end_date}T23:59:59Z`).getTime() / 1000,
		)

		// Determine which fields to query
		const categories = params.categories || ALL_CATEGORIES
		const fields = categories.map((cat) => CATEGORY_FIELDS[cat]).join('\n')

		// Build dynamic GraphQL query
		const query = `
      query coreFetchCompanyFinancialDashboard($id: ID!, $config: CreatorDashboardChartConfigInput!) {
        company(id: $id) {
          id
          creatorDashboardCharts(config: $config) {
            ${fields}
          }
        }
      }
    `

		// Build config object
		const config: Record<string, unknown> = {
			from,
			to,
			interval: params.interval || 'monthly',
			currency: params.currency || 'usd',
			timeZone: params.time_zone || 'Etc/UTC',
		}

		// Add optional parameters
		if (params.access_pass_ids) {
			config.accessPassIds = params.access_pass_ids
		}
		if (params.week_mode !== undefined) {
			config.weekMode = params.week_mode
		}

		// Execute GraphQL query
		const result = await this.client.graphql<FinancialDashboardResponse>({
			operationName: 'coreFetchCompanyFinancialDashboard',
			query,
			variables: {
				id: this.companyId,
				config,
			},
		})

		// Format and return response
		return this.formatResponse(
			result.company.creatorDashboardCharts,
			categories,
		)
	}

	/**
	 * Format raw GraphQL response into structured financial data
	 */
	private formatResponse(
		charts: RawFinancialCharts,
		categories: FinancialCategory[],
	): FinancialData {
		const response: FinancialData = {
			summary: {},
			time_series: {},
			details_available: true,
		}

		// Revenue metrics
		if (categories.includes('revenue')) {
			response.summary.revenue = {
				gross_volume: charts.grossVolume?.sum || 0,
				net_volume: charts.netVolume?.sum || 0,
				mrr: charts.mrr?.last || 0,
				arr: charts.arr?.last || 0,
				churned_revenue: charts.churnedRevenue?.sum || 0,
			}
			response.time_series.revenue = {
				gross_volume: charts.grossVolume?.data,
				net_volume: charts.netVolume?.data,
				mrr: charts.mrr?.data,
				arr: charts.arr?.data,
				churned_revenue: charts.churnedRevenue?.data,
			}
		}

		// Fee metrics
		if (categories.includes('fees')) {
			const paymentProcessing = charts.paymentProcessingFees?.sum || 0
			const whopProcessing = charts.whopProcessingFees?.sum || 0
			const affiliate = charts.affiliateFees?.sum || 0
			const dispute = charts.disputeFees?.sum || 0

			response.summary.fees = {
				payment_processing: paymentProcessing,
				whop_processing: whopProcessing,
				affiliate: affiliate,
				dispute: dispute,
				tax_withheld: charts.salesTaxWithheld?.sum || 0,
				refunded: charts.totalRefunded?.sum || 0,
				total_fees: paymentProcessing + whopProcessing + affiliate + dispute,
			}
			response.time_series.fees = {
				payment_processing: charts.paymentProcessingFees?.data,
				whop_processing: charts.whopProcessingFees?.data,
				affiliate: charts.affiliateFees?.data,
				dispute: charts.disputeFees?.data,
				tax_withheld: charts.salesTaxWithheld?.data,
				refunded: charts.totalRefunded?.data,
			}
		}

		// User metrics
		if (categories.includes('users')) {
			response.summary.users = {
				arppu: charts.averageRevenuePerPayingUser?.last || 0,
				arps: charts.averageRevenuePerSubscription?.last || 0,
				churn_rate: charts.churnRate?.avg || 0,
				trial_conversion_rate: charts.trialConversionRate?.avg || 0,
			}
			response.time_series.users = {
				arppu: charts.averageRevenuePerPayingUser?.data,
				arps: charts.averageRevenuePerSubscription?.data,
				churn_rate: charts.churnRate?.data,
				trial_conversion_rate: charts.trialConversionRate?.data,
			}
		}

		// Growth metrics
		if (categories.includes('growth')) {
			response.summary.growth = {
				new_users: charts.newUsers?.sum || 0,
				users_growth: charts.usersGrowth?.last || 0,
			}
			response.time_series.growth = {
				new_users: charts.newUsers?.data,
				users_growth: charts.usersGrowth?.data,
			}
		}

		// Payment metrics
		if (categories.includes('payments')) {
			response.summary.payments = {
				successful: charts.successfulPayments?.sum || 0,
				by_status: charts.paymentsByStatus || [],
			}
			response.time_series.payments = {
				successful: charts.successfulPayments?.data,
			}
		}

		// Traffic metrics
		if (categories.includes('traffic')) {
			response.summary.traffic = {
				page_visits: charts.pageVisits?.sum || 0,
			}
			response.time_series.traffic = {
				page_visits: charts.pageVisits?.data,
			}
		}

		// Affiliate metrics
		if (categories.includes('affiliates')) {
			response.summary.affiliates = {
				new_users_split: charts.newUsersSplit || [],
				revenue_split: charts.revenueSplit || [],
			}
		}

		// Top performers
		if (categories.includes('top_performers')) {
			response.summary.top_performers = {
				customers:
					charts.topCustomers?.slice(0, 10).map((c) => ({
						name: c.user.name || c.user.username,
						username: c.user.username,
						sales: c.sales,
					})) || [],
				affiliates:
					charts.topAffiliates?.slice(0, 10).map((a) => ({
						name: a.user.name || a.user.username,
						username: a.user.username,
						sales: a.sales,
					})) || [],
			}
		}

		return response
	}
}
