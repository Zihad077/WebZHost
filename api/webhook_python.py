from http.server import BaseHTTPRequestHandler
import json
import os
import requests
import firebase_admin
from firebase_admin import credentials, firestore
from urllib.parse import urlparse, parse_qs

# Firebase Admin Initialize
if not firebase_admin._apps:
    private_key = os.environ.get("FIREBASE_PRIVATE_KEY", "")
    if private_key:
        private_key = private_key.replace('\\n', '\n')
        
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": "bothostz",
        "private_key": private_key,
        "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL", "")
    })
    firebase_admin.initialize_app(cred)

# Connect Specifically to your Custom Database 'webzhost'
try:
    db = firestore.client(database='webzhost')
except Exception:
    db = firestore.client()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse Query Parameters
            query_components = parse_qs(urlparse(self.path).query)
            bot_id = query_components.get('botId', [None])[0]

            if not bot_id:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'Missing botId')
                return

            # Read Payload safely
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                update = json.loads(post_data.decode('utf-8'))
            else:
                update = {}

            # Query 'webzhost' Database
            doc_ref = db.collection('bots').document(bot_id)
            doc = doc_ref.get()

            if not doc.exists:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'Bot Document Not Found')
                return

            bot_data = doc.to_dict()
            token = bot_data.get('token')
            code = bot_data.get('code')

            # Execution Logic
            if 'message' in update and 'text' in update['message']:
                chat_id = update['message']['chat']['id']

                def reply(text):
                    requests.post(f"https://api.telegram.org/bot{token}/sendMessage", json={
                        "chat_id": chat_id,
                        "text": str(text)
                    })

                sandbox = {
                    "update": update,
                    "reply": reply,
                    "print": print
                }

                exec(code, sandbox)

            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')

        except Exception as e:
            print(f"Python Error: {e}")
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f'Handled Error: {str(e)}'.encode('utf-8'))

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'WebzHost Python Webhook Engine Active!')
