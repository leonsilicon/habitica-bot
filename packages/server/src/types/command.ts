import {
	type ChatInputCommandInteraction,
	type SlashCommandBuilder,
} from 'discord.js'

export interface SlashCommand<
	S extends Partial<SlashCommandBuilder> = Partial<SlashCommandBuilder>
> {
	data: S
	execute(interaction: ChatInputCommandInteraction): Promise<void>
}
