document.addEventListener('DOMContentLoaded', () => {
    
    // --- STATE KASIR ---
    let cart = [];
    let currentCategory = 'all';
    
    const productsGrid = document.getElementById('productsGrid');
    const categoryList = document.getElementById('categoryList');
    const searchInput = document.querySelector('.search-box input');
    
    // --- LOAD KATEGORI DARI "DATABASE" ---
    db.on('categories', (categories) => {
        if(!categoryList) return;
        
        categoryList.innerHTML = `<li class="${currentCategory === 'all' ? 'active' : ''}" data-category="all">Semua</li>`;
        
        categories.forEach(k => {
            const li = document.createElement('li');
            li.className = currentCategory === k.id ? 'active' : '';
            li.dataset.category = k.id;
            li.innerText = k.name;
            categoryList.appendChild(li);
        });
        
        // Pasang ulang event listener setelah dirender
        listenCategoryClicks();
    });

    // --- LOAD PRODUK DARI "DATABASE" ---
    let allProducts = [];
    db.on('products', (data) => {
        allProducts = data;
        renderProducts();
    });

    // --- RENDER PRODUK ---
    function renderProducts() {
        if(!productsGrid) return;
        
        productsGrid.innerHTML = '';
        
        const searchTerm = searchInput.value.toLowerCase();
        
        const filteredProducts = allProducts.filter(p => {
            const matchCategory = currentCategory === 'all' || p.category === currentCategory;
            const matchSearch = p.name.toLowerCase().includes(searchTerm);
            return matchCategory && matchSearch;
        });

        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 20px; color: var(--text-muted)">Tidak ada produk.</div>';
            return;
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card glass-panel';
            const itemInCart = cart.find(i => i.id === product.id);
            const qty = itemInCart ? itemInCart.qty : 0;
            
            const imgHtml = product.image ? `<img src="${product.image}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : `<i class="fa-solid ${product.icon}"></i>`;

            card.innerHTML = `
                <div class="product-img" style="overflow:hidden;">${imgHtml}</div>
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p class="price">Rp ${product.price.toLocaleString('id-ID')}</p>
                </div>
                <div class="qty-controls" style="display:flex; align-items:center; gap: 15px; margin-top: 10px;">
                    <button class="btn-icon" style="width:35px; height:35px;" onclick="window.updateQty('${product.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                    <span id="qty-${product.id}" style="font-weight:800; font-size: 1.2rem; min-width: 25px; text-align: center;">${qty}</span>
                    <button class="btn-icon" style="width:35px; height:35px;" onclick="window.updateQty('${product.id}', 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                if(e.target.closest('button')) return; // let minus/plus button handle the click
                addToCart(product);
                // Animasi klik
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.style.transform = '', 100);
            });
            
            productsGrid.appendChild(card);
        });
    }

    // --- FILTER & SEARCH ---
    function listenCategoryClicks() {
        if(!categoryList) return;
        const catItems = categoryList.querySelectorAll('li');
        catItems.forEach(item => {
            // hapus listener lama utk hindari duplicate
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', (e) => {
                const li = e.currentTarget;
                categoryList.querySelectorAll('li').forEach(i => i.classList.remove('active'));
                li.classList.add('active');
                currentCategory = li.dataset.category;
                renderProducts();
            });
        });
    }

    if(searchInput) {
        searchInput.addEventListener('input', renderProducts);
    }

    // --- KERANJANG BELANJA (CART) ---
    const cartItemsDiv = document.getElementById('cartItems');
    const totalEl = document.getElementById('total');
    const subtotalEl = document.getElementById('subtotal');

    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ ...product, qty: 1 });
        }
        renderCart();
        updateCardQty(product.id);
    }

    function updateQty(id, change) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.qty += change;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            renderCart();
            updateCardQty(id);
        } else if (change > 0) {
            const product = allProducts.find(p => p.id === id);
            if(product) addToCart(product);
        }
    }

    function updateCardQty(id) {
        const qtySpan = document.getElementById(`qty-${id}`);
        if(qtySpan) {
            const item = cart.find(i => i.id === id);
            qtySpan.innerText = item ? item.qty : 0;
        }
    }

    function renderCart() {
        if(!cartItemsDiv) return;

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = `
                <div class="empty-cart">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <p>Keranjang masih kosong</p>
                </div>`;
            totalEl.innerText = 'Rp 0';
            subtotalEl.innerText = 'Rp 0';
            return;
        }

        let total = 0;
        cartItemsDiv.innerHTML = '';
        
        cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            
            const div = document.createElement('div');
            // Menambahkan styling inline khusus untuk item di keranjang agar rapi
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '10px 0';
            div.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            
            div.innerHTML = `
                <div style="flex:1;">
                    <div style="font-weight: 600; font-size: 0.95rem;">${item.name}</div>
                    <div style="color: var(--primary); font-size: 0.85rem;">Rp ${item.price.toLocaleString('id-ID')}</div>
                </div>
                <div style="display:flex; align-items:center; gap: 10px;">
                    <button class="btn-icon" style="width:28px; height:28px; font-size:0.8rem;" onclick="window.updateQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                    <span style="font-weight:600;">${item.qty}</span>
                    <button class="btn-icon" style="width:28px; height:28px; font-size:0.8rem;" onclick="window.updateQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
            `;
            cartItemsDiv.appendChild(div);
        });

        totalEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
        subtotalEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
    }

    // Expose for inline onclick
    window.updateQty = updateQty;

    // --- CHECKOUT PROCESS & MODAL PEMBAYARAN ---
    const btnCheckout = document.getElementById('btnCheckout');
    const modalPembayaran = document.getElementById('modalPembayaran');
    const btnClosePayment = document.getElementById('btnClosePayment');
    const formPembayaran = document.getElementById('formPembayaran');
    
    // Elemen modal pembayaran
    const valTotalBelanja = document.getElementById('payTotalBelanja');
    const valTotalTagihan = document.getElementById('payTotalTagihan');
    const valKembalian = document.getElementById('payKembalian');
    const inputDiskon = document.getElementById('payDiskon');
    const inputTipeDiskon = document.getElementById('payTipeDiskon');
    const inputUang = document.getElementById('payJumlahUang');
    
    // Helper format ribuan (Rupiah real-time input)
    function formatRupiahInput(inputEl) {
        if(inputEl) {
            inputEl.addEventListener('input', function(e) {
                let val = this.value.replace(/[^0-9]/g, '');
                this.value = val ? parseInt(val).toLocaleString('id-ID') : '';
            });
        }
    }
    formatRupiahInput(inputUang);
    formatRupiahInput(inputDiskon);

    let totalBelanjaSaatIni = 0;
    let totalTagihanAkhir = 0;
    let isUangMurniDiketikan = false;

    // Fungsi Kalkulasi Otomatis Modal Pembayaran
    function hitungKembalian() {
        let diskonNominal = 0;
        const diskonVal = parseInt(inputDiskon.value.replace(/\./g, '')) || 0;
        const tipeDiskon = inputTipeDiskon ? inputTipeDiskon.value : 'nominal';
        
        if (tipeDiskon === 'persen') {
            diskonNominal = (totalBelanjaSaatIni * Math.min(diskonVal, 100)) / 100;
        } else {
            diskonNominal = diskonVal;
        }

        totalTagihanAkhir = Math.max(0, totalBelanjaSaatIni - Math.floor(diskonNominal));
        
        valTotalTagihan.innerText = `Rp ${totalTagihanAkhir.toLocaleString('id-ID')}`;
        
        const uang = parseInt(inputUang.value.replace(/\./g, '')) || 0;
        const kembalian = uang - totalTagihanAkhir;
        
        if (kembalian >= 0) {
            valKembalian.innerText = `Rp ${kembalian.toLocaleString('id-ID')}`;
            valKembalian.style.color = "var(--success)";
        } else {
            valKembalian.innerText = `Kurang Rp ${Math.abs(kembalian).toLocaleString('id-ID')}`;
            valKembalian.style.color = "var(--danger)";
        }
    }

    if(btnCheckout && modalPembayaran) {
        // --- 1. MUNCULKAN MODAL PEMBAYARAN SAAT KLIK BAYAR ---
        btnCheckout.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Keranjang masih kosong!");
                return;
            }

            // Hitung subtotal cart
            totalBelanjaSaatIni = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            
            // Set ke UI Modal
            valTotalBelanja.innerText = `Rp ${totalBelanjaSaatIni.toLocaleString('id-ID')}`;
            inputDiskon.value = '';
            
            // Auto uang pas
            totalTagihanAkhir = totalBelanjaSaatIni;
            inputUang.value = totalTagihanAkhir.toLocaleString('id-ID');
            isUangMurniDiketikan = false;
            
            hitungKembalian(); // Hitung awal
            modalPembayaran.classList.add('active'); // Tampilkan Popup Modal
            
            // Auto fokus ke input jumlah uang supaya kasir langsung ngetik
            setTimeout(() => { inputUang.focus(); }, 100);
        });

        // Tutup modal
        btnClosePayment.addEventListener('click', () => {
            modalPembayaran.classList.remove('active');
        });

        // Autocalculate saat ngetik Diskon atau Uang
        inputDiskon.addEventListener('input', hitungKembalian);
        if(inputTipeDiskon) inputTipeDiskon.addEventListener('change', hitungKembalian);
        inputUang.addEventListener('input', () => {
            isUangMurniDiketikan = true;
            hitungKembalian();
        });

        // --- PRESET TOMBOL UANG CEPAT ---
        const btnResetUang = document.querySelector('.btn-reset-uang');
        if(btnResetUang) {
            btnResetUang.addEventListener('click', () => {
                inputUang.value = totalTagihanAkhir.toLocaleString('id-ID');
                isUangMurniDiketikan = false;
                hitungKembalian();
                inputUang.focus();
            });
        }
        
        document.querySelectorAll('.btn-uang-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const addVal = parseInt(e.target.dataset.val);
                if (!isUangMurniDiketikan) {
                    inputUang.value = addVal.toLocaleString('id-ID');
                    isUangMurniDiketikan = true;
                } else {
                    const currentVal = parseInt(inputUang.value.replace(/\./g, '')) || 0;
                    inputUang.value = (currentVal + addVal).toLocaleString('id-ID');
                }
                hitungKembalian();
                inputUang.focus();
            });
        });

        // --- 2. SUBMIT FORM PEMBAYARAN (SELESAIKAN TRANSAKSI) ---
        formPembayaran.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const uangDibayar = parseInt(inputUang.value.replace(/\./g, '')) || 0;
            
            let diskonAkhir = 0;
            const diskonVal = parseInt(inputDiskon.value.replace(/\./g, '')) || 0;
            const tipeDiskon = inputTipeDiskon ? inputTipeDiskon.value : 'nominal';
            if (tipeDiskon === 'persen') {
                diskonAkhir = Math.floor((totalBelanjaSaatIni * Math.min(diskonVal, 100)) / 100);
            } else {
                diskonAkhir = diskonVal;
            }
            
            if (uangDibayar < totalTagihanAkhir) {
                alert("Uang pembayaran kurang!");
                return;
            }

            // Generate Transaction ID
            const date = new Date();
            const orderId = 'ORD-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const kembalianAkhir = uangDibayar - totalTagihanAkhir;
            
            const transaction = {
                id: orderId,
                waktu: date.toISOString(),
                items: [...cart],
                subtotal: totalBelanjaSaatIni,
                diskon: diskonAkhir,
                total: totalTagihanAkhir,
                uang_dibayar: uangDibayar,
                kembalian: kembalianAkhir,
                kasir: document.getElementById('username')?.value || 'Admin'
            };

            // Simpan transaksi ke "Database" (akan otomatis tersinkron ke Admin/Owner)
            const currentTransactions = db.get('transactions');
            currentTransactions.push(transaction);
            db.set('transactions', currentTransactions);

            // Cetak ke Printer jika ada
            if(window.cetakStruk) {
                window.cetakStruk(transaction);
            }

            // Reset Kasir & UI Angka Produk
            const cachedArr = [...cart];
            cart = [];
            cachedArr.forEach(i => updateCardQty(i.id));
            renderCart();
            modalPembayaran.classList.remove('active');
            
            // Ubah ID Pesanan di UI untuk antrean berikutnya
            document.querySelector('.order-id').innerText = '#' + orderId;
            
            // Notifikasi sukses (optional bisa diganti modal cantik nanti)
            alert(`✅ Transaksi Selesai!\n\nKembalian: Rp ${kembalianAkhir.toLocaleString('id-ID')}`);
        });
    }

});
