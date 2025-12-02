/**
 * semantic-release configuration
 * @see https://semantic-release.gitbook.io/semantic-release/usage/configuration
 */
export default {
	branches: ['main'],
	plugins: [
		// Analyze commits to determine version bump
		[
			'@semantic-release/commit-analyzer',
			{
				preset: 'conventionalcommits',
				releaseRules: [
					{ type: 'feat', release: 'minor' },
					{ type: 'fix', release: 'patch' },
					{ type: 'perf', release: 'patch' },
					{ type: 'refactor', release: 'patch' },
					{ type: 'docs', release: false },
					{ type: 'style', release: false },
					{ type: 'chore', release: false },
					{ type: 'test', release: false },
					{ type: 'ci', release: false },
					{ breaking: true, release: 'major' },
				],
			},
		],
		// Generate release notes
		[
			'@semantic-release/release-notes-generator',
			{
				preset: 'conventionalcommits',
				presetConfig: {
					types: [
						{ type: 'feat', section: 'Features' },
						{ type: 'fix', section: 'Bug Fixes' },
						{ type: 'perf', section: 'Performance Improvements' },
						{ type: 'refactor', section: 'Code Refactoring' },
						{ type: 'docs', section: 'Documentation', hidden: true },
						{ type: 'style', section: 'Styles', hidden: true },
						{ type: 'chore', section: 'Miscellaneous', hidden: true },
						{ type: 'test', section: 'Tests', hidden: true },
						{ type: 'ci', section: 'CI/CD', hidden: true },
					],
				},
			},
		],
		// Update CHANGELOG.md
		'@semantic-release/changelog',
		// Update package.json version
		'@semantic-release/npm',
		// Create GitHub release and commit changes
		[
			'@semantic-release/github',
			{
				assets: [],
			},
		],
		// Commit the changelog and package.json changes
		[
			'@semantic-release/git',
			{
				assets: ['CHANGELOG.md', 'package.json'],
				message:
					'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
			},
		],
	],
}
