/**
 * Types for creating apps
 */

import type { AgentUser, ApiKey } from './app-credentials'

export interface CreateAppInput {
	/** App name */
	name: string
	/** Company ID to create the app under */
	companyId: string
}

export interface CreatedApp {
	id: string
	name: string
	description: string | null
	baseUrl: string | null
	baseDevUrl: string | null
	status: string
	apiKeys: ApiKey[]
	agentUsers: AgentUser[]
	company: {
		id: string
	}
	accessPass: {
		id: string
	}
}
