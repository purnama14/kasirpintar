document.addEventListener('DOMContentLoaded', () => {
    
    // --- DASHBOARD ADMIN ELEMENTS ---
    const adminProductsList = document.getElementById('adminProductsList');
    const liveTransactionsList = document.getElementById('liveTransactionsList');
    
    // Stats Elements
    const statIncome = document.querySelector('.stat-icon.income + .stat-info .stat-value');
    const statSales = document.querySelector('.stat-icon.sales + .stat-info .stat-value');
    const statItems = document.querySelector('.stat-icon.items + .stat-info .stat-value');

    // --- RENDER PRODUK DI TABEL ADMIN ---
    db.on('products', (products) => {
        if(!adminProductsList) return;

        
        adminProductsList.innerHTML = '';
        if(products.length === 0) {
            adminProductsList.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada produk</td></tr>';
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="product-img" style="width: 40px; height: 40px; font-size: 1rem; overflow:hidden;">
                    ${p.image ? `<img src="${p.image}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid ${p.icon}"></i>`}
                </div></td>
                <td>${p.name}</td>
                <td style="text-transform: capitalize;">${p.category}</td>
                <td>Rp ${p.price.toLocaleString('id-ID')}</td>
                <td>
                    <button class="btn btn-secondary btn-edit" onclick="window.editProduk('${p.id}')" style="padding: 5px 10px;"><i class="fa-solid fa-edit"></i></button>
                    <button class="btn btn-delete" data-id="${p.id}" style="background:var(--danger); color:white; padding: 5px 10px; border:none; border-radius:12px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            adminProductsList.appendChild(tr);
        });

        // Event listener hapus
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if(confirm('Yakin hapus produk ini?')) {
                    // Animasi hapus sedikit
                    const tr = e.currentTarget.closest('tr');
                    tr.style.opacity = '0';
                    tr.style.transform = 'translateX(-20px)';
                    tr.style.transition = 'all 0.3s ease';
                    
                    setTimeout(() => {
                        const newProducts = products.filter(item => item.id !== id);
                        db.set('products', newProducts);
                    }, 300);
                }
            });
        });
    });

    // --- TAMBAH / EDIT PRODUK BARU UI Modal ---
    const btnTambahProduk = document.getElementById('btnTambahProduk');
    const modalProduk = document.getElementById('modalProduk');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const formProduk = document.getElementById('formProduk');
    const modalTitle = document.getElementById('modalTitle');

    // Field Form
    const fId = document.getElementById('prodId');
    const fName = document.getElementById('prodName');
    const fPrice = document.getElementById('prodPrice');
    const fCat = document.getElementById('prodCategory');
    const fIcon = document.getElementById('prodIcon');
    const fImageFile = document.getElementById('setProdImageFile');
    const previewProdImg = document.getElementById('previewProdImg');

    if(fImageFile) {
        fImageFile.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewProdImg.src = e.target.result;
                    previewProdImg.style.display = 'block';
                }
                reader.readAsDataURL(file);
            } else {
                previewProdImg.src = '';
                previewProdImg.style.display = 'none';
            }
        });
    }
    
    // --- LOAD KATEGORI DINAMIS UNTUK SELECT ---
    let daftarKategori = [];
    db.on('categories', (kat) => {
        daftarKategori = kat || [];
        if(fCat) {
            fCat.innerHTML = '';
            daftarKategori.forEach(k => {
                const opt = document.createElement('option');
                opt.value = k.id;
                opt.innerText = k.name;
                fCat.appendChild(opt);
            });
            // Tambahkan opsi "Tambah Baru" di paling bawah
            const optNew = document.createElement('option');
            optNew.value = "_tambah_baru_";
            optNew.innerText = "+ Tambah Kategori Baru...";
            optNew.style.fontWeight = "bold";
            optNew.style.color = "var(--primary)";
            fCat.appendChild(optNew);
        }
    });
    
    if(fCat) {
        // Event Jika Kategori "+ Tambah Baru" dipilih
        fCat.addEventListener('change', (e) => {
            if(e.target.value === '_tambah_baru_') {
                const namaKatBaru = prompt("Masukkan Nama Kategori Baru:");
                if(namaKatBaru && namaKatBaru.trim() !== '') {
                    const idKatBaru = namaKatBaru.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const iconKatBaru = prompt("Masukkan icon kategori (misal: fa-box, fa-mug-hot, fa-burger):", "fa-box") || "fa-box";
                    
                    const newCategoryList = [...daftarKategori, { id: idKatBaru, name: namaKatBaru, icon: iconKatBaru }];
                    db.set('categories', newCategoryList);
                    
                    // Set select ke kategori baru ini setelah beberapa saat (nunggu render db)
                    setTimeout(() => { fCat.value = idKatBaru; }, 200);
                } else {
                    fCat.selectedIndex = 0; // Kembalikan ke pilihan pertama jika dibatalkan
                }
            }
        });
    }

    if(btnTambahProduk && modalProduk) {
        // Buka popup untuk tambah
        btnTambahProduk.addEventListener('click', () => {
            modalTitle.innerText = "Tambah Produk Baru";
            formProduk.reset();
            fId.value = ''; // Kosongkan ID untuk mode tambah
            if(previewProdImg) {
                previewProdImg.src = '';
                previewProdImg.style.display = 'none';
            }
            if(fImageFile) fImageFile.value = '';
            modalProduk.classList.add('active');
        });

        // Tutup popup
        btnCloseModal.addEventListener('click', () => {
            modalProduk.classList.remove('active');
        });

        // Submit form
        formProduk.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentProds = db.get('products');
            
            const imageSrc = (previewProdImg && previewProdImg.src.startsWith('data:image')) ? previewProdImg.src : null;

            if (fId.value === '') {
                // Mode TAMBAH
                const newProduct = {
                    id: 'p_' + Date.now(),
                    name: fName.value,
                    price: parseInt(fPrice.value),
                    category: fCat.value,
                    icon: fIcon.value,
                    image: imageSrc
                };
                currentProds.push(newProduct);
                alert("Produk berhasil ditambah!");
                
            } else {
                // Mode EDIT
                const index = currentProds.findIndex(p => p.id === fId.value);
                if(index !== -1) {
                    currentProds[index] = {
                        id: fId.value,
                        name: fName.value,
                        price: parseInt(fPrice.value),
                        category: fCat.value,
                        icon: fIcon.value,
                        image: imageSrc || currentProds[index].image
                    };
                    alert("Produk berhasil diperbarui!");
                }
            }
            
            db.set('products', currentProds);
            modalProduk.classList.remove('active');
        });

    } // End if modalProduk

    // Fungsi Global untuk Edit (dipanggil dari tombol edit dalam tabel produk)
    window.editProduk = function(id) {
        const currentProds = window.db.get('products'); // Gunakan window.db
        const produk = currentProds.find(p => p.id === id);
        
        const mTitle = document.getElementById('modalTitle');
        const mProd = document.getElementById('modalProduk');
        const idField = document.getElementById('prodId');
        const nameField = document.getElementById('prodName');
        const priceField = document.getElementById('prodPrice');
        const catField = document.getElementById('prodCategory');
        const iconField = document.getElementById('prodIcon');

        if(produk && mProd) {
            mTitle.innerText = "Edit Produk";
            idField.value = produk.id;
            nameField.value = produk.name;
            priceField.value = produk.price;
            catField.value = produk.category;
            iconField.value = produk.icon;
            
            const prevImg = document.getElementById('previewProdImg');
            if(prevImg) {
                if(produk.image) {
                    prevImg.src = produk.image;
                    prevImg.style.display = 'block';
                } else {
                    prevImg.src = '';
                    prevImg.style.display = 'none';
                }
            }
            const imgFile = document.getElementById('setProdImageFile');
            if(imgFile) imgFile.value = '';

            mProd.classList.add('active');
        }
    };

    // --- TRANSAKSI REAL-TIME & STATISTIK ---
    const filterWaktu = document.getElementById('filterWaktu');
    const kustomRentangMenu = document.getElementById('kustomRentangMenu');
    const filterTglMulai = document.getElementById('filterTglMulai');
    const filterTglAkhir = document.getElementById('filterTglAkhir');
    const btnTerapkanKustom = document.getElementById('btnTerapkanKustom');

    let semuaTransaksi = [];

    // Fungsi menghitung berdasarkan filter
    function updateStatistikFilter() {
        if(!semuaTransaksi) return;

        const sekarang = new Date();
        const tipeFilter = filterWaktu ? filterWaktu.value : 'hari_ini';
        
        let totalIncome = 0;
        let totalSales = 0;
        let totalItemsSold = 0;
        let productSales = {};

        // Toggle UI Kustom
        if(kustomRentangMenu) {
            kustomRentangMenu.style.display = (tipeFilter === 'kustom') ? 'flex' : 'none';
        }

        semuaTransaksi.forEach(t => {
            const wTrx = new Date(t.waktu);
            let termasuk = false;

            // Reset jam untuk komparasi tanggal yang akurat
            const tDateOnly = new Date(wTrx.getFullYear(), wTrx.getMonth(), wTrx.getDate());
            const nowDateOnly = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
            const diffTime = Math.abs(nowDateOnly - tDateOnly);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (tipeFilter === 'hari_ini') {
                if (diffDays === 0 || (diffDays === 1 && tDateOnly.getTime() === nowDateOnly.getTime())) termasuk = true;
            } 
            else if (tipeFilter === 'kemarin') {
                if (diffDays === 1 && tDateOnly < nowDateOnly) termasuk = true;
            } 
            else if (tipeFilter === '7_hari') {
                if (diffDays <= 7 && tDateOnly <= nowDateOnly) termasuk = true;
            } 
            else if (tipeFilter === '1_bulan') {
                if (diffDays <= 30 && tDateOnly <= nowDateOnly) termasuk = true;
            } 
            else if (tipeFilter === 'semua') {
                termasuk = true;
            }
            else if (tipeFilter === 'kustom') {
                if(filterTglMulai && filterTglAkhir && filterTglMulai.value && filterTglAkhir.value) {
                    const start = new Date(filterTglMulai.value);
                    const end = new Date(filterTglAkhir.value);
                    // Sesuaikan akhir hari
                    end.setHours(23, 59, 59, 999);
                    
                    if(wTrx >= start && wTrx <= end) {
                        termasuk = true;
                    }
                }
            }

            if(termasuk) {
                totalIncome += t.total;
                totalSales++;
                t.items.forEach(item => {
                    totalItemsSold += item.qty;
                    const name = item.name || 'Produk Tak Bernama';
                    productSales[name] = (productSales[name] || 0) + item.qty;
                });
            }
        });

        if(statIncome) statIncome.innerText = 'Rp ' + totalIncome.toLocaleString('id-ID');
        if(statSales) statSales.innerText = totalSales;
        if(statItems) statItems.innerText = totalItemsSold;

        // Update Label
        document.querySelectorAll('.stat-desc').forEach(el => {
            if(tipeFilter === 'hari_ini') el.innerText = 'Hari Ini';
            else if(tipeFilter === 'kemarin') el.innerText = 'Kemarin';
            else if(tipeFilter === '7_hari') el.innerText = '7 Hari Terakhir';
            else if(tipeFilter === '1_bulan') el.innerText = '1 Bulan Terakhir';
            else if(tipeFilter === 'semua') el.innerText = 'Keseluruhan';
            else if(tipeFilter === 'kustom') el.innerText = `Kustom Waktu`;
        });

        // Update UI Produk Laris
        const prodListEl = document.getElementById('produkLarisList');
        if(prodListEl) {
            prodListEl.innerHTML = '';
            const sortedProd = Object.entries(productSales).sort((a,b) => b[1] - a[1]);
            
            if(sortedProd.length === 0) {
                prodListEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 10px;">Belum ada data penjualan.</div>';
            } else {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
                // Hitung max untuk progress bar
                const maxQty = sortedProd[0][1];
                
                sortedProd.forEach((prodEntry, idx) => {
                    const [prodName, prodQty] = prodEntry;
                    const cColor = colors[idx % colors.length];
                    const percent = Math.max(5, Math.round((prodQty / maxQty) * 100));

                    const div = document.createElement('div');
                    div.style.display = 'flex';
                    div.style.flexDirection = 'column';
                    div.style.gap = '6px';
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 600; color: var(--dark);">
                            <span>${prodName}</span>
                            <span>${prodQty} Terjual</span>
                        </div>
                        <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.05); border-radius: 5px; overflow: hidden;">
                            <div style="width: ${percent}%; height: 100%; background: ${cColor}; border-radius: 5px; box-shadow: 0 0 10px ${cColor}40;"></div>
                        </div>
                    `;
                    prodListEl.appendChild(div);
                });
            }
        }
    }

    if(filterWaktu) {
        filterWaktu.addEventListener('change', updateStatistikFilter);
    }
    
    if(btnTerapkanKustom) {
        btnTerapkanKustom.addEventListener('click', updateStatistikFilter);
    }

    db.on('transactions', (transactions) => {
        semuaTransaksi = transactions || [];
        updateStatistikFilter();

        if(!liveTransactionsList) return;


        // --- UPDATE TABEL REAL-TIME (Reverse Order - Baru di atas) ---
        liveTransactionsList.innerHTML = '';
        if(transactions.length === 0) {
            liveTransactionsList.innerHTML = '<tr><td colspan="4" style="text-align: center;">Menunggu transaksi...</td></tr>';
            return;
        }

        const sortedTrans = [...transactions].sort((a,b) => new Date(b.waktu) - new Date(a.waktu));

        // Kelompokkan berdasarkan tanggal
        const grouped = {};
        sortedTrans.forEach(t => {
            const dateObj = new Date(t.waktu);
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
            
            if(!grouped[dateKey]) {
                grouped[dateKey] = {
                    dateStr: dateObj.toLocaleDateString('id-ID', { weekday:'long', day: 'numeric', month: 'long', year: 'numeric' }),
                    total: 0,
                    transactions: []
                };
            }
            grouped[dateKey].transactions.push(t);
            grouped[dateKey].total += t.total;
        });

        Object.values(grouped).forEach(group => {
            // Header Baris Tanggal
            const trHeader = document.createElement('tr');
            trHeader.style.background = 'rgba(99, 102, 241, 0.05)';
            trHeader.innerHTML = `
                <td colspan="3" style="font-weight: 700; color: var(--dark); border-bottom: 2px solid rgba(0,0,0,0.05); padding: 15px 20px;">
                    <i class="fa-solid fa-calendar-day" style="color: var(--primary); margin-right: 8px;"></i> ${group.dateStr}
                </td>
                <td style="font-weight: 800; color: var(--primary); text-align: right; border-bottom: 2px solid rgba(0,0,0,0.05); padding: 15px 20px;">
                    Total: Rp ${group.total.toLocaleString('id-ID')}
                </td>
            `;
            liveTransactionsList.appendChild(trHeader);

            // Baris Transaksi individu
            group.transactions.forEach(t => {
                const tr = document.createElement('tr');
                
                // Highlight animasi jika ini transaksi yang baru saja masuk (< 5 detik)
                const isBaru = (new Date() - new Date(t.waktu)) < 5000;
                if(isBaru) {
                    tr.style.animation = 'highlightRow 2s';
                    tr.style.background = 'rgba(16, 185, 129, 0.1)';
                }
                
                const timeStr = new Date(t.waktu).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
                const itemsText = t.items.map(i=>i.name).join(', ');
                
                tr.innerHTML = `
                    <td><strong style="color: var(--dark);">${t.id}</strong> <br><small style="color: var(--text-muted);">Kasir: ${t.kasir}</small></td>
                    <td><div style="font-weight: 500; font-size: 0.95rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 6px;"><i class="fa-regular fa-clock"></i> ${timeStr}</div></td>
                    <td>
                        <div style="font-weight: 600; color: var(--dark);">${t.items.length} Macam</div>
                        <small style="color: var(--text-muted); display: block; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsText}">
                            ${itemsText}
                        </small>
                    </td>
                    <td style="color: var(--success); font-weight: 700; font-size: 1.05rem; text-align: right;">Rp ${t.total.toLocaleString('id-ID')}</td>
                `;
                liveTransactionsList.appendChild(tr);
            });
        });
    });

    // --- CSS ANIMASI HIGHLIGHT ROW ---
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes highlightRow {
            0% { background: rgba(16, 185, 129, 0.4); }
            100% { background: transparent; }
        }
    `;
    document.head.appendChild(style);

    // --- PENGATURAN TOKO & STRUK ---
    const formPengaturan = document.getElementById('formPengaturan');
    const setNamaToko = document.getElementById('setNamaToko');
    const setAlamat = document.getElementById('setAlamat');
    const setPesananBawah = document.getElementById('setPesananBawah');
    const setLogoFile = document.getElementById('setLogoFile');
    const previewLogo = document.getElementById('previewLogo');
    const setUkuranKertas = document.getElementById('setUkuranKertas');
    const setAdminPin = document.getElementById('setAdminPin');

    let currentSettings = {};

    db.on('store_settings', (settings) => {
        currentSettings = settings;
        if(setNamaToko) setNamaToko.value = settings.name || '';
        if(setAlamat) setAlamat.value = settings.address || '';
        if(setPesananBawah) setPesananBawah.value = settings.footer || '';
        if(setUkuranKertas) setUkuranKertas.value = settings.printerSize || 32;
        if(setAdminPin) setAdminPin.value = localStorage.getItem('kp_admin_pin') || '1234';
        
        if(previewLogo && settings.logo) {
            previewLogo.src = settings.logo;
            previewLogo.style.display = 'block';
        }
    });

    if(setLogoFile) {
        setLogoFile.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewLogo.src = e.target.result;
                    previewLogo.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    if(formPengaturan) {
        formPengaturan.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newSettings = {
                name: setNamaToko.value,
                address: setAlamat.value,
                footer: setPesananBawah.value,
                logo: previewLogo.src.startsWith('data:image') ? previewLogo.src : currentSettings.logo,
                printerSize: parseInt(setUkuranKertas.value) || 32
            };
            
            if (setAdminPin) {
                localStorage.setItem('kp_admin_pin', setAdminPin.value);
            }
            
            db.set('store_settings', newSettings);
            alert("Pengaturan Toko Berhasil Disimpan!");
        });
    }

    const btnPreviewStruk = document.getElementById('btnPreviewStruk');
    if(btnPreviewStruk) {
        btnPreviewStruk.addEventListener('click', () => {
            const previewSettings = {
                name: setNamaToko.value || 'NAMA TOKO',
                address: setAlamat.value || 'Alamat Toko',
                footer: setPesananBawah.value || 'TERIMA KASIH',
                logo: (previewLogo.src && previewLogo.src.startsWith('data:image')) ? previewLogo.src : currentSettings.logo,
                printerSize: parseInt(setUkuranKertas.value) || 32
            };
            
            const mockTransaction = {
                id: 'PREV-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
                kasir: 'Admin (Preview)',
                waktu: new Date().toISOString(),
                items: [
                    { name: 'Produk Contoh 1', qty: 2, price: 15000 },
                    { name: 'Produk Contoh 2', qty: 1, price: 10000 }
                ],
                subtotal: 40000,
                diskon: 0,
                total: 40000,
                uang_dibayar: 50000,
                kembalian: 10000,
                isPreview: true // Mencegah tercetak secara fisik ke bluetooth
            };
            
            if(window.cetakStruk) {
                window.cetakStruk(mockTransaction, previewSettings);
            } else {
                alert("Sistem struk belum siap.");
            }
        });
    }

});
