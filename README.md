# whop-core-auth

Automate your Whop account with OTP authentication. Manage companies, install apps, and access the full Whop platform programmatically.

## Installation

```bash
bun add whop-core-auth
```

## Quick Start

```typescript
import { Whop } from 'whop-core-auth'

const whop = new Whop()

// Authenticate with OTP
const ticket = await whop.auth.sendOTP('your@email.com')
const code = '123456' // From email
await whop.auth.verify({ email: 'your@email.com', code, ticket })

// Use authenticated client
const companies = await whop.companies.list()
const apps = await whop.companies.listApps(companies[0].id)
```

## Features

- **OTP Authentication** - Secure email-based login
- **Session Management** - Automatic session persistence
- **Company Management** - List and manage companies
- **App Operations** - List, install, and retrieve app details
- **GraphQL Support** - Direct access to Whop's GraphQL API
- **TypeScript** - Full type safety

## Documentation

- [Authenticating](./docs/authenticating.md) - OTP flow and session management
- [Listing Companies](./docs/listing-companies.md) - Retrieve user companies
- [Listing Apps](./docs/listing-apps.md) - Get company apps with pagination
- [App Details](./docs/app-details.md) - Detailed app information
- [Installing Apps](./docs/installing-apps.md) - Install apps to companies
- [Error Handling](./docs/error-handling.md) - Handle errors properly

## Examples

### Authentication

```typescript
const whop = new Whop()

if (!whop.isAuthenticated()) {
  const ticket = await whop.auth.sendOTP('user@example.com')
  await whop.auth.verify({ email: 'user@example.com', code: '123456', ticket })
}
```

### List Companies

```typescript
const companies = await whop.companies.list()

for (const company of companies) {
  console.log(company.title, company.id)
}
```

### Install App

```typescript
const experience = await whop.companies.installApp('biz_xxx', 'app_xxx')
console.log('Installed:', experience.name)
```

### Using Existing Tokens

```typescript
const whop = Whop.fromTokens({
  accessToken: process.env.WHOP_ACCESS_TOKEN,
  csrfToken: process.env.WHOP_CSRF_TOKEN,
  refreshToken: process.env.WHOP_REFRESH_TOKEN,
})
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
