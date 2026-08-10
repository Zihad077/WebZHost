// api/webhook.js
const admin = require('firebase-admin');

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
    // 🔥 এখানে ডেটাবেস আইডি সেট করুন
    db = admin.firestore();
    db.settings({ databaseId: 'webzhost' });   // ← এই লাইনটি অবশ্যই থাকতে হবে
    console.log("✅ Firebase initialized with database: webzhost");
  } else {
    db = admin.firestore();
    db.settings({ databaseId: 'webzhost' });
  }
} catch (e) {
  initError = "Firebase init error: " + e.message;
  console.error(initError);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    const docRef = db.collection('bots').doc(botId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: `Bot not found for ID: ${botId}` });
    }

    const bot = doc.data();
    const { code, lang, token } = bot;

    // টোকেন ভেরিফাই (ঐচ্ছিক)
    if (token) {
      try {
        const check = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await check.json();
        if (!data.ok) console.warn('Token invalid');
      } catch (e) { /* ignore */ }
    }

    // ইউজারের কোড এক্সিকিউট
    if (lang === 'JS') {
      const sandbox = { console, fetch: require('node-fetch') };
      const func = new Function('sandbox', 'req', 'res', 'update', `
        try {
          const { console, fetch } = sandbox;
          ${code}
        } catch (err) {
          console.error('Bot code error:', err);
          throw err;
        }
      `);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), 5000)
      );
      await Promise.race([
        func(sandbox, req, res, req.body),
        timeout
      ]);
    } else if (lang === 'PY') {
      return res.status(400).json({ error: 'Python not supported in this endpoint' });
    } else {
      return res.status(400).json({ error: `Unsupported language: ${lang}` });
    }

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
