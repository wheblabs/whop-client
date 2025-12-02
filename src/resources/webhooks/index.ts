import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	CreateWebhookInput,
	GetWebhookLogsOptions,
	ListWebhooksOptions,
	TestWebhookInput,
	UpdateWebhookInput,
	Webhook,
	WebhookEvent,
	WebhookLogsConnection,
	WebhooksConnection,
	WebhookTestResult,
} from './types'

// GraphQL Fragment
const WEBHOOK_FRAGMENT = `
  fragment CompanyWebhook on Webhook {
    id
    enabled
    events
    url
    apiVersion
    webhookSecret
    createdAt
    childResourceEvents
  }
`

/**
 * Webhooks resource - Manage webhooks for event-driven integrations
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List webhooks
 * const { webhooks } = await whop.webhooks.list({ companyId: 'biz_xxx' })
 *
 * // Create a webhook
 * const webhook = await whop.webhooks.create({
 *   companyId: 'biz_xxx',
 *   url: 'https://example.com/webhook',
 *   events: ['membership.created', 'membership.updated']
 * })
 *
 * // Test a webhook
 * const result = await whop.webhooks.test({
 *   webhookId: webhook.id,
 *   event: 'membership.created'
 * })
 * ```
 */
export class Webhooks {
	constructor(private readonly client: Whop) {}

	/**
	 * List webhooks for a company
	 *
	 * @param options - Filtering and pagination options
	 * @returns Paginated webhooks list
	 *
	 * @example
	 * ```typescript
	 * const { webhooks, totalCount } = await whop.webhooks.list({
	 *   companyId: 'biz_xxx'
	 * })
	 *
	 * for (const webhook of webhooks) {
	 *   console.log(`${webhook.url} - ${webhook.enabled ? 'Active' : 'Inactive'}`)
	 * }
	 * ```
	 */
	async list(options: ListWebhooksOptions): Promise<WebhooksConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyWebhooks($id: ID!, $first: Int, $after: String, $tableFilters: JSON!) {
        company(id: $id) {
          creatorDashboardTable(tableFilters: $tableFilters) {
            webhooks(first: $first, after: $after) {
              nodes {
                ...CompanyWebhook
              }
              totalCount
            }
          }
        }
      }
      ${WEBHOOK_FRAGMENT}
    `

		interface FetchWebhooksResponse {
			company: {
				creatorDashboardTable: {
					webhooks: {
						nodes: Webhook[]
						totalCount: number
					}
				}
			}
		}

		const response = await graphqlRequest<FetchWebhooksResponse>(
			'fetchCompanyWebhooks',
			{
				query,
				variables: {
					id: options.companyId,
					first: options.first || 50,
					after: options.after || null,
					tableFilters: {},
				},
				operationName: 'fetchCompanyWebhooks',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			webhooks: response.company.creatorDashboardTable.webhooks.nodes,
			totalCount: response.company.creatorDashboardTable.webhooks.totalCount,
		}
	}

	/**
	 * Get a specific webhook
	 *
	 * @param companyId - Company ID
	 * @param webhookId - Webhook ID
	 * @returns Webhook details
	 *
	 * @example
	 * ```typescript
	 * const webhook = await whop.webhooks.get('biz_xxx', 'webhook_xxx')
	 * console.log(`Secret: ${webhook.webhookSecret}`)
	 * ```
	 */
	async get(companyId: string, webhookId: string): Promise<Webhook> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query coreFetchWebhook($companyId: ID!, $webhookId: ID!) {
        company(id: $companyId) {
          id
          webhook(id: $webhookId) {
            ...CompanyWebhook
          }
        }
      }
      ${WEBHOOK_FRAGMENT}
    `

		interface FetchWebhookResponse {
			company: {
				webhook: Webhook
			}
		}

