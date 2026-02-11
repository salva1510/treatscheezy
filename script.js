let isAdmin = false;
let basket = {}; 
let currentLiveItems = [];
let currentSlide = 0;
let touchStartX = 0;
let touchEndX = 0;

const ADMIN_PHONE = "639153290207"; 
const FB_USERNAME = "kram.samot.2024"; 
const JSON_URL = 'products.json'; 

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
        const res = await fetch(JSON_URL + '?nocache=' + new Date().getTime());
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
            <img src="${item.image}" onerror="this.src='https://via.placeholder.com/400x250?text=No+Image'">
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

function goToSlide(index) {
    currentSlide = index;
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
        handleSwipe();
    }, false);
}

function handleSwipe() {
    if (touchEndX < touchStartX - 50) moveSlider(1);
    if (touchEndX > touchStartX + 50) moveSlider(-1);
}

function displayItems(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map((item, index) => {
        const statusClass = item.status === "In Stock" ? "in-stock" : "out-stock";
        // B1T1 Badge Logic
        const isB1T1 = (item.description || "").toUpperCase().includes("B1T1");
        const promoBadge = isB1T1 ? `<div style="position:absolute; top:10px; left:10px; background:#ff4d4d; color:white; padding:4px 8px; border-radius:8px; font-size:10px; font-weight:bold; z-index:2;">BUY 1 TAKE 1</div>` : "";

        return `
            <div class="product-card" style="position:relative;">
                ${promoBadge}
                <img src="${item.image}" onclick="openProductView(${index})" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                <div onclick="openProductView(${index})" style="cursor:pointer; flex-grow:1;">
                    <span class="status-badge ${statusClass}">${item.status}</span>
                    <h4>${item.name}</h4>
                    <div class="item-details-text">${item.qty || ''} ${item.weight ? ' • ' + item.weight : ''}</div>
                    <div style="margin-bottom: 8px; text-align:left; padding:0 5px;">
                        ${item.pricePiece ? `<div class="price-tag" style="font-size:11px; color:#1a73e8;">₱${item.pricePiece.toLocaleString()} /pc</div>` : ''}
                        ${item.pricePack ? `<div class="price-tag" style="font-size:11px; color:#e67e22;">₱${item.pricePack.toLocaleString()} /pack</div>` : ''}
                        ${item.priceSet ? `<div class="price-tag" style="font-size:11px; color:#6f42c1;">₱${item.priceSet.toLocaleString()} /set</div>` : ''}
                        ${item.priceBox ? `<div class="price-tag" style="font-size:11px; color:#28a745;">₱${item.priceBox.toLocaleString()} /box</div>` : ''}
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    ${isAdmin ? `
                        <button onclick="editItem(${index})" style="background:#ffc107; color:#000; border:none; padding:8px; border-radius:8px; cursor:pointer; font-weight:bold;">Edit</button>
                        <button onclick="deleteItem(${index})" style="background:#dc3545; color:#fff; border:none; padding:8px; border-radius:8px; cursor:pointer;">Delete</button>
                    ` : 
                    `
                        <button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">+ Piece</button>
                        ${item.pricePack ? `<button class="opt-btn" style="background:#e67e22; margin-bottom:5px;" onclick="addToBasket('${item.name}', ${item.pricePack}, 'Pack')">+ Pack</button>` : ''}
                        ${item.priceSet ? `<button class="opt-btn" style="background:#6f42c1; margin-bottom:5px;" onclick="addToBasket('${item.name}', ${item.priceSet}, 'Set')">+ Set</button>` : ''}
                        <button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')">+ Box</button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function openProductView(index) {
    const item = currentLiveItems[index];
    document.getElementById('viewImage').src = item.image;
    document.getElementById('viewName').innerText = item.name;
    document.getElementById('viewDesc').innerText = item.description || "No description provided.";
    document.getElementById('viewQty').innerText = "📦 Unit: " + (item.qty || 'N/A');
    document.getElementById('viewWeight').innerText = "⚖️ Weight: " + (item.weight || 'N/A');
    document.getElementById('viewExpiry').innerText = "📅 Expiry: " + (item.expiry || 'Not set');
    document.getElementById('viewStatus').innerHTML = `<span class="status-badge ${item.status === "In Stock" ? "in-stock" : "out-stock"}">${item.status}</span>`;
    
    let buttonsHtml = '';
    if(item.pricePiece) buttonsHtml += `<button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece'); closeProductView();" style="width:48%;">Piece (₱${item.pricePiece})</button>`;
    if(item.pricePack) buttonsHtml += `<button class="opt-btn" style="background:#e67e22; width:48%; color:white;" onclick="addToBasket('${item.name}', ${item.pricePack}, 'Pack'); closeProductView();">Pack (₱${item.pricePack})</button>`;
    if(item.priceSet) buttonsHtml += `<button class="opt-btn" style="background:#6f42c1; width:48%; color:white;" onclick="addToBasket('${item.name}', ${item.priceSet}, 'Set'); closeProductView();">Set (₱${item.priceSet})</button>`;
    if(item.priceBox) buttonsHtml += `<button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box'); closeProductView();" style="width:48%;">Box (₱${item.priceBox})</button>`;
    
    document.getElementById('viewPriceContainer').innerHTML = buttonsHtml;
    document.getElementById('productViewModal').style.display = 'flex';
}

function addToBasket(name, price, type) {
    const key = `${name} (${type})`;
    basket[key] = basket[key] ? { ...basket[key], count: basket[key].count + 1 } : { price, count: 1, type, originalName: name };
    updateBasketCount();
    document.getElementById('basketFloat').style.display = 'flex';
}

function renderBasket() {
    const list = document.getElementById('basketList');
    let total = 0;
    let html = "";
    
    for (let key in basket) {
        let item = basket[key];
        let productData = currentLiveItems.find(p => p.name === item.originalName);
        let finalPrice = item.price;
        let discountApplied = false;

        // B1T1 Logic: Babayaran lang ang kalahati kung divisible by 2
        const isB1T1 = (productData && productData.description.toUpperCase().includes("B1T1"));
        let billableCount = item.count;
        
        if (isB1T1) {
            billableCount = Math.ceil(item.count / 2);
            discountApplied = true;
        } else if (productData && productData.discounts) {
            const d = productData.discounts;
            if (item.type === 'Piece' && d.pieceThreshold > 0 && item.count >= d.pieceThreshold) { finalPrice = d.pieceDiscountPrice; discountApplied = true; }
            else if (item.type === 'Pack' && d.packThreshold > 0 && item.count >= d.packThreshold) { finalPrice = d.packDiscountPrice; discountApplied = true; }
            else if (item.type === 'Set' && d.setThreshold > 0 && item.count >= d.setThreshold) { finalPrice = d.setDiscountPrice; discountApplied = true; }
            else if (item.type === 'Box' && d.boxThreshold > 0 && item.count >= d.boxThreshold) { finalPrice = d.boxDiscountPrice; discountApplied = true; }
        }

        total += finalPrice * billableCount;
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
            <div style="flex: 1;">
                <div style="font-weight:bold; font-size:14px;">${key}</div>
                <div style="color:#28a745; font-size:12px;">
                    ₱${finalPrice.toLocaleString()} ea. 
                    ${isB1T1 ? '<span style="color:#ff4d4d; font-weight:bold; font-size:10px;">(PROMO: BUY 1 TAKE 1)</span>' : (discountApplied ? '<span style="color:red; font-weight:bold; font-size:10px;">(DISCOUNTED)</span>' : '')}
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="display:flex; align-items:center; background:#f0f0f0; border-radius:5px; overflow:hidden;">
                    <button onclick="changeQuantity('${key}', -1)" style="border:none; padding:5px 10px; cursor:pointer;">-</button>
                    <span style="font-weight:bold; min-width:25px; text-align:center;">${item.count}</span>
                    <button onclick="changeQuantity('${key}', 1)" style="border:none; padding:5px 10px; cursor:pointer;">+</button>
                </div>
                <button onclick="removeFromBasket('${key}')" style="background:#ff4d4d; color:white; border:none; padding:6px 10px; border-radius:5px;">🗑️</button>
            </div>
        </div>`;
    }
    list.innerHTML = html || "<p style='text-align:center; padding:20px; color:#888;'>Walang laman ang basket.</p>";
    document.getElementById('basketTotal').innerText = "₱" + total.toLocaleString();
}

// ... (Yung ibang functions ay mananatiling pareho tulad ng sendOrder, toggleAdmin, etc.)
// Paki-copy ang natitirang functions mula sa original mong script.js dito sa baba...

