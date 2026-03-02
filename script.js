// ==========================================
// 1. تهيئة الاتصال بقاعدة البيانات (Supabase)
// ==========================================
const supabaseUrl = 'https://uzhhrktnspnxnlnsuxop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGhya3Ruc3BueG5sbnN1eG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzI0NTEsImV4cCI6MjA4ODA0ODQ1MX0.vI9lrhAwlN2N2F4rIuiPyJbSN287HSaoU8pWfibJQ5g';

// غيرنا الاسم هنا لـ db بدلاً من supabase
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. جلب البيانات من الداتابيز (Fetch Data)
// ==========================================
async function loadDynamicData() {
    try {
        // استخدمنا db.from بدلاً من supabase.from
        const [offersRes, pizzasRes, sidesRes, drinksRes, branchesRes, settingsRes] = await Promise.all([
            db.from('offers').select('*').order('created_at', { ascending: false }),
            db.from('pizzas').select('*').order('created_at', { ascending: false }),
            db.from('sides').select('*').order('created_at', { ascending: false }),
            db.from('drinks').select('*').order('created_at', { ascending: false }),
            db.from('branches').select('*').order('created_at', { ascending: true }),
            db.from('restaurant_settings').select('*').limit(1).single()
        ]);

        // تجهيز أرقام التواصل من الإعدادات
        const settings = settingsRes.data || {};
        const globalPhone = settings.phone || '0796468272';
        const globalWa = settings.whatsapp ? `https://api.whatsapp.com/send/?phone=${settings.whatsapp}&text=${encodeURIComponent(settings.whatsapp_message || '')}` : '#';

        // تمرير البيانات للطباعة
        renderMenu({
            offers: offersRes.data || [],
            pizzas: pizzasRes.data || [],
            sides: sidesRes.data || [],
            drinks: drinksRes.data || [],
            branches: branchesRes.data || [],
            phone: globalPhone,
            whatsapp: globalWa
        });

        // تحديث أرقام الفوتر الثابتة برمجياً
        updateFooterContacts(globalPhone, globalWa, branchesRes.data || []);

    } catch (error) {
        console.error('حدث خطأ أثناء جلب البيانات:', error);
    }
}

// ==========================================
// 3. دوال الطباعة (Render) بالبيانات الجديدة
// ==========================================
function renderMenu(data) {
    // 🍕 رسم العروض
    const offersTrack = document.getElementById('offersTrack');
    if (offersTrack) {
        offersTrack.innerHTML = data.offers.map(offer => `
            <div class="offer-card">
                <div class="offer-image">
                    <img src="${offer.image_url}" alt="${offer.title}">
                    <div class="offer-price">${offer.price}</div>
                </div>
                <div class="offer-details">
                    <h3>${offer.title}</h3>
                    <p>${offer.description || ''}</p>
                </div>
            </div>
        `).join('');
    }

    // 🍕 رسم البيتزا
    const pizzaGrid = document.getElementById('pizzaGrid');
    if (pizzaGrid) {
        pizzaGrid.innerHTML = data.pizzas.map(pizza => `
            <div class="menu-card">
                <div class="card-image">
                    <img src="${pizza.image_url}" alt="${pizza.title}">
                    <div class="card-badge">${pizza.price}</div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${pizza.title}</h3>
                    <p class="card-description">${pizza.description || ''}</p>
                </div>
            </div>
        `).join('');
    }

    // 🍟 رسم الإضافات
    const sidesContainer = document.getElementById('sidesContainer');
    if (sidesContainer) {
        sidesContainer.innerHTML = data.sides.map(side => `
            <div class="horizontal-menu-item">
                <div class="item-image"><img src="${side.image_url}" alt="${side.title}"></div>
                <div class="item-info">
                    <h3>${side.title}</h3>
                    <p>${side.description || ''}</p>
                    <span class="item-price">${side.price}</span>
                </div>
            </div>
        `).join('');
    }

    // 🥤 رسم المشروبات
    const drinksContainer = document.getElementById('drinksContainer');
    if (drinksContainer) {
        drinksContainer.innerHTML = data.drinks.map(drink => `
            <div class="horizontal-menu-item">
                <div class="item-image"><img src="${drink.image_url}" alt="${drink.title}"></div>
                <div class="item-info">
                    <h3>${drink.title}</h3>
                    <p>${drink.description || ''}</p>
                    <span class="item-price">${drink.price}</span>
                </div>
            </div>
        `).join('');
    }

    // 📍 رسم الفروع في الـ Modal
    const branchesContainer = document.getElementById('branchesContainer');
    if (branchesContainer) {
        branchesContainer.innerHTML = data.branches.map(branch => `
            <div class="branch-card">
                <div class="branch-info">
                    <h3>📍 ${branch.name}</h3>
                    <p>${branch.address}</p>
                </div>
                <div class="branch-actions">
                    <a href="${branch.map_link}" target="_blank" class="action-btn map-btn">🗺️ الاتجاهات</a>
                    <a href="${data.whatsapp}" target="_blank" class="action-btn wa-btn">💬 واتساب</a>
                    <a href="tel:${data.phone}" class="action-btn call-btn">📞 اتصال</a>
                </div>
            </div>
        `).join('');
    }

    // تشغيل السلايدر بعد اكتمال رسم العروض
    initOffersCarousel();
}

