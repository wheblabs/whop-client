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
 * Create a retry interceptor
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
			// Note: actual retry logic would need to be handled in the fetch wrapper
			// This interceptor just tracks retry state
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
