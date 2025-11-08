# @whoplabs/whop-client

Unofficial SDK for Whop account automation. Authenticate, create apps, manage companies programmatically.

## Installation

```bash
bun add @whoplabs/whop-client
```

## Quick Start

```typescript
import { Whop } from '@whoplabs/whop-client'

const client = new Whop()

// First run: authenticate with OTP
if (!client.isAuthenticated()) {
  const ticket = await client.auth.sendOTP('your@email.com')
  await client.auth.verify({ email: 'your@email.com', code: '123456', ticket })
}

// Subsequent runs: session auto-loads
const user = await client.me.get()
console.log(`Logged in as ${user.username}`)

// NEW: Builder pattern API
const companies = await client.me.companies.list()
const apps = await client.company(companies[0].id).apps.list()
const products = await client.company(companies[0].id).products.list()

// Browse app store
const appStore = await client.appStore.query({
  first: 20,
  category: 'ai',
  viewType: 'hub'
})

// Chain operations naturally
await client
  .company('biz_xxx')
  .product('prod_xxx')
  .plan('plan_xxx')
  .update({ renewalPrice: '39.99' })
```

## Core Concepts

**Sessions persist automatically.** First auth saves to `.whop-session.json`. Next run loads it. Add to `.gitignore`.

**Tokens refresh automatically.** Every request refreshes expired tokens. Never manually refresh.

**Custom token storage.** Use `onTokenRefresh` callback for database persistence instead of files.

**Errors are typed.** Catch specific errors for better handling.

## Authentication

```typescript
// OTP flow
const ticket = await whop.auth.sendOTP('email@example.com')
await whop.auth.verify({ email, code, ticket })

// Check status
whop.isAuthenticated() // true

// Use existing tokens (CI/CD)
const whop = Whop.fromTokens({
  accessToken: process.env.WHOP_ACCESS_TOKEN,
  csrfToken: process.env.WHOP_CSRF_TOKEN,
  refreshToken: process.env.WHOP_REFRESH_TOKEN,
})

// Database-backed tokens with auto-refresh
const tokens = await db.getWhopTokens(userId)
const whop = Whop.fromTokens(tokens, {
  onTokenRefresh: async (newTokens) => {
    // Called automatically when tokens are refreshed
    await db.saveWhopTokens(userId, newTokens)
  }
})
```

## Builder Pattern API (Recommended)

The new fluent API makes working with nested resources natural and intuitive:

```typescript
// List my companies
const companies = await client.me.companies.list()

// Work with a specific company
const company = client.company('biz_xxx')

// List company resources
const apps = await company.apps.list()
const experiences = await company.experiences.list()
const products = await company.products.list()
const memberships = await company.memberships.list()

// Install an app
await company.apps.install('app_xxx')

// Get app credentials
const credentials = await company.app('app_xxx').credentials.get()
console.log(credentials.apiKey.token)

// Filter experiences by app
const filtered = await company.experiences.list({ appId: 'app_xxx' })

// Create a new product
const newProduct = await company.products.create({
  title: 'Premium Membership',
  headline: 'Get exclusive access',
  visibility: 'visible',
  planOptions: {
    baseCurrency: 'usd',
    renewalPrice: 29.99,
    planType: 'renewal',
    billingPeriod: 30
  }
})

// Update a product
await company.product('prod_xxx').update({
  title: 'New Product Name',
  visibility: 'visible'
})

// List plans for a product
const plans = await company.product('prod_xxx').plans.list()

// Create a plan for a product
const plan = await company.product('prod_xxx').plans.create({
  title: 'Monthly Membership',
  planType: 'renewal',
  visibility: 'visible',
  currency: 'usd',
  renewalPrice: '29.99',
  billingPeriod: 30,
  trialPeriodDays: 7
})

// Update a plan (full chain)
await client
  .company('biz_xxx')
  .product('prod_xxx')
  .plan('plan_xxx')
  .update({ renewalPrice: '39.99' })

// List memberships with total spend
const memberships = await company.memberships.list()
for (const m of memberships.nodes) {
  console.log(`${m.companyMember.user.username}: $${m.totalSpend}`)
}

// Filter memberships
const filtered = await company.memberships.list({
  filters: { status: 'active' },
  first: 50
})
```

## Legacy API (Deprecated)

The old flat API still works for backwards compatibility:

```typescript
// List owned companies (use client.me.companies.list() instead)
const companies = await whop.companies.list()

// List company's apps (use client.company(id).apps.list() instead)
const apps = await whop.companies.listApps('biz_xxx')

// Other legacy methods still available...
```

## Token Storage Options

### File-based (Default)

```typescript
// Auto-loads from .whop-session.json
const whop = new Whop()

// Custom file path
const whop = new Whop('./my-session.json')

// Disable auto-load
const whop = new Whop({ autoLoad: false })
```

### Database-backed (Server environments)

Perfect for server applications where tokens need to be stored per user:

```typescript
import { Whop } from '@whoplabs/whop-client'

// Load tokens from database
const tokens = await db.getWhopTokens(userId)

// Create client with refresh callback
const whop = Whop.fromTokens(tokens, {
  onTokenRefresh: async (newTokens) => {
    // Automatically called when tokens are refreshed
    await db.saveWhopTokens(userId, newTokens)
    console.log('Tokens updated in database')
  }
})

// Now use the client - tokens will auto-refresh and save
const companies = await whop.companies.list()
```

