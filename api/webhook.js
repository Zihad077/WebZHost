// api/webhook.js
const admin = require('firebase-admin');

// ---------- Firebase Initialization ----------
let db = null;
let initError = null;

try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || "bothostz";

  if (!privateKey || !clientEmail) {
    initError = "Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL in env";
  } else if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
    db = admin.firestore();  // ✅ সঠিক সিনট্যাক্স
    console.log("✅ Firebase initialized (JS)");
  } else {
    db = admin.firestore();
  }
} catch (e) {
  initError = "Firebase init error: " + e.message;
  console.error(initError);
}

// ---------- Webhook Handler ----------
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check Firebase init
  if (initError) {
    return res.status(500).json({ error: initError });
  }

  try {
    const botId = req.query.botId;
    if (!botId) return res.status(400).json({ error: 'botId missing' });

    // Fetch bot data
    const doc = await db.collection('bots').doc(botId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Bot not found' });

    const bot = doc.data();
    const { code, lang, token } = bot;

    // Token verification (optional but recommended)
    if (token) {
      try {
        const check = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await check.json();
        if (!data.ok) {
          return res.status(400).json({ error: 'Bot token invalid or revoked' });
        }
      } catch (e) {
        console.warn('Token verify failed:', e.message);
      }
    }

    // ---------- Execute bot code ----------
    if (lang === 'JS') {
      // Safe execution using Function constructor (no vm)
      const sandbox = {
        console: console,
        fetch: require('node-fetch'),
        // You can add more safe modules here
      };

      // Wrap code inside a function
      const func = new Function('sandbox', 'req', 'res', 'update', `
        try {
          const { console, fetch } = sandbox;
          // User code starts here
          ${code}
          // User code ends here
        } catch (err) {
          console.error('Bot code error:', err);
          throw err;
        }
      `);

      // Execute with 5 seconds timeout
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Bot execution timeout (5s)')), 5000)
      );
      await Promise.race([
        func(sandbox, req, res, req.body),
        timeout
      ]);

    } else if (lang === 'PY') {
      // For Python, call the Python webhook endpoint internally
      // But simpler: just call the Python function via HTTP (if deployed separately)
      return res.status(400).json({
        error: 'Python webhook should be called via /api/webhook_python'
      });
    } else {
      return res.status(400).json({ error: `Unsupported language: ${lang}` });
    }

    // Update last activity
    await db.collection('bots').doc(botId).update({
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      webhookStatus: 'connected'
    });

    return res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
