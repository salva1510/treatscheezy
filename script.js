let isAdmin = false;
let basket = {}; 
let currentLiveItems = [];
let currentSlide = 0;

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
    } catch (e) { console.error(e); }
}

// ORIGINAL SLIDER FUNCTIONS
function setupSlider(items) {
    const track = document.getElementById('imageSlider');
    const dots = document.getElementById('sliderDots');
    track.innerHTML = items.map((item, index) => `
        <div class="slider-item" onclick="openProductView(${index})">
            <img src="${item.image}">
            <p>${item.name}</p>
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

// ORIGINAL DISPLAY LOGIC
function displayItems(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map((item, index) => `
        <div class="product-card">
            <img src="${item.image}" onclick="openProductView(${index})">
            <h4 onclick="openProductView(${index})">${item.name}</h4>
            <div style="font-size:11px; color:blue;">₱${item.pricePiece} /pc</div>
            <div style="font-size:11px; color:green;">₱${item.priceBox} /box</div>
            <button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">+ Piece</button>
            <button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')" style="background:green;">+ Box</button>
        </div>
    `).join('');
}

// DISCOUNTED BASKET RENDER (DAGDAG-BAWAS LOGIC)
function renderBasket() {
    const list = document.getElementById('basketList');
    let total = 0;
    let html = "";
    
    for (let key in basket) {
        let item = basket[key];
        let productData = currentLiveItems.find(p => p.name === item.originalName);
        let finalPrice = item.price;
        let isDisc = false;

        // DISCOUNT LOGIC
        if (productData && productData.discounts) {
            const d = productData.discounts;
            if (item.type === 'Piece' && d.pieceThreshold > 0 && item.count >= d.pieceThreshold) {
                finalPrice = d.pieceDiscountPrice;
                isDisc = true;
            } else if (item.type === 'Box' && d.boxThreshold > 0 && item.count >= d.boxThreshold) {
                finalPrice = d.boxDiscountPrice;
                isDisc = true;
            }
        }

        total += finalPrice * item.count;
        html += `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <div>
                <b>${key}</b><br>
                <small>₱${finalPrice} ${isDisc ? '(Discounted)' : ''}</small>
            </div>
            <div>
                <button onclick="changeQty('${key}', -1)">-</button>
                <span>${item.count}</span>
                <button onclick="changeQty('${key}', 1)">+</button>
            </div>
        </div>`;
    }
    list.innerHTML = html || "Empty Basket";
    document.getElementById('basketTotal').innerText = "₱" + total.toLocaleString();
}

// NATIVE SEARCH FUNCTIONS
function toggleSearch(show) {
    document.getElementById('searchOverlay').style.display = show ? 'block' : 'none';
}

function searchFunction() {
    let val = document.getElementById('searchInput').value.toUpperCase();
    const filtered = currentLiveItems.filter(item => item.name.toUpperCase().includes(val));
    const grid = document.getElementById('searchResultGrid');
    grid.innerHTML = filtered.map(item => {
        const idx = currentLiveItems.findIndex(p => p.name === item.name);
        return `<div class="product-card" style="width:140px;">
            <img src="${item.image}" onclick="openProductView(${idx})">
            <h4 style="font-size:12px;">${item.name}</h4>
            <button onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')" style="font-size:10px;">+ Add</button>
        </div>`;
    }).join('');
}

// BASKET & MODALS (ORIGINAL)
function addToBasket(name, price, type) {
    const key = `${name} (${type})`;
    basket[key] = basket[key] ? { ...basket[key], count: basket[key].count + 1 } : { price, count: 1, type, originalName: name };
    updateBasketCount();
    document.getElementById('basketFloat').style.display = 'flex';
}

function changeQty(key, delta) {
    basket[key].count += delta;
    if (basket[key].count <= 0) delete basket[key];
    renderBasket();
    updateBasketCount();
}

function updateBasketCount() {
    let count = Object.values(basket).reduce((a, b) => a + b.count, 0);
    document.getElementById('basketCount').innerText = count;
}

function openProductView(index) {
    const item = currentLiveItems[index];
    document.getElementById('viewImage').src = item.image;
    document.getElementById('viewName').innerText = item.name;
    document.getElementById('viewDesc').innerText = item.description || "";
    document.getElementById('viewQty').innerText = "Unit: " + item.qty;
    document.getElementById('viewStatus').innerHTML = item.status;
    document.getElementById('viewPriceContainer').innerHTML = `
        <button class="opt-btn" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">Piece (₱${item.pricePiece})</button>
        <button class="opt-btn" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')" style="background:green;">Box (₱${item.priceBox})</button>
    `;
    document.getElementById('productViewModal').style.display = 'flex';
}

function closeProductView() { document.getElementById('productViewModal').style.display = 'none'; }
function toggleBasketModal() { 
    const m = document.getElementById('basketModal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
    renderBasket();
}

function sendOrder(platform) {
    const name = document.getElementById('customerName').value;
    const address = document.getElementById('customerAddress').value;
    if(!name || !address) return alert("Paki-puno ang detalye!");
    let msg = `*NEW ORDER*\nName: ${name}\nAddr: ${address}\n---\n`;
    for(let k in basket) { msg += `- ${k} x ${basket[k].count}\n`; }
    window.open(`https://m.me/kram.samot.2024?text=${encodeURIComponent(msg)}`);
}

function toggleAdmin() {
    if (prompt("Pass:") === "123") { localStorage.setItem('adminLoggedIn', 'true'); location.reload(); }
}
function applyAdminUI() { document.getElementById('adminSection').style.display = "block"; }
