// EcoFin Service Worker
const CACHE_NAME = 'ecofin-v1.0.0';
const STATIC_CACHE = 'ecofin-static-v1.0.0';
const DYNAMIC_CACHE = 'ecofin-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/js/config.js',
    '/js/auth.js',
    '/js/transactions.js',
    '/js/dashboard.js',
    '/js/charts.js',
    '/js/notifications.js',
    '/js/currency.js',
    '/js/ai-assistant.js',
    '/js/app.js',
    '/manifest.json',
    // External CDN resources (cached dynamically)
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
    /https:\/\/api\.exchangerate\.host/,
    /https:\/\/api\.coingecko\.com/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching static files...');
                return cache.addAll(STATIC_FILES.filter(file => !file.startsWith('http')));
            })
            .then(() => {
                console.log('✅ Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (request.url.includes('firestore.googleapis.com')) {
        // Firebase requests - try network first, fallback to cache
        event.respondWith(handleFirebaseRequest(request));
        
    } else if (isAPIRequest(request.url)) {
        // API requests - cache with expiration
        event.respondWith(handleAPIRequest(request));
        
    } else if (isStaticAsset(request.url)) {
        // Static assets - cache first
        event.respondWith(handleStaticAsset(request));
        
    } else {
        // HTML pages - network first, fallback to cache
        event.respondWith(handlePageRequest(request));
    }
});

// Handle Firebase/Firestore requests
async function handleFirebaseRequest(request) {
    try {
        // Always try network first for Firebase
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('🔄 Firebase offline, trying cache...');
        
        // Try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for Firebase
        return new Response(
            JSON.stringify({ 
                error: 'offline',
                message: 'Firebase unavailable offline'
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle API requests (currency, etc.)
async function handleAPIRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache with timestamp for expiration
            const responseToCache = networkResponse.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-at', Date.now().toString());
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, cachedResponse);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('🔄 API offline, trying cache...');
        
        // Check cache
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Check if cache is still valid (1 hour for API data)
            const cachedAt = cachedResponse.headers.get('sw-cached-at');
            const cacheAge = Date.now() - parseInt(cachedAt || '0');
            const maxAge = 60 * 60 * 1000; // 1 hour
            
            if (cacheAge < maxAge) {
                return cachedResponse;
            }
        }
        
        // Return offline response
        return new Response(
            JSON.stringify({ 
                error: 'offline',
                message: 'API unavailable offline',
                cached: !!cachedResponse
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle static assets (CSS, JS, images)
async function handleStaticAsset(request) {
    // Cache first strategy for static assets
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('❌ Failed to fetch static asset:', request.url);
        
        // Return a fallback for failed static assets
        if (request.url.includes('.css')) {
            return new Response('/* Offline - CSS unavailable */', {
                headers: { 'Content-Type': 'text/css' }
            });
        }
        
        if (request.url.includes('.js')) {
            return new Response('console.log("Offline - JS unavailable");', {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }
        
        throw error;
    }
}

// Handle page requests (HTML)
async function handlePageRequest(request) {
    try {
        // Network first for pages
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('🔄 Page offline, trying cache...');
        
        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to index.html for SPA routing
        const indexResponse = await caches.match('/index.html');
        if (indexResponse) {
            return indexResponse;
        }
        
        // Ultimate fallback - offline page
        return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
                <title>EcoFin - Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                    }
                    .container {
                        max-width: 400px;
                        padding: 2rem;
                    }
                    .icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    h1 {
                        margin: 0 0 1rem 0;
                        font-size: 2rem;
                    }
                    p {
                        margin: 0 0 2rem 0;
                        opacity: 0.9;
                    }
                    button {
                        background: rgba(255,255,255,0.2);
                        border: 2px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    }
                    button:hover {
                        background: rgba(255,255,255,0.3);
                        border-color: rgba(255,255,255,0.5);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">📱</div>
                    <h1>EcoFin</h1>
                    <p>Você está offline. Verifique sua conexão com a internet e tente novamente.</p>
                    <button onclick="location.reload()">Tentar Novamente</button>
                </div>
            </body>
            </html>
            `,
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// Helper functions
function isAPIRequest(url) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isStaticAsset(url) {
    return /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/i.test(url) ||
           url.includes('cdn.') ||
           url.includes('unpkg.com') ||
           url.includes('cdnjs.cloudflare.com');
}

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncOfflineTransactions());
    }
    
    if (event.tag === 'sync-currency') {
        event.waitUntil(syncCurrencyRates());
    }
});

// Sync offline transactions when connection is restored
async function syncOfflineTransactions() {
    try {
        // Get offline transactions from IndexedDB
        const offlineTransactions = await getOfflineTransactions();
        
        if (offlineTransactions.length > 0) {
            console.log(`🔄 Syncing ${offlineTransactions.length} offline transactions...`);
            
            // Send to all clients to handle sync
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_OFFLINE_TRANSACTIONS',
                    transactions: offlineTransactions
                });
            });
        }
        
    } catch (error) {
        console.error('❌ Failed to sync offline transactions:', error);
    }
}

// Sync currency rates
async function syncCurrencyRates() {
    try {
        console.log('🔄 Syncing currency rates...');
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_CURRENCY_RATES'
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to sync currency rates:', error);
    }
}

// Mock function - would integrate with IndexedDB in real implementation
async function getOfflineTransactions() {
    // This would read from IndexedDB in a real implementation
    return [];
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_TRANSACTION':
            // Cache transaction data for offline access
            cacheTransactionData(data);
            break;
            
        case 'CLEAR_CACHE':
            // Clear all caches
            clearAllCaches();
            break;
            
        default:
            console.log('Unknown message type:', type);
    }
});

// Cache transaction data
async function cacheTransactionData(data) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(`/offline-data/transactions-${data.userId}`, response);
        console.log('✅ Transaction data cached for offline access');
        
    } catch (error) {
        console.error('❌ Failed to cache transaction data:', error);
    }
}

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        
        console.log('✅ All caches cleared');
        
    } catch (error) {
        console.error('❌ Failed to clear caches:', error);
    }
}

// Periodic cleanup of old cache entries
setInterval(async () => {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const cachedAt = response.headers.get('sw-cached-at');
                if (cachedAt) {
                    const age = Date.now() - parseInt(cachedAt);
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                    
                    if (age > maxAge) {
                        await cache.delete(request);
                        console.log('🗑️ Cleaned up old cache entry:', request.url);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
    }
}, 60 * 60 * 1000); // Run every hour

console.log('✅ EcoFin Service Worker loaded successfully');