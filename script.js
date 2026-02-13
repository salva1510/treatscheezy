let isAdmin = false;
let basket = {}; 
let currentLiveItems = [];
let currentSlide = 0;
let touchStartX = 0;
let touchEndX = 0;

const ADMIN_PHONE = "639153290207"; 
const FB_USERNAME = "chee.zeeyy.2025"; 
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
        displayHotDeals(); // ADD THIS
    } catch (e) { console.error("Error loading JSON:", e); }
}

// NEW: Filtering Logic
function filterCategory(category, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (category === 'All') {
        displayItems(currentLiveItems);
    } else {
        const filtered = currentLiveItems.filter(item => item.category === category);
        displayItems(filtered);
    }
}

function displayItems(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map((item, index) => {
        // Find real index in currentLiveItems for editing/deleting
        const realIndex = currentLiveItems.findIndex(p => p.name === item.name);
        const statusClass = item.status === "In Stock" ? "in-stock" : "out-stock";
        let expiryWarning = '';
if (item.expiry) {
    const today = new Date();
    const expiryDate = new Date(item.expiry);
    const diffDays = (expiryDate - today) / (1000 * 60 * 60 * 24);

    if (diffDays <= 30 && diffDays > 0) {
        expiryWarning = `<div style="color:#dc3545; font-size:11px; font-weight:bold;">⏳ Expiring Soon</div>`;
    }
}
        return `
            <div class="product-card">
                <img src="${item.image}" onclick="openProductViewFromData('${item.name}')" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                <div onclick="openProductViewFromData('${item.name}')" style="cursor:pointer; flex-grow:1;">
                    <span class="status-badge ${statusClass}">${item.status}</span>
                    <h4>${item.name}</h4>
                        ${expiryWarning}
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
                        <button onclick="editItem(${realIndex})" style="background:#ffc107; color:#000; border:none; padding:8px; border-radius:8px; cursor:pointer; font-weight:bold;">Edit</button>
                        <button onclick="deleteItem(${realIndex})" style="background:#dc3545; color:#fff; border:none; padding:8px; border-radius:8px; cursor:pointer;">Delete</button>
                    ` : 
                    `
                        ${item.pricePiece ? `<button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">+ Piece</button>` : ''}
                        ${item.pricePack ? `<button class="opt-btn" style="background:#e67e22; margin-bottom:5px;" onclick="addToBasket('${item.name}', ${item.pricePack}, 'Pack')">+ Pack</button>` : ''}
                        ${item.priceSet ? `<button class="opt-btn" style="background:#6f42c1; margin-bottom:5px;" onclick="addToBasket('${item.name}', ${item.priceSet}, 'Set')">+ Set</button>` : ''}
                        ${item.priceBox ? `<button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')">+ Box</button>` : ''}
                    `}
                </div>
            </div>
        `;
    }).join('');
}
function displayHotDeals() {
    const container = document.getElementById('hotDealsContainer');
    if (!container) return;

    const hotItems = currentLiveItems.filter(item => {
        if (!item.discounts) return false;
        return (
            item.discounts.pieceThreshold > 0 ||
            item.discounts.packThreshold > 0 ||
            item.discounts.setThreshold > 0 ||
            item.discounts.boxThreshold > 0
        );
    });

    container.innerHTML = hotItems.slice(0, 6).map(item => `
        <div class="product-card" style="border:2px solid #ff4d4d;">
            <img src="${item.image}" onclick="openProductViewFromData('${item.name}')">
            <span style="background:red; color:white; padding:3px 8px; font-size:11px; border-radius:20px; position:absolute;">🔥 SALE</span>
            <h4>${item.name}</h4>
        </div>
    `).join('');
}

