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
    } catch (e) { console.error("Error loading JSON:", e); }
}

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
        const realIndex = currentLiveItems.findIndex(i => i.name === item.name);
        return `
        <div class="product-card">
            ${isAdmin ? `<div style="position:absolute; top:5px; right:5px; display:flex; gap:5px; z-index:10;">
                <button onclick="editItem(${realIndex})" style="background:blue; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px;">Edit</button>
                <button onclick="deleteItem(${realIndex})" style="background:red; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px;">X</button>
            </div>` : ''}
            <img src="${item.image}" onclick="viewProduct('${item.name}', '${item.image}', '${item.description.replace(/\n/g, '<br>')}')">
            <h4>${item.name}</h4>
            <div class="price-tag">₱${item.pricePiece}</div>
            <div class="info-text">⚖️ ${item.weight}</div>
            <div class="info-text">📅 Exp: ${item.expiry || 'N/A'}</div>
            
            <div class="qty-control">
                <button onclick="updateBasket('${item.name}', -1)">-</button>
                <span id="qty-${item.name}">${basket[item.name] || 0}</span>
                <button onclick="updateBasket('${item.name}', 1)">+</button>
            </div>
        </div>`;
    }).join('');
}

function updateBasket(name, delta) {
    basket[name] = (basket[name] || 0) + delta;
    if (basket[name] <= 0) delete basket[name];
    
    document.getElementById(`qty-${name}`).innerText = basket[name] || 0;
    
    let totalCount = Object.values(basket).reduce((a, b) => a + b, 0);
    document.getElementById('basketCount').innerText = totalCount;
}

function renderBasket() {
    const list = document.getElementById('basketList');
    let total = 0;
    
    let html = Object.keys(basket).map(name => {
        const item = currentLiveItems.find(i => i.name === name);
        let qty = basket[name];
        let price = item.pricePiece;

        // Apply Piece Discount
        if (item.discounts?.pieceThreshold > 0 && qty >= item.discounts.pieceThreshold) {
            price = item.discounts.pieceDiscountPrice;
        }

        let subtotal = qty * price;
        total += subtotal;

        return `
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee; font-size:14px;">
                <span>${qty}x ${name}</span>
                <span>₱${subtotal.toLocaleString()}</span>
            </div>`;
    }).join('');

    list.innerHTML = html || '<p style="text-align:center; color:#999;">Empty basket</p>';
    document.getElementById('basketTotal').innerText = '₱' + total.toLocaleString();
}

function sendOrder(type) {
    const name = document.getElementById('customerName').value;
    const contact = document.getElementById('customerContact').value;
    const address = document.getElementById('customerAddress').value;
    const payment = document.getElementById('paymentMethod').value;

    if (!name || !contact || !address) return alert("Please fill up all details.");

    let orderList = Object.keys(basket).map(n => {
        const item = currentLiveItems.find(i => i.name === n);
        return `${basket[n]}x ${n}`;
    }).join('\n');

    const total = document.getElementById('basketTotal').innerText;
    const text = `*NEW ORDER FROM WEBSITE*\n\n*Name:* ${name}\n*Contact:* ${contact}\n*Address:* ${address}\n*Payment:* ${payment}\n\n*Orders:*\n${orderList}\n\n*TOTAL: ${total}*`;

    if (type === 'whatsapp') {
        window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(text)}`);
    } else {
        window.open(`https://m.me/${FB_USERNAME}`);
        navigator.clipboard.writeText(text).then(() => alert("Order copied! Paste it in Messenger."));
    }
}

// ADMIN FUNCTIONS
function toggleAdmin() {
    let pass = prompt("Admin Password:");
    if (pass === "cheezy2025") {
        isAdmin = true;
        localStorage.setItem('adminLoggedIn', 'true');
        applyAdminUI();
    } else {
        alert("Wrong password!");
    }
}

function applyAdminUI() {
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('adminStatus').innerText = "Admin Mode ACTIVE";
    document.getElementById('loginBtn').innerText = "Logout";
    document.getElementById('loginBtn').onclick = () => {
        localStorage.removeItem('adminLoggedIn');
        location.reload();
    };
    displayItems(currentLiveItems);
}

