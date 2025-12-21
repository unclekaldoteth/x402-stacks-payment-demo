/**
 * Data API Routes - CoinMarketCap & Hiro Stacks Integration
 * Paid endpoints using x402-stacks middleware
 */

// API Configuration
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const COINMARKETCAP_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

/**
 * Setup Data API routes
 * @param {Express} app - Express app instance
 * @param {Function} createX402Middleware - x402 middleware factory
 * @param {Function} STXtoMicroSTX - Utility function
 * @param {Object} CONFIG - Server configuration
 */
function setupDataApiRoutes(app, createX402Middleware, STXtoMicroSTX, CONFIG) {

    const HIRO_API_BASE_URL = CONFIG.network === 'mainnet'
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

    // ============================================
    // CoinMarketCap Helper Functions
    // ============================================

    async function fetchCoinMarketCapData(endpoint, params = {}) {
        const url = new URL(`${COINMARKETCAP_BASE_URL}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY || '',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('CoinMarketCap API error:', error.message);
            return null;
        }
    }

    function getMockCryptoData() {
        return {
            BTC: {
                name: 'Bitcoin', symbol: 'BTC',
                price: 100000 + Math.random() * 5000,
                percent_change_24h: (Math.random() * 10 - 5).toFixed(2),
                percent_change_7d: (Math.random() * 20 - 10).toFixed(2),
                market_cap: 2000000000000,
                volume_24h: 50000000000
            },
            STX: {
                name: 'Stacks', symbol: 'STX',
                price: 1.5 + Math.random() * 0.5,
                percent_change_24h: (Math.random() * 15 - 7.5).toFixed(2),
                percent_change_7d: (Math.random() * 30 - 15).toFixed(2),
                market_cap: 2300000000,
                volume_24h: 150000000
            },
            ETH: {
                name: 'Ethereum', symbol: 'ETH',
                price: 3500 + Math.random() * 200,
                percent_change_24h: (Math.random() * 8 - 4).toFixed(2),
                percent_change_7d: (Math.random() * 15 - 7.5).toFixed(2),
                market_cap: 420000000000,
                volume_24h: 20000000000
            }
        };
    }

    // ============================================
    // Hiro Stacks Helper Functions
    // ============================================

    async function fetchHiroData(endpoint) {
        try {
            const response = await fetch(`${HIRO_API_BASE_URL}${endpoint}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`Hiro API error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Hiro API error:', error.message);
            return null;
        }
    }

    // ============================================
    // CoinMarketCap Endpoints
    // ============================================

    /**
     * BTC Price - 0.0001 STX
     */
    app.get('/api/x402/cmc/btc-price',
        createX402Middleware({
            amount: STXtoMicroSTX(0.0001),
            tokenType: 'STX',
            resource: '/api/x402/cmc/btc-price',
            description: 'Bitcoin Price from CoinMarketCap'
        }),
        async (req, res) => {
            const cmcData = await fetchCoinMarketCapData('/cryptocurrency/quotes/latest', { symbol: 'BTC' });
            const data = cmcData?.BTC || getMockCryptoData().BTC;

            res.json({
                message: '💰 Bitcoin Price Data',
                paymentInfo: req.paymentInfo,
                source: cmcData ? 'CoinMarketCap API' : 'Demo Data',
                data: {
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    price_usd: data.quote?.USD?.price || data.price,
                    change_24h: data.quote?.USD?.percent_change_24h || data.percent_change_24h,
                    change_7d: data.quote?.USD?.percent_change_7d || data.percent_change_7d,
                    market_cap: data.quote?.USD?.market_cap || data.market_cap,
                    volume_24h: data.quote?.USD?.volume_24h || data.volume_24h
                },
                timestamp: new Date().toISOString()
            });
        }
    );

    /**
     * Multi-Crypto Prices - 0.0005 STX
     */
    app.get('/api/x402/cmc/crypto-prices',
        createX402Middleware({
            amount: STXtoMicroSTX(0.0005),
            tokenType: 'STX',
            resource: '/api/x402/cmc/crypto-prices',
            description: 'Multiple Cryptocurrency Prices'
        }),
        async (req, res) => {
            const symbols = req.query.symbols || 'BTC,STX,ETH';
            const cmcData = await fetchCoinMarketCapData('/cryptocurrency/quotes/latest', { symbol: symbols });
            const mockData = getMockCryptoData();

            const prices = {};
            symbols.split(',').forEach(symbol => {
                const sym = symbol.trim().toUpperCase();
                const d = cmcData?.[sym] || mockData[sym];
                if (d) {
                    prices[sym] = {
                        name: d.name,
                        price_usd: d.quote?.USD?.price || d.price,
                        change_24h: d.quote?.USD?.percent_change_24h || d.percent_change_24h,
                        market_cap: d.quote?.USD?.market_cap || d.market_cap
                    };
                }
            });

            res.json({
                message: '📊 Cryptocurrency Prices',
                paymentInfo: req.paymentInfo,
                source: cmcData ? 'CoinMarketCap API' : 'Demo Data',
                data: prices,
                timestamp: new Date().toISOString()
            });
        }
    );

    /**
     * Top 10 Cryptocurrencies - 0.001 STX
     */
    app.get('/api/x402/cmc/top-10',
        createX402Middleware({
            amount: STXtoMicroSTX(0.001),
            tokenType: 'STX',
            resource: '/api/x402/cmc/top-10',
            description: 'Top 10 Cryptocurrencies'
        }),
        async (req, res) => {
            const cmcData = await fetchCoinMarketCapData('/cryptocurrency/listings/latest', { limit: 10 });

            const listings = cmcData || [
                { name: 'Bitcoin', symbol: 'BTC', cmc_rank: 1, quote: { USD: { price: 100000, market_cap: 2000000000000 } } },
                { name: 'Ethereum', symbol: 'ETH', cmc_rank: 2, quote: { USD: { price: 3500, market_cap: 420000000000 } } },
                { name: 'Tether', symbol: 'USDT', cmc_rank: 3, quote: { USD: { price: 1, market_cap: 140000000000 } } },
                { name: 'BNB', symbol: 'BNB', cmc_rank: 4, quote: { USD: { price: 700, market_cap: 110000000000 } } },
                { name: 'Solana', symbol: 'SOL', cmc_rank: 5, quote: { USD: { price: 220, market_cap: 105000000000 } } },
                { name: 'XRP', symbol: 'XRP', cmc_rank: 6, quote: { USD: { price: 2.5, market_cap: 90000000000 } } },
                { name: 'USDC', symbol: 'USDC', cmc_rank: 7, quote: { USD: { price: 1, market_cap: 45000000000 } } },
                { name: 'Cardano', symbol: 'ADA', cmc_rank: 8, quote: { USD: { price: 1.1, market_cap: 40000000000 } } },
                { name: 'Avalanche', symbol: 'AVAX', cmc_rank: 9, quote: { USD: { price: 50, market_cap: 20000000000 } } },
                { name: 'Stacks', symbol: 'STX', cmc_rank: 10, quote: { USD: { price: 1.8, market_cap: 2700000000 } } }
            ];

            res.json({
                message: '🏆 Top 10 Cryptocurrencies',
                paymentInfo: req.paymentInfo,
                source: cmcData ? 'CoinMarketCap API' : 'Demo Data',
                data: listings.map(coin => ({
                    rank: coin.cmc_rank,
                    name: coin.name,
                    symbol: coin.symbol,
                    price_usd: coin.quote?.USD?.price,
                    market_cap: coin.quote?.USD?.market_cap
                })),
                timestamp: new Date().toISOString()
            });
        }
    );

    // ============================================
    // Hiro Stacks Endpoints
    // ============================================

    /**
     * Stacks Network Info - 0.0001 STX
     */
    app.get('/api/x402/hiro/network-info',
        createX402Middleware({
            amount: STXtoMicroSTX(0.0001),
            tokenType: 'STX',
            resource: '/api/x402/hiro/network-info',
            description: 'Stacks Network Information'
        }),
        async (req, res) => {
            const [info, pox] = await Promise.all([
                fetchHiroData('/v2/info'),
                fetchHiroData('/v2/pox')
            ]);

            res.json({
                message: '🔗 Stacks Network Info (Hiro)',
                paymentInfo: req.paymentInfo,
                source: 'Hiro Stacks API',
                data: {
                    network: CONFIG.network,
                    stacks_tip_height: info?.stacks_tip_height || 'N/A',
                    burn_block_height: info?.burn_block_height || 'N/A',
                    server_version: info?.server_version || 'N/A',
                    current_pox_cycle: pox?.current_cycle?.id || 'N/A'
                },
                timestamp: new Date().toISOString()
            });
        }
    );

    /**
     * STX Balance Check - 0.0002 STX
     */
    app.get('/api/x402/hiro/balance/:address',
        createX402Middleware({
            amount: STXtoMicroSTX(0.0002),
            tokenType: 'STX',
            resource: '/api/x402/hiro/balance',
            description: 'STX Account Balance'
        }),
        async (req, res) => {
            const { address } = req.params;
            const balance = await fetchHiroData(`/extended/v1/address/${address}/balances`);

            if (!balance) {
                return res.status(404).json({ success: false, error: 'Could not fetch balance' });
            }

            const stxBalance = BigInt(balance.stx?.balance || 0);
            const stxLocked = BigInt(balance.stx?.locked || 0);

            res.json({
                message: '💎 STX Account Balance (Hiro)',
                paymentInfo: req.paymentInfo,
                source: 'Hiro Stacks API',
                data: {
                    address: address,
                    balance: (Number(stxBalance) / 1000000).toFixed(6) + ' STX',
                    locked: (Number(stxLocked) / 1000000).toFixed(6) + ' STX',
                    fungible_tokens: Object.keys(balance.fungible_tokens || {}).length,
                    nfts: Object.keys(balance.non_fungible_tokens || {}).length
                },
                timestamp: new Date().toISOString()
            });
        }
    );

    /**
     * Recent Stacks Blocks - 0.0003 STX
     */
    app.get('/api/x402/hiro/blocks',
        createX402Middleware({
            amount: STXtoMicroSTX(0.0003),
            tokenType: 'STX',
            resource: '/api/x402/hiro/blocks',
            description: 'Recent Stacks Blocks'
        }),
        async (req, res) => {
            const limit = Math.min(parseInt(req.query.limit) || 5, 20);
            const blocks = await fetchHiroData(`/extended/v2/blocks?limit=${limit}`);

            res.json({
                message: '📦 Recent Stacks Blocks (Hiro)',
                paymentInfo: req.paymentInfo,
                source: 'Hiro Stacks API',
                data: {
                    total: blocks?.total || 0,
                    blocks: (blocks?.results || []).map(block => ({
                        height: block.height,
                        hash: block.hash?.substring(0, 16) + '...',
                        timestamp: block.burn_block_time_iso,
                        tx_count: block.txs?.length || block.tx_count || 0
                    }))
                },
                timestamp: new Date().toISOString()
            });
        }
    );

    /**
     * Address Transactions - 0.0005 STX
     */
    app.get('/api/x402/hiro/transactions/:address',
        createX402Middleware({
            amount: STXtoMicroSTX(0.0005),
            tokenType: 'STX',
            resource: '/api/x402/hiro/transactions',
            description: 'Address Transaction History'
        }),
        async (req, res) => {
            const { address } = req.params;
            const limit = Math.min(parseInt(req.query.limit) || 10, 50);
            const txs = await fetchHiroData(`/extended/v1/address/${address}/transactions?limit=${limit}`);

            res.json({
                message: '📜 Transaction History (Hiro)',
                paymentInfo: req.paymentInfo,
                source: 'Hiro Stacks API',
                data: {
                    address: address,
                    total: txs?.total || 0,
                    transactions: (txs?.results || []).map(tx => ({
                        tx_id: tx.tx_id?.substring(0, 16) + '...',
                        type: tx.tx_type,
                        status: tx.tx_status,
                        fee: (Number(tx.fee_rate || 0) / 1000000).toFixed(6) + ' STX'
                    }))
                },
                timestamp: new Date().toISOString()
            });
        }
    );


    // ============================================
    // USDCx Stablecoin Endpoints
    // ============================================

    // USDCx Contract addresses (1:1 USDC-backed via Circle xReserve)
    const USDCX_CONTRACT = CONFIG.network === 'mainnet'
        ? 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1'
        : 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1';

    /**
     * USDCx Balance Check - 0.0001 STX
     */
    app.get('/api/x402/usdcx/balance/:address',
        createX402Middleware({
            amount: STXtoMicroSTX(0.0001),
            tokenType: 'STX',
            resource: '/api/x402/usdcx/balance',
            description: 'USDCx Balance Check'
        }),
        async (req, res) => {
            const { address } = req.params;
            const balance = await fetchHiroData(`/extended/v1/address/${address}/balances`);

            if (!balance) {
                return res.status(404).json({ success: false, error: 'Could not fetch balance' });
            }

            // Find USDCx token balance
            const usdcxKey = Object.keys(balance.fungible_tokens || {})
                .find(key => key.includes('usdcx'));
            const usdcxBalance = usdcxKey 
                ? BigInt(balance.fungible_tokens[usdcxKey]?.balance || 0)
                : BigInt(0);

            res.json({
                message: 'USDCx Balance',
                paymentInfo: req.paymentInfo,
                source: 'Hiro Stacks API',
                data: {
                    address: address,
                    contract: USDCX_CONTRACT,
                    balance: (Number(usdcxBalance) / 1000000).toFixed(6),
                    balance_raw: usdcxBalance.toString(),
                    unit: 'USDCx'
                },
                timestamp: new Date().toISOString()
            });
        }
    );

    /**
     * USDCx Info - 0.0001 STX
     */
    app.get('/api/x402/usdcx/info',
        createX402Middleware({
            amount: STXtoMicroSTX(0.0001),
            tokenType: 'STX',
            resource: '/api/x402/usdcx/info',
            description: 'USDCx Token Information'
        }),
        async (req, res) => {
            res.json({
                message: 'USDCx Token Information',
                paymentInfo: req.paymentInfo,
                data: {
                    name: 'USDCx',
                    description: '1:1 USDC-backed stablecoin via Circle xReserve',
                    contract: USDCX_CONTRACT,
                    network: CONFIG.network,
                    decimals: 6,
                    standard: 'SIP-010',
                    issuer: 'Circle',
                    backing: 'USDC (1:1)',
                    bridge: 'Circle xReserve / CCTP'
                },
                resources: {
                    docs: 'https://docs.stacks.co/learn/bridging/usdcx',
                    circle: 'https://developers.circle.com/xreserve',
                    explorer: `https://explorer.hiro.so/token/${USDCX_CONTRACT}?chain=${CONFIG.network}`
                },
                timestamp: new Date().toISOString()
            });
        }
    );

    console.log('Data API routes registered (CoinMarketCap + Hiro + USDCx)');
}

module.exports = { setupDataApiRoutes };
