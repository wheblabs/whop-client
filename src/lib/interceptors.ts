import type { AuthTokens } from '@/types'

/**
 * Request context passed to interceptors
 */
export interface RequestContext {
	/** The operation name (GraphQL operation or REST endpoint) */
	operationName: string
	/** Request URL */
	url: string
	/** HTTP method */
	method: string
	/** Request headers */
	headers: Record<string, string>
	/** Request body (for POST/PUT/PATCH) */
	body?: unknown
	/** Current authentication tokens */
	tokens?: AuthTokens
	/** Custom metadata you can attach */
	metadata?: Record<string, unknown>
	/** Timestamp when request started */
	startTime: number
}

/**
 * Response context passed to interceptors
 */
export interface ResponseContext<T = unknown> {
	/** The original request context */
	request: RequestContext
	/** HTTP status code */
	status: number
	/** Response headers */
	headers: Headers
	/** Parsed response data */
	data: T
	/** Duration of the request in milliseconds */
	duration: number
	/** Whether the response came from cache */
	fromCache?: boolean
	/** Any error that occurred */
	error?: Error
}

/**
 * Request interceptor function type
 * Can modify the request before it's sent, or throw to abort
 */
export type RequestInterceptor = (
	context: RequestContext,
) => RequestContext | Promise<RequestContext>

/**
 * Response interceptor function type
 * Can modify the response or handle errors
 */
export type ResponseInterceptor<T = unknown> = (
	context: ResponseContext<T>,
) => ResponseContext<T> | Promise<ResponseContext<T>>

/**
 * Error interceptor function type
 * Called when a request fails
 */
export type ErrorInterceptor = (
	error: Error,
	context: RequestContext,
) => Error | void | Promise<Error | void>

/**
 * Interceptor configuration
 */
export interface InterceptorConfig {
	/** Called before each request */
	onRequest?: RequestInterceptor
	/** Called after each successful response */
	onResponse?: ResponseInterceptor
	/** Called when a request fails */
	onError?: ErrorInterceptor
}

/**
 * Interceptor manager for handling request/response lifecycle hooks
 */
export class InterceptorManager {
	private requestInterceptors: RequestInterceptor[] = []
	private responseInterceptors: ResponseInterceptor[] = []
	private errorInterceptors: ErrorInterceptor[] = []

	constructor(config?: InterceptorConfig) {
		if (config?.onRequest) {
			this.requestInterceptors.push(config.onRequest)
		}
		if (config?.onResponse) {
			this.responseInterceptors.push(config.onResponse)
		}
		if (config?.onError) {
			this.errorInterceptors.push(config.onError)
		}
	}

	/**
	 * Add a request interceptor
	 * @returns Function to remove the interceptor
	 */
	addRequestInterceptor(interceptor: RequestInterceptor): () => void {
		this.requestInterceptors.push(interceptor)
		return () => {
			const index = this.requestInterceptors.indexOf(interceptor)
			if (index !== -1) {
				this.requestInterceptors.splice(index, 1)
			}
		}
	}

	/**
	 * Add a response interceptor
	 * @returns Function to remove the interceptor
	 */
	addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
		this.responseInterceptors.push(interceptor)
		return () => {
			const index = this.responseInterceptors.indexOf(interceptor)
			if (index !== -1) {
				this.responseInterceptors.splice(index, 1)
			}
		}
	}

	/**
	 * Add an error interceptor
	 * @returns Function to remove the interceptor
	 */
	addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
		this.errorInterceptors.push(interceptor)
		return () => {
			const index = this.errorInterceptors.indexOf(interceptor)
			if (index !== -1) {
				this.errorInterceptors.splice(index, 1)
			}
		}
	}

	/**
	 * Run all request interceptors
	 */
	async runRequestInterceptors(
		context: RequestContext,
	): Promise<RequestContext> {
		let ctx = context
		for (const interceptor of this.requestInterceptors) {
			ctx = await interceptor(ctx)
		}
		return ctx
	}

	/**
	 * Run all response interceptors
	 */
	async runResponseInterceptors<T>(
		context: ResponseContext<T>,
	): Promise<ResponseContext<T>> {
		let ctx = context
		for (const interceptor of this.responseInterceptors) {
			ctx = (await interceptor(ctx)) as ResponseContext<T>
		}
		return ctx
	}

	/**
	 * Run all error interceptors
	 */
	async runErrorInterceptors(
		error: Error,
		context: RequestContext,
	): Promise<Error> {
		let err = error
		for (const interceptor of this.errorInterceptors) {
			const result = await interceptor(err, context)
			if (result instanceof Error) {
				err = result
			}
		}
		return err
	}

	/**
	 * Clear all interceptors
	 */
	clear(): void {
		this.requestInterceptors = []
		this.responseInterceptors = []
		this.errorInterceptors = []
	}
}

/**
 * Create a logging interceptor for debugging
 */
export function createLoggingInterceptor(options?: {
	logRequest?: boolean
	logResponse?: boolean
	logErrors?: boolean
}): InterceptorConfig {
	const {
		logRequest = true,
		logResponse = true,
		logErrors = true,
	} = options ?? {}

	return {
		onRequest: logRequest
			? (ctx) => {
					console.log(`[Whop SDK] → ${ctx.method} ${ctx.operationName}`, {
						url: ctx.url,
						hasBody: !!ctx.body,
					})
					return ctx
				}
			: undefined,

		onResponse: logResponse
			? (ctx) => {
					console.log(
						`[Whop SDK] ← ${ctx.request.operationName} (${ctx.status}) ${ctx.duration}ms`,
						{
							fromCache: ctx.fromCache,
						},
					)
					return ctx
				}
			: undefined,

		onError: logErrors
			? (error, ctx) => {
					console.error(
						`[Whop SDK] ✕ ${ctx.operationName} failed:`,
						error.message,
					)
					return error
				}
			: undefined,
	}
}