function saveItem() {
    const editIdx = parseInt(document.getElementById('editIndex').value);
    const newItem = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        qty: document.getElementById('itemQty').value,
        weight: document.getElementById('itemWeight').value,
        pricePiece: parseInt(document.getElementById('itemPricePiece').value) || 0,
        pricePack: parseInt(document.getElementById('itemPricePack').value) || 0,
        priceSet: parseInt(document.getElementById('itemPriceSet').value) || 0,
        priceBox: parseInt(document.getElementById('itemPriceBox').value) || 0,
        status: document.getElementById('itemStatus').value,
        expiry: document.getElementById('itemExpiry').value,
        description: document.getElementById('itemDesc').value,
        image: document.getElementById('itemImage').value,
        discounts: {
            pieceThreshold: parseInt(document.getElementById('pieceThreshold').value) || 0,
            pieceDiscountPrice: parseInt(document.getElementById('pieceDiscountPrice').value) || 0,
            packThreshold: parseInt(document.getElementById('packThreshold').value) || 0,
            packDiscountPrice: parseInt(document.getElementById('packDiscountPrice').value) || 0,
            setThreshold: parseInt(document.getElementById('setThreshold').value) || 0,
            setDiscountPrice: parseInt(document.getElementById('setDiscountPrice').value) || 0,
            boxThreshold: parseInt(document.getElementById('boxThreshold').value) || 0,
            boxDiscountPrice: parseInt(document.getElementById('boxDiscountPrice').value) || 0
        }
    };

    if(editIdx > -1) {
        currentLiveItems[editIdx] = newItem;
    } else {
        currentLiveItems.push(newItem);
    }

    displayItems(currentLiveItems);
    copyNewJSON();
}

function editItem(index) {
    const item = currentLiveItems[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemQty').value = item.qty;
    document.getElementById('itemWeight').value = item.weight;
    document.getElementById('itemPricePiece').value = item.pricePiece;
    document.getElementById('itemPricePack').value = item.pricePack;
    document.getElementById('itemPriceSet').value = item.priceSet;
    document.getElementById('itemPriceBox').value = item.priceBox;
    document.getElementById('itemStatus').value = item.status;
    document.getElementById('itemExpiry').value = item.expiry;
    document.getElementById('itemDesc').value = item.description;
    document.getElementById('itemImage').value = item.image;
    
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

function viewProduct(title, img, desc) {
    document.getElementById('viewTitle').innerText = title;
    document.getElementById('viewImg').src = img;
    document.getElementById('viewDesc').innerHTML = desc;
    document.getElementById('productViewModal').style.display = 'flex';
}

function searchFunction() {
    let val = document.getElementById('searchInput').value.toUpperCase();
    let cards = document.getElementsByClassName('product-card');
    for (let card of cards) card.style.display = card.innerText.toUpperCase().includes(val) ? "flex" : "none";
}

// SLIDER LOGIC
function setupSlider(items) {
    const track = document.getElementById('imageSlider');
    const dotsContainer = document.getElementById('sliderDots');
    const featured = items.filter(i => i.status === 'In Stock').slice(0, 5);
    
    track.innerHTML = featured.map(item => `
        <div class="slider-item">
            <img src="${item.image}">
            <p>${item.name}</p>
        </div>
    `).join('');

    dotsContainer.innerHTML = featured.map((_, i) => `<div class="dot ${i===0?'active':''}"></div>`).join('');
}

function moveSlider(step) {
    const track = document.getElementById('imageSlider');
    const items = document.querySelectorAll('.slider-item');
    const dots = document.querySelectorAll('.dot');
    if (!items.length) return;

    currentSlide = (currentSlide + step + items.length) % items.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach(d => d.classList.remove('active'));
    dots[currentSlide].classList.add('active');
}

function setupSwipe() {
    const container = document.querySelector('.slider-container');
    container.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
    container.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) moveSlider(1);
        if (touchEndX - touchStartX > 50) moveSlider(-1);
    });
}