		const response = await graphqlRequest<FetchWebhookResponse>(
			'coreFetchWebhook',
			{
				query,
				variables: { companyId, webhookId },
				operationName: 'coreFetchWebhook',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.webhook
	}

	/**
	 * Create a new webhook
	 *
	 * @param input - Webhook creation input
	 * @returns Created webhook (partial response)
	 *
	 * @example
	 * ```typescript
	 * const webhook = await whop.webhooks.create({
	 *   companyId: 'biz_xxx',
	 *   url: 'https://example.com/webhook',
	 *   events: ['membership.created', 'payment.completed'],
	 *   enabled: true
	 * })
	 * ```
	 */
	async create(
		input: CreateWebhookInput,
	): Promise<{ enabled: boolean; childResourceEvents: boolean }> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation createWebhook($input: CreateWebhookInput!) {
        createWebhook(input: $input) {
          enabled
          childResourceEvents
        }
      }
    `

		interface CreateWebhookResponse {
			createWebhook: { enabled: boolean; childResourceEvents: boolean }
		}

		const response = await graphqlRequest<CreateWebhookResponse>(
			'createWebhook',
			{ query: mutation, variables: { input }, operationName: 'createWebhook' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createWebhook
	}

	/**
	 * Update a webhook
	 *
	 * @param webhookId - Webhook ID
	 * @param input - Update input
	 * @returns Updated webhook (partial response)
	 *
	 * @example
	 * ```typescript
	 * await whop.webhooks.update('webhook_xxx', {
	 *   enabled: false,
	 *   events: ['membership.created']
	 * })
	 * ```
	 */
	async update(
		webhookId: string,
		input: Omit<UpdateWebhookInput, 'id'>,
	): Promise<{ enabled: boolean; childResourceEvents: boolean }> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updateWebhook($input: UpdateWebhookInput!) {
        updateWebhook(input: $input) {
          enabled
          childResourceEvents
        }
      }
    `

		interface UpdateWebhookResponse {
			updateWebhook: { enabled: boolean; childResourceEvents: boolean }
		}

		const response = await graphqlRequest<UpdateWebhookResponse>(
			'updateWebhook',
			{
				query: mutation,
				variables: { input: { ...input, id: webhookId } },
				operationName: 'updateWebhook',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateWebhook
	}

	/**
	 * Delete a webhook
	 *
	 * @param webhookId - Webhook ID
	 * @returns True if deleted
	 *
	 * @example
	 * ```typescript
	 * await whop.webhooks.delete('webhook_xxx')
	 * ```
	 */
	async delete(webhookId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation deleteWebhook($id: ID!) {
        deleteWebhook(input: { id: $id })
      }
    `

		interface DeleteWebhookResponse {
			deleteWebhook: boolean
		}

		const response = await graphqlRequest<DeleteWebhookResponse>(
			'deleteWebhook',
			{
				query: mutation,
				variables: { id: webhookId },
				operationName: 'deleteWebhook',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deleteWebhook
	}

	/**
	 * Test a webhook by sending a sample event
	 *
	 * @param input - Test input
	 * @returns Test result with response body and status
	 *
	 * @example
	 * ```typescript
	 * const result = await whop.webhooks.test({
	 *   webhookId: 'webhook_xxx',
	 *   event: 'membership.created'
	 * })
	 *
	 * if (result.success) {
	 *   console.log('Webhook is working!')
	 * } else {
	 *   console.log(`Failed with status ${result.status}: ${result.body}`)
	 * }
	 * ```
	 */
	async test(input: TestWebhookInput): Promise<WebhookTestResult> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation testWebhookV2($input: TestWebhookV2Input!) {
        testWebhookV2(input: $input) {
          body
          status
          success
        }
      }
    `

		interface TestWebhookResponse {
			testWebhookV2: WebhookTestResult
		}

		const response = await graphqlRequest<TestWebhookResponse>(
			'testWebhookV2',
			{ query: mutation, variables: { input }, operationName: 'testWebhookV2' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.testWebhookV2
	}

	/**
	 * List all available webhook events
	 *
	 * @returns Array of event names
	 *
	 * @example
	 * ```typescript
	 * const events = await whop.webhooks.listEvents()
	 * console.log('Available events:', events)
	 * ```
	 */
	async listEvents(): Promise<WebhookEvent[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query coreFetchWebhookEvents {
        webhookEvents
      }
    `

		interface FetchEventsResponse {
			webhookEvents: string[]
		}

		const response = await graphqlRequest<FetchEventsResponse>(
			'coreFetchWebhookEvents',
			{ query, operationName: 'coreFetchWebhookEvents' },
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.webhookEvents
	}

	/**
	 * Get webhook delivery logs
	 *
	 * @param options - Log query options
	 * @returns Paginated webhook logs
	 *
	 * @example
	 * ```typescript
	 * const { logs } = await whop.webhooks.logs({
	 *   companyId: 'biz_xxx',
	 *   webhookId: 'webhook_xxx',
	 *   first: 20
	 * })
	 *
	 * for (const log of logs) {
	 *   console.log(`${log.sentAt} - Status: ${log.responseCode}`)
	 * }
	 * ```
	 */
	async logs(options: GetWebhookLogsOptions): Promise<WebhookLogsConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query coreFetchWebhookLogs($companyId: ID!, $webhookId: ID!, $first: Int, $after: String) {
        company(id: $companyId) {
          id
          webhook(id: $webhookId) {
            id
            logs(first: $first, after: $after) {
              nodes {
                requestBody
                resourceId
                responseBody
                responseCode
                sentAt
                totalTime
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    `

		interface FetchLogsResponse {
			company: {
				webhook: {
					logs: {
						nodes: WebhookLogsConnection['logs']
						pageInfo: WebhookLogsConnection['pageInfo']
					}
				}
			}
		}

		const response = await graphqlRequest<FetchLogsResponse>(
			'coreFetchWebhookLogs',
			{
				query,
				variables: {
					companyId: options.companyId,
					webhookId: options.webhookId,
					first: options.first || 50,
					after: options.after || null,
				},
				operationName: 'coreFetchWebhookLogs',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			logs: response.company.webhook.logs.nodes,
			pageInfo: response.company.webhook.logs.pageInfo,
		}
	}
}

export * from './types'
