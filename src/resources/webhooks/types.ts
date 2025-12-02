/**
 * Webhook object
 */
export interface Webhook {
	id: string
	enabled: boolean
	events: string[]
	url: string
	apiVersion: string
	webhookSecret: string
	createdAt: string
	childResourceEvents: boolean
}

/**
 * Options for listing webhooks
 */
export interface ListWebhooksOptions {
	/** Company ID */
	companyId: string
	/** Number of webhooks to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
}

/**
 * Paginated webhooks response
 */
export interface WebhooksConnection {
	webhooks: Webhook[]
	totalCount: number
}

/**
 * Input for creating a webhook
 */
export interface CreateWebhookInput {
	/** Company ID to create the webhook for */
	companyId: string
	/** Webhook endpoint URL */
	url: string
	/** Events to subscribe to */
	events: string[]
	/** Whether the webhook is enabled */
	enabled?: boolean
	/** Whether to receive events from child resources */
	childResourceEvents?: boolean
}

/**
 * Input for updating a webhook
 */
export interface UpdateWebhookInput {
	/** Webhook ID */
	id: string
	/** Webhook endpoint URL */
	url?: string
	/** Events to subscribe to */
	events?: string[]
	/** Whether the webhook is enabled */
	enabled?: boolean
	/** Whether to receive events from child resources */
	childResourceEvents?: boolean
}

/**
 * Webhook log entry
 */
export interface WebhookLog {
	requestBody: string
	resourceId: string
	responseBody: string
	responseCode: number
	sentAt: string
	totalTime: number
}

/**
 * Options for fetching webhook logs
 */
export interface GetWebhookLogsOptions {
	/** Company ID */
	companyId: string
	/** Webhook ID */
	webhookId: string
	/** Number of logs to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
}

/**
 * Paginated webhook logs response
 */
export interface WebhookLogsConnection {
	logs: WebhookLog[]
	pageInfo: {
		hasNextPage: boolean
		endCursor: string | null
	}
}

/**
 * Input for testing a webhook
 */
export interface TestWebhookInput {
	/** Webhook ID */
	webhookId: string
	/** Event type to test */
	event: string
}

/**
 * Webhook test result
 */
export interface WebhookTestResult {
	body: string
	status: number
	success: boolean
}

/**
 * Webhook event type
 */
export type WebhookEvent = string
