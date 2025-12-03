import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Whop } from '../client'

// Mock fetch globally - using any to simplify test setup
const mockFetch = mock(
	(): Promise<any> =>
		Promise.resolve({ ok: true, json: () => ({ data: {} }), text: () => '' }),
)
globalThis.fetch = mockFetch as any

describe('Users', () => {
	let whop: Whop

	beforeEach(() => {
		mockFetch.mockClear()
		whop = Whop.fromTokens({
			accessToken: 'test-access-token',
			csrfToken: 'test-csrf-token',
			refreshToken: 'test-refresh-token',
		})
	})

	describe('get', () => {
		it('should get a user by ID', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								user: {
									id: 'user_123',
									email: 'test@example.com',
									name: 'Test User',
									username: 'testuser',
									profilePicUrl: 'https://example.com/pic.jpg',
									bio: 'Hello world',
									isVerified: true,
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.users.get('user_123')

			expect(result.id).toBe('user_123')
			expect(result.email).toBe('test@example.com')
			expect(result.name).toBe('Test User')
			expect(result.username).toBe('testuser')
			expect(result.isVerified).toBe(true)
		})

		it('should include social account info', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								user: {
									id: 'user_123',
									discord: { username: 'testuser#1234', id: '123456789' },
									twitterAccount: { username: 'testuser' },
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.users.get('user_123')

			expect(result.discord?.username).toBe('testuser#1234')
			expect(result.twitterAccount?.username).toBe('testuser')
		})
	})

	describe('getByUsername', () => {
		it('should get a user by username', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								userByUsername: {
									id: 'user_123',
									name: 'Test User',
									username: 'testuser',
									profilePicUrl: 'https://example.com/pic.jpg',
									bio: 'Hello world',
									isVerified: false,
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.users.getByUsername('testuser')

			expect(result.id).toBe('user_123')
			expect(result.username).toBe('testuser')
		})

		it('should strip @ from username', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								userByUsername: {
									id: 'user_123',
									username: 'testuser',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.users.getByUsername('@testuser')

			expect(result.username).toBe('testuser')
		})
	})

	describe('exists', () => {
		it('should return true if username exists', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								userByUsername: {
									id: 'user_123',
									username: 'testuser',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.users.exists('testuser')

			expect(result).toBe(true)
		})

		it('should return false if username does not exist', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: false,
					status: 404,
					json: () => Promise.resolve({ errors: [{ message: 'Not found' }] }),
					text: () => Promise.resolve('Not found'),
				}),
			)

			const result = await whop.users.exists('nonexistent')

			expect(result).toBe(false)
		})
	})
})
