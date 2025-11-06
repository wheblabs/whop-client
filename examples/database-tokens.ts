/**
 * Example: Using Whop client with database-backed token storage
 *
 * This demonstrates how to use the onTokenRefresh callback to persist
 * tokens to a database instead of a local file. Perfect for server
 * environments and multi-user applications.
 */

import { Whop } from '../src'
import type { AuthTokens } from '../src/types'

// Simulated database (replace with your actual database)
const db = {
	tokens: new Map<string, AuthTokens>(),

	async getWhopTokens(userId: string): Promise<AuthTokens | undefined> {
		console.log(`📖 Loading tokens for user ${userId} from database...`)
		return this.tokens.get(userId)
	},

	async saveWhopTokens(userId: string, tokens: AuthTokens): Promise<void> {
		console.log(`💾 Saving refreshed tokens for user ${userId} to database...`)
		this.tokens.set(userId, tokens)
		console.log(`✅ Tokens saved successfully`)
	},
}

async function main() {
	const userId = 'user_123'

	// Example 1: Using fromTokens with callback
	console.log('\n=== Example 1: fromTokens with onTokenRefresh ===')

	// Simulate loading tokens from database
	const tokens: AuthTokens = {
		accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
		csrfToken: 'csrf_token_123',
		refreshToken: 'refresh_token_456',
	}

	await db.saveWhopTokens(userId, tokens)

	const loadedTokens = await db.getWhopTokens(userId)
	if (!loadedTokens) {
		throw new Error('No tokens found')
	}

	const whop = Whop.fromTokens(loadedTokens, {
		onTokenRefresh: async (newTokens) => {
			// This will be called automatically whenever tokens are refreshed
			await db.saveWhopTokens(userId, newTokens)
		},
	})

	console.log('✓ Client initialized with database tokens')
	console.log(`✓ Authenticated: ${whop.isAuthenticated()}`)

	// Example 2: Using constructor with callback
	console.log('\n=== Example 2: Constructor with onTokenRefresh ===')

	const whop2 = new Whop({
		autoLoad: false, // Don't load from .whop-session.json
		onTokenRefresh: async (newTokens) => {
			console.log('🔄 Tokens refreshed!')
			await db.saveWhopTokens(userId, newTokens)
		},
	})

	whop2.setTokens(tokens)
	console.log('✓ Client initialized with manual tokens')

	// Example 3: Simulating a token refresh
	console.log('\n=== Example 3: Simulating Token Refresh ===')

	const refreshedTokens: AuthTokens = {
		accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...',
		csrfToken: 'csrf_token_new',
		refreshToken: 'refresh_token_new',
	}

	// This is called internally by the library when tokens are refreshed
	// You would never call this directly, but we're demonstrating what happens
	console.log('Simulating token refresh...')
	whop._updateTokens(refreshedTokens)

	// Give the async callback time to complete
	await new Promise((resolve) => setTimeout(resolve, 100))

	console.log('\n✅ All examples completed successfully!')
}

main().catch(console.error)
