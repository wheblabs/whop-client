import { existsSync, readFileSync } from 'node:fs'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { AuthTokens } from '../types/auth'
import { WhopParseError } from './errors'

/**
 * Session file format
 */
export interface SessionData {
	version: number
	tokens: AuthTokens
	createdAt: string
	updatedAt: string
}

/**
 * Load session from file synchronously
 * Returns undefined if file doesn't exist or on parse errors
 * Used for auto-loading in constructor
 */
export function loadSessionSync(path: string): AuthTokens | undefined {
	if (!existsSync(path)) {
		return undefined
	}

	try {
		const content = readFileSync(path, 'utf-8')
		const data = JSON.parse(content)

		if (isValidSessionData(data)) {
			return data.tokens
		}

		return undefined
	} catch {
		// Silently fail - corrupted file or no permissions
		return undefined
	}
}

/**
 * Load session from file (async version)
 * Returns undefined if file doesn't exist
 * Throws on parse errors or invalid format
 */
export async function loadSession(
	path: string,
): Promise<AuthTokens | undefined> {
	if (!existsSync(path)) {
		return undefined
	}

	let content: string
	try {
		content = await readFile(path, 'utf-8')
	} catch (error) {
		throw new WhopParseError(
			`Failed to read session file: ${error instanceof Error ? error.message : 'unknown error'}`,
			'session_file',
			`Check file permissions for: ${path}`,
		)
	}

	let data: unknown
	try {
		data = JSON.parse(content)
	} catch (_error) {
		throw new WhopParseError(
			'Session file is not valid JSON',
			'session_json',
			`Delete the corrupted file: ${path}`,
		)
	}

	// Validate structure
	if (!isValidSessionData(data)) {
		throw new WhopParseError(
			'Session file has invalid structure',
			'session_structure',
			`Expected version, tokens, createdAt, updatedAt fields`,
		)
	}

	return data.tokens
}

/**
 * Save session to file with restrictive permissions
 */
export async function saveSession(
	path: string,
	tokens: AuthTokens,
): Promise<void> {
	const sessionData: SessionData = {
		version: 1,
		tokens,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	}

	const content = JSON.stringify(sessionData, null, 2)

	// Ensure directory exists
	const dir = dirname(path)
	try {
		await mkdir(dir, { recursive: true })
	} catch (error) {
		// Ignore if already exists
		if (error instanceof Error && !error.message.includes('EEXIST')) {
			throw error
		}
	}

	// Write file
	try {
		await writeFile(path, content, 'utf-8')
	} catch (error) {
		throw new WhopParseError(
			`Failed to write session file: ${error instanceof Error ? error.message : 'unknown error'}`,
			'session_write',
			`Check write permissions for: ${path}`,
		)
	}

	// Set restrictive permissions (0600 = owner read/write only)
	try {
		await chmod(path, 0o600)
	} catch (_error) {
		// Warn but don't fail - file is already written
		console.warn(
			`Warning: Could not set restrictive permissions on session file: ${path}`,
		)
	}
}

/**
 * Type guard for SessionData
 */
function isValidSessionData(data: unknown): data is SessionData {
	if (typeof data !== 'object' || data === null) {
		return false
	}

	const d = data as Record<string, unknown>

	return (
		typeof d.version === 'number' &&
		typeof d.tokens === 'object' &&
		d.tokens !== null &&
		typeof d.createdAt === 'string' &&
		typeof d.updatedAt === 'string' &&
		hasRequiredTokens(d.tokens)
	)
}

/**
 * Validate required token fields
 */
function hasRequiredTokens(tokens: unknown): tokens is AuthTokens {
	if (typeof tokens !== 'object' || tokens === null) {
		return false
	}

	const t = tokens as Record<string, unknown>

	return (
		typeof t.accessToken === 'string' &&
		typeof t.csrfToken === 'string' &&
		typeof t.refreshToken === 'string'
	)
}