/**
 * Options for retry functionality
 */
export interface RetryOptions {
	/** Maximum number of retry attempts (default: 3) */
	maxRetries?: number
	/** Base delay in milliseconds between retries (default: 1000) */
	baseDelayMs?: number
	/** Maximum delay in milliseconds (default: 30000) */
	maxDelayMs?: number
	/** Whether to use exponential backoff (default: true) */
	exponentialBackoff?: boolean
	/** Custom function to determine if an error is retryable */
	shouldRetry?: (error: Error) => boolean
	/** Callback when a retry is attempted */
	onRetry?: (attempt: number, error: Error, delayMs: number) => void
}

/**
 * Default function to determine if an error is retryable
 * Retries on network errors and 5xx server errors
 */
export function isRetryableError(error: Error): boolean {
	// Network errors
	if (error.name === 'AbortError') return false // Don't retry timeouts
	if (error.message.includes('Network error')) return true
	if (error.message.includes('fetch')) return true

	// Check for HTTP status in error message
	const statusMatch = error.message.match(/HTTP (\d{3})/)
	if (statusMatch?.[1]) {
		const status = parseInt(statusMatch[1], 10)
		// Retry on 429 (rate limit) and 5xx (server errors)
		return status === 429 || (status >= 500 && status < 600)
	}

	return false
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
	attempt: number,
	baseDelayMs: number,
	maxDelayMs: number,
	exponentialBackoff: boolean,
): number {
	if (!exponentialBackoff) {
		return baseDelayMs
	}

	// Exponential backoff: baseDelay * 2^attempt
	const exponentialDelay = baseDelayMs * 2 ** attempt

	// Add jitter (±25%)
	const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)

	return Math.min(exponentialDelay + jitter, maxDelayMs)
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wrap an async operation with retry logic
 *
 * @param operation - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * // Retry a GraphQL request up to 3 times
 * const result = await withRetry(
 *   () => whop.graphql({ query: '...' }),
 *   { maxRetries: 3 }
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Custom retry logic with callbacks
 * const result = await withRetry(
 *   () => fetchData(),
 *   {
 *     maxRetries: 5,
 *     baseDelayMs: 500,
 *     shouldRetry: (error) => error.message.includes('temporary'),
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`)
 *     }
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	options?: RetryOptions,
): Promise<T> {
	const {
		maxRetries = 3,
		baseDelayMs = 1000,
		maxDelayMs = 30_000,
		exponentialBackoff = true,
		shouldRetry = isRetryableError,
		onRetry,
	} = options ?? {}

	let lastError: Error | undefined

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation()
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))

			// Check if we should retry
			if (attempt < maxRetries && shouldRetry(lastError)) {
				const delay = calculateDelay(
					attempt,
					baseDelayMs,
					maxDelayMs,
					exponentialBackoff,
				)

				if (onRetry) {
					onRetry(attempt + 1, lastError, delay)
				}

				await sleep(delay)
			} else {
				throw lastError
			}
		}
	}

	// This should never be reached, but TypeScript needs it
	throw lastError
}

/**
 * Create a retry interceptor for tracking retry state
 * @deprecated Use `withRetry()` function instead for actual retry logic
 */
export function createRetryInterceptor(options?: {
	maxRetries?: number
	retryDelayMs?: number
	shouldRetry?: (error: Error) => boolean
}): ErrorInterceptor {
	const {
		maxRetries = 3,
		retryDelayMs: _retryDelayMs = 1000,
		shouldRetry = () => true,
	} = options ?? {}
	const retryCount = new Map<string, number>()

	return (error, ctx) => {
		const key = `${ctx.method}:${ctx.url}`
		const count = retryCount.get(key) ?? 0

		if (count < maxRetries && shouldRetry(error)) {
			retryCount.set(key, count + 1)
			console.log(
				`[Whop SDK] Retry ${count + 1}/${maxRetries} for ${ctx.operationName}`,
			)
		} else {
			retryCount.delete(key)
		}

		return error
	}
}

/**
 * Create a metrics interceptor for tracking request statistics
 */
export function createMetricsInterceptor(
	onMetric: (metric: RequestMetric) => void,
): InterceptorConfig {
	return {
		onResponse: (ctx) => {
			onMetric({
				operation: ctx.request.operationName,
				method: ctx.request.method,
				url: ctx.request.url,
				status: ctx.status,
				duration: ctx.duration,
				timestamp: Date.now(),
				success: ctx.status >= 200 && ctx.status < 300,
			})
			return ctx
		},
		onError: (error, ctx) => {
			onMetric({
				operation: ctx.operationName,
				method: ctx.method,
				url: ctx.url,
				status: 0,
				duration: Date.now() - ctx.startTime,
				timestamp: Date.now(),
				success: false,
				error: error.message,
			})
			return error
		},
	}
}

/**
 * Metric data structure
 */
export interface RequestMetric {
	operation: string
	method: string
	url: string
	status: number
	duration: number
	timestamp: number
	success: boolean
	error?: string
}
