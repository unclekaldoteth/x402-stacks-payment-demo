# x402-stacks Payment Demo

x402 payment protocol implementation on Stacks blockchain with STX, sBTC, and USDCx token support.

Built for Talent Protocol Stacks Builder Challenge.

## Overview

x402 enables HTTP-native micropayments. Protected endpoints respond with HTTP 402, and clients automatically sign and submit payments.

**Supported tokens:** STX, sBTC, USDCx (via Circle xReserve)

## Quick Start

```bash
git clone https://github.com/unclekaldoteth/x402-stacks-payment-demo.git
cd x402-stacks-payment-demo
npm install
cp .env.example .env
npm run dev
```

## Configuration

```env
STACKS_NETWORK=testnet
SERVER_STX_ADDRESS=SP1ZGGS886YCZHMFXJR1EK61ZP34FNWNSX32N685T
FACILITATOR_URL=https://x402-backend-7eby.onrender.com
COINMARKETCAP_API_KEY=your_api_key_here
```

## API Endpoints

### Free

| Endpoint | Description |
|----------|-------------|
| GET /health | Health check |
| GET /api/info | API information |
| GET /api/public-data | Public data |

### Paid (STX)

| Endpoint | Amount | Description |
|----------|--------|-------------|
| GET /api/x402/stx-data | 0.001 STX | Market data |
| GET /api/x402/premium-analysis | 0.01 STX | AI analysis |

### Paid (sBTC)

| Endpoint | Amount | Description |
|----------|--------|-------------|
| GET /api/x402/sbtc-data | 100 sats | Bitcoin data |

### Data APIs - CoinMarketCap

| Endpoint | Amount | Description |
|----------|--------|-------------|
| GET /api/x402/cmc/btc-price | 0.0001 STX | BTC price |
| GET /api/x402/cmc/crypto-prices | 0.0005 STX | Multi-crypto prices |
| GET /api/x402/cmc/top-10 | 0.001 STX | Top 10 by market cap |

### Data APIs - Hiro Stacks

| Endpoint | Amount | Description |
|----------|--------|-------------|
| GET /api/x402/hiro/network-info | 0.0001 STX | Network status |
| GET /api/x402/hiro/balance/:address | 0.0002 STX | STX balance |
| GET /api/x402/hiro/blocks | 0.0003 STX | Recent blocks |
| GET /api/x402/hiro/transactions/:address | 0.0005 STX | TX history |

### USDCx Stablecoin

| Endpoint | Amount | Description |
|----------|--------|-------------|
| GET /api/x402/usdcx/info | 0.0001 STX | USDCx token info |
| GET /api/x402/usdcx/balance/:address | 0.0001 STX | USDCx balance |

USDCx contracts:
- Mainnet: `SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1`
- Testnet: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1`

## Server Example

```javascript
import { x402PaymentRequired, STXtoMicroSTX } from 'x402-stacks';

app.get('/api/premium',
  x402PaymentRequired({
    amount: STXtoMicroSTX(0.001),
    address: 'SP1ZGGS886YCZHMFXJR1EK61ZP34FNWNSX32N685T',
    network: 'testnet',
  }),
  (req, res) => res.json({ data: 'Premium content' })
);
```

## Client Example

```javascript
import { withPaymentInterceptor, privateKeyToAccount } from 'x402-stacks';

const account = privateKeyToAccount(process.env.PRIVATE_KEY, 'testnet');
const api = withPaymentInterceptor(axios.create(), account);
const response = await api.get('/api/premium');
```

## How x402 Works

1. Client requests protected endpoint
2. Server returns HTTP 402 with payment details
3. Client signs transaction (does not broadcast)
4. Client retries with X-PAYMENT header
5. Server sends signed tx to facilitator
6. Facilitator broadcasts and confirms
7. Server returns data

## Project Structure

```
app.js              - Express server with x402 middleware
data-api.js         - CoinMarketCap, Hiro, USDCx APIs
public/             - Frontend demo
.env.example        - Configuration template
```

## Resources

- x402-stacks: https://www.npmjs.com/package/x402-stacks
- x402 Protocol: https://x402.org
- USDCx Docs: https://docs.stacks.co/learn/bridging/usdcx
- CoinMarketCap: https://coinmarketcap.com/api/
- Hiro Stacks API: https://docs.hiro.so/stacks

## License

MIT
