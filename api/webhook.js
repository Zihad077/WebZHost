// api/webhook.js (Advanced Version)
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const update = req.body;
    if (update && update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text || '';

      let reply = '';

      // কমান্ড হ্যান্ডেল
      if (text === '/start') {
        reply = '👋 Welcome! I am your smart bot.\nSend /help to see what I can do.';
      } else if (text === '/help') {
        reply = '📋 Commands:\n/start - Welcome\n/help - This menu\n/info - Your details\n/about - About this bot';
      } else if (text === '/info') {
        const details = {
          '🆔 ID': message.from.id,
          '👤 Name': message.from.first_name || 'N/A',
          '🔖 Username': message.from.username ? `@${message.from.username}` : 'N/A',
          '🗣️ Language': message.from.language_code || 'N/A',
          '📱 Chat Type': message.chat.type || 'N/A'
        };
        reply = '📋 **Your Details**\n\n';
        for (const [k, v] of Object.entries(details)) reply += `${k}: ${v}\n`;
      } else if (text === '/about') {
        reply = '🤖 This bot is built with ❤️ using Vercel + Telegram Webhook.';
      } else {
        const funReplies = [
          '😄 Interesting! Tell me more.',
          '🤔 I\'m not sure about that.',
          '🌟 You\'re awesome!',
          '🎉 Keep going!',
          '💡 That\'s a great thought.'
        ];
        reply = funReplies[Math.floor(Math.random() * funReplies.length)];
      }

      const token = "8654064192:AAEiQkzclDSo_ls1Ct4NyEzEE968DLmQFBc";
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' })
      });
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: error.message });
  }
};
