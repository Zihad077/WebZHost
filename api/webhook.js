// api/webhook.js
const admin = require('firebase-admin');

// ---------- Firebase Initialization (সঠিক ডেটাবেস সহ) ----------
let db = null;
let initError = null;

try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || "bothostz";

  if (!privateKey || !clientEmail) {
    initError = "Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL";
  } else if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
    // 🔥 গুরুত্বপূর্ণ: ডেটাবেস আইডি সেট করুন (যেটা ফ্রন্টএন্ডে ব্যবহার করেছেন)
    db = admin.firestore();
    db.settings({ databaseId: 'webzhost' });  // ← এই লাইন যোগ করুন
    console.log("✅ Firebase initialized with database: webzhost");
  } else {
    db = admin.firestore();
    db.settings({ databaseId: 'webzhost' });
  }
} catch (e) {
  initError = "Firebase init error: " + e.message;
  console.error(initError);
}

// ---------- Webhook Handler ----------
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (initError) {
    return res.status(500).json({ error: initError });
  }

  try {
    const botId = req.query.botId;
    if (!botId) return res.status(400).json({ error: 'botId missing' });

    // ডকুমেন্ট খুঁজুন
    const docRef = db.collection('bots').doc(botId);
    const doc = await docRef.get();
    if (!doc.exists) {
      // ডকুমেন্ট না পেলে ক্লিয়ার মেসেজ দিন
      return res.status(404).json({ error: `Bot not found for ID: ${botId}` });
    }

    const bot = doc.data();
    const { code, lang, token } = bot;

    // (ঐচ্ছিক) টোকেন ভেরিফাই
    if (token) {
      try {
        const check = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await check.json();
        if (!data.ok) {
          console.warn('Token may be invalid');
        }
      } catch (e) { /* ignore */ }
    }

    // ---------- ইউজারের কোড এক্সিকিউট করুন ----------
    if (lang === 'JS') {
      // Simple execution using Function constructor
      const sandbox = {
        console: console,
        fetch: require('node-fetch'),
        // টেলিগ্রাম API কল সহজ করতে একটি হেল্পার ফাংশন যোগ করতে পারেন
      };

      const func = new Function('sandbox', 'req', 'res', 'update', `
        try {
          const { console, fetch } = sandbox;
          // ইউজারের কোড এখানে আসবে
          ${code}
        } catch (err) {
          console.error('Bot code error:', err);
          throw err;
        }
      `);

      // ৫ সেকেন্ড টাইমআউট
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), 5000)
      );
      await Promise.race([
        func(sandbox, req, res, req.body),
        timeout
      ]);

    } else if (lang === 'PY') {
      return res.status(400).json({ error: 'Python webhook not implemented here' });
    } else {
      return res.status(400).json({ error: `Unsupported language: ${lang}` });
    }

    // Last activity আপডেট
    await docRef.update({
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      webhookStatus: 'connected'
    });

    return res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
