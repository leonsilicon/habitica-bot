type EnvKey = 'DISCORD_TOKEN' | 'HABITICA_API_TOKEN' | 'HABITICA_USER_ID'

export function env(key: EnvKey) {
	const value = process.env[key]
	if (value === undefined) {
		throw new Error(`Environment variable ${key} not found in environment.`)
	}

	return value
}
