# App Details

Retrieve detailed information about a specific app.

## Get App

```typescript
import { Whop } from '@whop/core-auth'

const whop = new Whop()

const app = await whop.apps.get('app_xxx')

console.log(app.name)
console.log(app.description)
console.log(app.totalInstalls)
console.log(app.verified)
```

## Response Type

```typescript
interface AppDetails {
  id: string
  name: string
  description: string | null
  appStoreDescription: string | null
  totalInstalls: number
  verified: boolean
  stats: {
    mau: number
  }
  icon?: {
    source: {
      url: string
    }
  }
  creator: {
    id: string
    name: string
    username: string
    roles: string[]
    profilePicture?: {
      source: {
        url: string
      }
    }
  }
  accessPass?: {
    title: string
    route: string
    headline: string | null
    attachments: Array<{
      source: {
        url: string
      }
      contentType: string
      blurhash?: string
    }>
    marketplaceCategory?: {
      route: string
    }
  }
}
```
