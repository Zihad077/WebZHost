let db = null;
let initError = null;

// Crash-Proof Initialization
try {
  const admin = require('firebase-admin');
  const { getFirestore } = require('firebase-admin/firestore');

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    initError = "Vercel Environment Variables Missing (FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL)";
  } else {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: "bothostz",
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n')
        })
      });
    }
    db = getFirestore('webzhost');
  }
} catch (e) {
  initError = "JS Init Exception: " + e.message;
}

export default async function handler(req, res) {
  if (initError) {
    return res.status(200).send("Config Issue: " + initError);
  }

  if (req.method !== 'POST') return res.status(200).send('WebzHost JS Engine Active & Ready!');

  const { botId } = req.query;
  const update = req.body;

  if (!botId || !update) return res.status(200).send('Missing Parameters');

  try {
    const botDoc = await db.collection('bots').doc(botId).get();
    if (!botDoc.exists) return res.status(200).send('Bot Document Not Found in DB');

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

    const vm = require('vm');
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 2500 });

    return res.status(200).send('OK');
  } catch (error) {
    return res.status(200).send('Execution Handled Error: ' + error.message);
  }
}
