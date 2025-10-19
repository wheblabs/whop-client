# Error Handling

Handle authentication and API errors.

## Authentication Errors

```typescript
import { Whop, WhopAuthError } from '@whop/core-auth'

try {
  const whop = new Whop()
  await whop.auth.verify({ email, code, ticket })
} catch (error) {
  if (error instanceof WhopAuthError) {
    console.log(error.message)
    console.log(error.code)
    console.log(error.details)
  }
}
```

## API Errors

```typescript
import { WhopAPIError } from '@whop/core-auth'

try {
  const companies = await whop.companies.list()
} catch (error) {
  if (error instanceof WhopAPIError) {
    console.log(error.statusCode)
    console.log(error.message)
  }
}
```

## Network Errors

```typescript
import { WhopNetworkError } from '@whop/core-auth'

try {
  const apps = await whop.companies.listApps('biz_xxx')
} catch (error) {
  if (error instanceof WhopNetworkError) {
    console.log('Network request failed')
    console.log(error.message)
  }
}
```

## Error Types

All errors extend `WhopError`:

```typescript
import {
  WhopError,
  WhopAuthError,
  WhopAPIError,
  WhopNetworkError,
  WhopParseError,
  WhopServerActionNotFoundError,
} from '@whop/core-auth'
```