// تحديث أرقام الفوتر الديناميكية
function updateFooterContacts(phone, whatsappLink, branches) {
    document.querySelectorAll('.phone-link').forEach(el => {
        el.href = `tel:${phone}`;
        el.textContent = phone;
    });
    
    document.querySelectorAll('.wa-footer-btn, .wa-link, .wa-btn').forEach(el => {
        el.href = whatsappLink;
    });

    const footerLinksContainer = document.querySelector('.footer-links');
    if(footerLinksContainer && branches.length > 0) {
        footerLinksContainer.innerHTML = branches.map(branch => `
            <li>
                <a href="${branch.map_link}" target="_blank">
                    📍 ${branch.name} - ${branch.address}
                </a>
            </li>
        `).join('');
    }
}

// ==========================================
// 4. التفاعلات والانيميشن
// ==========================================
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

function openBranchesModal(e) {
    if (e) e.preventDefault();
    document.getElementById('branchesModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBranchesModal() {
    document.getElementById('branchesModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

window.onclick = function(event) {
    const modal = document.getElementById('branchesModal');
    if (event.target == modal) closeBranchesModal();
}

function initOffersCarousel() {
    const track = document.getElementById('offersTrack');
    if (!track || track.children.length === 0) return;

    let cards = Array.from(track.children);
    
    if (cards.length > 0 && cards.length < 6) {
        cards.forEach(card => {
            let clone = card.cloneNode(true);
            track.appendChild(clone);
        });
    }

    const intervalTime = 1500;
    const transitionTime = 400;
    let autoPlayInterval;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let isAnimating = false;

    function getCardWidth() {
        const gap = 20; 
        return track.children[0].offsetWidth + gap;
    }

    function moveNext() {
        if (isAnimating || isDragging) return;
        isAnimating = true;

        const moveAmount = getCardWidth();
        track.style.transition = `transform ${transitionTime}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        track.style.transform = `translateX(${moveAmount}px)`;

        setTimeout(() => {
            track.style.transition = 'none';
            track.appendChild(track.firstElementChild);
            track.style.transform = `translateX(0)`;
            isAnimating = false;
        }, transitionTime);
    }

    function play() {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(moveNext, intervalTime + transitionTime);
    }

    function stop() { clearInterval(autoPlayInterval); }

    function dragStart(e) {
        if (isAnimating) return;
        isDragging = true;
        stop();
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        track.style.transition = 'none';
        track.classList.add('grabbing');
    }

    function dragMove(e) {
        if (!isDragging) return;
        if(e.cancelable) e.preventDefault(); 
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        currentX = x - startX;
        track.style.transform = `translateX(${currentX}px)`;
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('grabbing');

        const threshold = 50; 
        if (currentX > threshold) {
            track.style.transition = `transform ${transitionTime}ms ease-out`;
            track.style.transform = `translateX(${getCardWidth()}px)`;
            isAnimating = true;
            setTimeout(() => {
                track.style.transition = 'none';
                track.appendChild(track.firstElementChild);
                track.style.transform = `translateX(0)`;
                isAnimating = false;
                currentX = 0;
                play();
            }, transitionTime);
        } else if (currentX < -threshold) {
            isAnimating = true;
            track.style.transition = 'none';
            track.insertBefore(track.lastElementChild, track.firstElementChild);
            track.style.transform = `translateX(${getCardWidth() + currentX}px)`;
            track.offsetHeight;

            track.style.transition = `transform ${transitionTime}ms ease-out`;
            track.style.transform = `translateX(0)`;
            setTimeout(() => {
                isAnimating = false;
                currentX = 0;
                play();
            }, transitionTime);
        } else {
            track.style.transition = `transform ${transitionTime}ms ease-out`;
            track.style.transform = `translateX(0)`;
            currentX = 0;
            play();
        }
    }

    track.addEventListener('mousedown', dragStart);
    track.addEventListener('mousemove', dragMove);
    track.addEventListener('mouseup', dragEnd);
    track.addEventListener('mouseleave', () => { if (isDragging) dragEnd(); });
    track.addEventListener('touchstart', dragStart, { passive: true });
    track.addEventListener('touchmove', dragMove, { passive: false });
    track.addEventListener('touchend', dragEnd);

    track.style.cursor = 'grab';
    play();
}

window.addEventListener('scroll', function () {
    const header = document.querySelector('.header');
    if (window.pageYOffset > 50) {
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        header.style.padding = '10px 0';
    } else {
        header.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
        header.style.padding = '20px 0';
    }
});

// تشغيل جلب البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadDynamicData);