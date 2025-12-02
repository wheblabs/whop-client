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

describe('Invoices', () => {
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
		it('should list invoices for a company', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								company: {
									invoices: {
										nodes: [
											{
												id: 'inv_123',
												createdAt: '2024-01-01',
												status: 'pending',
												formattedAmount: '$99.00',
												currency: 'USD',
												memo: 'Custom service',
												recipient: {
													id: 'user_123',
													email: 'test@example.com',
												},
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

			const result = await whop.invoices.list('biz_123')

			expect(result.invoices).toHaveLength(1)
			expect(result.invoices[0]?.id).toBe('inv_123')
			expect(result.invoices[0]?.status).toBe('pending')
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
									invoices: {
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

			await whop.invoices.list('biz_123', { status: 'paid' })

			expect(mockFetch).toHaveBeenCalled()
		})
	})

	describe('get', () => {
		it('should get a specific invoice', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								invoice: {
									id: 'inv_123',
									createdAt: '2024-01-01',
									status: 'pending',
									formattedAmount: '$99.00',
									currency: 'USD',
									memo: 'Custom service',
									invoiceNumber: 'INV-001',
									paymentUrl: 'https://whop.com/pay/...',
									recipient: {
										id: 'user_123',
										email: 'test@example.com',
									},
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.invoices.get('inv_123')

			expect(result.id).toBe('inv_123')
			expect(result.invoiceNumber).toBe('INV-001')
			expect(result.paymentUrl).toContain('whop.com/pay')
		})
	})

	describe('create', () => {
		it('should create an invoice', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								createInvoice: {
									id: 'inv_123',
									createdAt: '2024-01-01',
									status: 'pending',
									formattedAmount: '$99.00',
									currency: 'USD',
									memo: 'Custom service',
									paymentUrl: 'https://whop.com/pay/...',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.invoices.create('biz_123', {
				recipientUserId: 'user_123',
				amount: 9900,
				memo: 'Custom service',
			})

			expect(result.id).toBe('inv_123')
			expect(result.status).toBe('pending')
			expect(result.formattedAmount).toBe('$99.00')
		})
	})

	describe('void', () => {
		it('should void an invoice', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								voidInvoice: {
									id: 'inv_123',
									voidedAt: '2024-01-02',
									status: 'voided',
								},
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.invoices.void('biz_123', 'inv_123')

			expect(result.id).toBe('inv_123')
			expect(result.status).toBe('voided')
		})
	})

	describe('sendReminder', () => {
		it('should send an invoice reminder', async () => {
			mockFetch.mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							data: {
								sendInvoiceReminder: true,
							},
						}),
					text: () => Promise.resolve(''),
				}),
			)

			const result = await whop.invoices.sendReminder('inv_123')

			expect(result).toBe(true)
		})
	})
})
