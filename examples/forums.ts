/**
 * Example: Working with Forum Experiences
 *
 * This demonstrates how to list forums, fetch posts, and manage comments
 * using the Whop SDK's forum resources.
 */

import { Whop } from '../src'

async function main() {
	const client = new Whop()

	// ============================================
	// LIST FORUM EXPERIENCES
	// ============================================
	console.log('\n=== List Forum Experiences ===')
	const forums = await client.company('biz_xxx').forums.list()

	console.log(`Found ${forums.length} forum experiences`)
	for (const forum of forums) {
		console.log(`\n  - ${forum.name}`)
		console.log(`    ID: ${forum.id}`)
		console.log(`    App: ${forum.app.name}`)
		if (forum.description) {
			console.log(`    Description: ${forum.description}`)
		}
	}

	if (forums.length === 0) {
		console.log('\nNo forums found. Exiting.')
		return
	}

	// Use the first forum for examples
	const forumId = forums[0].id
	const forum = client.company('biz_xxx').forum(forumId)

	// ============================================
	// LIST POSTS (WITHOUT COMMENTS)
	// ============================================
	console.log('\n=== List Posts (Without Comments) ===')
	const postsResult = await forum.posts.list({
		limit: 10,
	})

	console.log(`Found ${postsResult.posts.length} posts`)
	console.log(`Has next page: ${postsResult.pagination.hasNextPage}`)

	for (const post of postsResult.posts.slice(0, 3)) {
		console.log(`\n  - ${post.title}`)
		console.log(`    ID: ${post.id}`)
		console.log(`    Author: ${post.user.name} (@${post.user.username})`)
		console.log(`    Comments: ${post.commentCount}`)
		console.log(`    Views: ${post.viewCount}`)
		console.log(`    Pinned: ${post.pinned ? 'Yes' : 'No'}`)
		if (post.content) {
			const preview = post.content.substring(0, 100)
			console.log(
				`    Preview: ${preview}${post.content.length > 100 ? '...' : ''}`,
			)
		}
	}

	// ============================================
	// LIST POSTS (WITH COMMENTS)
	// ============================================
	console.log('\n=== List Posts (With Comments) ===')
	const postsWithComments = await forum.posts.list({
		limit: 5,
		withComments: true,
	})

	console.log(`Found ${postsWithComments.posts.length} posts with comments`)
	for (const post of postsWithComments.posts.slice(0, 2)) {
		console.log(`\n  - ${post.title}`)
		console.log(`    Total comments: ${post.comments.length}`)

		// Show first-level comments
		for (const comment of post.comments.slice(0, 2)) {
			console.log(
				`      └─ ${comment.user.username}: ${comment.content.substring(0, 50)}...`,
			)
			if (comment.children.length > 0) {
				console.log(`         └─ ${comment.children.length} replies`)
			}
		}
	}

	// ============================================
	// PAGINATE POSTS
	// ============================================
	console.log('\n=== Paginate Posts ===')
	let before: string | undefined
	let page = 1

	do {
		const pageResult = await forum.posts.list({
			limit: 5,
			before,
		})

		console.log(`\nPage ${page}: ${pageResult.posts.length} posts`)
		for (const post of pageResult.posts) {
			console.log(`  - ${post.title}`)
		}

		if (pageResult.pagination.hasNextPage && pageResult.pagination.nextBefore) {
			before = pageResult.pagination.nextBefore
			page++
		} else {
			break
		}
	} while (page <= 3) // Limit to 3 pages for demo

	// ============================================
	// GET COMMENTS FOR A SPECIFIC POST
	// ============================================
	if (postsResult.posts.length > 0) {
		const firstPost = postsResult.posts[0]
		console.log(`\n=== Comments for Post: ${firstPost.title} ===`)

		const commentsResult = await forum.post(firstPost.id).comments.list({
			limit: 20,
		})

		console.log(`Found ${commentsResult.posts.length} comments`)
		console.log(`Total: ${commentsResult.totalCount}`)
		console.log(`Has next page: ${commentsResult.pagination.hasNextPage}`)

		// Display first few comments
		for (const comment of commentsResult.posts.slice(0, 5)) {
			console.log(`\n  - ${comment.user.name} (@${comment.user.username})`)
			console.log(
				`    ${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}`,
			)
			console.log(`    Replies: ${comment.commentCount}`)
		}
	}

	// ============================================
	// PAGINATE COMMENTS
	// ============================================
	if (postsResult.posts.length > 0) {
		const firstPost = postsResult.posts[0]
		console.log(`\n=== Paginate Comments for Post: ${firstPost.title} ===`)

		let commentBefore: string | undefined
		let commentPage = 1

		do {
			const commentPageResult = await forum.post(firstPost.id).comments.list({
				limit: 10,
				before: commentBefore,
			})

			console.log(
				`\nComment Page ${commentPage}: ${commentPageResult.posts.length} comments`,
			)
			for (const comment of commentPageResult.posts.slice(0, 3)) {
				console.log(
					`  - ${comment.user.username}: ${comment.content.substring(0, 50)}...`,
				)
			}

			if (
				commentPageResult.pagination.hasNextPage &&
				commentPageResult.pagination.nextBefore
			) {
				commentBefore = commentPageResult.pagination.nextBefore
				commentPage++
			} else {
				break
			}
		} while (commentPage <= 2) // Limit to 2 pages for demo
	}
}

// Run the example
main().catch(console.error)
