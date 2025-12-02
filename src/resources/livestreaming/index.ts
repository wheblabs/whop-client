import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	CreateTokenInput,
	ListFeedsOptions,
	LiveKitToken,
	LivestreamFeed,
	ParticipantPermissions,
	StreamKey,
	UpdateParticipantPermissionsInput,
} from './types'

/**
 * Feeds sub-resource
 */
export class LivestreamFeeds {
	constructor(private readonly client: Whop) {}

	/**
	 * List livestream feeds for an experience
	 */
	async list(options: ListFeedsOptions): Promise<LivestreamFeed[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchLivestreamFeeds($experienceId: ID!, $first: Int, $status: String) {
        experience(id: $experienceId) {
          livestreamFeeds(first: $first, status: $status) {
            nodes {
              id
              title
              status
              viewerCount
              startedAt
              endedAt
              recording {
                id
                url
                duration
              }
            }
          }
        }
      }
    `

		interface FetchFeedsResponse {
			experience: {
				livestreamFeeds: { nodes: LivestreamFeed[] }
			}
		}

		const response = await graphqlRequest<FetchFeedsResponse>(
			'fetchLivestreamFeeds',
			{
				query,
				variables: {
					experienceId: options.experienceId,
					first: options.first || 20,
					status: options.status || null,
				},
				operationName: 'fetchLivestreamFeeds',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.experience.livestreamFeeds.nodes
	}
}

/**
 * Recordings sub-resource
 */
export class LivestreamRecordings {
	constructor(private readonly client: Whop) {}

	/**
	 * Delete a recording
	 */
	async delete(recordingId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation deleteLivestreamRecording($id: ID!) {
        deleteLivestreamRecording(input: { id: $id })
      }
    `

		interface DeleteRecordingResponse {
			deleteLivestreamRecording: boolean
		}

		const response = await graphqlRequest<DeleteRecordingResponse>(
			'deleteLivestreamRecording',
			{
				query: mutation,
				variables: { id: recordingId },
				operationName: 'deleteLivestreamRecording',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deleteLivestreamRecording
	}
}

/**
 * Participants sub-resource
 */
export class LivestreamParticipants {
	constructor(private readonly client: Whop) {}

	/**
	 * Mute a participant
	 */
	async mute(roomName: string, participantIdentity: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation muteLivestreamParticipant($input: MuteParticipantInput!) {
        muteLivestreamParticipant(input: $input)
      }
    `

		interface MuteResponse {
			muteLivestreamParticipant: boolean
		}

		const response = await graphqlRequest<MuteResponse>(
			'muteLivestreamParticipant',
			{
				query: mutation,
				variables: { input: { roomName, participantIdentity } },
				operationName: 'muteLivestreamParticipant',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.muteLivestreamParticipant
	}

	/**
	 * Update participant permissions
	 */
	async updatePermissions(
		input: UpdateParticipantPermissionsInput,
	): Promise<ParticipantPermissions> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updateParticipantPermissions($input: UpdateParticipantPermissionsInput!) {
        updateLivestreamParticipantPermissions(input: $input) {
          canPublish
          canSubscribe
          canPublishData
        }
      }
    `

		interface UpdatePermissionsResponse {
			updateLivestreamParticipantPermissions: ParticipantPermissions
		}

		const response = await graphqlRequest<UpdatePermissionsResponse>(
			'updateParticipantPermissions',
			{
				query: mutation,
				variables: { input },
				operationName: 'updateParticipantPermissions',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateLivestreamParticipantPermissions
	}
}

/**
 * Livestreaming resource - Manage livestreams with LiveKit integration
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // Create a token to join a livestream
 * const { token, wsUrl } = await whop.livestreaming.createToken({
 *   experienceId: 'exp_xxx',
 *   participantType: 'host'
 * })
 *
 * // Get stream key for RTMP
 * const streamKey = await whop.livestreaming.getStreamKey('exp_xxx')
 *
 * // End a livestream
 * await whop.livestreaming.end('livestream_xxx')
 * ```
 */
export class Livestreaming {
	public readonly feeds: LivestreamFeeds
	public readonly recordings: LivestreamRecordings
	public readonly participants: LivestreamParticipants

	constructor(private readonly client: Whop) {
		this.feeds = new LivestreamFeeds(client)
		this.recordings = new LivestreamRecordings(client)
		this.participants = new LivestreamParticipants(client)
	}

	/**
	 * Create a LiveKit token to join a livestream
	 *
	 * @param input - Token creation options
	 * @returns Token info with WebSocket URL
	 */
	async createToken(input: CreateTokenInput): Promise<LiveKitToken> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation createLiveKitToken($input: CreateLiveKitTokenInput!) {
        createLiveKitToken(input: $input) {
          token
          room
          wsUrl
        }
      }
    `

		interface CreateTokenResponse {
			createLiveKitToken: LiveKitToken
		}

		const response = await graphqlRequest<CreateTokenResponse>(
			'createLiveKitToken',
			{
				query: mutation,
				variables: { input },
				operationName: 'createLiveKitToken',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createLiveKitToken
	}

	/**
	 * Generate a stream key for RTMP streaming
	 *
	 * @param experienceId - Experience ID
	 * @returns New stream key info
	 */
	async generateStreamKey(experienceId: string): Promise<StreamKey> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation generateStreamKey($experienceId: ID!) {
        generateStreamKey(input: { experienceId: $experienceId }) {
          key
          rtmpUrl
          rtmpsUrl
        }
      }
    `

		interface GenerateKeyResponse {
			generateStreamKey: StreamKey
		}

		const response = await graphqlRequest<GenerateKeyResponse>(
			'generateStreamKey',
			{
				query: mutation,
				variables: { experienceId },
				operationName: 'generateStreamKey',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.generateStreamKey
	}

	/**
	 * Get the current stream key for an experience
	 *
	 * @param experienceId - Experience ID
	 * @returns Stream key info
	 */
	async getStreamKey(experienceId: string): Promise<StreamKey | null> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query getStreamKey($experienceId: ID!) {
        experience(id: $experienceId) {
          streamKey {
            key
            rtmpUrl
            rtmpsUrl
          }
        }
      }
    `

		interface GetKeyResponse {
			experience: {
				streamKey: StreamKey | null
			}
		}

		const response = await graphqlRequest<GetKeyResponse>(
			'getStreamKey',
			{
				query,
				variables: { experienceId },
				operationName: 'getStreamKey',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.experience.streamKey
	}

	/**
	 * End a livestream
	 *
	 * @param livestreamId - Livestream ID
	 * @returns True if ended
	 */
	async end(livestreamId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation endLivestream($id: ID!) {
        endLivestream(input: { id: $id })
      }
    `

		interface EndLivestreamResponse {
			endLivestream: boolean
		}

		const response = await graphqlRequest<EndLivestreamResponse>(
			'endLivestream',
			{
				query: mutation,
				variables: { id: livestreamId },
				operationName: 'endLivestream',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.endLivestream
	}
}

export * from './types'
