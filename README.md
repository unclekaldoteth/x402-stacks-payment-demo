# x402-stacks Payment Demo

<p align="center">
  <img src="https://img.shields.io/badge/Stacks-Blockchain-purple" alt="Stacks">
  <img src="https://img.shields.io/badge/x402-Protocol-orange" alt="x402">
  <img src="https://img.shields.io/badge/STX-Payments-blue" alt="STX">
  <img src="https://img.shields.io/badge/sBTC-Payments-yellow" alt="sBTC">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
</p>

A demonstration of the **x402 payment protocol** on **Stacks blockchain** with support for both **STX** and **sBTC** tokens. This project shows how to implement HTTP-native micropayments for APIs, AI agents, and digital services.

🏆 **Built for [Talent Protocol Stacks Builder Challenge](https://talent.app/~/earn/stacks-challenge-2)**

## ⚡ What is x402?

x402 is an open payment protocol that enables automatic HTTP-level payments. When a client requests a protected resource, the server responds with HTTP 402 (Payment Required), and the client automatically signs and submits payment to access the content.

**Key Features:**
- 🔗 HTTP-native payments using status code 402
- 💰 Multi-token support (STX and sBTC)
- 🤖 Perfect for AI agents and micropayments
- ⚡ Fast settlement on Stacks blockchain
- 🔒 Secure facilitator pattern

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/unclekaldoteth/x402-stacks-payment-demo.git
cd x402-stacks-payment-demo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start the server
npm run dev
```

### Configuration

Edit `.env` file:

```env
# Stacks Network
STACKS_NETWORK=testnet

# Your Stacks wallet address to receive payments
SERVER_STX_ADDRESS=SP1ZGGS886YCZHMFXJR1EK61ZP34FNWNSX32N685T

# x402 Facilitator
FACILITATOR_URL=https://x402-backend-7eby.onrender.com
```

## 📡 API Endpoints

### Free Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/info` | API information |
| `GET /api/public-data` | Free public data |

### Paid Endpoints (x402 - STX)

| Endpoint | Amount | Description |
|----------|--------|-------------|
| `GET /api/x402/stx-data` | 0.001 STX | Premium market data |
| `GET /api/x402/premium-analysis` | 0.01 STX | AI-powered analysis |

### Paid Endpoints (x402 - sBTC)

| Endpoint | Amount | Description |
|----------|--------|-------------|
| `GET /api/x402/sbtc-data` | 100 sats | Premium Bitcoin data |

## 💻 Code Examples

### Server Setup (Express.js)

```javascript
import { x402PaymentRequired, STXtoMicroSTX } from 'x402-stacks';

app.get('/api/premium',
  x402PaymentRequired({
    amount: STXtoMicroSTX(0.001), // 0.001 STX
    address: 'SP1ZGGS886YCZHMFXJR1EK61ZP34FNWNSX32N685T',
    network: 'testnet',
    facilitatorUrl: 'https://x402-backend-7eby.onrender.com',
  }),
  (req, res) => {
    res.json({ data: 'Premium content!' });
  }
);
```

### Client Usage (axios)

```javascript
import axios from 'axios';
import { withPaymentInterceptor, privateKeyToAccount } from 'x402-stacks';

// Create account from private key
const account = privateKeyToAccount(process.env.PRIVATE_KEY, 'testnet');

// Wrap axios with automatic payment handling
const api = withPaymentInterceptor(axios.create(), account);

// Use normally - 402 payments are handled automatically!
const response = await api.get('/api/premium');
console.log(response.data);
```

### sBTC Payments

```javascript
import { x402PaymentRequired, BTCtoSats, getDefaultSBTCContract } from 'x402-stacks';

app.get('/api/bitcoin-data',
  x402PaymentRequired({
    amount: BTCtoSats(0.000001), // 100 sats
    address: 'SP1ZGGS886YCZHMFXJR1EK61ZP34FNWNSX32N685T',
    network: 'testnet',
    tokenType: 'sBTC',
    tokenContract: getDefaultSBTCContract('testnet'),
  }),
  (req, res) => {
    res.json({ data: 'Premium Bitcoin data' });
  }
);
```

## 🔄 How x402 Works

```
1. Client requests protected API endpoint
2. Server responds with HTTP 402 + payment details
3. Client signs STX/sBTC transaction (does NOT broadcast)
4. Client retries request with signed tx in X-PAYMENT header
5. Server sends signed tx to facilitator for settlement
6. Facilitator broadcasts and confirms transaction
7. Server grants access and returns data
```

## 🏗️ Project Structure

```
├── app.js              # Express server with x402 middleware
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .env                # Your configuration
├── public/
│   ├── index.html      # Demo frontend
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── README.md           # This file
├── LICENSE             # MIT License
└── CONTRIBUTING.md     # Contribution guide
```

## 🧪 Testing

### Get Testnet STX

1. Go to [Hiro Faucet](https://platform.hiro.so/faucet)
2. Connect your Stacks wallet
3. Request testnet STX

### Test Endpoints

```bash
# Test free endpoint
curl http://localhost:3000/api/public-data

# Test paid endpoint (will return 402)
curl http://localhost:3000/api/x402/stx-data

# Response:
# {
#   "error": "Payment Required",
#   "maxAmountRequired": "1000",
#   "tokenType": "STX",
#   "payTo": "SP1ZGGS886YCZHMFXJR1EK61ZP34FNWNSX32N685T",
#   ...
# }
```

## 🔐 Security

- Never commit private keys to git
- Use environment variables for sensitive data
- The facilitator pattern ensures atomic payments
- Always use HTTPS in production

## 📚 Resources

- [x402-stacks on npm](https://www.npmjs.com/package/x402-stacks)
- [x402-stacks GitHub](https://github.com/tony1908/x402Stacks)
- [x402 Protocol](https://x402.org)
- [Stacks Documentation](https://docs.stacks.co)
- [sBTC Documentation](https://www.stacks.co/sbtc)

## 🏆 Talent Protocol

This project was built for the [Stacks Builder Challenge](https://talent.app/~/earn/stacks-challenge-2) on Talent Protocol.

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

**Built with ❤️ on Stacks Blockchain**
