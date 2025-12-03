import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Whop } from '../client'

// Mock fetch globally - using any to simplify test setup
const mockFetch = mock(
	(): Promise<any> =>
		Promise.resolve({ ok: true, json: () => ({ data: {} }), text: () => '' }),
)
globalThis.fetch = mockFetch as any

describe('Members', () => {
	let whop: Whop

	beforeEach(() => {
		mockFetch.mockClear()
		whop = Whop.fromTokens({
			accessToken: 'test-access-token',
			csrfToken: 'test-csrf-token',
			refreshToken: 'test-refresh-token',
		})
	})

	describe('list', () => {
		it('should list members for a company', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									creatorDashboardTable: {
										companyMembers: {
											nodes: [
												{
													id: 'member_123',
													joinedAt: '2024-01-01',
													user: {
														id: 'user_123',
														email: 'test@example.com',
														name: 'Test User',
														username: 'testuser',
													},
												},
											],
											totalCount: 1,
											pageInfo: { hasNextPage: false },
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.members.list('biz_123')

			expect(result.members).toHaveLength(1)
			expect(result.members[0]?.id).toBe('member_123')
			expect(result.members[0]?.user.email).toBe('test@example.com')
			expect(result.totalCount).toBe(1)
		})

		it('should accept search query', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									creatorDashboardTable: {
										companyMembers: {
											nodes: [],
											totalCount: 0,
											pageInfo: { hasNextPage: false },
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			await whop.members.list('biz_123', { query: 'test@example.com' })

			expect(mockFetch).toHaveBeenCalled()
		})
	})

	describe('get', () => {
		it('should get a specific member', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									companyMember: {
										id: 'member_123',
										joinedAt: '2024-01-01',
										user: {
											id: 'user_123',
											email: 'test@example.com',
											name: 'Test User',
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.members.get('biz_123', 'member_123')

			expect(result.id).toBe('member_123')
			expect(result.user.email).toBe('test@example.com')
		})
	})

	describe('ban', () => {
		it('should ban a member', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								banCompanyMember: {
									id: 'member_123',
									bannedAt: '2024-01-02',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.members.ban('biz_123', 'member_123')

			expect(result.id).toBe('member_123')
			expect(result.bannedAt).toBe('2024-01-02')
		})
	})

	describe('unban', () => {
		it('should unban a member', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								unbanCompanyMember: {
									id: 'member_123',
									bannedAt: null,
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.members.unban('biz_123', 'member_123')

			expect(result.id).toBe('member_123')
			expect(result.bannedAt).toBeNull()
		})
	})

	describe('search', () => {
		it('should search members by query', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									creatorDashboardTable: {
										companyMembers: {
											nodes: [
												{
													id: 'member_123',
													user: { id: 'user_123', email: 'test@example.com' },
												},
											],
											totalCount: 1,
											pageInfo: { hasNextPage: false },
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.members.search('biz_123', 'test@example.com')

			expect(result).toHaveLength(1)
			expect(result[0]?.id).toBe('member_123')
		})
	})
})
