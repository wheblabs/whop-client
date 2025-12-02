import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	Affiliate,
	AffiliatePlan,
	AffiliatesConnection,
	CreateAffiliateInput,
	CreateExternalLinkInput,
	ExternalLink,
	ListAffiliatesOptions,
	ListExternalLinksOptions,
	RevSharePartner,
	UpdateAffiliateInput,
	UpdateExternalLinkInput,
} from './types'

// GraphQL Fragment
const AFFILIATE_FRAGMENT = `
  fragment CompanyAffiliate on Affiliate {
    id
    totalPlanCount
    totalOverridesCount
    companyMember {
      id
    }
    user {
      id
      header
      username
      profilePic
    }
    status
    affiliateType
    totalReferrals
    totalReferralEarnings
    customerRetention
    customerRetention90Days
    totalRevenue
    mrr
    activeMembersCount
  }
`

/**
 * External links sub-resource
 */
export class AffiliateExternalLinks {
	constructor(private readonly client: Whop) {}

	/**
	 * List external tracking links
	 */
	async list(options: ListExternalLinksOptions): Promise<ExternalLink[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyExternalLinks($id: ID!, $first: Int, $after: String) {
        company(id: $id) {
          externalLinks(first: $first, after: $after) {
            nodes {
              id
              url
              title
              clicks
              conversions
              createdAt
            }
          }
        }
      }
    `

		interface FetchLinksResponse {
			company: {
				externalLinks: { nodes: ExternalLink[] }
			}
		}

		const response = await graphqlRequest<FetchLinksResponse>(
			'fetchCompanyExternalLinks',
			{
				query,
				variables: {
					id: options.companyId,
					first: options.first || 50,
					after: options.after || null,
				},
				operationName: 'fetchCompanyExternalLinks',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.externalLinks.nodes
	}

	/**
	 * Create an external tracking link
	 */
	async create(input: CreateExternalLinkInput): Promise<ExternalLink> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation coreCreateExternalLink($input: CreateExternalLinkInput!) {
        createExternalLink(input: $input) {
          id
          url
          title
          clicks
          conversions
          createdAt
        }
      }
    `

		interface CreateLinkResponse {
			createExternalLink: ExternalLink
		}

		const response = await graphqlRequest<CreateLinkResponse>(
			'coreCreateExternalLink',
			{
				query: mutation,
				variables: { input },
				operationName: 'coreCreateExternalLink',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createExternalLink
	}

	/**
	 * Update an external link
	 */
	async update(
		linkId: string,
		input: Omit<UpdateExternalLinkInput, 'id'>,
	): Promise<ExternalLink> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation coreUpdateExternalLink($input: UpdateExternalLinkInput!) {
        updateExternalLink(input: $input) {
          id
          url
          title
          clicks
          conversions
          createdAt
        }
      }
    `

		interface UpdateLinkResponse {
			updateExternalLink: ExternalLink
		}

		const response = await graphqlRequest<UpdateLinkResponse>(
			'coreUpdateExternalLink',
			{
				query: mutation,
				variables: { input: { ...input, id: linkId } },
				operationName: 'coreUpdateExternalLink',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateExternalLink
	}

	/**
	 * Delete an external link
	 */
	async delete(linkId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation coreDeleteExternalLink($id: ID!) {
        deleteExternalLink(input: { id: $id })
      }
    `

		interface DeleteLinkResponse {
			deleteExternalLink: boolean
		}

		const response = await graphqlRequest<DeleteLinkResponse>(
			'coreDeleteExternalLink',
			{
				query: mutation,
				variables: { id: linkId },
				operationName: 'coreDeleteExternalLink',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deleteExternalLink
	}
}

/**
 * Affiliates resource - Manage affiliate partners and revenue sharing
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List affiliates
 * const { affiliates } = await whop.affiliates.list({ companyId: 'biz_xxx' })
 *
 * // Create a rev-share affiliate
 * const affiliate = await whop.affiliates.create({
 *   companyId: 'biz_xxx',
 *   userId: 'user_xxx',
 *   affiliateType: 'revshare',
 *   revenueSharePercent: 20
 * })
 * ```
 */
export class Affiliates {
	public readonly externalLinks: AffiliateExternalLinks

	constructor(private readonly client: Whop) {
		this.externalLinks = new AffiliateExternalLinks(client)
	}

	/**
	 * List affiliates for a company
	 */
	async list(options: ListAffiliatesOptions): Promise<AffiliatesConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyAffiliates($id: ID!, $filters: JSON!, $first: Int, $after: String) {
        company(id: $id) {
          creatorDashboardTable(tableFilters: $filters) {
            affiliates(first: $first, after: $after) {
              nodes {
                ...CompanyAffiliate
              }
              totalCount
            }
          }
        }
      }
      ${AFFILIATE_FRAGMENT}
    `

		const filters: Record<string, unknown> = {}
		if (options.status) filters.status = options.status
		if (options.affiliateType) filters.affiliateType = options.affiliateType
		if (options.search) filters.search = options.search

		interface FetchAffiliatesResponse {
			company: {
				creatorDashboardTable: {
					affiliates: {
						nodes: Affiliate[]
						totalCount: number
					}
				}
			}
		}

		const response = await graphqlRequest<FetchAffiliatesResponse>(
			'fetchCompanyAffiliates',
			{
				query,
				variables: {
					id: options.companyId,
					first: options.first || 50,
					after: options.after || null,
					filters,
				},
				operationName: 'fetchCompanyAffiliates',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			affiliates: response.company.creatorDashboardTable.affiliates.nodes,
			totalCount: response.company.creatorDashboardTable.affiliates.totalCount,
		}
	}

	/**
	 * Get a specific affiliate
	 */
	async get(companyId: string, affiliateId: string): Promise<Affiliate> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyAffiliate($companyId: ID!, $affiliateId: ID!) {
        company(id: $companyId) {
          affiliate(id: $affiliateId) {
            ...CompanyAffiliate
          }
        }
      }
      ${AFFILIATE_FRAGMENT}
    `

		interface FetchAffiliateResponse {
			company: {
				affiliate: Affiliate
			}
		}

		const response = await graphqlRequest<FetchAffiliateResponse>(
			'fetchCompanyAffiliate',
			{
				query,
				variables: { companyId, affiliateId },
				operationName: 'fetchCompanyAffiliate',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.affiliate
	}

	/**
	 * Create a rev-share affiliate
	 */
	async create(input: CreateAffiliateInput): Promise<Affiliate> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation createRevShareAffiliate($input: CreateRevShareAffiliateInput!) {
        createRevShareAffiliate(input: $input) {
          ...CompanyAffiliate
        }
      }
      ${AFFILIATE_FRAGMENT}
    `

		interface CreateAffiliateResponse {
			createRevShareAffiliate: Affiliate
		}

		const response = await graphqlRequest<CreateAffiliateResponse>(
			'createRevShareAffiliate',
			{
				query: mutation,
				variables: { input },
				operationName: 'createRevShareAffiliate',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createRevShareAffiliate
	}

	/**
	 * Update an affiliate
	 */
	async update(
		affiliateId: string,
		input: Omit<UpdateAffiliateInput, 'id'>,
	): Promise<Affiliate> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation updateRevshareAffiliate($input: UpdateRevShareAffiliateInput!) {
        updateRevShareAffiliate(input: $input) {
          ...CompanyAffiliate
        }
      }
      ${AFFILIATE_FRAGMENT}
    `

		interface UpdateAffiliateResponse {
			updateRevShareAffiliate: Affiliate
		}

		const response = await graphqlRequest<UpdateAffiliateResponse>(
			'updateRevshareAffiliate',
			{
				query: mutation,
				variables: { input: { ...input, id: affiliateId } },
				operationName: 'updateRevshareAffiliate',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateRevShareAffiliate
	}

	/**
	 * Delete an affiliate
	 */
	async delete(affiliateId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation deleteRevshareAffiliate($id: ID!) {
        deleteRevShareAffiliate(input: { id: $id })
      }
    `

		interface DeleteAffiliateResponse {
			deleteRevShareAffiliate: boolean
		}

		const response = await graphqlRequest<DeleteAffiliateResponse>(
			'deleteRevshareAffiliate',
			{
				query: mutation,
				variables: { id: affiliateId },
				operationName: 'deleteRevshareAffiliate',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deleteRevShareAffiliate
	}

	/**
	 * List affiliate plans for a company
	 */
	async listPlans(companyId: string): Promise<AffiliatePlan[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchCompanyAffiliatePlans($id: ID!) {
        company(id: $id) {
          affiliatePlans {
            id
            title
            revenueSharePercent
            accessPass {
              id
              title
            }
          }
        }
      }
    `

		interface FetchPlansResponse {
			company: {
				affiliatePlans: AffiliatePlan[]
			}
		}

		const response = await graphqlRequest<FetchPlansResponse>(
			'fetchCompanyAffiliatePlans',
			{
				query,
				variables: { id: companyId },
				operationName: 'fetchCompanyAffiliatePlans',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.affiliatePlans
	}

	/**
	 * List rev-share partners
	 */
	async listRevSharePartners(companyId: string): Promise<RevSharePartner[]> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query fetchRevsharePartners($id: ID!) {
        company(id: $id) {
          revSharePartners {
            id
            user {
              id
              username
              profilePic
            }
            revenueSharePercent
            totalEarnings
            pendingEarnings
          }
        }
      }
    `

		interface FetchPartnersResponse {
			company: {
				revSharePartners: RevSharePartner[]
			}
		}

		const response = await graphqlRequest<FetchPartnersResponse>(
			'fetchRevsharePartners',
			{
				query,
				variables: { id: companyId },
				operationName: 'fetchRevsharePartners',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.company.revSharePartners
	}
}

export * from './types'
