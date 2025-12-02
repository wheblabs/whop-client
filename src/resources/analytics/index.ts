import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	AnalyticsConfig,
	ChartResponse,
	TopAffiliate,
	TopCustomer,
} from './types'

/**
 * Helper to build config variables for chart queries
 */
function buildChartConfig(config?: AnalyticsConfig): Record<string, unknown> {
	return {
		timeRange: config?.timeRange || 'last_30_days',
		startDate: config?.startDate || null,
		endDate: config?.endDate || null,
		granularity: config?.granularity || 'day',
		accessPassId: config?.accessPassId || null,
		planId: config?.planId || null,
	}
}

/**
 * Analytics resource - Company performance metrics and statistics
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // Get MRR over the last 30 days
 * const mrr = await whop.analytics.mrr('biz_xxx', { timeRange: 'last_30_days' })
 * console.log(`Current MRR: $${mrr.last}`)
 *
 * // Get user growth
 * const growth = await whop.analytics.userGrowth('biz_xxx', { timeRange: 'last_90_days' })
 * ```
 */
export class Analytics {
	constructor(private readonly client: Whop) {}

	/**
	 * Helper method for generic chart queries
	 */
	private async fetchChart(
		companyId: string,
		chartName: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompany${chartName.charAt(0).toUpperCase() + chartName.slice(1)}($id: ID!, $config: CreatorDashboardChartConfigInput!) {
        company(id: $id) {
          creatorDashboardCharts(config: $config) {
            ${chartName} {
              last
              min
              max
              data {
                t
                v
              }
            }
          }
        }
      }
    `

		interface ChartQueryResponse {
			company: {
				creatorDashboardCharts: Record<string, ChartResponse>
			}
		}

		const response = await graphqlRequest<ChartQueryResponse>(
			`fetchCompany${chartName.charAt(0).toUpperCase() + chartName.slice(1)}`,
			{
				query,
				variables: {
					id: companyId,
					config: buildChartConfig(config),
				},
				operationName: `fetchCompany${chartName.charAt(0).toUpperCase() + chartName.slice(1)}`,
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		const chartData = response.company.creatorDashboardCharts[chartName]
		if (!chartData) {
			throw new Error(`Chart data for '${chartName}' not found`)
		}
		return chartData
	}

	/**
	 * Get Monthly Recurring Revenue (MRR)
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns MRR chart data
	 *
	 * @example
	 * ```typescript
	 * const mrr = await whop.analytics.mrr('biz_xxx', { timeRange: 'last_30_days' })
	 * console.log(`Current MRR: $${mrr.last}`)
	 * console.log(`Peak MRR: $${mrr.max}`)
	 * ```
	 */
	async mrr(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'mrr', config)
	}

	/**
	 * Get Annual Recurring Revenue (ARR)
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns ARR chart data
	 */
	async arr(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'arr', config)
	}

	/**
	 * Get churn rate
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Churn rate chart data
	 */
	async churnRate(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'churnRate', config)
	}

	/**
	 * Get gross volume (total revenue before fees)
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Gross volume chart data
	 */
	async grossVolume(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'grossVolume', config)
	}

	/**
	 * Get net volume (revenue after fees)
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Net volume chart data
	 */
	async netVolume(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'netVolume', config)
	}

	/**
	 * Get new users count
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns New users chart data
	 */
	async newUsers(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'newUsers', config)
	}

	/**
	 * Get user growth
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns User growth chart data
	 */
	async userGrowth(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'userGrowth', config)
	}

	/**
	 * Get page visits
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Page visits chart data
	 */
	async pageVisits(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'pageVisits', config)
	}

	/**
	 * Get time spent
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Time spent chart data
	 */
	async timeSpent(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'timeSpent', config)
	}

	/**
	 * Get successful payments count
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Successful payments chart data
	 */
	async successfulPayments(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'successfulPayments', config)
	}

	/**
	 * Get trial conversion rate
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Trial conversion rate chart data
	 */
	async trialConversionRate(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'trialConversionRate', config)
	}

	/**
	 * Get authorization rate
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Auth rate chart data
	 */
	async authRate(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'authRate', config)
	}

	/**
	 * Get average revenue per paying user (ARPPU)
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns ARPPU chart data
	 */
	async avgRevenuePerUser(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'averageRevenuePerPayingUser', config)
	}

	/**
	 * Get average revenue per subscription
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Average revenue per subscription chart data
	 */
	async avgRevenuePerSubscription(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'averageRevenuePerSubscription', config)
	}

	/**
	 * Get churned revenue
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Churned revenue chart data
	 */
	async churnedRevenue(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'churnedRevenue', config)
	}

	/**
	 * Get net revenue after all fees
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Net revenue after all fees chart data
	 */
	async netRevenueAfterFees(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'netRevenueAfterAllFees', config)
	}

	/**
	 * Get total refunded
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Total refunded chart data
	 */
	async totalRefunded(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'totalRefunded', config)
	}

	/**
	 * Get payment processing fees
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Payment processing fees chart data
	 */
	async paymentProcessingFees(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'paymentProcessingFees', config)
	}

	/**
	 * Get Whop processing fees
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Whop processing fees chart data
	 */
	async whopProcessingFees(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'whopProcessingFees', config)
	}

	/**
	 * Get affiliate fees
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Affiliate fees chart data
	 */
	async affiliateFees(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'affiliateFees', config)
	}

	/**
	 * Get sales tax withheld
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Sales tax withheld chart data
	 */
	async salesTaxWithheld(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'salesTaxWithheld', config)
	}

	/**
	 * Get dispute fees
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Dispute fees chart data
	 */
	async disputeFees(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'disputeFees', config)
	}

	/**
	 * Get disputes count
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns Disputes count chart data
	 */
	async disputesCount(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<ChartResponse> {
		return this.fetchChart(companyId, 'disputesCount', config)
	}

	/**
	 * Get top affiliates
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns List of top affiliates
	 */
	async topAffiliates(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<TopAffiliate[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyTopAffiliates($id: ID!, $config: CreatorDashboardChartConfigInput!) {
        company(id: $id) {
          creatorDashboardCharts(config: $config) {
            topAffiliates {
              id
              username
              profilePic
              totalReferrals
              totalEarnings
              mrr
            }
          }
        }
      }
    `

		interface TopAffiliatesResponse {
			company: {
				creatorDashboardCharts: {
					topAffiliates: TopAffiliate[]
				}
			}
		}

		const response = await graphqlRequest<TopAffiliatesResponse>(
			'fetchCompanyTopAffiliates',
			{
				query,
				variables: {
					id: companyId,
					config: buildChartConfig(config),
				},
				operationName: 'fetchCompanyTopAffiliates',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.creatorDashboardCharts.topAffiliates
	}

	/**
	 * Get top customers
	 *
	 * @param companyId - Company ID
	 * @param config - Analytics configuration
	 * @returns List of top customers
	 */
	async topCustomers(
		companyId: string,
		config?: AnalyticsConfig,
	): Promise<TopCustomer[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyTopCustomers($id: ID!, $config: CreatorDashboardChartConfigInput!) {
        company(id: $id) {
          creatorDashboardCharts(config: $config) {
            topCustomers {
              id
              username
              profilePic
              totalSpent
              membershipCount
              firstPurchase
            }
          }
        }
      }
    `

		interface TopCustomersResponse {
			company: {
				creatorDashboardCharts: {
					topCustomers: TopCustomer[]
				}
			}
		}

		const response = await graphqlRequest<TopCustomersResponse>(
			'fetchCompanyTopCustomers',
			{
				query,
				variables: {
					id: companyId,
					config: buildChartConfig(config),
				},
				operationName: 'fetchCompanyTopCustomers',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.creatorDashboardCharts.topCustomers
	}
}

export * from './types'
