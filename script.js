let isAdmin = false;
let basket = {}; 
let currentLiveItems = [];
let currentSlide = 0;
let touchStartX = 0;
let touchEndX = 0;

const FB_USERNAME = "kram.samot.2024"; 

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        isAdmin = true;
        applyAdminUI();
    }
    loadData();
    setupSwipe();
});

async function loadData() {
    try {
        const res = await fetch('products.json?nocache=' + new Date().getTime());
        currentLiveItems = await res.json();
        displayItems(currentLiveItems);
        setupSlider(currentLiveItems);
    } catch (e) { console.error("Error loading JSON:", e); }
}

// SLIDER LOGIC (ORIGINAL)
function setupSlider(items) {
    const track = document.getElementById('imageSlider');
    const dots = document.getElementById('sliderDots');
    track.innerHTML = items.map((item, index) => `
        <div class="slider-item" onclick="openProductView(${index})" style="cursor:pointer;">
            <img src="${item.image}">
            <p>${item.name} - View Details</p>
        </div>
    `).join('');
    dots.innerHTML = items.map((_, i) => `<div class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('');
}

function moveSlider(direction) {
    const totalSlides = currentLiveItems.length;
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    updateSliderPosition();
}

function updateSliderPosition() {
    const track = document.getElementById('imageSlider');
    const dots = document.querySelectorAll('.dot');
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}

function setupSwipe() {
    const slider = document.getElementById('imageSlider');
    slider.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, false);
    slider.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) moveSlider(1);
        if (touchEndX > touchStartX + 50) moveSlider(-1);
    }, false);
}

// DISPLAY ITEMS (ORIGINAL)
function displayItems(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map((item, index) => renderProductCard(item, index)).join('');
}

function renderProductCard(item, index) {
    const statusClass = item.status === "In Stock" ? "in-stock" : "out-stock";
    return `
        <div class="product-card">
            <img src="${item.image}" onclick="openProductView(${index})">
            <div onclick="openProductView(${index})" style="cursor:pointer;">
                <span class="status-badge ${statusClass}">${item.status}</span>
                <h4>${item.name}</h4>
                <div style="font-size:11px; color:#1a73e8;">₱${item.pricePiece} /pc</div>
                <div style="font-size:11px; color:#28a745;">₱${item.priceBox} /box</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                <button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">+ Piece</button>
                <button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')">+ Box</button>
            </div>
        </div>
    `;
}

// SEARCH LOGIC (FIXED)
function toggleSearch(show) {
    const overlay = document.getElementById('searchOverlay');
    overlay.style.display = show ? 'block' : 'none';
    if(show) {
        document.getElementById('searchInput').focus();
        renderSearchResults(currentLiveItems);
    }
}

function searchFunction() {
    let val = document.getElementById('searchInput').value.toUpperCase();
    const filtered = currentLiveItems.filter(item => item.name.toUpperCase().includes(val));
    renderSearchResults(filtered);
}

function renderSearchResults(items) {
    const grid = document.getElementById('searchResultGrid');
    grid.innerHTML = items.map((item) => {
        const originalIndex = currentLiveItems.findIndex(p => p.name === item.name);
        return renderProductCard(item, originalIndex);
    }).join('');
}

// PRODUCT VIEW (ORIGINAL)
function openProductView(index) {
    const item = currentLiveItems[index];
    document.getElementById('viewImage').src = item.image;
    document.getElementById('viewName').innerText = item.name;
    document.getElementById('viewDesc').innerText = item.description || "No description.";
    document.getElementById('viewQty').innerText = "Unit: " + item.qty;
    document.getElementById('viewWeight').innerText = "Weight: " + item.weight;
    document.getElementById('viewStatus').innerHTML = `<span class="status-badge">${item.status}</span>`;
    
    document.getElementById('viewPriceContainer').innerHTML = `
        <button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">Piece (₱${item.pricePiece})</button>
        <button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')">Box (₱${item.priceBox})</button>
    `;
    document.getElementById('productViewModal').style.display = 'flex';
}

function closeProductView() { document.getElementById('productViewModal').style.display = 'none'; }

// BASKET LOGIC (ORIGINAL)
function addToBasket(name, price, type) {
    const key = `${name} (${type})`;
    basket[key] = basket[key] ? { ...basket[key], count: basket[key].count + 1 } : { price, count: 1, type, originalName: name };
    updateBasketCount();
    document.getElementById('basketFloat').style.display = 'flex';
}

function updateBasketCount() {
    let total = Object.values(basket).reduce((acc, item) => acc + item.count, 0);
    document.getElementById('basketCount').innerText = total;
}

function toggleBasketModal() {
    const modal = document.getElementById('basketModal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    if(modal.style.display === 'flex') renderBasket();
}

function renderBasket() {
    const list = document.getElementById('basketList');
    let total = 0;
    let html = "";
    for (let key in basket) {
        let item = basket[key];
        total += item.price * item.count;
        html += `<div style="padding:10px 0; border-bottom:1px solid #eee;">
            ${key} x ${item.count} - ₱${(item.price * item.count).toLocaleString()}
        </div>`;
    }
    list.innerHTML = html || "Basket is empty.";
    document.getElementById('basketTotal').innerText = "₱" + total.toLocaleString();
}

function sendOrder(platform) {
    const name = document.getElementById('customerName').value;
    const contact = document.getElementById('customerContact').value;
    const address = document.getElementById('customerAddress').value;
    const payment = document.getElementById('paymentMethod').value;
    
    if(!name || !address) return alert("Paki-puno ang details!");

    let msg = `*BAGONG ORDER*\nName: ${name}\nContact: ${contact}\nAddress: ${address}\nPayment: ${payment}\n----------\n`;
    for(let k in basket) { msg += `- ${k} x ${basket[k].count}\n`; }
    
    navigator.clipboard.writeText(msg);
    alert("Order details copied!");
    window.open(`https://m.me/${FB_USERNAME}`);
}

// ADMIN (ORIGINAL)
function toggleAdmin() {
    if (prompt("Pass:") === "123") {
        localStorage.setItem('adminLoggedIn', 'true');
        location.reload();
    }
}
function applyAdminUI() { document.getElementById('adminSection').style.display = "block"; }
function addNewProduct() { /* Your original add logic */ }
