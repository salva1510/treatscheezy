let isAdmin = false;
let basket = {}; 
let currentLiveItems = [];
let currentSlide = 0;
let touchStartX = 0;
let touchEndX = 0;

const FB_USERNAME = "kram.samot.2024"; 

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('adminLoggedIn') === 'true') { isAdmin = true; applyAdminUI(); }
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
    const total = currentLiveItems.length;
    currentSlide = (currentSlide + direction + total) % total;
    document.getElementById('imageSlider').style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function displayItems(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map((item, index) => `
        <div class="product-card">
            <img src="${item.image}" onclick="openProductView(${index})">
            <h4 onclick="openProductView(${index})">${item.name}</h4>
            <p>₱${item.pricePiece}/pc | ₱${item.priceBox}/box</p>
            <button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">+ Piece</button>
            <button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')">+ Box</button>
        </div>
    `).join('');
}

// SAFE SEARCH (Does not affect home grid)
function toggleSearch(show) {
    document.getElementById('searchOverlay').style.display = show ? 'block' : 'none';
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
    grid.innerHTML = items.map(item => {
        const idx = currentLiveItems.findIndex(p => p.name === item.name);
        return `<div class="product-card" style="width:145px;">
            <img src="${item.image}" onclick="openProductView(${idx})">
            <h4 style="font-size:12px;">${item.name}</h4>
            <button class="opt-btn btn-pc" style="font-size:10px;" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">+ Add</button>
        </div>`;
    }).join('');
}

function openProductView(index) {
    const item = currentLiveItems[index];
    document.getElementById('viewImage').src = item.image;
    document.getElementById('viewName').innerText = item.name;
    document.getElementById('viewDesc').innerText = item.description || "";
    document.getElementById('viewQty').innerText = "Unit: " + item.qty;
    document.getElementById('viewStatus').innerText = item.status;
    document.getElementById('viewPriceContainer').innerHTML = `
        <button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">Piece (₱${item.pricePiece})</button>
        <button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')">Box (₱${item.priceBox})</button>
    `;
    document.getElementById('productViewModal').style.display = 'flex';
}

function closeProductView() { document.getElementById('productViewModal').style.display = 'none'; }

function addToBasket(name, price, type) {
    const key = `${name} (${type})`;
    basket[key] = basket[key] ? { ...basket[key], count: basket[key].count + 1 } : { price, count: 1, type, originalName: name };
    updateBasketCount();
    document.getElementById('basketFloat').style.display = 'flex';
}

function updateBasketCount() {
    let count = Object.values(basket).reduce((a, b) => a + b.count, 0);
    document.getElementById('basketCount').innerText = count;
}

function toggleBasketModal() {
    const m = document.getElementById('basketModal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
    if(m.style.display === 'flex') renderBasket();
}

function renderBasket() {
    const list = document.getElementById('basketList');
    let total = 0; let html = "";
    for (let key in basket) {
        let item = basket[key];
        total += item.price * item.count;
        html += `<div style="padding:10px; border-bottom:1px solid #eee;">${key} x ${item.count} - ₱${item.price * item.count}</div>`;
    }
    list.innerHTML = html || "Basket is empty.";
    document.getElementById('basketTotal').innerText = "₱" + total;
}

function sendOrder() {
    const name = document.getElementById('customerName').value;
    const addr = document.getElementById('customerAddress').value;
    if(!name || !addr) return alert("Details needed!");
    let msg = `Order for ${name}:\n`;
    for(let k in basket) { msg += `- ${k} x ${basket[k].count}\n`; }
    window.open(`https://m.me/${FB_USERNAME}?text=${encodeURIComponent(msg)}`);
}

function toggleAdmin() {
    if (prompt("Pass:") === "123") { localStorage.setItem('adminLoggedIn', 'true'); location.reload(); }
}
function applyAdminUI() { document.getElementById('adminSection').style.display = "block"; }
function setupSwipe() { /* Original Swipe logic here */ }
      
