const {
  Client,
  GatewayIntentBits,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const confirmMap = new Map();

client.once('ready', () => {
  console.log(`Login sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // STEP 1: minta konfirmasi
  if (message.content === '!nuke') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('❌ Tidak punya izin');
    }

    confirmMap.set(message.author.id, message.channel.id);
    return message.reply(
      '⚠️ Ini akan menghapus **SEMUA pesan (<14 hari)** di channel ini.\n' +
      'Ketik `!confirm` dalam 10 detik untuk lanjut.'
    );
  }

  // STEP 2: eksekusi
  if (message.content === '!confirm') {
    const channelId = confirmMap.get(message.author.id);
    if (channelId !== message.channel.id) return;

    confirmMap.delete(message.author.id);
    await message.delete();

    let total = 0;

    while (true) {
      const msgs = await message.channel.messages.fetch({ limit: 100 });
      if (msgs.size === 0) break;

      const deletable = msgs.filter(
        m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000
      );

      if (deletable.size === 0) break;

      await message.channel.bulkDelete(deletable, true);
      total += deletable.size;
    }

    return message.channel.send(
      `✅ Selesai. ${total} pesan terhapus.\n` +
      'Pesan >14 hari tidak bisa dihapus oleh bot.'
    );
  }
});

client.login(process.env.TOKEN);
