import type { Whop } from '@/client'
import { CompanyApps } from './apps'
import { CompanyExperiences } from './experiences'
import { CompanyMemberships } from './memberships'
import { CompanyProducts } from './products'

/**
 * Company builder - provides access to company-scoped resources
 * Returned by client.company(id)
 */
export class CompanyBuilder {
	public readonly apps: CompanyApps
	public readonly experiences: CompanyExperiences
	public readonly memberships: CompanyMemberships
	public readonly products: CompanyProducts

	constructor(
		readonly client: Whop,
		public readonly id: string,
	) {
		this.apps = new CompanyApps(client, id)
		this.experiences = new CompanyExperiences(client, id)
		this.memberships = new CompanyMemberships(client, id)
		this.products = new CompanyProducts(client, id)
	}
}
