/**
 * x402-stacks Payment Demo Server
 * Demonstrates x402 payment protocol on Stacks blockchain
 * Supports both STX and sBTC payments
 * 
 * For Talent Protocol Builder Challenge
 * Repository: https://github.com/unclekaldoteth/x402-stacks-payment-demo
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

// x402-stacks imports
let x402Stacks;
try {
    x402Stacks = require('x402-stacks');
} catch (e) {
    console.log('⚠️  x402-stacks not installed yet. Run: npm install');
    x402Stacks = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const CONFIG = {
    network: process.env.STACKS_NETWORK || 'testnet',
    serverAddress: process.env.SERVER_STX_ADDRESS || 'SP1ZGGS886YCZHMFXJR1EK61ZP34FNWNSX32N685T',
    facilitatorUrl: process.env.FACILITATOR_URL || 'https://x402-backend-7eby.onrender.com',
    sbtcContract: process.env.SBTC_TOKEN_CONTRACT || 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token',
    // sBTC Pay config (optional)
    sbtcApiKey: process.env.SBTC_API_KEY,
    webhookSecret: process.env.SBTC_WEBHOOK_SECRET
};

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON for most routes
app.use((req, res, next) => {
    if (req.path === '/api/webhooks/sbtc') {
        express.raw({ type: 'application/json' })(req, res, next);
    } else {
        express.json()(req, res, next);
    }
});

// In-memory storage
const payments = new Map();
const orders = new Map();

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert STX to microSTX (1 STX = 1,000,000 microSTX)
 */
function STXtoMicroSTX(stx) {
    return BigInt(Math.floor(stx * 1000000));
}

/**
 * Convert BTC to satoshis (1 BTC = 100,000,000 sats)
 */
function BTCtoSats(btc) {
    return BigInt(Math.floor(btc * 100000000));
}

/**
 * Format microSTX to STX string
 */
function formatSTX(microSTX) {
    return (Number(microSTX) / 1000000).toFixed(6) + ' STX';
}

/**
 * Format satoshis to sBTC string
 */
function formatSBTC(sats) {
    return (Number(sats) / 100000000).toFixed(8) + ' sBTC';
}

// ============================================
// x402 MIDDLEWARE HELPER
// ============================================

/**
 * Create x402 payment required middleware
 * Falls back to mock if x402-stacks not available
 */
function createX402Middleware(options) {
    // If x402-stacks is available, use it
    if (x402Stacks && x402Stacks.x402PaymentRequired) {
        return x402Stacks.x402PaymentRequired({
            amount: options.amount,
            address: CONFIG.serverAddress,
            network: CONFIG.network,
            facilitatorUrl: CONFIG.facilitatorUrl,
            tokenType: options.tokenType || 'STX',
            tokenContract: options.tokenType === 'sBTC' ? {
                address: CONFIG.sbtcContract.split('.')[0],
                name: CONFIG.sbtcContract.split('.')[1]
            } : undefined,
            resource: options.resource,
            expirationSeconds: options.expirationSeconds || 300
        });
    }

    // Fallback: Mock x402 middleware for demo
    return (req, res, next) => {
        const paymentHeader = req.headers['x-payment'];

        if (!paymentHeader) {
            // Return 402 Payment Required
            const paymentRequest = {
                x402Version: 1,
                maxAmountRequired: options.amount.toString(),
                resource: options.resource || req.path,
                payTo: CONFIG.serverAddress,
                network: CONFIG.network,
                nonce: crypto.randomBytes(16).toString('hex'),
                expiresAt: new Date(Date.now() + 300000).toISOString(),
                tokenType: options.tokenType || 'STX',
                description: options.description || 'API Access Payment'
            };

            if (options.tokenType === 'sBTC') {
                paymentRequest.tokenContract = CONFIG.sbtcContract;
            }

            return res.status(402).json({
                error: 'Payment Required',
                ...paymentRequest
            });
        }

        // For demo: accept any payment header
        console.log('💰 Payment received:', paymentHeader.substring(0, 50) + '...');

        // Add payment info to request
        req.paymentInfo = {
            verified: true,
            amount: options.amount.toString(),
            tokenType: options.tokenType || 'STX',
            timestamp: new Date().toISOString()
        };

        next();
    };
}

// ============================================
// FREE ENDPOINTS
// ============================================

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        network: CONFIG.network,
        x402Enabled: !!x402Stacks,
        serverAddress: CONFIG.serverAddress
    });
});

/**
 * API Info
 */
