from http.server import BaseHTTPRequestHandler
import json
import os
import requests
import firebase_admin
from firebase_admin import credentials, firestore
from urllib.parse import urlparse, parse_qs

if not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": "bothostz",
        "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
        "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL", "")
    })
    firebase_admin.initialize_app(cred)

db = firestore.client()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            query_components = parse_qs(urlparse(self.path).query)
            bot_id = query_components.get('botId', [None])[0]

            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            update = json.loads(post_data.decode('utf-8'))

            if not bot_id or not update:
                self.send_response(400)
                self.end_headers()
                return

            doc_ref = db.collection('bots').document(bot_id)
            doc = doc_ref.get()

            if not doc.exists:
                self.send_response(404)
                self.end_headers()
                return

            bot_data = doc.to_dict()
            token = bot_data.get('token')
            code = bot_data.get('code')

            if 'message' in update and 'text' in update['message']:
                chat_id = update['message']['chat']['id']

                def reply(text):
                    requests.post(f"https://api.telegram.org/bot{token}/sendMessage", json={
                        "chat_id": chat_id,
                        "text": str(text)
                    })

                sandbox = { "update": update, "reply": reply, "print": print }
                exec(code, sandbox)

            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        except Exception as e:
            print(f"Python Execution Error: {e}")
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Handled')

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Python Webhook Engine Ready')
