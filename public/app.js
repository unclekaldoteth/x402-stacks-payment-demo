/**
 * x402-stacks Demo - Frontend JavaScript
 * Handles API testing and response display
 */

// ==========================================
// API Testing Functions
// ==========================================

/**
 * Test an API endpoint
 */
async function testEndpoint(path, type) {
    showModal('loading', {
        title: 'Testing Endpoint...',
        message: `Sending request to ${path}`
    });

    try {
        const response = await fetch(path);
        const data = await response.json();

        if (response.status === 402) {
            // Payment Required response
            showModal('payment-required', {
                title: 'HTTP 402 - Payment Required',
                message: 'This endpoint requires payment. Here are the payment details:',
                data: data,
                path: path,
                type: type
            });
        } else if (response.ok) {
            // Success response
            showModal('success', {
                title: '✅ Success!',
                message: type === 'free' ? 'Free endpoint response:' : 'Payment verified! Here is your data:',
                data: data
            });
        } else {
            throw new Error(data.error || 'Request failed');
        }

    } catch (error) {
        console.error('Error:', error);
        showModal('error', {
            title: '❌ Error',
            message: error.message
        });
    }
}

// ==========================================
// Modal Functions
// ==========================================

function showModal(type, options) {
    const modal = document.getElementById('responseModal');
    const modalBody = document.getElementById('modalBody');

    let content = '';

    switch (type) {
        case 'loading':
            content = `
                <div class="modal-icon"><div class="spinner"></div></div>
                <h3 class="modal-title">${options.title}</h3>
                <p class="modal-message">${options.message}</p>
            `;
            break;

        case 'payment-required':
            content = `
                <div class="modal-icon">💳</div>
                <h3 class="modal-title">${options.title}</h3>
                <p class="modal-message">${options.message}</p>
                <div class="response-info">
                    <div class="info-row">
                        <span class="info-label">Amount:</span>
                        <span class="info-value highlight">${formatAmount(options.data.maxAmountRequired, options.data.tokenType)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Token:</span>
                        <span class="info-value">${options.data.tokenType || 'STX'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Pay To:</span>
                        <span class="info-value mono">${truncate(options.data.payTo, 20)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Network:</span>
                        <span class="info-value">${options.data.network}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Expires:</span>
                        <span class="info-value">${formatDate(options.data.expiresAt)}</span>
                    </div>
                </div>
                <div class="code-response">
                    <pre>${JSON.stringify(options.data, null, 2)}</pre>
                </div>
                <p class="modal-hint">
                    💡 To complete payment, use <code>x402-stacks</code> client with your Stacks wallet.
                </p>
                <button onclick="closeModal()" class="modal-button secondary">Close</button>
            `;
            break;

        case 'success':
            content = `
                <div class="modal-icon">✅</div>
                <h3 class="modal-title">${options.title}</h3>
                <p class="modal-message">${options.message}</p>
                <div class="code-response">
                    <pre>${JSON.stringify(options.data, null, 2)}</pre>
                </div>
                <button onclick="closeModal()" class="modal-button">Done</button>
            `;
            break;

        case 'error':
            content = `
                <div class="modal-icon">❌</div>
                <h3 class="modal-title">${options.title}</h3>
                <p class="modal-message">${options.message}</p>
                <button onclick="closeModal()" class="modal-button secondary">Close</button>
            `;
            break;
    }

    modalBody.innerHTML = content;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('responseModal');
    modal.classList.remove('active');
}

// ==========================================
// Utility Functions
// ==========================================

function formatAmount(amount, tokenType) {
    if (tokenType === 'sBTC') {
        return `${amount} sats (${(Number(amount) / 100000000).toFixed(8)} sBTC)`;
    }
    return `${(Number(amount) / 1000000).toFixed(6)} STX`;
}

function truncate(str, len) {
    if (!str || str.length <= len) return str;
    return `${str.slice(0, len / 2)}...${str.slice(-len / 2)}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
}

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚡ x402-stacks Demo initialized');

    // Load API info
    try {
        const response = await fetch('/api/info');
        const info = await response.json();

        const badge = document.getElementById('networkBadge');
        if (badge) {
            badge.textContent = info.network.charAt(0).toUpperCase() + info.network.slice(1);
        }
    } catch (e) {
        console.log('Could not load API info');
    }

    // Modal close handlers
    document.getElementById('responseModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});
