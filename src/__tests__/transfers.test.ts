import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Whop } from '../client'

// Mock fetch globally - using any to simplify test setup
// biome-ignore lint/suspicious/noExplicitAny: Test mocking
const mockFetch = mock(
	(): Promise<any> =>
		Promise.resolve({ ok: true, json: () => ({ data: {} }), text: () => '' }),
)
// biome-ignore lint/suspicious/noExplicitAny: Test mocking
globalThis.fetch = mockFetch as any

describe('Transfers', () => {
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
		it('should list transfers for a company', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									transfers: {
										nodes: [
											{
												id: 'transfer_123',
												createdAt: '2024-01-01',
												completedAt: '2024-01-02',
												status: 'completed',
												formattedAmount: '$1,000.00',
												formattedFee: '$50.00',
												formattedNetAmount: '$950.00',
												currency: 'USD',
												method: 'stripe',
											},
										],
										totalCount: 1,
										pageInfo: { hasNextPage: false },
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.transfers.list('biz_123')

			expect(result.transfers).toHaveLength(1)
			expect(result.transfers[0]?.id).toBe('transfer_123')
			expect(result.transfers[0]?.status).toBe('completed')
			expect(result.transfers[0]?.formattedAmount).toBe('$1,000.00')
			expect(result.totalCount).toBe(1)
		})

		it('should accept status filter', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									transfers: {
										nodes: [],
										totalCount: 0,
										pageInfo: { hasNextPage: false },
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			await whop.transfers.list('biz_123', { status: 'pending' })

			expect(mockFetch).toHaveBeenCalled()
		})
	})

	describe('get', () => {
		it('should get a specific transfer', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								transfer: {
									id: 'transfer_123',
									createdAt: '2024-01-01',
									completedAt: '2024-01-02',
									status: 'completed',
									formattedAmount: '$1,000.00',
									formattedFee: '$50.00',
									formattedNetAmount: '$950.00',
									currency: 'USD',
									method: 'stripe',
									destination: '**** 1234',
									reference: 'Monthly payout',
									periodStart: '2024-01-01',
									periodEnd: '2024-01-31',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.transfers.get('transfer_123')

			expect(result.id).toBe('transfer_123')
			expect(result.status).toBe('completed')
			expect(result.reference).toBe('Monthly payout')
		})
	})

	describe('create', () => {
		it('should request a transfer', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								requestTransfer: {
									id: 'transfer_123',
									createdAt: '2024-01-01',
									status: 'pending',
									formattedAmount: '$500.00',
									currency: 'USD',
									method: 'stripe',
									reference: 'Manual payout',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.transfers.create('biz_123', {
				amount: 50000,
				reference: 'Manual payout',
			})

			expect(result.id).toBe('transfer_123')
			expect(result.status).toBe('pending')
			expect(result.reference).toBe('Manual payout')
		})
	})

	describe('getBalance', () => {
		it('should get company balance', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									balance: {
										availableBalance: 100000,
										formattedAvailableBalance: '$1,000.00',
										pendingBalance: 25000,
										formattedPendingBalance: '$250.00',
										currency: 'USD',
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.transfers.getBalance('biz_123')

			expect(result.availableBalance).toBe(100000)
			expect(result.formattedAvailableBalance).toBe('$1,000.00')
			expect(result.pendingBalance).toBe(25000)
			expect(result.currency).toBe('USD')
		})
	})
})
