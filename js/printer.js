// Logika untuk menghubungkan Aplikasi Web HTML5 dengan Bluetooth Thermal Printer

document.addEventListener('DOMContentLoaded', () => {
    
    // --- TOMBOL CONNECT PRINTER DI KASIR ---
    const btnConnectPrinter = document.getElementById('btnConnectPrinter');
    
    // Simpan referensi device printer
    let btDevice = null;
    let btServer = null;

    if(btnConnectPrinter) {
        btnConnectPrinter.addEventListener('click', async () => {
            try {
                // Periksa apakah browser dukung Web Bluetooth API
                if (!navigator.bluetooth) {
                    alert('Browser Anda tidak mendukung Bluetooth Web. Gunakan Chrome untuk Android.');
                    return;
                }

                btnConnectPrinter.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mencari...';

                // Minta Otorisasi Pairing ke Perangkat Bluetooth
                // Menggunakan services bawaan Printer Thermal Umum: '000018f0-0000-1000-8000-00805f9b34fb'
                btDevice = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // UUID Service Printer Thermal Universal
                });

                console.log('> Menghubungkan ke GATT Server...');
                btServer = await btDevice.gatt.connect();
                
                btnConnectPrinter.innerHTML = '<i class="fa-brands fa-bluetooth" style="color:#10b981;"></i> ' + btDevice.name;
                btnConnectPrinter.classList.remove('btn-secondary');
                btnConnectPrinter.style.background = 'rgba(16, 185, 129, 0.1)';
                btnConnectPrinter.style.color = '#10b981';
                btnConnectPrinter.style.borderColor = '#10b981';
                
                alert(`Terhubung ke printer: ${btDevice.name}`);

            } catch (error) {
                console.error('Error menghubungkan bluetooth:', error);
                alert('Gagal terhubung dengan Printer. Pastikan Bluetooth nyala dan Anda sudah pairing dari Setelan HP.');
                btnConnectPrinter.innerHTML = '<i class="fa-brands fa-bluetooth"></i> Hubungkan Printer';
            }
        });
    }

    // --- MODAL STRUK BROWSER ---
    const modalStruk = document.getElementById('modalStruk');
    const areaStruk = document.getElementById('areaStruk');
    const btnCloseStruk = document.getElementById('btnCloseStruk');
    const btnPrintStrukFisik = document.getElementById('btnPrintStrukFisik');
    let lastTransaction = null;
    let storedSettings = {};

    if(btnCloseStruk) {
        btnCloseStruk.addEventListener('click', () => modalStruk.classList.remove('active'));
    }

    if(btnPrintStrukFisik) {
        btnPrintStrukFisik.addEventListener('click', () => {
             if(lastTransaction) {
                 // Coba cetak bluetooth lagi
                 cetakKeBluetooth(lastTransaction, storedSettings);
             }
        });
    }

    // --- FUNGSI GLOBAL UNTUK MENCETAK STRUK ---
    // Dipanggil dari pos.js saat checkout berhasil
    window.cetakStruk = async function(transaction, previewSettings = null) {
        lastTransaction = transaction;
        const currentSettings = previewSettings || db.get('store_settings'); // Ambil info toko
        storedSettings = currentSettings;

        // 1. TAMPILKAN STRUK DI LAYAR (VISUAL RECEIPT)
        if(areaStruk && modalStruk) {
            let htmlStruk = `<div style="text-align:center; margin-bottom: 10px;">`;
            
            if(currentSettings.logo) {
                htmlStruk += `<img src="${currentSettings.logo}" style="max-width: 80px; max-height: 80px; object-fit:contain; margin-bottom: 5px;">`;
            }
            htmlStruk += `<h3 style="margin:0; font-size:1.2rem;">${currentSettings.name || 'KASIR PINTAR'}</h3>`;
            htmlStruk += `<p style="margin:0; font-size:0.8rem; color:#555;">${currentSettings.address || 'Alamat Toko Tersimpan'}</p>`;
            htmlStruk += `</div>`;
            
            const tgl = new Date(transaction.waktu);
            const tglStr = tgl.toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'});
            const wktStr = tgl.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});

            htmlStruk += `<div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin-bottom: 10px; font-size:0.8rem;">`;
            htmlStruk += `<div>Nota  : ${transaction.id}</div>`;
            htmlStruk += `<div>Waktu : ${tglStr} ${wktStr}</div>`;
            htmlStruk += `</div>`;
            
            htmlStruk += `<table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">`;
            transaction.items.forEach(i => {
                htmlStruk += `<tr><td colspan="2" style="font-weight:bold; padding-top:4px;">${i.name}</td></tr>`;
                htmlStruk += `<tr>`;
                htmlStruk += `  <td style="color:#555;">${i.qty} x Rp${i.price.toLocaleString('id-ID')}</td>`;
                htmlStruk += `  <td style="text-align:right;">Rp${(i.price * i.qty).toLocaleString('id-ID')}</td>`;
                htmlStruk += `</tr>`;
            });
            htmlStruk += `</table>`;
            
            htmlStruk += `<div style="border-top: 1px solid #000; margin-top: 8px; padding-top: 8px; font-size:0.9rem;">`;
            htmlStruk += `  <div style="display:flex; justify-content:space-between;"><span>Subtotal</span><span>Rp ${transaction.subtotal.toLocaleString('id-ID')}</span></div>`;
            if(transaction.diskon > 0) {
                htmlStruk += `  <div style="display:flex; justify-content:space-between; color:red;"><span>Diskon</span><span>-Rp ${transaction.diskon.toLocaleString('id-ID')}</span></div>`;
            }
            htmlStruk += `  <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem; margin-top:5px; margin-bottom:5px;"><span>TOTAL</span><span>Rp ${transaction.total.toLocaleString('id-ID')}</span></div>`;
            htmlStruk += `  <div style="display:flex; justify-content:space-between; color:#555;"><span>Tunai</span><span>Rp ${transaction.uang_dibayar.toLocaleString('id-ID')}</span></div>`;
            htmlStruk += `  <div style="display:flex; justify-content:space-between; color:#555;"><span>Kembali</span><span>Rp ${transaction.kembalian.toLocaleString('id-ID')}</span></div>`;
            htmlStruk += `</div>`;
            
            htmlStruk += `<div style="text-align:center; margin-top: 15px; font-size:0.8rem;">`;
            htmlStruk += `${currentSettings.footer || 'TERIMA KASIH BELANJA'}`;
            htmlStruk += `</div>`;

            areaStruk.innerHTML = htmlStruk;
            modalStruk.classList.add('active');
        }

        // 2. CETAK FISIK / SIMULASI KE CONSOLE
        if(!transaction.isPreview) {
            cetakKeBluetooth(transaction, currentSettings);
        }
    };

    async function cetakKeBluetooth(transaction, currentSettings) {
        // Jika belum konek printer, tampilkan konfirmasi ke layar aja (Simulasi)
        if (!btDevice || !btDevice.gatt.connected) {
            console.log("Mencetak simulasi ke Konsol Browser... Hubungkan Printer jika ingin cetak fisik.");
            return;
        }

        try {
            // Logika Mengirim Teks ke Printer Thermal 58mm
            const service = await btServer.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

            // Susun Teks Struk
            let strukText = "\n";
            // Keterangan khusus Logo: Bluetooth Printer mentah sulit print gambar. Hanya Teks dispport native.
            
            const nToko = currentSettings.hasOwnProperty('name') ? currentSettings.name : 'KASIR PINTAR';
            const aToko = currentSettings.hasOwnProperty('address') ? currentSettings.address : 'AlamatToko';
            
            const pSize = currentSettings.hasOwnProperty('printerSize') ? currentSettings.printerSize : 32;
            
            // Tengahkan Nama Toko
            const padToko = Math.floor((pSize - nToko.length) / 2);
            strukText += " ".repeat(Math.max(0, padToko)) + nToko + "\n";
            const padAlm = Math.floor((pSize - aToko.length) / 2);
            strukText += " ".repeat(Math.max(0, padAlm)) + aToko + "\n";
            
            const tglB = new Date(transaction.waktu);
            const tglStrB = tglB.toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'});
            const wktStrB = tglB.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});

            strukText += "-".repeat(pSize) + "\n";
            strukText += `Nota  : ${transaction.id}\n`;
            strukText += `Waktu : ${tglStrB} ${wktStrB}\n`;
            strukText += "-".repeat(pSize) + "\n";
            
            transaction.items.forEach(i => {
                strukText += `${i.name}\n`;
                const jml = `${i.qty}x Rp${i.price}`;
                const tot = `Rp${i.price * i.qty}`;
                const spaceLen = pSize - jml.length - tot.length;
                const spaces = Array(Math.max(1, spaceLen)).join(" ");
                strukText += `${jml}${spaces}${tot}\n`;
            });

            strukText += "-".repeat(pSize) + "\n";
            strukText += `Subtotal:      Rp ${transaction.subtotal.toLocaleString('id-ID')}\n`;
            if (transaction.diskon > 0) {
                strukText += `Diskon  :     -Rp ${transaction.diskon.toLocaleString('id-ID')}\n`;
            }
            strukText += `TOTAL   :      Rp ${transaction.total.toLocaleString('id-ID')}\n`;
            strukText += `Tunai   :      Rp ${transaction.uang_dibayar.toLocaleString('id-ID')}\n`;
            strukText += `Kembali :      Rp ${transaction.kembalian.toLocaleString('id-ID')}\n`;
            strukText += "=".repeat(pSize) + "\n";
            
            const fToko = currentSettings.hasOwnProperty('footer') ? currentSettings.footer : 'TERIMA KASIH BELANJA';
            const padFoot = Math.floor((pSize - fToko.length) / 2);
            strukText += " ".repeat(Math.max(0, padFoot)) + fToko + "\n";
            strukText += "\n\n\n";

            // Mengubah String Teks menjadi Uint8Array Array Buffer (Format Bluetooth)
            const encoder = new TextEncoder();
            const data = encoder.encode(strukText);

            let i = 0;
            while (i < data.length) {
                const chunk = data.slice(i, i + 512);
                await characteristic.writeValue(chunk);
                i += 512;
            }

            console.log('Struk berhasil dicetak!');
            
        } catch (error) {
            console.error('Gagal mencetak:', error);
            alert('Gagal mencetak struk. Koneksi dengan printer mungkin terputus.');
        }
    }

});
