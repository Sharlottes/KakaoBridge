import { Client, CommandInteraction, Intents } from "discord.js";
import { REST } from "@discordjs/rest";
import { SlashCommandBuilder } from '@discordjs/builders';

import config from "@KakaoBridge/discord.json";
import { Kakao, DiscordCommands, onDiscordMessage } from "@KakaoBridge/kakaos";
import CM from "@KakaoBridge/commands";
import { CommandCategory } from "./@type";

const app = {
  client: new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }),
  config: config,
  rest: new REST({ version: '9' }).setToken(config.botToken)
};

const masterIDs = [
  "462167403237867520",
  "473072758629203980"
];

const { client } = app;

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}(${client.application?.id})`);
});

client.on("interactionCreate", async interaction => {
  if (interaction.isCommand()) {
    const command = CM.commands.get(interaction.commandName);
    if (!command || !interaction.channel) return;
    await interaction.deferReply();

    if (interaction.channel.type == "DM" || !command.dmOnly) command.run(interaction);
    else interaction.editReply("This command is available only in the dm channel.");
  }
});

client.on("messageCreate", async message => {
  if (message.author.id != client.user?.id) onDiscordMessage(message);

  if (message.channel.type === 'GUILD_TEXT' && message.content == "!refresh" && message.guild != null && (message.author.id == message.guild.ownerId || masterIDs.includes(message.author.id))) {
    const time = Date.now();

    message.reply(`refresh start! server: ${message.guild.name}`).catch(console.log);
    CM.commands.clear();
    commandInit();
    await CM.refreshCommand("guild", message.guild);
    message.reply(`guild command push has been done in ${(Date.now() - time)}ms`);
  }
});

Kakao.init();
client.login(config.botToken);


function registerCmd(builder: SlashCommandBuilder, callback: ((interaction: CommandInteraction) => void), category: CommandCategory = 'guild') {
  CM.register({
    category: category,
    dmOnly: false,
    debug: false,
    builder,
    setHiddenConfig: (arg) => arg,
    run: callback
  });
}

function commandInit() {
  registerCmd((() => {
    const s = new SlashCommandBuilder().setName('link').setDescription('link to kakao room');
    s.addStringOption((option) => option.setName('room').setDescription('the room name').setRequired(true));
    return s;
  })(), DiscordCommands.linkChannel);
  registerCmd((() => {
    const s = new SlashCommandBuilder().setName('dislink').setDescription('dislink to kakao room');
    s.addStringOption((option) => option.setName('room').setDescription('the room name').setRequired(true));
    return s;
  })(), DiscordCommands.dislinkChannel);
  registerCmd(new SlashCommandBuilder().setName('links').setDescription('show all link list'), DiscordCommands.linkList);
  registerCmd(new SlashCommandBuilder().setName('sessions').setDescription('show all session list'), DiscordCommands.sessionList);
}
commandInit();

process.on('unhandledrejection', err => console.log(err));
export default app;