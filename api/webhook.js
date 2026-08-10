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

      // ✅ ইমেজ জেনারেট কমান্ড
      if (text.startsWith('/image')) {
        const prompt = text.replace('/image', '').trim();

        if (!prompt) {
          await sendMessage(chatId, '❌ দয়া করে একটি প্রম্পট দিন।\nউদাহরণ: `/image a beautiful sunset`');
          return res.status(200).send('OK');
        }

        // ⏳ প্রসেসিং মেসেজ
        await sendMessage(chatId, `🎨 আপনার ছবি তৈরি হচ্ছে: *"${prompt}"*`, 'Markdown');

        try {
          // 🔥 Pollinations.ai URL (সরাসরি)
          const encodedPrompt = encodeURIComponent(prompt);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux`;

          // ⚠️ URL টি টেলিগ্রামকে পাঠান (টেলিগ্রাম নিজেই ডাউনলোড করবে)
          await sendPhoto(chatId, imageUrl);

        } catch (error) {
          console.error('Image error:', error);
          await sendMessage(chatId, '❌ ছবি তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        }

        return res.status(200).send('OK');
      }

      // ✅ হেল্প কমান্ড
      if (text === '/start' || text === '/help') {
        await sendMessage(chatId, 
          `🤖 *AI Image Generator Bot*\n\n` +
          `📌 *কমান্ডসমূহ:*\n` +
          `/image [প্রম্পট] - AI দিয়ে ছবি তৈরি করুন\n` +
          `/help - এই মেসেজ দেখুন\n\n` +
          `📝 *উদাহরণ:*\n` +
          `/image a beautiful sunset over the ocean`
        , 'Markdown');
        return res.status(200).send('OK');
      }

      // ✅ অন্য মেসেজ ইগনোর
      return res.status(200).send('OK');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ---------- হেল্পার ফাংশন ----------
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

async function sendPhoto(chatId, photoUrl) {
  const token = "8654064192:AAEiQkzclDSo_ls1Ct4NyEzEE968DLmQFBc";
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl  // 🔥 সরাসরি URL
    })
  });
}
