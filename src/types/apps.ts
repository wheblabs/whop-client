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
	accessPass: AccessPass | null
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

export interface AccessPass {
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

export interface Experience {
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
