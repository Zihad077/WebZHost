// api/webhook.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const update = req.body;
    if (update && update.message) {
      const message = update.message;
      const chatId = message.chat.id;

      const userDetails = {
        '🆔 User ID': message.from.id,
        '👤 First Name': message.from.first_name || 'N/A',
        '👥 Last Name': message.from.last_name || 'N/A',
        '🔖 Username': message.from.username ? `@${message.from.username}` : 'N/A',
        '🗣️ Language': message.from.language_code || 'N/A',
        '💬 Message Text': message.text || 'N/A',
        '📅 Date': new Date(message.date * 1000).toLocaleString(),
        '📱 Chat Type': message.chat.type || 'N/A'
      };

      let replyText = '📋 **Your Telegram Details**\n\n';
      for (const [key, value] of Object.entries(userDetails)) {
        replyText += `${key}: ${value}\n`;
      }

      const token = "8654064192:AAEiQkzclDSo_ls1Ct4NyEzEE968DLmQFBc";
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' })
      });
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: error.message });
  }
};
