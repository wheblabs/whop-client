import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Whop } from '../client'

// Mock fetch globally - using any to simplify test setup
const mockFetch = mock(
	(): Promise<any> =>
		Promise.resolve({ ok: true, json: () => ({ data: {} }), text: () => '' }),
)
globalThis.fetch = mockFetch as any

describe('Access', () => {
	let whop: Whop

	beforeEach(() => {
		mockFetch.mockClear()
		whop = Whop.fromTokens({
			accessToken: 'test-access-token',
			csrfToken: 'test-csrf-token',
			refreshToken: 'test-refresh-token',
			userId: 'user_123',
		})
	})

	describe('checkExperience', () => {
		it('should check access to an experience', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								experience: {
									id: 'exp_123',
									title: 'My Experience',
									company: {
										id: 'biz_123',
										ownerUserId: 'user_456',
										viewer: {
											hasAccess: true,
											isTeamMember: false,
											membership: { id: 'mem_123', status: 'active' },
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.access.checkExperience({
				experienceId: 'exp_123',
			})

			expect(result.hasAccess).toBe(true)
			expect(result.isAdmin).toBe(false)
			expect(result.isMember).toBe(true)
		})

		it('should recognize owner as admin', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								experience: {
									id: 'exp_123',
									title: 'My Experience',
									company: {
										id: 'biz_123',
										ownerUserId: 'user_123', // Same as the user
										viewer: {
											hasAccess: false,
											isTeamMember: false,
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.access.checkExperience({
				experienceId: 'exp_123',
			})

			expect(result.hasAccess).toBe(true)
			expect(result.isAdmin).toBe(true)
		})

		it('should recognize team member as admin', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								experience: {
									id: 'exp_123',
									title: 'My Experience',
									company: {
										id: 'biz_123',
										ownerUserId: 'user_456',
										viewer: {
											hasAccess: false,
											isTeamMember: true,
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.access.checkExperience({
				experienceId: 'exp_123',
			})

			expect(result.hasAccess).toBe(true)
			expect(result.isAdmin).toBe(true)
		})
	})

	describe('checkAccessPass', () => {
		it('should check access to an access pass', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								accessPass: {
									id: 'prod_123',
									title: 'Premium Access',
									viewer: {
										hasAccess: true,
										membership: {
											id: 'mem_123',
											status: 'active',
											plan: { id: 'plan_123', planType: 'renewal' },
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.access.checkAccessPass({
				accessPassId: 'prod_123',
			})

			expect(result.id).toBe('prod_123')
			expect(result.title).toBe('Premium Access')
			expect(result.hasAccess).toBe(true)
			expect(result.membership?.status).toBe('active')
		})
	})

	describe('getUserAccess', () => {
		it('should get user access summary for a company', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									id: 'biz_123',
									ownerUserId: 'user_456',
									viewer: {
										hasAccess: true,
										isTeamMember: false,
									},
								},
								viewer: {
									user: {
										id: 'user_123',
										memberships: {
											nodes: [
												{
													id: 'mem_123',
													status: 'active',
													accessPass: {
														id: 'prod_123',
														title: 'Premium',
													},
												},
											],
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.access.getUserAccess('biz_123')

			expect(result.userId).toBe('user_123')
			expect(result.companyId).toBe('biz_123')
			expect(result.isOwner).toBe(false)
			expect(result.memberships).toHaveLength(1)
		})
	})

	describe('hasCompanyAccess', () => {
		it('should return true if user has access', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									viewer: {
										hasAccess: true,
										isTeamMember: false,
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.access.hasCompanyAccess('biz_123')

			expect(result).toBe(true)
		})

		it('should return false if user has no access', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									viewer: {
										hasAccess: false,
										isTeamMember: false,
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.access.hasCompanyAccess('biz_123')

			expect(result).toBe(false)
		})
	})
})
