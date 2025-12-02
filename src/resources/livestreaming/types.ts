/**
 * Participant type in livestream
 */
export type ParticipantType = 'host' | 'viewer' | 'co_host'

/**
 * Livestream status
 */
export type LivestreamStatus = 'idle' | 'live' | 'ended'

/**
 * Input for creating a LiveKit token
 */
export interface CreateTokenInput {
	/** Experience ID */
	experienceId: string
	/** Participant type */
	participantType?: ParticipantType
	/** Room name (auto-generated if not provided) */
	roomName?: string
	/** Whether participant can publish video */
	canPublish?: boolean
	/** Whether participant can subscribe to others */
	canSubscribe?: boolean
	/** Whether participant can publish data */
	canPublishData?: boolean
}

/**
 * LiveKit token response
 */
export interface LiveKitToken {
	token: string
	room: string
	wsUrl: string
}

/**
 * Stream key info
 */
export interface StreamKey {
	key: string
	rtmpUrl: string
	rtmpsUrl: string
}

/**
 * Livestream feed
 */
export interface LivestreamFeed {
	id: string
	title?: string
	status: LivestreamStatus
	viewerCount: number
	startedAt?: string
	endedAt?: string
	recording?: {
		id: string
		url: string
		duration: number
	}
}

/**
 * Options for listing livestream feeds
 */
export interface ListFeedsOptions {
	/** Experience ID */
	experienceId: string
	/** Number of feeds to fetch */
	first?: number
	/** Filter by status */
	status?: LivestreamStatus
}

/**
 * Participant permissions
 */
export interface ParticipantPermissions {
	canPublish?: boolean
	canSubscribe?: boolean
	canPublishData?: boolean
}

/**
 * Input for updating participant permissions
 */
export interface UpdateParticipantPermissionsInput {
	/** Room name */
	roomName: string
	/** Participant identity */
	participantIdentity: string
	/** New permissions */
	permissions: ParticipantPermissions
}
