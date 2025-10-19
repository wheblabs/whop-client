export interface ServerAction {
	id: string
	name: string
}

export type RSCResult<T> =
	| { success: true; data: T }
	| { success: false; error: string }
