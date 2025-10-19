// Response from parseRSCResponse for login
export interface OTPResponse {
	twoFactor: {
		mode: 'email'
		ticket: string
		info: string
	}
}

// Or could be an error
export interface RSCError {
	error: string
}

// The tokens we'll eventually get from verify
export interface AuthTokens {
	accessToken: string
	csrfToken: string
	refreshToken: string
	uidToken?: string
	ssk?: string
	userId?: string
}
