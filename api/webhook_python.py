# api/webhook_python.py
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from urllib.parse import parse_qs
import traceback
import asyncio

# ---------- Firebase Initialization ----------
db = None
init_error = None

try:
    private_key = os.environ.get('FIREBASE_PRIVATE_KEY')
    client_email = os.environ.get('FIREBASE_CLIENT_EMAIL')
    project_id = os.environ.get('FIREBASE_PROJECT_ID', 'bothostz')

    if not private_key or not client_email:
        init_error = "Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL"
    elif not firebase_admin._apps:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": "dummy",
            "private_key": private_key.replace('\\n', '\n'),
            "client_email": client_email,
            "client_id": "",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email}"
        })
        firebase_admin.initialize_app(cred)
        db = firestore.client()  # ✅ সঠিক সিনট্যাক্স
        print("✅ Firebase initialized (Python)")
    else:
        db = firestore.client()
except Exception as e:
    init_error = f"Firebase init error: {e}"
    print(init_error)

# ---------- Webhook Handler (Vercel Python runtime) ----------
def application(environ, start_response):
    # CORS
    if environ.get('REQUEST_METHOD') == 'OPTIONS':
        headers = [('Access-Control-Allow-Origin', '*'), ('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')]
        start_response('200 OK', headers)
        return [b'']

    if environ.get('REQUEST_METHOD') != 'POST':
        headers = [('Access-Control-Allow-Origin', '*')]
        start_response('405 Method Not Allowed', headers)
        return [json.dumps({'error': 'Method not allowed'}).encode()]

    if init_error:
        headers = [('Access-Control-Allow-Origin', '*')]
        start_response('500 Internal Server Error', headers)
        return [json.dumps({'error': init_error}).encode()]

    try:
        # Parse query
        qs = environ.get('QUERY_STRING', '')
        params = parse_qs(qs)
        bot_id = params.get('botId', [''])[0]

        if not bot_id:
            headers = [('Access-Control-Allow-Origin', '*')]
            start_response('400 Bad Request', headers)
            return [json.dumps({'error': 'botId missing'}).encode()]

        # Fetch bot
        doc = db.collection('bots').document(bot_id).get()
        if not doc.exists:
            headers = [('Access-Control-Allow-Origin', '*')]
            start_response('404 Not Found', headers)
            return [json.dumps({'error': 'Bot not found'}).encode()]

        bot = doc.to_dict()
        code = bot.get('code', '')
        token = bot.get('token', '')

        # Get update from request body
        try:
            content_length = int(environ.get('CONTENT_LENGTH', 0))
            body = environ['wsgi.input'].read(content_length).decode()
            update = json.loads(body)
        except:
            update = {}

        # ---------- Execute Python code (restricted) ----------
        sandbox = {
            'update': update,
            'bot_token': token,
            'bot_id': bot_id,
            '__builtins__': {
                'print': print,
                'len': len,
                'str': str,
                'int': int,
                'list': list,
                'dict': dict,
                'range': range,
                'enumerate': enumerate,
                'zip': zip,
                'sum': sum,
                'min': min,
                'max': max,
                'sorted': sorted,
                'reversed': reversed,
                'abs': abs,
                'bool': bool,
                'float': float,
                'bytes': bytes,
                'bytearray': bytearray,
                'set': set,
                'frozenset': frozenset,
                'tuple': tuple,
                'map': map,
                'filter': filter,
                'any': any,
                'all': all,
                'format': format,
                'repr': repr,
                # আরও প্রয়োজনীয় builtins যোগ করুন
            }
        }

        # Execute with timeout (using threading timer)
        import threading
        result = {'done': False, 'error': None}
        def run_code():
            try:
                exec(code, {}, sandbox)
                result['done'] = True
            except Exception as e:
                result['error'] = str(e)
                result['done'] = True

        thread = threading.Thread(target=run_code)
        thread.start()
        thread.join(timeout=5)  # 5 seconds timeout

        if not result['done']:
            # Timeout
            headers = [('Access-Control-Allow-Origin', '*')]
            start_response('500 Internal Server Error', headers)
            return [json.dumps({'error': 'Bot execution timeout (5s)'}).encode()]

        if result['error']:
            headers = [('Access-Control-Allow-Origin', '*')]
            start_response('500 Internal Server Error', headers)
            return [json.dumps({'error': result['error']}).encode()]

        # Update last activity
        db.collection('bots').document(bot_id).update({
            'lastActivity': firestore.SERVER_TIMESTAMP,
            'webhookStatus': 'connected'
        })

        headers = [('Access-Control-Allow-Origin', '*'), ('Content-Type', 'text/plain')]
        start_response('200 OK', headers)
        return [b'OK']

    except Exception as e:
        print(traceback.format_exc())
        headers = [('Access-Control-Allow-Origin', '*')]
        start_response('500 Internal Server Error', headers)
        return [json.dumps({'error': str(e)}).encode()]
