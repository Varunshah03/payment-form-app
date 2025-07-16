from flask import Flask, request, jsonify
import razorpay
from dotenv import load_dotenv
import os
import hmac
import hashlib
import json

app = Flask(__name__)

# Load environment variables
load_dotenv()
print(f"Loaded RAZORPAY_KEY_ID: {os.getenv('RAZORPAY_KEY_ID')}")
print(f"Loaded RAZORPAY_KEY_SECRET: {os.getenv('RAZORPAY_KEY_SECRET')}")

# Validate and initialize Razorpay client
try:
    razorpay_key_id = os.getenv("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not razorpay_key_id or not razorpay_key_secret:
        raise ValueError("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in .env")
    client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
    print("Razorpay client initialized successfully")
except ValueError as ve:
    print(f"Configuration Error: {str(ve)}")
    client = None
except Exception as e:
    print(f"Failed to initialize Razorpay client: {str(e)}")
    client = None

# Enable CORS
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'  # Update to frontend URL in production
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/')
def home():
    return jsonify({"message": "Flask API is running. Use /api/create-order for POST requests."})

@app.route('/api/create-order', methods=['POST'])
def create_order():
    if not client:
        return jsonify({"error": "Razorpay client not initialized. Check your .env file."}), 500

    try:
        data = request.get_json()
        if not data or 'amount' not in data or 'currency' not in data:
            return jsonify({"error": "Missing amount or currency"}), 400

        # Use the amount from the request as the final total (in rupees)
        total_amount_rupees = float(data.get('amount', 0))
        if total_amount_rupees <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400

        # Convert to paise for Razorpay
        total_amount_paise = int(total_amount_rupees * 100)

        order_data = {
            "amount": total_amount_paise,
            "currency": data['currency'],
            "payment_capture": 1
        }
        razorpay_order = client.order.create(data=order_data)
        return jsonify({
            "orderId": razorpay_order["id"],
            "amount": total_amount_paise,
            "currency": data["currency"],
            "key": razorpay_key_id,
            "name": "Your Org Name"
        })
    except razorpay.errors.AuthenticationError:
        return jsonify({"error": "Authentication failed. Please check your Razorpay credentials."}), 401
    except razorpay.errors.BadRequestError as bre:
        return jsonify({"error": f"Bad request: {str(bre)}"}), 400
    except razorpay.errors.GatewayError as ge:
        return jsonify({"error": f"Gateway error: {str(ge)}"}), 502
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/api/webhook', methods=['POST'])
def webhook():
    try:
        payload = request.get_json()
        if not payload or 'signature' not in payload:
            return jsonify({"error": "Invalid payload"}), 400

        secret = os.getenv("RAZORPAY_KEY_SECRET").encode('utf-8')
        signature = payload.get("signature")
        body = json.dumps(payload["body"]).encode('utf-8')
    
        generated_signature = hmac.new(secret, body, hashlib.sha256).hexdigest()
    
        if generated_signature == signature:
            payment_id = payload["body"]["payload"]["payment"]["entity"]["id"]
            print(f"Payment verified: {payment_id}")
            return jsonify({"status": "success"}), 200
        else:
            return jsonify({"error": "Invalid signature"}), 400
    except Exception as e:
        return jsonify({"error": f"Webhook error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)