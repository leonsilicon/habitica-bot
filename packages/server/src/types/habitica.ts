export interface HabiticaRequest {
	type: string
	direction: string
	delta: number
	task: {
		repeat: {
			m: boolean
			t: boolean
			w: boolean
			th: boolean
			f: boolean
			s: boolean
			su: boolean
		}
		challenge: Record<string, unknown>
		group: {
			completedBy: Record<string, unknown>
			assignedUsers: unknown[]
		}
		frequency: string
		everyX: number
		streak: number
		nextDue: string[]
		yesterDaily: true
		history: Array<Record<string, unknown>>
		completed: boolean
		collapseChecklist: boolean
		type: string
		notes: string
		tags: unknown[]
		value: number
		priority: number
		attribute: string
		byHabitica: boolean
		startDate: string
		daysOfMonth: unknown[]
		weeksOfMonth: unknown[]
		checklist: unknown[]
		reminders: unknown[]
		createdAt: string
		updatedAt: string
		_id: string
		text: string
		userId: string
		isDue: boolean
		id: string
	}
	user: {
		_id: string
		stats: {
			buffs: Record<string, unknown>
			training: Record<string, unknown>
			hp: number
			mp: number
			exp: number
			gp: number
			lvl: number
			class: string
			points: number
			str: number
			con: number
			int: number
			per: number
			toNextLevel: number
			maxHealth: number
			maxMP: number
		}
		webhookType: string
	}
}

export interface HabiticaUser {
	profile: { name: string }
	auth: { local: { username: string } }
}
