import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type { AuditLogsConnection, ListAuditLogsOptions } from './types'

/**
 * Audit Logs resource - Track company activity for compliance and debugging
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List audit logs
 * const { logs } = await whop.auditLogs.list({ companyId: 'biz_xxx' })
 *
 * // Filter by action
 * const refunds = await whop.auditLogs.list({
 *   companyId: 'biz_xxx',
 *   action: 'refund'
 * })
 * ```
 */
export class AuditLogs {
	constructor(private readonly client: Whop) {}

	/**
	 * List audit logs for a company
	 *
	 * @param options - Filtering and pagination options
	 * @returns Paginated audit logs
	 */
	async list(options: ListAuditLogsOptions): Promise<AuditLogsConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyAuditLogs($id: ID!, $filters: JSON!, $first: Int, $after: String) {
        company(id: $id) {
          auditLogs(filters: $filters, first: $first, after: $after) {
            nodes {
              id
              action
              resource
              resourceId
              createdAt
              actor {
                id
                username
                profilePic
                role
              }
              metadata
              ipAddress
              userAgent
            }
            totalCount
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `

		const filters: Record<string, unknown> = {}
		if (options.action) filters.action = options.action
		if (options.resource) filters.resource = options.resource
		if (options.actorId) filters.actorId = options.actorId
		if (options.startDate) filters.startDate = options.startDate
		if (options.endDate) filters.endDate = options.endDate

		interface FetchLogsResponse {
			company: {
				auditLogs: {
					nodes: AuditLogsConnection['logs']
					totalCount: number
					pageInfo: AuditLogsConnection['pageInfo']
				}
			}
		}

		const response = await graphqlRequest<FetchLogsResponse>(
			'fetchCompanyAuditLogs',
			{
				query,
				variables: {
					id: options.companyId,
					first: options.first || 50,
					after: options.after || null,
					filters,
				},
				operationName: 'fetchCompanyAuditLogs',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			logs: response.company.auditLogs.nodes,
			totalCount: response.company.auditLogs.totalCount,
			pageInfo: response.company.auditLogs.pageInfo,
		}
	}
}

export * from './types'
