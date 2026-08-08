const admin = require('firebase-admin');
const vm = require('vm');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "bothostz",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n')
    })
  });
}

// Connect Specifically to your Custom Database 'webzhost'
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore('webzhost');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('WebzHost JS Engine Active!');

  const { botId } = req.query;
  const update = req.body;

  if (!botId || !update) return res.status(400).send('Missing Parameters');

  try {
    const botDoc = await db.collection('bots').doc(botId).get();
    if (!botDoc.exists) return res.status(404).send('Bot Document Not Found');

    const { token, code } = botDoc.data();
    if (!update.message) return res.status(200).send('OK');

    const reply = async (text) => {
      const chatId = update.message.chat.id;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
      });
    };

    const sandbox = { update, reply, console, fetch };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 2500 });

    return res.status(200).send('OK');
  } catch (error) {
    console.error('JS Error:', error);
    return res.status(200).send('Handled Error: ' + error.message);
  }
}
