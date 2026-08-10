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
      const text = message.text || '';

      // 🔥 বিশেষ কমান্ড (start, help)
      if (text === '/start' || text === '/help') {
        await sendMessage(chatId, 
          `🤖 *AI Image Generator Bot*\n\n` +
          `📌 *কীভাবে ব্যবহার করবেন:*\n` +
          `যেকোনো টেক্সট মেসেজ পাঠান, আমি সেটার জন্য AI-জেনারেটেড ছবির লিংক পাঠাব।\n\n` +
          `📝 *উদাহরণ:*\n` +
          `"a cute cat" লিখলেই ছবির URL পাবেন।\n` +
          `"a beautiful sunset" লিখলেও পাবেন।\n\n` +
          `🛠️ কমান্ড:\n` +
          `/help - এই সাহায্য দেখুন`
        , 'Markdown');
        return res.status(200).send('OK');
      }

      // ⚠️ যদি মেসেজ খালি না হয়
      if (text.trim()) {
        // 📝 পুরো মেসেজটিকে প্রম্পট হিসেবে নিচ্ছি
        const prompt = text.trim();
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

        // 📤 শুধু URL পাঠান
        await sendMessage(chatId, 
          `🎨 *আপনার প্রম্পটের জন্য ছবি তৈরি হয়েছে!*\n\n` +
          `📝 *প্রম্পট:* ${prompt}\n` +
          `🔗 *ছবির লিংক:*\n${imageUrl}\n\n` +
          `💡 লিংকে ক্লিক করে ছবি দেখুন।`
        , 'Markdown');

        return res.status(200).send('OK');
      }

      // অন্য কিছু (যেমন ইমোজি বা ফাঁকা) ইগনোর
      return res.status(200).send('OK');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ---------- হেল্পার ----------
async function sendMessage(chatId, text, parseMode = null) {
  const token = "8654064192:AAEiQkzclDSo_ls1Ct4NyEzEE968DLmQFBc";
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = { chat_id: chatId, text };
  if (parseMode) body.parse_mode = parseMode;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
