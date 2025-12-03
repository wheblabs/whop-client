import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Whop } from '../client'

// Mock fetch globally - using any to simplify test setup
const mockFetch = mock(
	(): Promise<any> =>
		Promise.resolve({ ok: true, json: () => ({ data: {} }), text: () => '' }),
)
globalThis.fetch = mockFetch as any

describe('Memberships', () => {
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
		it('should list memberships for a company', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									creatorDashboardTable: {
										memberships: {
											nodes: [
												{
													id: 'mem_123',
													createdAt: '2024-01-01',
													plan: { id: 'plan_123', planType: 'renewal' },
													accessPass: { id: 'prod_123', title: 'Premium' },
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

			const result = await whop.memberships.list('biz_123')

			expect(result.memberships).toHaveLength(1)
			expect(result.memberships[0]?.id).toBe('mem_123')
			expect(result.totalCount).toBe(1)
		})

		it('should accept filter options', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									creatorDashboardTable: {
										memberships: {
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

			await whop.memberships.list('biz_123', {
				status: 'active',
				first: 10,
			})

			expect(mockFetch).toHaveBeenCalled()
		})
	})

	describe('get', () => {
		it('should get a specific membership', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								membership: {
									id: 'mem_123',
									createdAt: '2024-01-01',
									plan: { id: 'plan_123', planType: 'renewal' },
									accessPass: { id: 'prod_123', title: 'Premium' },
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.memberships.get('mem_123')

			expect(result.id).toBe('mem_123')
		})
	})

	describe('pause', () => {
		it('should pause a membership', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								pauseMembership: {
									id: 'mem_123',
									paymentCollectionPaused: true,
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.memberships.pause({ membershipId: 'mem_123' })

			expect(result.id).toBe('mem_123')
			expect(result.paymentCollectionPaused).toBe(true)
		})
	})

	describe('resume', () => {
		it('should resume a membership', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								resumeMembership: {
									id: 'mem_123',
									paymentCollectionPaused: false,
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.memberships.resume({ membershipId: 'mem_123' })

			expect(result.id).toBe('mem_123')
			expect(result.paymentCollectionPaused).toBe(false)
		})
	})

	describe('cancel', () => {
		it('should cancel a membership', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								toggleCancelMyMembership: true,
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.memberships.cancel({ membershipId: 'mem_123' })

			expect(result).toBe(true)
		})
	})

	describe('transfer', () => {
		it('should transfer a membership', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								transferMyMembership: true,
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.memberships.transfer({
				membershipId: 'mem_123',
				toUserId: 'user_456',
			})

			expect(result).toBe(true)
		})
	})

	describe('listForUser', () => {
		it('should list memberships for current user', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								viewer: {
									user: {
										memberships: {
											nodes: [
												{
													id: 'mem_123',
													createdAt: '2024-01-01',
													plan: { id: 'plan_123' },
													accessPass: { id: 'prod_123', title: 'Premium' },
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

			const result = await whop.memberships.listForUser()

			expect(result.memberships).toHaveLength(1)
			expect(result.totalCount).toBe(1)
		})
	})
})
