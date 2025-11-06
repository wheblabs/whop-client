/**
 * Example: Using the builder pattern API
 *
 * This demonstrates the new fluent API for interacting with Whop resources
 */

import { Whop } from '../src'

async function main() {
	const client = new Whop()

	// ============================================
	// LIST MY COMPANIES
	// ============================================
	console.log('\n=== My Companies ===')
	const companies = await client.me.companies.list()

	for (const company of companies) {
		console.log(`${company.title} (${company.id})`)
	}

	if (companies.length === 0) {
		console.log('No companies found. Exiting.')
		return
	}

	const companyId = companies[0]?.id
	if (!companyId) return

	// ============================================
	// COMPANY-SCOPED OPERATIONS
	// ============================================
	console.log(`\n=== Working with ${companies[0]?.title} ===`)

	// List apps for the company
	const apps = await client.company(companyId).apps.list()
	console.log(`\nApps: ${apps.length}`)
	for (const app of apps) {
		console.log(`  - ${app.name} (${app.id})`)
	}

	// List experiences (app installations)
	const experiences = await client.company(companyId).experiences.list()
	console.log(`\nExperiences: ${experiences.totalCount}`)
	for (const exp of experiences.experiences) {
		console.log(`  - ${exp.name} (${exp.app.name})`)
	}

	// List products
	const products = await client.company(companyId).products.list()
	console.log(`\nProducts: ${products.totalCount}`)
	for (const product of products.accessPasses) {
		console.log(`  - ${product.title} (${product.id})`)
		console.log(`    Members: ${product.activeMembersCount}`)
	}

	// List memberships
	const memberships = await client.company(companyId).memberships.list({
		first: 10,
	})
	console.log(`\nMemberships: ${memberships.totalCount}`)
	for (const membership of memberships.nodes) {
		console.log(
			`  - ${membership.companyMember.user.username}: $${membership.totalSpend} total spend`,
		)
		console.log(`    Product: ${membership.accessPass.title}`)
		console.log(`    Plan: ${membership.plan.formattedPrice}`)
	}

	// ============================================
	// PRODUCT-SCOPED OPERATIONS
	// ============================================
	const productId = products.accessPasses[0]?.id
	if (productId) {
		console.log(`\n=== Working with Product ${productId} ===`)

		// List plans for the product
		const plans = await client
			.company(companyId)
			.product(productId)
			.plans.list()

		console.log(`\nPlans: ${plans.totalCount}`)
		for (const plan of plans.plans) {
			console.log(
				`  - ${plan.planType}: ${plan.formattedPrice} (${plan.activeMemberCount} active members)`,
			)
		}
	}

	// ============================================
	// APP-SCOPED OPERATIONS
	// ============================================
	const appId = apps[0]?.id
	if (appId) {
		console.log(`\n=== Working with App ${appId} ===`)

		// Get app credentials
		const credentials = await client
			.company(companyId)
			.app(appId)
			.credentials.get()

		console.log(`\nAPI Key: ${credentials.apiKey.token.slice(0, 20)}...`)
		console.log(`Base Dev URL: ${credentials.baseDevUrl || 'Not set'}`)
		console.log(`Agent Users: ${credentials.agentUsers.length}`)
	}

	// ============================================
	// CHAINED OPERATIONS
	// ============================================
	console.log('\n=== Chained Operations Example ===')

	if (productId) {
		// Example: Create a new plan for a product (commented out to avoid actual creation)
		/*
    const newPlan = await client
      .company(companyId)
      .product(productId)
      .plans.create({
        title: 'Monthly Subscription',
        planType: 'renewal',
        visibility: 'visible',
        currency: 'usd',
        renewalPrice: '29.99',
        billingPeriod: 30
      })
    console.log(`Created plan: ${newPlan.id}`)
    */

		console.log('(Plan creation example - commented out)')
	}

	console.log('\n✅ All examples completed successfully!')
}

main().catch(console.error)
