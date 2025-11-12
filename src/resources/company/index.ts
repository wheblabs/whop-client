import type { Whop } from '@/client'
import { CompanyApps } from './apps'
import { CompanyExperiences } from './experiences'
import { CompanyFinancials } from './financials'
import { CompanyForums } from './forums'
import { ForumBuilder } from './forums/forum-builder'
import { CompanyMemberships } from './memberships'
import { CompanyProducts } from './products'

/**
 * Company builder - provides access to company-scoped resources
 * Returned by client.company(id)
 */
export class CompanyBuilder {
	public readonly apps: CompanyApps
	public readonly experiences: CompanyExperiences
	public readonly financials: CompanyFinancials
	public readonly forums: CompanyForums
	public readonly memberships: CompanyMemberships
	public readonly products: CompanyProducts

	constructor(
		readonly client: Whop,
		public readonly id: string,
	) {
		this.apps = new CompanyApps(client, id)
		this.experiences = new CompanyExperiences(client, id)
		this.financials = new CompanyFinancials(client, id)
		this.forums = new CompanyForums(client, id)
		this.memberships = new CompanyMemberships(client, id)
		this.products = new CompanyProducts(client, id)
	}

	/**
	 * Access a specific forum by experience ID
	 *
	 * @param experienceId - The forum experience ID
	 * @returns ForumBuilder for the specified forum
	 *
	 * @example
	 * ```typescript
	 * const forum = whop.company('biz_xxx').forum('exp_123')
	 * const posts = await forum.posts.list({ limit: 20 })
	 * ```
	 */
	forum(experienceId: string): ForumBuilder {
		return new ForumBuilder(this.client, this.id, experienceId)
	}
}