The `onTokenRefresh` callback:
- Called automatically when Whop's API returns new tokens
- Supports both sync and async functions
- Errors are caught and logged (won't fail your requests)
- Works with both `new Whop()` and `Whop.fromTokens()`

### Ephemeral (In-memory only)

```typescript
const whop = new Whop({ autoLoad: false })
whop.setTokens({
  accessToken: '...',
  csrfToken: '...',
  refreshToken: '...'
})
// Tokens refresh in memory but aren't persisted anywhere
```

## Current User

```typescript
// Get authenticated user info
const user = await whop.me.get()

console.log(user.username)      // 'c0nstantine'
console.log(user.email)         // 'your@email.com'
console.log(user.id)            // 'user_xxx'
console.log(user.profilePic48.original) // Profile picture URL
```

## Apps

```typescript
// Create new app
const app = await whop.apps.create({
  name: 'My App',
  companyId: 'biz_xxx',
  baseUrl: 'https://myapp.com'  // Optional
})

// Get public details
const details = await whop.apps.get('app_xxx')

// Update app
const updated = await whop.apps.update('app_xxx', {
  name: 'New Name',
  description: 'Updated description',
  status: 'live', // 'live' | 'unlisted' | 'hidden'
  baseUrl: 'https://myapp.com',
  baseDevUrl: 'http://localhost:3000',
})

// Get credentials (API keys, URLs, agent users)
const creds = await whop.apps.getCredentials('app_xxx', 'biz_xxx')
console.log(creds.apiKey.token)
console.log(creds.baseDevUrl)
console.log(creds.agentUsers[0].username)

// Get app URL for dashboard access
const url = await whop.apps.getUrl('app_xxx', 'biz_xxx')
console.log(url) // https://whop.com/biz_xxx/app-name-123/app
```

## App Store

Browse and search public apps from the Whop app store with filtering, sorting, pagination, and search:

```typescript
// Basic query (first page)
const result = await whop.appStore.query({
  first: 20,
  orderBy: 'total_installs_last_30_days',
  viewType: 'hub'
})

console.log(`Found ${result.nodes.length} apps`)
console.log(`Total: ${result.totalCount}`)

// Filter by category
const aiApps = await whop.appStore.query({
  first: 20,
  category: 'ai',
  orderBy: 'total_installs_last_30_days',
  viewType: 'hub'
})

// Search query
const searchResults = await whop.appStore.query({
  first: 20,
  query: 'analytics',
  orderBy: 'discoverable_at',
  viewType: 'hub'
})

// Pagination (next page)
const firstPage = await whop.appStore.query({
  first: 20,
  viewType: 'hub'
})

if (firstPage.pageInfo.hasNextPage) {
  const secondPage = await whop.appStore.query({
    first: 20,
    after: firstPage.pageInfo.endCursor,
    viewType: 'hub'
  })
}

// Sort by most active apps
const mostActive = await whop.appStore.query({
  first: 10,
  orderBy: 'daily_active_users',
  viewType: 'hub'
})

// Sort by hottest apps (most time spent)
const hottest = await whop.appStore.query({
  first: 10,
  orderBy: 'time_spent_last_24_hours',
  viewType: 'hub'
})

// Combined filters
const filtered = await whop.appStore.query({
  first: 20,
  category: 'business-productivity',
  query: 'crm',
  orderBy: 'time_spent_last_24_hours',
  viewType: 'dashboard'
})
```

### Available Categories

- `community` - Community apps
- `business-productivity` - Business and productivity tools
- `games` - Gaming apps
- `sports` - Sports-related apps
- `social-media` - Social media apps
- `trading` - Trading apps
- `ai` - AI-powered apps
- `education` - Educational apps
- `ecommerce-shopping` - E-commerce and shopping apps
- `health-fitness` - Health and fitness apps
- `travel` - Travel apps

### Sort Options

- `total_installs_last_30_days` - Most installs in last 30 days (default)
- `time_spent_last_24_hours` - Most time spent ("hottest" apps)
- `discoverable_at` - Most recently discoverable
- `daily_active_users` - Most daily active users

### View Types

- `hub` - Apps displayed in hub/joined view (default)
- `dashboard` - Apps displayed in creator dashboard
- `discover` - Apps displayed in public discovery page
- `analytics` - Analytics view
- `dash` - Dash view

## Error Handling

```typescript
import { WhopAuthError, WhopHTTPError } from '@whoplabs/whop-client'

try {
  await whop.auth.verify({ email, code, ticket })
} catch (error) {
  if (error instanceof WhopAuthError) {
    console.error('Auth failed:', error.code)
  } else if (error instanceof WhopHTTPError) {
    console.error('HTTP error:', error.statusCode)
  }
}
```

## TypeScript

Full type safety included:

```typescript
import type { 
  Company, 
  App, 
  AppCredentials,
  CurrentUser,
  UpdateAppInput,
  Experience,
  ExperiencesConnection,
  AccessPass,
  AccessPassesConnection,
  CreateAccessPassInput,
  CreatedAccessPass,
  UpdateAccessPassInput,
  UpdatedAccessPass,
  Plan,
  CreatePlanInput,
  UpdatePlanInput,
  AccessPassPlansConnection,
  PublicApp,
  AppStoreResponse,
  QueryAppStoreOptions
} from '@whoplabs/whop-client'

const companies: Company[] = await whop.companies.list()
const creds: AppCredentials = await whop.apps.getCredentials('app_xxx', 'biz_xxx')
const user: CurrentUser = await whop.me.get()
const experiences: ExperiencesConnection = await whop.companies.listExperiences('biz_xxx')
const passes: AccessPassesConnection = await whop.companies.listAccessPasses('biz_xxx')
const appStore: AppStoreResponse = await whop.appStore.query({ first: 20, viewType: 'hub' })
```

## License

MIT
