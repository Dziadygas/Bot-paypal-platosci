require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const paypal = require('paypal-rest-sdk');
const express = require('express');

// Konfiguracja PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const prefix = process.env.DISCORD_PREFIX || '!';
const pendingPayments = new Map();
const ALLOWED_ROLES = process.env.ALLOWED_ROLE_IDS.split(',');

// Serwer IPN
const app = express();
app.use(express.urlencoded({ extended: false }));

app.post('/ipn', (req, res) => {
  const { payment_status, invoice, receiver_email, mc_gross, mc_currency } = req.body;

  if (payment_status === 'Completed' && 
      receiver_email === process.env.PAYPAL_EMAIL &&
      pendingPayments.has(invoice)) {
    
    const payment = pendingPayments.get(invoice);
    const amount = parseFloat(mc_gross);
    
    if (amount === payment.amount && mc_currency === process.env.PAYPAL_CURRENCY) {
      payment.paid = true;
      
      const channel = client.channels.cache.get(payment.channelId);
      if (channel) {
        const successEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Płatność potwierdzona')
          .setDescription(`**${payment.amount} ${process.env.PAYPAL_CURRENCY}** za:\n*"${payment.reason}"*`)
          .setFooter({ text: `ID: ${invoice}` });

        channel.messages.fetch(payment.messageId)
          .then(msg => msg.edit({
            embeds: [successEmbed],
            components: []
          }));

        channel.send({
          content: `Gratulacje <@${payment.userId}>! Płatność została zaksięgowana.`
        });
      }
      
      pendingPayments.delete(invoice);
    }
  }
  
  res.status(200).end();
});

app.listen(process.env.IPN_LISTENER_PORT || 5000, () => {
  console.log(`IPN listener running on port ${process.env.IPN_LISTENER_PORT || 5000}`);
});

// Komenda !pay
client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'pay') {
    // Sprawdź uprawnienia
    if (!ALLOWED_ROLES.some(roleId => message.member.roles.cache.has(roleId))) {
      const errorMsg = await message.reply({
        content: `❌ Tylko osoby z odpowiednimi rolami mogą używać tej komendy!`,
        ephemeral: true
      });
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    await message.delete().catch(console.error);

    if (args.length < 2) {
      const errorMsg = await message.channel.send({
        content: '❌ Użycie: `!pay <kwota> <powód>` (np. `!pay 50.00 Skórka`)',
        ephemeral: true
      });
      setTimeout(() => errorMsg.delete(), 5000);
      return;
    }

    const amount = parseFloat(args[0]);
    if (isNaN(amount) || amount <= 0) {
      const errorMsg = await message.channel.send({
        content: '❌ Kwota musi być liczbą większą niż 0!',
        ephemeral: true
      });
      setTimeout(() => errorMsg.delete(), 5000);
      return;
    }

    const reason = args.slice(1).join(' ');
    const paymentId = message.id;

    const paypalLink = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${
      encodeURIComponent(process.env.PAYPAL_EMAIL)
    }&amount=${amount}&currency_code=${
      process.env.PAYPAL_CURRENCY
    }&item_name=${
      encodeURIComponent(`[DISCORD] ${reason}`)
    }&invoice=${paymentId}&notify_url=${
      encodeURIComponent(process.env.IPN_LISTENER_URL)
    }`;

    pendingPayments.set(paymentId, {
      userId: message.author.id,
      amount: amount,
      reason: reason,
      paid: false,
      channelId: message.channel.id,
      messageId: null
    });

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('💳 Płatność PayPal')
      .setDescription(`**${amount} ${process.env.PAYPAL_CURRENCY}** za:\n*"${reason}"*`)
      .addFields(
        { name: 'Status', value: '🟡 Oczekuje na płatność', inline: true },
        { name: 'ID Płatności', value: `\`${paymentId}\``, inline: true }
      )
      .setFooter({ text: 'Kliknij "Zapłać teraz", aby przejść do PayPal' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Zapłać teraz')
          .setURL(paypalLink)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setCustomId('check_payment')
          .setLabel('Sprawdź status')
          .setStyle(ButtonStyle.Secondary)
      );

    const paymentMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    pendingPayments.get(paymentId).messageId = paymentMessage.id;

    setTimeout(async () => {
      if (pendingPayments.has(paymentId) && !pendingPayments.get(paymentId).paid) {
        pendingPayments.delete(paymentId);
        await paymentMessage.edit({
          embeds: [embed.setFooter({ text: '🔴 Link wygasł (24h)' })],
          components: []
        });
      }
    }, 86400000);
  }
});

client.on('ready', () => {
  console.log(`✅ Bot zalogowany jako ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);