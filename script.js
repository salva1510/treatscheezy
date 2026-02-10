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

// Palitan ang displayItems function para makita ang Edit button sa Admin
function displayItems(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map((item, index) => {
        const statusClass = item.status === "In Stock" ? "in-stock" : "out-stock";
        return `
            <div class="product-card">
                <img src="${item.image}" onclick="openProductView(${index})" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                <div onclick="openProductView(${index})" style="cursor:pointer; flex-grow:1;">
                    <span class="status-badge ${statusClass}">${item.status}</span>
                    <h4>${item.name}</h4>
                    <div class="item-details-text">${item.qty || ''} ${item.weight ? ' • ' + item.weight : ''}</div>
                    <div style="margin-bottom: 8px; text-align:left; padding:0 5px;">
                        ${item.pricePiece ? `<div class="price-tag" style="font-size:11px; color:#1a73e8;">₱${item.pricePiece.toLocaleString()} /pc</div>` : ''}
                        ${item.pricePack ? `<div class="price-tag" style="font-size:11px; color:#e67e22;">₱${item.pricePack.toLocaleString()} /pack</div>` : ''}
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
                        <button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')">+ Box</button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// Function para mapuno ang form kapag mag-eedit
function editItem(index) {
    const item = currentLiveItems[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemQty').value = item.qty;
    document.getElementById('itemWeight').value = item.weight;
    document.getElementById('itemPricePiece').value = item.pricePiece;
    document.getElementById('itemPricePack').value = item.pricePack || 0;
    document.getElementById('itemPriceBox').value = item.priceBox;
    document.getElementById('itemStatus').value = item.status;
    document.getElementById('itemExpiry').value = item.expiry;
    document.getElementById('itemDesc').value = item.description;
    document.getElementById('itemImageLink').value = item.image;
    
    document.getElementById('addBtn').innerText = "Update & Copy JSON";
    document.getElementById('cancelEditBtn').style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearAdminForm() {
    document.getElementById('editIndex').value = "-1";
    document.getElementById('addBtn').innerText = "+ Add & Copy JSON";
    document.getElementById('cancelEditBtn').style.display = "none";
    document.querySelectorAll('#adminSection input, #adminSection textarea').forEach(i => i.value = "");
}

function saveProduct() {
    const idx = parseInt(document.getElementById('editIndex').value);
    const newItem = {
        name: document.getElementById('itemName').value,
        qty: document.getElementById('itemQty').value,
        weight: document.getElementById('itemWeight').value,
        pricePiece: Number(document.getElementById('itemPricePiece').value),
        pricePack: Number(document.getElementById('itemPricePack').value),
        priceBox: Number(document.getElementById('itemPriceBox').value),
        status: document.getElementById('itemStatus').value,
        expiry: document.getElementById('itemExpiry').value,
        description: document.getElementById('itemDesc').value,
        image: document.getElementById('itemImageLink').value
    };

    if(!newItem.name) return alert("Paki-lagay ang pangalan!");

    if (idx === -1) {
        currentLiveItems.push(newItem);
    } else {
        currentLiveItems[idx] = newItem;
    }

    displayItems(currentLiveItems);
    clearAdminForm();
    copyNewJSON();
}


// IN-UPDATE: Para ipakita ang Description
function openProductView(index) {
    const item = currentLiveItems[index];
    document.getElementById('viewImage').src = item.image;
    document.getElementById('viewName').innerText = item.name;
    document.getElementById('viewDesc').innerText = item.description || "No description provided.";
    document.getElementById('viewQty').innerText = "📦 Unit: " + (item.qty || 'N/A');
    document.getElementById('viewWeight').innerText = "⚖️ Weight: " + (item.weight || 'N/A');
    document.getElementById('viewExpiry').innerText = "📅 Expiry: " + (item.expiry || 'Not set');
    document.getElementById('viewStatus').innerHTML = `<span class="status-badge ${item.status === "In Stock" ? "in-stock" : "out-stock"}">${item.status}</span>`;
    document.getElementById('viewPriceContainer').innerHTML = `
        <button class="opt-btn btn-pc" onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece'); closeProductView();" style="width:48%;">Add Piece (₱${item.pricePiece})</button>
        <button class="opt-btn btn-box" onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box'); closeProductView();" style="width:48%;">Add Box (₱${item.priceBox})</button>
    `;
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
        total += item.price * item.count;
        
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
            <div style="flex: 1;">
                <div style="font-weight:bold; font-size:14px;">${key}</div>
                <div style="color:#28a745; font-size:12px;">₱${item.price.toLocaleString()} ea.</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="display:flex; align-items:center; background:#f0f0f0; border-radius:5px; overflow:hidden;">
                    <button onclick="changeQuantity('${key}', -1)" style="border:none; padding:5px 10px; cursor:pointer; background:#e0e0e0;">-</button>
                    <span style="font-weight:bold; min-width:25px; text-align:center; font-size:14px;">${item.count}</span>
                    <button onclick="changeQuantity('${key}', 1)" style="border:none; padding:5px 10px; cursor:pointer; background:#e0e0e0;">+</button>
                </div>
                <button onclick="removeFromBasket('${key}')" style="background:#ff4d4d; color:white; border:none; padding:6px 10px; border-radius:5px; font-size:12px; cursor:pointer;">🗑️</button>
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
    const address = document.getElementById('customerAddress').value;
    if(!name || !address || Object.keys(basket).length === 0) return alert("Paki-puno ang details!");
    let msg = `*BAGONG ORDER*\n👤 Name: ${name}\n📍 Addr: ${address}\n----------\n`;
    for (let k in basket) msg += `- ${k} x ${basket[k].count}\n`;
    let total = Object.values(basket).reduce((acc, item) => acc + (item.price * item.count), 0);
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

// IN-UPDATE: Kasama na ang Description sa pag-add
function addNewProduct() {
    const newItem = {
        name: document.getElementById('itemName').value,
        qty: document.getElementById('itemQty').value,
        weight: document.getElementById('itemWeight').value,
        pricePiece: Number(document.getElementById('itemPricePiece').value),
        priceBox: Number(document.getElementById('itemPriceBox').value),
        status: document.getElementById('itemStatus').value,
        expiry: document.getElementById('itemExpiry').value,
        description: document.getElementById('itemDesc').value, // NEW
        image: document.getElementById('itemImageLink').value
    };
    if(!newItem.name) return alert("Paki-lagay ang pangalan ng item!");
    currentLiveItems.push(newItem);
    displayItems(currentLiveItems);
    copyNewJSON();
}

function deleteItem(index) { if(confirm("Burahin?")) { currentLiveItems.splice(index, 1); displayItems(currentLiveItems); copyNewJSON(); } }

function copyNewJSON() { 
    navigator.clipboard.writeText(JSON.stringify(currentLiveItems, null, 2))
    .then(() => alert("JSON Copied! Update your products.json."));
                          }
      
