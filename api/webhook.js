// ============================================================
// API Route: /api/webhook/[botId]
// Vercel Serverless Function for Telegram Webhook
// ============================================================

// Firebase Admin SDK (সার্ভার সাইডে ডাটাবেস পড়ার জন্য)
const admin = require('firebase-admin');

// আপনার Firebase Service Account Key (Firebase Console থেকে ডাউনলোড করুন)
// অথবা Environment Variable হিসেবে সেট করুন (নিচে দেখানো হলো)
let serviceAccount;
try {
  // লোকাল ডেভেলপমেন্টের জন্য JSON ফাইল
  serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
  // Production (Vercel) এর জন্য Environment Variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // শুধু POST মেথড অ্যাক্সেপ্ট করব
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // URL থেকে botId বের করি (Vercel এর রাউটিং)
  // URL: /api/webhook/bot_xyz123
  const botId = req.query.botId || req.url.split('/').pop();

  if (!botId) {
    return res.status(400).json({ error: 'Bot ID is required' });
  }

  try {
    // 1. ফায়ারবেস থেকে বটের ডেটা আনি
    const botDoc = await db.collection('bots').doc(botId).get();

    if (!botDoc.exists) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const botData = botDoc.data();

    // বট ডিসেবল থাকলে চলবে না
    if (botData.status === 'disabled') {
      return res.status(403).json({ error: 'Bot is disabled' });
    }

    // 2. Telegram থেকে আসা Update ডেটা
    const update = req.body;

    // 3. বটের কোড (Handler) এক্সিকিউট করি
    const result = await executeBotHandler(botData, update);

    // 4. রেজাল্ট Telegram-এ পাঠাই
    if (result && result.chat_id && result.text) {
      await sendTelegramMessage(botData.token, result.chat_id, result.text);
    }

    // 5. লগ সেভ করি (Firestore)
    await db.collection('logs').add({
      userId: botData.userId,
      botId: botId,
      time: Date.now(),
      level: 'success',
      message: `Webhook processed successfully for ${botData.name}`,
      createdAt: new Date().toISOString(),
    });

    // 6. বটের স্ট্যাটস আপডেট করি
    await db.collection('bots').doc(botId).update({
      'stats.requests': admin.firestore.FieldValue.increment(1),
    });

    return res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook Error:', error);

    // Error লগ সেভ করি
    await db.collection('logs').add({
      userId: botData?.userId || 'unknown',
      botId: botId,
      time: Date.now(),
      level: 'error',
      message: `Error: ${error.message}`,
      createdAt: new Date().toISOString(),
    });

    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// ============================================================
// বটের কোড এক্সিকিউট করার ফাংশন (Node.js Runtime)
// ============================================================
async function executeBotHandler(botData, update) {
  const code = botData.code || '';
  const language = botData.language || 'nodejs';

  if (language === 'python') {
    // Python হ্যান্ডলার (সাবপ্রসেস দিয়ে কল করা)
    // Python ইনস্টল থাকতে হবে Vercel এ (প্রথমে সেটআপ করতে হবে)
    // এখানে আমি Node.js-ই সুপারিশ করছি
    throw new Error('Python runtime is not supported in this version yet.');
  }

  // === Node.js Handler Execution (VM Sandbox) ===
  try {
    const vm = require('vm');

    // Environment Variables (ইউজার সেট করা)
    const envVars = botData.env || {};

    // স্যান্ডবক্সড কনটেক্সট তৈরি করি
    const context = {
      update: update,
      console: {
        log: (...args) => console.log('[Bot Log]', ...args),
        error: (...args) => console.error('[Bot Error]', ...args),
      },
      // ইউজার যা যা চায় তা এখানে যোগ করা যেতে পারে
      env: envVars,
      // Telegram API কল করার জন্য হেল্পার (না থাকলেও চলে)
      sendMessage: async (chatId, text) => {
        await sendTelegramMessage(botData.token, chatId, text);
      }
    };

    const script = new vm.Script(`
      // ইউজারের কোড রান করার জন্য
      const handler = (update) => {
        ${code}
      };
      // যদি ইউজার export ব্যবহার করে থাকে, তাহলে সেটা ধরব
      if (typeof exports !== 'undefined' && exports.handle) {
        exports.handle(update);
      } else {
        handler(update);
      }
    `);

    // কোড এক্সিকিউট করি
    const result = script.runInNewContext(context);

    // যদি ইউজার সরাসরি রিটার্ন করে
    if (result && typeof result === 'object' && result.chat_id) {
      return result;
    }

    // যদি ইউজার exports.handle ব্যবহার করে
    if (context.handle) {
      const handlerResult = context.handle(update);
      return handlerResult;
    }

    // ডিফল্ট ইকো রিপ্লাই (যদি কোড খালি থাকে)
    if (!code.trim()) {
      const msg = update.message;
      if (msg && msg.text) {
        return { chat_id: msg.chat.id, text: `Echo: ${msg.text}` };
      }
      return null;
    }

    return null;

  } catch (error) {
    console.error('Execution Error:', error);
    throw new Error(`Handler execution failed: ${error.message}`);
  }
}

// ============================================================
// Telegram API তে মেসেজ পাঠানোর ফাংশন
// ============================================================
async function sendTelegramMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Telegram Send Error:', error);
    throw error;
  }
        }
