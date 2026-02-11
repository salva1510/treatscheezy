let isAdmin = false;
let basket = {}; 
let currentLiveItems = [];
let currentSlide = 0;

const ADMIN_PHONE = "639153290207"; 
const FB_USERNAME = "kram.samot.2024"; 

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('adminLoggedIn') === 'true') { isAdmin = true; applyAdminUI(); }
    loadData();
});

async function loadData() {
    try {
        const res = await fetch('products.json?nocache=' + new Date().getTime());
        currentLiveItems = await res.json();
        displayItems(currentLiveItems);
        setupSlider(currentLiveItems);
    } catch (e) { console.error(e); }
}

function displayItems(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = items.map((item, index) => renderCard(item, index)).join('');
}

function renderCard(item, index) {
    const statusClass = item.status === "In Stock" ? "in-stock" : "out-stock";
    return `
        <div class="product-card">
            <img src="${item.image}" onclick="openProductView(${index})">
            <h4>${item.name}</h4>
            <div style="font-size:12px; color:blue;">₱${item.pricePiece || 0} /pc</div>
            <div style="font-size:12px; color:green;">₱${item.priceBox || 0} /box</div>
            <button onclick="addToBasket('${item.name}', ${item.pricePiece}, 'Piece')">+ Piece</button>
            <button onclick="addToBasket('${item.name}', ${item.priceBox}, 'Box')" style="background:green;">+ Box</button>
        </div>
    `;
}

// --- FIXED SEARCH LOGIC ---
function toggleSearch(show) {
    const overlay = document.getElementById('searchOverlay');
    overlay.style.display = show ? 'block' : 'none';
    if(show) {
        document.getElementById('searchInput').focus();
        renderSearchResults(currentLiveItems); // Ipakita lahat sa simula
    }
}

function searchFunction() {
    let val = document.getElementById('searchInput').value.toUpperCase();
    const filtered = currentLiveItems.filter(item => 
        item.name.toUpperCase().includes(val) || 
        (item.description && item.description.toUpperCase().includes(val))
    );
    renderSearchResults(filtered);
}

function renderSearchResults(items) {
    const grid = document.getElementById('searchResultGrid');
    if (items.length === 0) {
        grid.innerHTML = "<p style='text-align:center; padding:20px;'>Walang nahanap...</p>";
        return;
    }
    grid.innerHTML = items.map(item => {
        const originalIndex = currentLiveItems.findIndex(p => p.name === item.name);
        return renderCard(item, originalIndex);
    }).join('');
}

// --- BASKET & ORDERS ---
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

function sendOrder(platform) {
    const name = document.getElementById('customerName').value;
    const contact = document.getElementById('customerContact').value;
    const address = document.getElementById('customerAddress').value;
    const payment = document.getElementById('paymentMethod').value;
    
    if(!name || !contact || !address) return alert("Kulang ang details!");

    let msg = `*ORDER*\nName: ${name}\nContact: ${contact}\nPayment: ${payment}\n---\n`;
    for(let k in basket) { msg += `- ${k} x ${basket[k].count}\n`; }
    
    navigator.clipboard.writeText(msg);
    alert("Order Copied!");
    window.open(`https://m.me/${FB_USERNAME}`);
}

// --- ADMIN ---
function toggleAdmin() {
    let p = prompt("Pass:");
    if(p === "123") { localStorage.setItem('adminLoggedIn', 'true'); location.reload(); }
}
function applyAdminUI() { document.getElementById('adminSection').style.display = "block"; }
function saveProduct() { /* Logic for saving and copying JSON */ }
                                 
