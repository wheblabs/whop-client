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

describe('Payments', () => {
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
		it('should list payments for a company', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									creatorDashboardTable: {
										receipts: {
											nodes: [
												{
													id: 'receipt_123',
													createdAt: '2024-01-01',
													formattedPrice: '$99.00',
													paymentMethod: 'card',
													member: {
														id: 'user_123',
														email: 'test@example.com',
													},
													plan: { id: 'plan_123', title: 'Premium' },
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

			const result = await whop.payments.list('biz_123')

			expect(result.payments).toHaveLength(1)
			expect(result.payments[0]?.id).toBe('receipt_123')
			expect(result.payments[0]?.formattedAmount).toBe('$99.00')
			expect(result.totalCount).toBe(1)
		})
	})

	describe('get', () => {
		it('should get a specific payment', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								receipt: {
									id: 'receipt_123',
									createdAt: '2024-01-01',
									formattedPrice: '$99.00',
									paymentMethod: 'card',
									currency: 'USD',
									member: {
										id: 'user_123',
										email: 'test@example.com',
									},
									plan: { id: 'plan_123', title: 'Premium' },
									accessPass: { id: 'prod_123', title: 'Premium' },
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.payments.get('receipt_123')

			expect(result.id).toBe('receipt_123')
			expect(result.formattedAmount).toBe('$99.00')
			expect(result.currency).toBe('USD')
		})

		it('should correctly determine refunded status', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								receipt: {
									id: 'receipt_123',
									createdAt: '2024-01-01',
									formattedPrice: '$99.00',
									refundedAt: '2024-01-02',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.payments.get('receipt_123')

			expect(result.status).toBe('refunded')
		})
	})

	describe('refund', () => {
		it('should refund a payment', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								refundReceipt: {
									id: 'receipt_123',
									refundedAt: '2024-01-02',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.payments.refund('receipt_123')

			expect(result.id).toBe('receipt_123')
			expect(result.status).toBe('refunded')
		})
	})

	describe('retry', () => {
		it('should retry a failed payment', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								retryPayment: {
									id: 'receipt_123',
									status: 'paid',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.payments.retry('receipt_123')

			expect(result.id).toBe('receipt_123')
			expect(result.status).toBe('paid')
		})
	})

	describe('void', () => {
		it('should void a payment', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								voidReceipt: {
									id: 'receipt_123',
									voidedAt: '2024-01-02',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.payments.void('receipt_123')

			expect(result.id).toBe('receipt_123')
			expect(result.status).toBe('voided')
		})
	})

	describe('listReceipts', () => {
		it('should list receipts for current user', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								viewer: {
									user: {
										receipts: {
											nodes: [
												{
													id: 'receipt_123',
													createdAt: '2024-01-01',
													formattedPrice: '$99.00',
													plan: { id: 'plan_123', title: 'Premium' },
												},
											],
											totalCount: 1,
										},
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.payments.listReceipts()

			expect(result.receipts).toHaveLength(1)
			expect(result.receipts[0]?.id).toBe('receipt_123')
			expect(result.totalCount).toBe(1)
		})
	})

	describe('createCheckoutSession', () => {
		it('should create checkout session with API key', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							id: 'cs_123',
							purchase_url: 'https://whop.com/checkout/...',
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.payments.createCheckoutSession({
				planId: 'plan_123',
				apiKey: 'test-api-key',
				companyId: 'biz_123',
				onBehalfOfUserId: 'user_123',
			})

			expect(result.id).toBe('cs_123')
			expect(result.url).toContain('whop.com/checkout')
		})

		it('should create checkout session with user tokens', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								createCheckoutSession: {
									id: 'cs_123',
									url: 'https://whop.com/checkout/...',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.payments.createCheckoutSession({
				planId: 'plan_123',
			})

			expect(result.id).toBe('cs_123')
		})
	})
})
