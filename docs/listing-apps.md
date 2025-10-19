# Listing Apps

Retrieve apps installed on a company.

## List Apps

```typescript
import { Whop } from '@whop/core-auth'

const whop = new Whop()

const apps = await whop.companies.listApps('biz_xxx')

for (const app of apps) {
  console.log(app.name)
  console.log(app.id)
  console.log(`DAU: ${app.stats.dau}`)
  console.log(`MAU: ${app.stats.mau}`)
}
```

## Response Type

```typescript
interface App {
  id: string
  name: string
  stats: {
    dau: number
    wau: number
    mau: number
    timeSpentLast24HoursInSeconds: number
  }
}
```

## Pagination

```typescript
// Get first 10 apps
const apps = await whop.companies.listApps('biz_xxx', {
  first: 10,
})

// Get next page
const nextApps = await whop.companies.listApps('biz_xxx', {
  first: 10,
  after: apps.pageInfo.endCursor,
})
```
