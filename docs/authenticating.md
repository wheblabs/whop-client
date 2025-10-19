# Authenticating

Authenticate users with OTP (one-time password) sent to their email.

## Send OTP

```typescript
import { Whop } from '@whop/core-auth'

const whop = new Whop()

const ticket = await whop.auth.sendOTP('user@example.com')
```

## Verify OTP

```typescript
await whop.auth.verify({
  email: 'user@example.com',
  code: '123456',
  ticket,
})

// Session is automatically saved
console.log(whop.isAuthenticated()) // true
```

## Check Authentication

```typescript
if (whop.isAuthenticated()) {
  const tokens = whop.getTokens()
  console.log(tokens.userId)
  console.log(tokens.accessToken)
}
```

## Session Management

### Auto-load Existing Session

Sessions are persisted automatically to `.whop-session.json`:

```typescript
const whop = new Whop()

if (whop.isAuthenticated()) {
  // Session was loaded automatically
}
```

### Custom Session Path

```typescript
const whop = new Whop('./my-session.json')

await whop.auth.verify({ email, code, ticket })
// Saved to ./my-session.json
```

### Disable Auto-load

```typescript
const whop = new Whop({ autoLoad: false })

// Must authenticate manually
if (!whop.isAuthenticated()) {
  await whop.auth.sendOTP('user@example.com')
}
```

### Manual Session Save

```typescript
const whop = new Whop()
await whop.auth.verify({
  email,
  code,
  ticket,
  persist: false, // Don't auto-save
})

// Save manually later
await whop.saveSession()

// Or save to custom location
await whop.saveSession('./backup/session.json')
```

### Ephemeral Sessions

For temporary sessions that don't persist:

```typescript
const whop = new Whop()
await whop.auth.verify({
  email,
  code,
  ticket,
  persist: false,
})

// Tokens only in memory, lost when process exits
```

## Using Existing Tokens

Create a client from tokens stored elsewhere:

```typescript
const tokens = {
  accessToken: process.env.WHOP_ACCESS_TOKEN,
  csrfToken: process.env.WHOP_CSRF_TOKEN,
  refreshToken: process.env.WHOP_REFRESH_TOKEN,
}

const whop = Whop.fromTokens(tokens)
console.log(whop.isAuthenticated()) // true
```

Or set tokens directly:

```typescript
const whop = new Whop({ autoLoad: false })
whop.setTokens({
  accessToken: 'your-access-token',
  csrfToken: 'your-csrf-token',
  refreshToken: 'your-refresh-token',
})
```
