'use strict';
const f = (name, s) => ({ name, dir: false, data: Buffer.from(s) });
module.exports = {
  'python-bot': { label: 'Python Telegram bot (polling)', files: () => [
    f('main.py', `import os\nfrom telegram import Update\nfrom telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters\n\n\nasync def start(update: Update, context: ContextTypes.DEFAULT_TYPE):\n    await update.message.reply_text("Hello! Send me a message and I will echo it.")\n\n\nasync def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):\n    await update.message.reply_text(update.message.text)\n\n\ndef main():\n    app = Application.builder().token(os.environ["BOT_TOKEN"]).build()\n    app.add_handler(CommandHandler("start", start))\n    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))\n    app.run_polling()\n\n\nif __name__ == "__main__":\n    main()\n`),
    f('requirements.txt', 'python-telegram-bot>=20.0,<22\n'),
    f('.env.example', 'BOT_TOKEN=put-your-token-here\n') ] },
  'node-api': { label: 'Node.js HTTP API', files: () => [
    f('package.json', JSON.stringify({ name: 'node-api', version: '1.0.0', main: 'server.js', scripts: { start: 'node server.js' }, engines: { node: '>=18' } }, null, 2) + '\n'),
    f('server.js', `const http = require('http');\nconst port = Number(process.env.PORT) || 3000;\n\nhttp.createServer((req, res) => {\n  if (req.url === '/health') {\n    res.writeHead(200, { 'Content-Type': 'application/json' });\n    return res.end(JSON.stringify({ ok: true }));\n  }\n  res.writeHead(200, { 'Content-Type': 'text/plain' });\n  res.end('Hello from Node.js\\n');\n}).listen(port, () => console.log('Listening on ' + port));\n`) ] },
};
