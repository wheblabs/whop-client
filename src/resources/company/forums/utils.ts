import type { ForumPost, TreePost } from '@/types/forums'

/**
 * Build a comment tree from a flat array of comments
 *
 * @param comments - Flat array of comments (ForumPost[])
 * @param rootPostId - The ID of the root post these comments belong to
 * @returns Tree structure with nested children
 */
export function buildCommentTree(
	comments: ForumPost[],
	rootPostId: string,
): TreePost[] {
	const map = new Map<string, TreePost>()

	// Create nodes
	for (const comment of comments) {
		map.set(comment.id, {
			...comment,
			depth: -1,
			children: [],
			isOrphan: false,
			isChildLess: false,
		})
	}

	const roots: TreePost[] = []

	// Link children to parents
	for (const node of map.values()) {
		if (node.parentId && map.has(node.parentId)) {
			// Parent exists in current data
			map.get(node.parentId)?.children.push(node)
		} else if (node.parentId === rootPostId) {
			// Direct child of root post
			roots.push(node)
		} else if (node.parentId) {
			// Orphan: parent not in current data
			node.isOrphan = true
			roots.push(node)
		}
	}

	// Assign depth and sort
	function assignDepthAndSort(list: TreePost[], depth: number) {
		// Sort: depth 0 newest->oldest, depth >=1 oldest->newest
		const asc = depth >= 1
		list.sort((a, b) =>
			asc
				? Number(BigInt(a.createdAt) - BigInt(b.createdAt))
				: Number(BigInt(b.createdAt) - BigInt(a.createdAt)),
		)

		for (const item of list) {
			item.depth = depth
			if (item.children.length) {
				assignDepthAndSort(item.children, depth + 1)
			}
		}
	}

	assignDepthAndSort(roots, 0)

	// Mark childless posts
	function markChildLess(list: TreePost[]) {
		for (const item of list) {
			if (item.commentCount > 0 && item.children.length === 0) {
				item.isChildLess = true
			}
			if (item.children.length) markChildLess(item.children)
		}
	}

	markChildLess(roots)

	return roots
}
