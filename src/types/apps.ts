/**
 * App detail types
 */

export interface AppDetails {
	id: string
	name: string
	description: string | null
	appStoreDescription: string | null
	internalIdentifier: string | null
	totalInstalls: number
	verified: boolean
	icon: AppIcon | null
	stats: AppDetailStats
	accessPass: AppAccessPass | null
	creator: Creator
}

export interface AppIcon {
	source: {
		url: string
	}
}

export interface AppDetailStats {
	mau: number
}

export interface AppAccessPass {
	id: string
	route: string
	title: string
	headline: string | null
	description: string | null
	shortenedDescription: string | null
	attachments: Attachment[]
	marketplaceCategory: MarketplaceCategory | null
}

export interface AttachmentsConnection {
	nodes: Attachment[]
}

export interface Attachment {
	id: string
	contentType: string
	analyzed: boolean
	source: {
		url: string
		doubleUrl: string | null
	}
	blurhash?: string // Only for Image/Video attachments
}

export interface MarketplaceCategory {
	route: string
}

export interface Creator {
	id: string
	name: string
	username: string
	roles: string[]
	profilePicture: ProfilePicture | null
}

export interface ProfilePicture {
	source: {
		url: string
	}
}

/**
 * Experience (app installation) types
 */

export interface AppInstallExperience {
	id: string
	name: string
	company: {
		id: string
	}
	accessPasses: ExperienceAccessPass[]
}

export interface ExperienceAccessPass {
	id: string
}

/**
 * Options for installing an app
 */
export interface InstallAppOptions {
	/**
	 * Whether to create an experience for this installation
	 * @default true
	 */
	shouldCreateExperience?: boolean

	/**
	 * Whether to add the experience to an access pass
	 * @default true
	 */
	shouldAddExperienceToAccessPass?: boolean

	/**
	 * Section ID to install the app in (optional)
	 */
	sectionId?: string | null

	/**
	 * Permissions policy for the app
	 * @default { statements: [] } (no specific permissions)
	 */
	permissions?: {
		statements: Array<{
			grant: boolean
			actions: string[]
			resources: string[]
		}>
	}
}

/**
 * Input for updating an app
 */
export interface UpdateAppInput {
	/** App description */
	description?: string
	/** Description for app store in-depth view */
	appStoreDescription?: string
	/** Base production URL */
	baseUrl?: string
	/** Base developer URL */
	baseDevUrl?: string
	/** Base preview URL */
	basePreviewUrl?: string
	/** Path for dashboard view */
	dashboardPath?: string
	/** Path for discover view */
	discoverPath?: string
	/** Path for hub view */
	experiencePath?: string
	/** Hub call-to-action text */
	hubCta?: string
	/** App name */
	name?: string
	/** Product page text */
	productPage?: string
	/** OAuth scopes array */
	requiredScopes?: string[]
	/** App status (live/unlisted/hidden) */
	status?: 'live' | 'unlisted' | 'hidden'
}

/**
 * Updated app details (full response from updateAppV2)
 */
export interface UpdatedApp {
	id: string
	name: string
	description: string | null
	domainId: string
	appStoreDescription: string | null
	baseUrl: string | null
	baseDevUrl: string | null
	basePreviewUrl: string | null
	experiencePath: string | null
	consumerViewUrlTemplate: string | null
	dashboardViewUrlTemplate: string | null
	discoverViewUrlTemplate: string | null
	status: 'live' | 'unlisted' | 'hidden'
	verified: boolean
	requiredScopes: string[]
	totalInstallsLast30Days: number
	count: number | null
	usingDefaultIcon: boolean
	icon: AppIcon | null
	company: {
		id: string
		title: string
	}
}
