// Vercel Serverless Function: /api/webhook.js
const admin = require('firebase-admin');

// Firebase Service Account (from environment variable)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const botId = req.query.botId || req.url.split('/').pop();
  if (!botId) return res.status(400).json({ error: 'Bot ID required' });

  try {
    const doc = await db.collection('bots').doc(botId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Bot not found' });
    const bot = doc.data();
    if (bot.status === 'disabled') return res.status(403).json({ error: 'Bot disabled' });

    const update = req.body;
    // Execute handler (simple eval for demo, use VM for production)
    const code = bot.code || '';
    let result = null;
    if (code.trim()) {
      try {
        const handler = new Function('update', `"use strict"; ${code}; if (typeof handle === 'function') return handle(update); else return null;`);
        result = handler(update);
      } catch (e) {
        console.error('Handler error', e);
        await db.collection('logs').add({ botId, time: Date.now(), level: 'error', message: `Handler error: ${e.message}`, userId: bot.userId });
        return res.status(500).json({ error: 'Handler execution failed' });
      }
    }

    if (result && result.chat_id && result.text) {
      await fetch(`https://api.telegram.org/bot${bot.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: result.chat_id, text: result.text })
      });
    }

    // Update stats
    await db.collection('bots').doc(botId).update({
      'stats.requests': admin.firestore.FieldValue.increment(1),
    });
    await db.collection('logs').add({ botId, time: Date.now(), level: 'success', message: 'Webhook processed', userId: bot.userId });

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
};
