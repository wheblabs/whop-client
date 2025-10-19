/**
 * App credentials and configuration
 * Retrieved via company.app() query for owned apps
 */

export interface AppCredentials {
	id: string
	name: string
	description: string | null
	baseUrl: string | null
	baseDevUrl: string | null
	domainId: string
	status: string
	verified: boolean
	usingDefaultIcon: boolean
	icon: AppCredentialIcon | null
	experiencePath: string
	discoverPath: string | null
	dashboardPath: string | null
	apiKey: ApiKey
	agentUsers: AgentUser[]
	requestedPermissions: RequestedPermission[]
	stats: AppCredentialStats
}

export interface AppCredentialIcon {
	source: {
		url: string
	}
}

export interface ApiKey {
	id: string
	token: string
	createdAt: number
}

export interface RequestedPermission {
	permissionAction: {
		action: string
		name: string
	}
	isRequired: boolean
	justification: string | null
}

export interface AppCredentialStats {
	dau: number
	mau: number
	timeSpentLast24Hours: number
	wau: number
}

export interface AgentUser {
	id: string
	name: string
	username: string
}
