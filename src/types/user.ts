/**
 * User profile picture srcset
 */
export interface ProfilePicSrcset {
	original: string
	double: string | null
	isVideo: boolean
}

/**
 * Current user information
 */
export interface CurrentUser {
	id: string
	email: string
	username: string
	name?: string | null
	profilePic16: ProfilePicSrcset
	profilePic48: ProfilePicSrcset
}