// Reusable View Modal
function openProductViewFromData(name) {
    const item = currentLiveItems.find(p => p.name === name);
    if(!item) return;
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

function openProductView(index) {
    const item = currentLiveItems[index];
    openProductViewFromData(item.name);
}

// ... original slider functions ...
function setupSlider(items) {
    const track = document.getElementById('imageSlider');
    const dots = document.getElementById('sliderDots');
    track.innerHTML = items.slice(0, 10).map((item, index) => `
        <div class="slider-item" onclick="openProductViewFromData('${item.name}')" style="cursor:pointer;">
            <img src="${item.image}" onerror="this.src='https://via.placeholder.com/400x250?text=No+Image'">
            <p>${item.name} - View Details</p>
        </div>
    `).join('');
    dots.innerHTML = items.slice(0, 10).map((_, i) => `<div class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('');
}

function moveSlider(direction) {
    const totalSlides = Math.min(currentLiveItems.length, 10);
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

// ... Basket logic ...
function addToBasket(name, price, type) {
    const key = `${name} (${type})`;
    basket[key] = basket[key] ? { ...basket[key], count: basket[key].count + 1 } : { price, count: 1, type, originalName: name };
    updateBasketCount();
    const cart = document.getElementById('basketFloat');
cart.classList.add('bounce');
setTimeout(() => cart.classList.remove('bounce'), 400);
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

        if (productData && productData.discounts) {
            const d = productData.discounts;
            if (item.type === 'Piece' && d.pieceThreshold > 0 && item.count >= d.pieceThreshold) { finalPrice = d.pieceDiscountPrice; discountApplied = true; }
            else if (item.type === 'Pack' && d.packThreshold > 0 && item.count >= d.packThreshold) { finalPrice = d.packDiscountPrice; discountApplied = true; }
            else if (item.type === 'Set' && d.setThreshold > 0 && item.count >= d.setThreshold) { finalPrice = d.setDiscountPrice; discountApplied = true; }
            else if (item.type === 'Box' && d.boxThreshold > 0 && item.count >= d.boxThreshold) { finalPrice = d.boxDiscountPrice; discountApplied = true; }
        }

        total += finalPrice * item.count;
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
            <div style="flex: 1;">
                <div style="font-weight:bold; font-size:14px;">${key}</div>
                <div style="color:#28a745; font-size:12px;">
                    ₱${finalPrice.toLocaleString()} ea. 
                    ${discountApplied ? '<span style="color:red; font-weight:bold; font-size:10px;">(DISCOUNTED)</span>' : ''}
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

function changeQuantity(key, delta) {
    if (basket[key]) {
        basket[key].count += delta;
        if (basket[key].count <= 0) delete basket[key];
        updateBasketCount();
        renderBasket();
    }
}

function removeFromBasket(key) {
    if (confirm("Alisin ang item na ito?")) {
        delete basket[key];
        updateBasketCount();
        renderBasket();
    }
}

function updateBasketCount() {
    let total = Object.values(basket).reduce((acc, item) => acc + item.count, 0);
    document.getElementById('basketCount').innerText = total;
    document.getElementById('basketFloat').style.display = total > 0 ? 'flex' : 'none';
}

function sendOrder(platform) {
    const name = document.getElementById('customerName').value;
    const contact = document.getElementById('customerContact').value;
    const address = document.getElementById('customerAddress').value;
    const payment = document.getElementById('paymentMethod').value;

    if(!name || !contact || !address || Object.keys(basket).length === 0) return alert("Paki-puno ang lahat ng detalye!");
    
    let msg = `*BAGONG ORDER*\n👤 Name: ${name}\n📞 Contact: ${contact}\n📍 Addr: ${address}\n💰 Payment: ${payment}\n----------\n`;
    let total = 0;
    
    for (let k in basket) {
        let item = basket[k];
        let productData = currentLiveItems.find(p => p.name === item.originalName);
        let finalPrice = item.price;
        if (productData && productData.discounts) {
            const d = productData.discounts;
            if (item.type === 'Piece' && item.count >= d.pieceThreshold) finalPrice = d.pieceDiscountPrice;
            if (item.type === 'Pack' && item.count >= d.packThreshold) finalPrice = d.packDiscountPrice;
            if (item.type === 'Set' && item.count >= d.setThreshold) finalPrice = d.setDiscountPrice;
            if (item.type === 'Box' && item.count >= d.boxThreshold) finalPrice = d.boxDiscountPrice;
        }
        msg += `- ${k} x ${item.count} (@₱${finalPrice.toLocaleString()})\n`;
        total += (finalPrice * item.count);
    }
    msg += `----------\n💰 *TOTAL: ₱${total.toLocaleString()}*`;

    if(platform === 'whatsapp') window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`);
    else { navigator.clipboard.writeText(msg); alert("Order details copied!"); window.open(`https://m.me/${FB_USERNAME}`); }
}

function toggleAdmin() {
    if (isAdmin) { localStorage.removeItem('adminLoggedIn'); location.reload(); }
    else if (prompt("Pass:") === "123") { localStorage.setItem('adminLoggedIn', 'true'); location.reload(); }
}

function applyAdminUI() {
    document.getElementById('adminSection').style.display = "block";
    document.getElementById('adminStatus').innerText = "Admin Mode";
    document.getElementById('loginBtn').innerText = "Logout";
}

// ... Admin Save & Edit ...
function saveProduct() {
    const idx = parseInt(document.getElementById('editIndex').value || -1);
    const newItem = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value, // NEW
        qty: document.getElementById('itemQty').value,
        weight: document.getElementById('itemWeight').value,
        pricePiece: Number(document.getElementById('itemPricePiece').value),
        pricePack: Number(document.getElementById('itemPricePack').value),
        priceSet: Number(document.getElementById('itemPriceSet').value),
        priceBox: Number(document.getElementById('itemPriceBox').value),
        status: document.getElementById('itemStatus').value,
        expiry: document.getElementById('itemExpiry').value,
        description: document.getElementById('itemDesc').value,
        image: document.getElementById('itemImageLink').value,
        discounts: {
            pieceThreshold: Number(document.getElementById('pieceThreshold').value || 0),
            pieceDiscountPrice: Number(document.getElementById('pieceDiscountPrice').value || 0),
            packThreshold: Number(document.getElementById('packThreshold').value || 0),
            packDiscountPrice: Number(document.getElementById('packDiscountPrice').value || 0),
            setThreshold: Number(document.getElementById('setThreshold').value || 0),
            setDiscountPrice: Number(document.getElementById('setDiscountPrice').value || 0),
            boxThreshold: Number(document.getElementById('boxThreshold').value || 0),
            boxDiscountPrice: Number(document.getElementById('boxDiscountPrice').value || 0)
        }
    };
    if(!newItem.name) return alert("Paki-lagay ang pangalan!");
    if (idx === -1) currentLiveItems.push(newItem);
    else currentLiveItems[idx] = newItem;
    displayItems(currentLiveItems);
    copyNewJSON();
}

