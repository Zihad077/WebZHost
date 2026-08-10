// api/webhook.js
const admin = require('firebase-admin');

// ================================================================
// 🔥 আপনার Firebase Service Account JSON (Hardcoded)
// ================================================================
const serviceAccount = {
  "type": "service_account",
  "project_id": "bothostz",
  "private_key_id": "adbb06d394a7aead5bbdc46f13d92e294e0808ff",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGV3wJhqJsCkip\nOpwGpGhNfXzoAAvgTeoLwlDxKLMPlvfJJbKuDeiSpNYLfZ2T0M8G6ijyJrxpIBPy\nJAY90o2NYh3D9AZ5C5Ie3qDBYObkCVz1RT5/3Jo41OPXTLGZbv/jPmn6t8z+BLZ+\ndefgGPZjzB7bg1UGejqMzH8NVZxKkhxic0bmsjYxSdIUPoDfdhXuU9sOSKxVms9a\n/PILNg6ZZ40KVUIXFh0tTnZyh/iqF0odGH/NSnNB6aaSHzeZQ3sJvz4JiiOx0Kv4\nRzB8k2OIj+x4PUAnFibDUMFfPfWhZe74waatX3xPcmJEqBPXILRMjLGQy4sZ7mCh\nzYguEJrjAgMBAAECggEAKY0TUaWQakTfQwChxix0I2O6Ipo74rI/6VW8gkEN/iKY\n511L6PXF9s6sfrzCocBZVrAAgvZFe1p6gzwzyIjPGcLnzHDXWE1pv6jREaH8zOH/\nROzMMpoi/uvujWCmRigAWHlvV1RhEAgpuSV3PbXNDEwrXL5PNiuuD2gZ58+7Dc3e\n1a6/JJnuKNHFdLMBCytVfIH0aPh0/D4QBGdUtPmwV+6GUImu0h1MVIIyDP0+ekHE\nGttZbyCzjv26OsLiNZxJDIwB4N8/fUyoEVCPtEkXIc4ACHHceBz+97UJvQqAz691\nW+HpfVzneVmrYYRVyXzqtU7hg5ExQVfXb28OllB2qQKBgQDhf5NvOFEfNCu1gCXo\ny4jwEketLjya7tmTRedbXnntZL/Y7wW5R9XPsbBDkJoWv8X5p6HJ5aYJD/CTj6ml\nBNb/3NeyoulG5+gzy2Ba66UQQmEZFQiBCLgLmklQD+KXNpiAgnFy9XS+jfDfbwno\nkmcOC0zkBy9vZF8+Unc8yApEGQKBgQDhK4urISJz/YBL1liSveorw5NpJJB0jDRS\nehCBZz5F0JgJTIuiD1z4zkZuV1QB0/AbJc8WS7Gtjz5/mqCDyysfv3q/Iuwl753q\nfDD6yU+X9WWQZL8OAp9+/LBWxBXn7YPc6iMXKC+3O/99A2+yk4m3XiFUT8jmMdBq\n8LCy/RpWWwKBgDPIokjmO+rYhjkWBp6hLv9Ck2c3uP8zXo+te+XFmmZjvpLIwR29\nW2JowbuiV2BmBcbBMiw1Kp3mJS8dzK1yoRT82CPTuZJo6zAJwkTe3HcRZ07lP6Cy\nKeGwOqnCHBzxkq/gRMFLkNW5rtkAnNvl0visq6mp5MDF4gFj2rIAlirxAoGAZQoF\nQmU78JBwYZdtZ2uRCNJZ83RU3feMAvaDMY4Cg5F2p7WRcscyEPN+50SIjclslMIC\nix6sPBVrFhdsr7cbQsPJcLta/Crp0a6oy+BJtwaG7KRIlyDWMUVyW3zh15Dc+uSV\nmm6N+ssReidwl9FcmsvCaPLkU2dG/rXClI6+osECgYEA2eMSIon/s+AjUZ7+khun\nigzuTYxzNc76zXCfPA/VKOYzxMC1a0vnke12q6LF7f31QKE3ab14MRZY4j8wCO54\nsAtcOXsBxGERun11zY1Nym1qNOEiQOYVWlFUQEv4H1yaIxzAs5stmFMn3OzB+pd9\nmuMqOHEDv1pj8VjIe0GiinQ=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@bothostz.iam.gserviceaccount.com",
  "client_id": "105750146430424310646",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40bothostz.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};
// ================================================================

let db = null;
let initError = null;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  // 🔥 সঠিক ডেটাবেস আইডি (webzhost) ব্যবহার করুন
  const { getFirestore } = require('firebase-admin/firestore');
  db = getFirestore('webzhost');
  console.log("✅ Firebase connected to database: webzhost");
} catch (e) {
  initError = "Firebase init error: " + e.message;
  console.error(initError);
}

module.exports = async (req, res) => {
  // CORS
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
    if (!botId) {
      return res.status(400).json({ error: 'botId missing' });
    }

    // ডেটাবেস থেকে বট ডকুমেন্ট খুঁজুন
    const docRef = db.collection('bots').doc(botId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: `Bot not found for ID: ${botId}` });
    }

    const bot = doc.data();
    const { code, lang, token } = bot;

    // (ঐচ্ছিক) টোকেন ভেরিফাই
    if (token) {
      try {
        const check = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await check.json();
        if (!data.ok) console.warn('Token may be invalid');
      } catch (e) {
        console.warn('Token verify failed:', e.message);
      }
    }

    // ---------- ইউজারের কোড এক্সিকিউট করুন ----------
    if (lang === 'JS') {
      const sandbox = {
        console: console,
        fetch: require('node-fetch')
      };

      const func = new Function('sandbox', 'req', 'res', 'update', `
        try {
          const { console, fetch } = sandbox;
          // ইউজারের কোড এখানে রান হবে
          ${code}
        } catch (err) {
          console.error('Bot code error:', err);
          throw err;
        }
      `);

      // ৫ সেকেন্ড টাইমআউট
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout (5s)')), 5000)
      );

      await Promise.race([
        func(sandbox, req, res, req.body),
        timeout
      ]);

    } else if (lang === 'PY') {
      return res.status(400).json({ error: 'Python not supported in /api/webhook, use /api/webhook_python' });
    } else {
      return res.status(400).json({ error: `Unsupported language: ${lang}` });
    }

    // শেষ অ্যাক্টিভিটি আপডেট
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
