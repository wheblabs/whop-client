# @whoplabs/whop-client

Unofficial SDK for Whop account automation. Authenticate, create apps, manage companies programmatically.

## Installation

```bash
bun add @whoplabs/whop-client
```

## Quick Start

```typescript
import { Whop } from '@whoplabs/whop-client'

const whop = new Whop()

// First run: authenticate with OTP
if (!whop.isAuthenticated()) {
  const ticket = await whop.auth.sendOTP('your@email.com')
  await whop.auth.verify({ email: 'your@email.com', code: '123456', ticket })
}

// Subsequent runs: session auto-loads
const user = await whop.me.get()
console.log(`Logged in as ${user.username}`)

const companies = await whop.companies.list()
const apps = await whop.companies.listApps(companies[0].id)
```

## Core Concepts

**Sessions persist automatically.** First auth saves to `.whop-session.json`. Next run loads it. Add to `.gitignore`.

**Tokens refresh automatically.** Every request refreshes expired tokens. Never manually refresh.

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
```

## Companies

```typescript
// List owned companies
const companies = await whop.companies.list()

// List company's apps
const apps = await whop.companies.listApps('biz_xxx')

// List company's experiences
const result = await whop.companies.listExperiences('biz_xxx')
console.log(`Total: ${result.totalCount}`)
for (const exp of result.experiences) {
  console.log(`${exp.name} - ${exp.app.name}`)
}

// Filter experiences by app
const filtered = await whop.companies.listExperiences('biz_xxx', {
  appId: 'app_xxx'
})

// List company's access passes (products)
const passes = await whop.companies.listAccessPasses('biz_xxx')
console.log(`Total products: ${passes.totalCount}`)
for (const pass of passes.accessPasses) {
  console.log(`${pass.title} - ${pass.activeMembersCount} members`)
  console.log(`Price: ${pass.defaultPlan?.formattedPrice || 'N/A'}`)
}

// Create a new access pass (product)
const newPass = await whop.companies.createAccessPass({
  title: 'My Premium Community',
  companyId: 'biz_xxx',
  headline: 'Exclusive access',
  description: 'Join our community',
  visibility: 'visible',
  planOptions: {
    baseCurrency: 'USD',
    renewalPrice: 29.99,
    planType: 'renewal',
    billingPeriod: 30
  }
})
console.log(`Created: ${newPass.title} at /${newPass.route}`)

// Update an existing access pass
const updatedPass = await whop.companies.updateAccessPass({
  id: 'prod_xxx',
  title: 'New Product Name',
  visibility: 'visible',
  showMemberCount: true
})

// Create a plan for an access pass
const plan = await whop.companies.createPlan({
  productId: 'prod_xxx',
  title: 'Monthly Membership',
  planType: 'renewal',
  visibility: 'visible',
  currency: 'usd',
  renewalPrice: '29.99',
  billingPeriod: 30,
  trialPeriodDays: 7
})
console.log(`Checkout link: ${plan.directLink}`)

// Update a plan
const updatedPlan = await whop.companies.updatePlan({
  id: 'plan_xxx',
  renewalPrice: '39.99',
  setAsDefault: true
})

// Install app to company
const exp = await whop.companies.installApp('biz_xxx', 'app_xxx')
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
  UpdatePlanInput
} from '@whoplabs/whop-client'

const companies: Company[] = await whop.companies.list()
const creds: AppCredentials = await whop.apps.getCredentials('app_xxx', 'biz_xxx')
const user: CurrentUser = await whop.me.get()
const experiences: ExperiencesConnection = await whop.companies.listExperiences('biz_xxx')
const passes: AccessPassesConnection = await whop.companies.listAccessPasses('biz_xxx')
```

## License

MIT
