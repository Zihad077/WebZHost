# api/webhook_python.py
from http.server import BaseHTTPRequestHandler
import json
import os

db = None
init_error = None

# Crash-Proof Initialization
try:
    import requests
    import firebase_admin
    from firebase_admin import credentials, firestore
    from urllib.parse import urlparse, parse_qs

    if not firebase_admin._apps:
        private_key = os.environ.get("FIREBASE_PRIVATE_KEY", "")
        client_email = os.environ.get("FIREBASE_CLIENT_EMAIL", "")

        if not private_key or not client_email:
            init_error = "Vercel Environment Variables Missing (FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL)"
        else:
            private_key = private_key.replace('\\n', '\n')
            
            # Added Google's required 'token_uri' & 'auth_uri' fields
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": "bothostz",
                "private_key": private_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth"
            })
            firebase_admin.initialize_app(cred)

            try:
                db = firestore.client(database='webzhost')
            except Exception:
                db = firestore.client()

except Exception as e:
    init_error = f"Python Import/Init Error: {str(e)}"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        if init_error:
            self.wfile.write(f"Config Issue: {init_error}".encode('utf-8'))
        else:
            self.wfile.write(b"WebzHost Python Engine Active & Ready!")

    def do_POST(self):
        if init_error:
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Config Error: {init_error}".encode('utf-8'))
            return

        try:
            query_components = parse_qs(urlparse(self.path).query)
            bot_id = query_components.get('botId', [None])[0]

            if not bot_id:
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'Missing botId parameter')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                update = json.loads(post_data.decode('utf-8'))
            else:
                update = {}

            doc_ref = db.collection('bots').document(bot_id)
            doc = doc_ref.get()

            if not doc.exists:
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'Bot Document Not Found in DB')
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
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f'Execution Handled Error: {str(e)}'.encode('utf-8'))