function editItem(index) {
    const item = currentLiveItems[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category || "Cheese"; // NEW
    document.getElementById('itemQty').value = item.qty;
    document.getElementById('itemWeight').value = item.weight;
    document.getElementById('itemPricePiece').value = item.pricePiece;
    document.getElementById('itemPricePack').value = item.pricePack || 0;
    document.getElementById('itemPriceSet').value = item.priceSet || 0;
    document.getElementById('itemPriceBox').value = item.priceBox;
    document.getElementById('itemStatus').value = item.status;
    document.getElementById('itemExpiry').value = item.expiry;
    document.getElementById('itemDesc').value = item.description;
    document.getElementById('itemImageLink').value = item.image;
    
    if(item.discounts) {
        document.getElementById('pieceThreshold').value = item.discounts.pieceThreshold || 0;
        document.getElementById('pieceDiscountPrice').value = item.discounts.pieceDiscountPrice || 0;
        document.getElementById('packThreshold').value = item.discounts.packThreshold || 0;
        document.getElementById('packDiscountPrice').value = item.discounts.packDiscountPrice || 0;
        document.getElementById('setThreshold').value = item.discounts.setThreshold || 0;
        document.getElementById('setDiscountPrice').value = item.discounts.setDiscountPrice || 0;
        document.getElementById('boxThreshold').value = item.discounts.boxThreshold || 0;
        document.getElementById('boxDiscountPrice').value = item.discounts.boxDiscountPrice || 0;
    }
    document.getElementById('addBtn').innerText = "Update & Copy JSON";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteItem(index) { if(confirm("Burahin?")) { currentLiveItems.splice(index, 1); displayItems(currentLiveItems); copyNewJSON(); } }

function copyNewJSON() { 
    navigator.clipboard.writeText(JSON.stringify(currentLiveItems, null, 2))
    .then(() => alert("JSON Copied! Update your products.json."));
}

function toggleBasketModal() {
    const modal = document.getElementById('basketModal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    if(modal.style.display === 'flex') renderBasket();
}

function closeProductView() { document.getElementById('productViewModal').style.display = 'none'; }

function searchFunction() {
    let val = document.getElementById('searchInput').value.toUpperCase();
    let cards = document.getElementsByClassName('product-card');
    for (let card of cards) card.style.display = card.innerText.toUpperCase().includes(val) ? "flex" : "none";
      }
setInterval(() => {
    if (currentLiveItems.length > 1) {
        moveSlider(1);
    }
}, 4000);
// ===== SEARCH FUNCTION =====
const searchInput = document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener("keyup", function () {
    let filter = searchInput.value.toLowerCase();
    let products = document.querySelectorAll(".product");

    products.forEach(product => {
      let text = product.textContent.toLowerCase();
      product.style.display = text.includes(filter) ? "block" : "none";
    });
  });
}

// ===== CATEGORY FILTER =====
const categoryButtons = document.querySelectorAll(".category-btn");

categoryButtons.forEach(btn => {
  btn.addEventListener("click", function () {

    document.querySelector(".category-btn.active")
      ?.classList.remove("active");

    this.classList.add("active");

    let category = this.getAttribute("data-category");
    let products = document.querySelectorAll(".product");

    products.forEach(product => {
      if (category === "all") {
        product.style.display = "block";
      } else {
        product.style.display =
          product.classList.contains(category) ? "block" : "none";
      }
    });

  });
});
                                                                                                                                                                                                                  
