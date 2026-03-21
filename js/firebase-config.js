// Konfigurasi ini biasanya didapat dari Project Settings di Firebase Console
const firebaseConfig = {
    // KARENA INI VERSI DEMO TANPA API KEY, KITA GUNAKAN LOCAL STORAGE & MOCK DATA SEMENTARA
    // AGAR APLIKASI BISA LANGSUNG JALAN DAN DITEST OLEH USER, KITA BUAT SEOLAH REAL-TIME.
    // Jika user mau, kita akan ubah ini menembak Firebase Betulan.
};

// --- MOCK FIREBASE DB MENGGUNAKAN LOCALSTORAGE & BROADCAST CHANNEL ---
// Ini memungkinkan Sinkronisasi Realtime antar Tab Browser (Toko & Owner) 
class RealtimeDB {
    constructor() {
        this.channel = new BroadcastChannel('kasir_pintar_channel');
        this.callbacks = {};
        
        // Listen to updates from other tabs
        this.channel.onmessage = (event) => {
            const { path, data } = event.data;
            if (this.callbacks[path]) {
                this.callbacks[path].forEach(cb => cb(data));
            }
        };

        // Initialize empty data if not exists
        if (!localStorage.getItem('kp_products')) {
            const defaultProducts = [
                { id: 'p1', name: 'Kopi Susu Gula Aren', price: 15000, category: 'minuman', icon: 'fa-mug-hot' },
                { id: 'p2', name: 'Burger Spesial', price: 25000, category: 'makanan', icon: 'fa-burger' },
                { id: 'p3', name: 'Kentang Goreng', price: 12000, category: 'snack', icon: 'fa-cookie' },
                { id: 'p4', name: 'Air Mineral', price: 5000, category: 'minuman', icon: 'fa-glass-water' }
            ];
            localStorage.setItem('kp_products', JSON.stringify(defaultProducts));
        }

        // Update categories to match user request
        const defaultCategories = [
            { id: 'bakso_seafood', name: 'Seafood', icon: 'fa-fish' },
            { id: 'bakso_iga', name: 'Bakso', icon: 'fa-bowl-food' },
            { id: 'mie_ayam', name: 'Mie', icon: 'fa-bowl-rice' },
            { id: 'aneka_toping', name: 'Toping', icon: 'fa-layer-group' },
            { id: 'minuman', name: 'Minuman', icon: 'fa-mug-hot' }
        ];
        localStorage.setItem('kp_categories', JSON.stringify(defaultCategories));

        if (!localStorage.getItem('kp_transactions')) {
            localStorage.setItem('kp_transactions', JSON.stringify([]));
        }

        if (!localStorage.getItem('kp_store_settings')) {
            const defaultSettings = {
                name: 'KASIR PINTAR',
                address: 'Jalan Kebangsaan No. 12',
                footer: 'TERIMA KASIH TELAH BERBELANJA',
                logo: '', // base64 image or url
                printerSize: 32 // 32 chars = 58mm, 48 chars = 80mm
            };
            localStorage.setItem('kp_store_settings', JSON.stringify(defaultSettings));
        }
    }

    // Get Data
    get(path) {
        return JSON.parse(localStorage.getItem('kp_' + path) || '[]');
    }

    // Set/Update Data and Notify other tabs
    set(path, data) {
        localStorage.setItem('kp_' + path, JSON.stringify(data));
        this.channel.postMessage({ path, data });
        // Also trigger callbacks in current tab
        if (this.callbacks[path]) {
            this.callbacks[path].forEach(cb => cb(data));
        }
    }

    // Listen to Data Changes (Real-time listener)
    on(path, callback) {
        if (!this.callbacks[path]) this.callbacks[path] = [];
        this.callbacks[path].push(callback);
        // Trigger immediately with current data
        callback(this.get(path));
    }
}

const db = new RealtimeDB();
window.db = db; // expose to window for other scripts to use