app.get('/api/info', (req, res) => {
    res.json({
        name: 'x402-stacks Payment Demo',
        version: '1.0.0',
        description: 'Demonstrates x402 payment protocol on Stacks blockchain',
        network: CONFIG.network,
        paymentAddress: CONFIG.serverAddress,
        endpoints: {
            free: [
                { path: '/health', description: 'Health check' },
                { path: '/api/info', description: 'API information' },
                { path: '/api/public-data', description: 'Free public data' }
            ],
            paid_stx: [
                { path: '/api/x402/stx-data', amount: '0.001 STX', description: 'Premium data (STX payment)' },
                { path: '/api/x402/premium-analysis', amount: '0.01 STX', description: 'AI-powered analysis' }
            ],
            paid_sbtc: [
                { path: '/api/x402/sbtc-data', amount: '100 sats', description: 'Premium data (sBTC payment)' }
            ]
        },
        facilitator: CONFIG.facilitatorUrl
    });
});

/**
 * Free public endpoint
 */
app.get('/api/public-data', (req, res) => {
    res.json({
        message: 'This is free public data!',
        timestamp: new Date().toISOString(),
        data: {
            btcPrice: 100000 + Math.random() * 5000,
            stxPrice: 1.5 + Math.random() * 0.5,
            blockHeight: 180000 + Math.floor(Math.random() * 1000)
        }
    });
});

// ============================================
// x402 PAID ENDPOINTS - STX
// ============================================

/**
 * Premium data endpoint - requires 0.001 STX payment
 */
app.get('/api/x402/stx-data',
    createX402Middleware({
        amount: STXtoMicroSTX(0.001), // 0.001 STX = 1000 microSTX
        tokenType: 'STX',
        resource: '/api/x402/stx-data',
        description: 'Premium STX Data Access'
    }),
    (req, res) => {
        res.json({
            message: '🎉 Payment successful! Here is your premium STX data.',
            paymentInfo: req.paymentInfo,
            data: {
                premiumBtcData: {
                    price: 100000 + Math.random() * 5000,
                    volume24h: 25000000000 + Math.random() * 5000000000,
                    marketCap: 2000000000000,
                    sentiment: 'bullish'
                },
                stacksMetrics: {
                    totalStacked: 1500000000,
                    currentCycle: 52,
                    nextCycleIn: '3 days',
                    averageYield: '8.5%'
                },
                aiPrediction: {
                    shortTerm: 'positive',
                    confidence: 0.75,
                    factors: ['institutional adoption', 'sBTC launch', 'halving effect']
                }
            },
            timestamp: new Date().toISOString()
        });
    }
);

/**
 * Premium AI Analysis - requires 0.01 STX payment
 */
app.get('/api/x402/premium-analysis',
    createX402Middleware({
        amount: STXtoMicroSTX(0.01), // 0.01 STX
        tokenType: 'STX',
        resource: '/api/x402/premium-analysis',
        description: 'Premium AI-Powered Analysis'
    }),
    (req, res) => {
        res.json({
            message: '🧠 Premium AI Analysis unlocked!',
            paymentInfo: req.paymentInfo,
            analysis: {
                summary: 'Based on on-chain metrics and market sentiment analysis...',
                btcOutlook: {
                    trend: 'bullish',
                    support: 95000,
                    resistance: 110000,
                    riskLevel: 'medium'
                },
                stxOutlook: {
                    trend: 'strongly bullish',
                    catalyst: 'sBTC mainnet adoption',
                    targetPrice: 3.5,
                    timeframe: 'Q1 2025'
                },
                recommendations: [
                    'Consider DCA strategy into STX',
                    'Monitor sBTC TVL growth',
                    'Watch for Nakamoto upgrade impacts'
                ],
                confidence: 0.82,
                generatedAt: new Date().toISOString()
            }
        });
    }
);

// ============================================
// x402 PAID ENDPOINTS - sBTC
// ============================================

/**
 * Premium data endpoint - requires 100 satoshis sBTC payment
 */
app.get('/api/x402/sbtc-data',
    createX402Middleware({
        amount: BTCtoSats(0.000001), // 100 sats
        tokenType: 'sBTC',
        resource: '/api/x402/sbtc-data',
        description: 'Premium sBTC Data Access'
    }),
    (req, res) => {
        res.json({
            message: '₿ Payment with sBTC successful! Here is your Bitcoin-backed premium data.',
            paymentInfo: req.paymentInfo,
            data: {
                sbtcMetrics: {
                    totalMinted: 500,
                    totalLocked: 500,
                    pegHealth: '100%',
                    validators: 15
                },
                bitcoinBridge: {
                    pendingDeposits: 12,
                    pendingWithdrawals: 5,
                    avgConfirmationTime: '10 minutes'
                },
                defiOpportunities: [
                    { protocol: 'Velar', apy: '12%', risk: 'low' },
                    { protocol: 'Alex', apy: '18%', risk: 'medium' },
                    { protocol: 'Arkadiko', apy: '8%', risk: 'low' }
                ]
            },
            timestamp: new Date().toISOString()
        });
    }
);

