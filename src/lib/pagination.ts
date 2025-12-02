/**
 * Page info for cursor-based pagination
 */
export interface PageInfo {
	hasNextPage: boolean
	endCursor: string | null
}

/**
 * Options for pagination
 */
export interface PaginationOptions {
	/** Number of items per page (default: 50, max: 100) */
	first?: number
	/** Cursor for fetching the next page */
	after?: string
}

/**
 * A paginated response with items and page info
 */
export interface PaginatedResponse<T> {
	items: T[]
	pageInfo: PageInfo
}

/**
 * Function type for fetching a single page
 */
export type PageFetcher<T, Options extends PaginationOptions> = (
	options: Options,
) => Promise<{ items: T[]; pageInfo: PageInfo }>

/**
 * Create an async iterator for paginated results
 *
 * @param fetcher - Function that fetches a single page
 * @param options - Initial options (without cursor)
 * @returns AsyncGenerator that yields individual items
 *
 * @example
 * ```typescript
 * // Iterate over all members
 * const iterator = paginate(
 *   (opts) => whop.members.list({ companyId: 'biz_xxx', ...opts }),
 *   {}
 * )
 *
 * for await (const member of iterator) {
 *   console.log(member.user.username)
 * }
 * ```
 */
export async function* paginate<T, Options extends PaginationOptions>(
	fetcher: PageFetcher<T, Options>,
	options: Omit<Options, keyof PaginationOptions> & PaginationOptions,
): AsyncGenerator<T, void, undefined> {
	let cursor: string | null = null
	let hasMore = true

	while (hasMore) {
		const response = await fetcher({
			...options,
			after: cursor ?? undefined,
		} as Options)

		for (const item of response.items) {
			yield item
		}

		hasMore = response.pageInfo.hasNextPage
		cursor = response.pageInfo.endCursor
	}
}

/**
 * Fetch all items from a paginated endpoint
 *
 * @param fetcher - Function that fetches a single page
 * @param options - Initial options (without cursor)
 * @returns Promise that resolves to all items
 *
 * @example
 * ```typescript
 * // Get all members at once
 * const allMembers = await fetchAll(
 *   (opts) => whop.members.list({ companyId: 'biz_xxx', ...opts }),
 *   {}
 * )
 *
 * console.log(`Total members: ${allMembers.length}`)
 * ```
 */
export async function fetchAll<T, Options extends PaginationOptions>(
	fetcher: PageFetcher<T, Options>,
	options: Omit<Options, keyof PaginationOptions> & PaginationOptions,
): Promise<T[]> {
	const items: T[] = []

	for await (const item of paginate(fetcher, options)) {
		items.push(item)
	}

	return items
}

/**
 * Create a paginated resource wrapper with iterate() and all() methods
 *
 * @param fetcher - Function that fetches a single page
 * @returns Object with iterate and all methods
 *
 * @example
 * ```typescript
 * const membersPaginator = createPaginator(
 *   (opts) => whop.members.list({ companyId: 'biz_xxx', ...opts })
 * )
 *
 * // Iterate lazily
 * for await (const member of membersPaginator.iterate()) {
 *   console.log(member.user.username)
 * }
 *
 * // Or get all at once
 * const allMembers = await membersPaginator.all()
 * ```
 */
export function createPaginator<T, Options extends PaginationOptions>(
	fetcher: PageFetcher<T, Options>,
): {
	iterate: (
		options?: Omit<Options, keyof PaginationOptions>,
	) => AsyncGenerator<T, void, undefined>
	all: (options?: Omit<Options, keyof PaginationOptions>) => Promise<T[]>
} {
	return {
		iterate: (options = {} as Omit<Options, keyof PaginationOptions>) =>
			paginate(
				fetcher,
				options as Omit<Options, keyof PaginationOptions> & PaginationOptions,
			),
		all: (options = {} as Omit<Options, keyof PaginationOptions>) =>
			fetchAll(
				fetcher,
				options as Omit<Options, keyof PaginationOptions> & PaginationOptions,
			),
	}
}
