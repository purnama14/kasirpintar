document.addEventListener('DOMContentLoaded', () => {
    
    // ======== KASIR <-> ADMIN TOGGLE ========
    const btnGoAdmin = document.getElementById('btnGoAdmin');
    const btnGoPOS = document.getElementById('btnGoPOS');
    const appContainerKasir = document.getElementById('appContainer');
    const adminContainer = document.getElementById('adminContainer');

    if (btnGoAdmin && adminContainer && appContainerKasir) {
        const modalPin = document.getElementById('modalPin');
        const formPin = document.getElementById('formPin');
        const inputPin = document.getElementById('inputPin');
        const btnBatalPin = document.getElementById('btnBatalPin');
        const errorPin = document.getElementById('errorPin');

        btnGoAdmin.addEventListener('click', () => {
            if(modalPin) {
                inputPin.value = '';
                errorPin.style.display = 'none';
                modalPin.classList.add('active');
                setTimeout(() => inputPin.focus(), 100);
            } else {
                appContainerKasir.classList.add('hidden');
                adminContainer.classList.remove('hidden');
            }
        });

        if(btnBatalPin && modalPin) {
            btnBatalPin.addEventListener('click', () => {
                modalPin.classList.remove('active');
            });
        }

        if(formPin) {
            formPin.addEventListener('submit', (e) => {
                e.preventDefault();
                const storedPin = localStorage.getItem('kp_admin_pin') || '1234'; 
                if(inputPin.value === storedPin) {
                    modalPin.classList.remove('active');
                    appContainerKasir.classList.add('hidden');
                    adminContainer.classList.remove('hidden');
                } else {
                    errorPin.style.display = 'block';
                    inputPin.value = '';
                    inputPin.focus();
                }
            });
        }
    }

    if (btnGoPOS && adminContainer && appContainerKasir) {
        btnGoPOS.addEventListener('click', () => {
            adminContainer.classList.add('hidden');
            appContainerKasir.classList.remove('hidden');
        });
    }

    // ======== DASHBOARD TAB SYSTEM ========
    const navLinks = document.querySelectorAll('.nav-links a');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.dataset.tab;
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Nanti implementasikan pergantian tab konten, disini sementara hanya highlight nav
            const targetSection = document.getElementById('tab-' + targetTab);
            if(targetSection) {
                tabContents.forEach(tc => tc.classList.add('hidden'));
                targetSection.classList.remove('hidden');
            }
            console.log("Switching to tab:", targetTab);
        });
    });

    // ======== CATEGORY FILTER (KASIR UI) ========
    const catItems = document.querySelectorAll('#categoryList li');
    catItems.forEach(item => {
        item.addEventListener('click', () => {
            catItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            // Nanti disini panggil fungsi render produk berdasarkan produk dari firebase
        });
    });

    // Hover Animation on Prod Cards
    const prodCards = document.querySelectorAll('.product-card');
    prodCards.forEach(card => {
        card.addEventListener('click', () => {
            // Animasi kecil saat produk ditambah ke keranjang
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = 'translateY(-5px)'; // kembali ke status hover
            }, 100);
        });
    });
});