// ============================================
// sBTC PAY ENDPOINTS (Legacy)
// ============================================

const SBTC_API_BASE_URL = 'https://sbtcpay.org/api/v1';

/**
 * Create payment intent via sBTC Pay
 */
app.post('/api/payments/create', async (req, res) => {
    try {
        const { amount, description, productId, customerEmail, metadata } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount is required and must be positive'
            });
        }

        // For demo: create mock payment intent
        const paymentIntent = {
            id: `pi_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            amount: amount,
            amount_usd: (amount / 100000000 * 100000).toFixed(2),
            status: 'created',
            checkout_url: `https://sbtcpay.org/checkout/demo`,
            expires_at: new Date(Date.now() + 3600000).toISOString()
        };

        payments.set(paymentIntent.id, {
            ...paymentIntent,
            description,
            productId,
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            paymentIntent: {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                amountUsd: paymentIntent.amount_usd,
                status: paymentIntent.status,
                checkoutUrl: paymentIntent.checkout_url,
                expiresAt: paymentIntent.expires_at
            }
        });

    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create payment'
        });
    }
});

/**
 * Get payment status
 */
app.get('/api/payments/:id', (req, res) => {
    const { id } = req.params;
    const payment = payments.get(id);

    if (!payment) {
        return res.status(404).json({
            success: false,
            error: 'Payment not found'
        });
    }

    res.json({
        success: true,
        payment
    });
});

/**
 * List all payments
 */
app.get('/api/payments', (req, res) => {
    const allPayments = Array.from(payments.values());
    res.json({
        success: true,
        payments: allPayments,
        count: allPayments.length
    });
});

/**
 * Webhook handler for sBTC Pay
 */
app.post('/api/webhooks/sbtc', (req, res) => {
    try {
        const signature = req.headers['x-sbtc-signature'] || req.headers['x-webhook-signature'];
        const payload = req.body;
        const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : JSON.stringify(payload);

        // Verify signature if configured
        if (signature && CONFIG.webhookSecret && CONFIG.webhookSecret !== 'whsec_your_webhook_secret_here') {
            const expectedSignature = crypto
                .createHmac('sha256', CONFIG.webhookSecret)
                .update(payloadString)
                .digest('hex');

            try {
                if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
                    return res.status(401).json({ error: 'Invalid signature' });
                }
            } catch {
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const event = typeof payload === 'string' ? JSON.parse(payload) :
            Buffer.isBuffer(payload) ? JSON.parse(payloadString) : payload;

        console.log('📩 Webhook received:', event.type);

        switch (event.type) {
            case 'payment_intent.succeeded':
            case 'payment.succeeded':
                const paymentId = event.data?.object?.id || event.data?.id;
                if (paymentId && payments.has(paymentId)) {
                    const payment = payments.get(paymentId);
                    payments.set(paymentId, {
                        ...payment,
                        status: 'succeeded',
                        paidAt: new Date().toISOString()
                    });
                }
                console.log('✅ Payment succeeded:', paymentId);
                break;

            case 'payment_intent.failed':
            case 'payment.failed':
                console.log('❌ Payment failed');
                break;
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: error.message });
    }
});

// ============================================
// STATIC FILES & SERVER
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ⚡ x402-stacks Payment Demo Server                                     ║
║                                                                           ║
║   Server running at: http://localhost:${PORT}                              ║
║   Network: ${CONFIG.network.padEnd(58)}║
║   Payment Address: ${CONFIG.serverAddress.substring(0, 42)}...  ║
║   x402 Enabled: ${(x402Stacks ? 'Yes' : 'No (mock mode)').padEnd(53)}║
║                                                                           ║
║   FREE Endpoints:                                                         ║
║   • GET  /health                 - Health check                           ║
║   • GET  /api/info               - API information                        ║
║   • GET  /api/public-data        - Free public data                       ║
║                                                                           ║
║   PAID Endpoints (x402 - STX):                                            ║
║   • GET  /api/x402/stx-data      - Premium data (0.001 STX)               ║
║   • GET  /api/x402/premium-analysis - AI analysis (0.01 STX)              ║
║                                                                           ║
║   PAID Endpoints (x402 - sBTC):                                           ║
║   • GET  /api/x402/sbtc-data     - Premium data (100 sats)                ║
║                                                                           ║
║   sBTC Pay Endpoints:                                                     ║
║   • POST /api/payments/create    - Create payment intent                  ║
║   • GET  /api/payments/:id       - Get payment status                     ║
║   • POST /api/webhooks/sbtc      - Webhook handler                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);
});
