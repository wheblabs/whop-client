/**
 * Example: Querying the Whop App Store
 *
 * This demonstrates how to browse and search public apps from the Whop app store
 * with filtering, sorting, pagination, and search capabilities.
 */

import { Whop } from '../src'

async function main() {
	const client = new Whop()

	// ============================================
	// BASIC QUERY - FIRST PAGE
	// ============================================
	console.log('\n=== Basic Query (First Page) ===')
	const firstPage = await client.appStore.query({
		first: 20,
		orderBy: 'total_installs_last_30_days',
		viewType: 'hub',
	})

	console.log(`Found ${firstPage.nodes.length} apps`)
	console.log(`Total available: ${firstPage.totalCount}`)
	console.log(`Has next page: ${firstPage.pageInfo.hasNextPage}`)

	// Display first few apps
	for (const app of firstPage.nodes.slice(0, 5)) {
		console.log(`\n  - ${app.name}`)
		console.log(`    ID: ${app.id}`)
		console.log(`    Installs: ${app.totalInstalls.toLocaleString()}`)
		console.log(`    Creator: ${app.creator.name} (@${app.creator.username})`)
		console.log(`    Status: ${app.status}`)
	}

	// ============================================
	// FILTER BY CATEGORY
	// ============================================
	console.log('\n=== Filter by Category (AI Apps) ===')
	const aiApps = await client.appStore.query({
		first: 10,
		category: 'ai',
		orderBy: 'total_installs_last_30_days',
		viewType: 'hub',
	})

	console.log(`Found ${aiApps.nodes.length} AI apps`)
	for (const app of aiApps.nodes.slice(0, 3)) {
		console.log(`  - ${app.name} (${app.totalInstalls} installs)`)
	}

	// ============================================
	// SEARCH QUERY
	// ============================================
	console.log('\n=== Search Query ===')
	const searchResults = await client.appStore.query({
		first: 10,
		query: 'analytics',
		orderBy: 'discoverable_at',
		viewType: 'hub',
	})

	console.log(`Found ${searchResults.nodes.length} apps matching "analytics"`)
	for (const app of searchResults.nodes) {
		console.log(`  - ${app.name}`)
	}

	// ============================================
	// PAGINATION - NEXT PAGE
	// ============================================
	console.log('\n=== Pagination (Next Page) ===')
	if (firstPage.pageInfo.hasNextPage && firstPage.pageInfo.endCursor) {
		const secondPage = await client.appStore.query({
			first: 20,
			after: firstPage.pageInfo.endCursor,
			orderBy: 'total_installs_last_30_days',
			viewType: 'hub',
		})

		console.log(`Second page: ${secondPage.nodes.length} apps`)
		console.log(`Has next page: ${secondPage.pageInfo.hasNextPage}`)
	}

	// ============================================
	// DIFFERENT SORT ORDERS
	// ============================================
	console.log('\n=== Sort by Most Active (DAU) ===')
	const mostActive = await client.appStore.query({
		first: 10,
		orderBy: 'daily_active_users',
		viewType: 'hub',
	})

	console.log(`Top ${mostActive.nodes.length} most active apps:`)
	for (const app of mostActive.nodes.slice(0, 5)) {
		console.log(
			`  - ${app.name}: ${app.stats.dau} DAU, ${app.stats.timeSpentLast24HoursInSeconds}s time spent`,
		)
	}

	console.log('\n=== Sort by Hottest (Time Spent) ===')
	const hottest = await client.appStore.query({
		first: 10,
		orderBy: 'time_spent_last_24_hours',
		viewType: 'hub',
	})

	console.log(`Top ${hottest.nodes.length} hottest apps:`)
	for (const app of hottest.nodes.slice(0, 5)) {
		console.log(
			`  - ${app.name}: ${app.stats.timeSpentLast24HoursInSeconds}s in last 24h`,
		)
	}

	// ============================================
	// COMBINED FILTERS
	// ============================================
	console.log('\n=== Combined Filters ===')
	const filtered = await client.appStore.query({
		first: 10,
		category: 'business-productivity',
		query: 'crm',
		orderBy: 'time_spent_last_24_hours',
		viewType: 'dashboard',
	})

	console.log(
		`Found ${filtered.nodes.length} business-productivity apps matching "crm"`,
	)

	// ============================================
	// AVAILABLE CATEGORIES
	// ============================================
	console.log('\n=== Available Categories ===')
	const categories = [
		'community',
		'business-productivity',
		'games',
		'sports',
		'social-media',
		'trading',
		'ai',
		'education',
		'ecommerce-shopping',
		'health-fitness',
		'travel',
	]

	console.log('Categories you can filter by:')
	for (const category of categories) {
		const result = await client.appStore.query({
			first: 1,
			category,
			viewType: 'hub',
		})
		console.log(`  - ${category}: ${result.totalCount} apps`)
	}

	console.log('\n✅ All examples completed successfully!')
}

main().catch(console.error)
