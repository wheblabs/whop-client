# Listing Companies

Retrieve companies associated with the authenticated user.

## List Companies

```typescript
import { Whop } from '@whop/core-auth'

const whop = new Whop()

const companies = await whop.companies.list()

for (const company of companies) {
  console.log(company.title)
  console.log(company.id)

  if (company.image) {
    console.log(company.image.original)
  }
}
```

## Response Type

```typescript
interface Company {
  id: string
  title: string
  image?: {
    original: string
    isVideo: boolean
  }
  staticImage?: {
    original: string
    isVideo: boolean
  }
}
```
