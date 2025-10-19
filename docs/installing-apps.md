# Installing Apps

Install an app to a company and create an experience.

## Install App

```typescript
import { Whop } from '@whop/core-auth'

const whop = new Whop()

const experience = await whop.companies.installApp(
  'biz_xxx', // company ID
  'app_xxx', // app ID
)

console.log(experience.id)
console.log(experience.name)
console.log(experience.company.id)
```

## Response Type

```typescript
interface Experience {
  id: string
  name: string
  company: {
    id: string
  }
  accessPasses: Array<{
    id: string
  }>
}
```

## Access Passes

The created experience includes access passes:

```typescript
const experience = await whop.companies.installApp('biz_xxx', 'app_xxx')

for (const pass of experience.accessPasses) {
  console.log(pass.id)
}
```
