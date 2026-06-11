// --- 1. INITIAL STATE ---
let cart = [];
const cartCounter = document.querySelector('.nav-cart');

// --- 2. CART LOGIC ---
document.querySelectorAll('.add-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const name = button.getAttribute('data-name');
        const price = parseInt(button.getAttribute('data-price'));
        const colorPicker = card.querySelector('.color-picker');
        const color = colorPicker ? colorPicker.value : "Default";

        const rawImages = button.getAttribute('data-images');
        let selectedImg = "";

        if (rawImages) {
            try {
                const imagesData = JSON.parse(rawImages);
                selectedImg = imagesData[color] || Object.values(imagesData)[0];
            } catch (err) {
                selectedImg = "placeholder.jpg";
            }
        } else {
            selectedImg = button.getAttribute('data-img') || "placeholder.jpg";
        }
        addToCart(name, price, color, selectedImg);
    });
});

function addToCart(name, price, color, img) {
    const existingItem = cart.find(item => item.name === name && item.color === color);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, color, quantity: 1, img: img });
    }
    updateUI();
}

function changeQuantity(index, newQty) {
    if (newQty <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].quantity = parseInt(newQty);
    }
    updateUI();
}

function updateUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCounter) cartCounter.innerText = `Cart (${totalItems})`;

    const summary = document.getElementById('cart-summary');
    const miniCart = document.getElementById('mini-cart');
    const miniItemsContainer = document.getElementById('mini-cart-items');
    const miniTotalSpan = document.getElementById('mini-cart-total');

    if (!summary) return;

    if (cart.length === 0) {
        summary.innerHTML = "<p>No items added yet.</p>";
        if (miniCart) miniCart.classList.add('hidden');
        return;
    }

    const shippingFee = 49;
    let subtotal = 0;
    let mainHtml = '<div class="cart-list">';
    let miniHtml = '';

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        mainHtml += `
            <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${item.img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0px;">
                    <div>
                        <div style="font-weight: bold;">${item.name}</div>
                        <small style="color: #666;">Color: ${item.color}</small>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold;">${itemTotal} SEK</div>
                    <div class="qty-controls" style="margin-top: 5px; display: flex; align-items: center; gap: 5px; justify-content: flex-end;">
                        <button class="cart-qty-btn" onclick="changeQuantity(${index}, ${item.quantity - 1})">−</button>
                        
                        <select onchange="changeQuantity(${index}, this.value)" class="qty-dropdown" style="padding: 2px; border-radius: 0px; border: 1px solid #ccc;">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => 
                                `<option value="${n}" ${item.quantity == n ? 'selected' : ''}>${n}</option>`
                            ).join('')}
                            ${item.quantity > 10 ? `<option value="${item.quantity}" selected>${item.quantity}</option>` : ''}
                            <option value="0">0 (Remove)</option>
                        </select>
                        
                        <button class="cart-qty-btn" onclick="addToCart('${item.name.replace(/'/g, "\\'")}', ${item.price}, '${item.color}', '${item.img}')">+</button>
                    </div>
                </div>
            </div>`;

        // ... keep the miniHtml logic as is ...
        // Mini Cart Item with Thumbnails
        miniHtml += `
            <div class="mini-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <img src="${item.img}" style="width: 35px; height: 35px; object-fit: cover; border-radius: 0px;">
                <div style="flex: 1;">
                    <div style="font-size: 0.8rem; font-weight: bold;">${item.name} x${item.quantity}</div>
                    <div style="font-size: 0.7rem; color: #777;">${item.color}</div>
                </div>
            </div>`;
    });

    const grandTotal = subtotal + shippingFee;

    // Totals Section (Right Aligned)
    mainHtml += `
        </div>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #f4f4f4; display: flex; flex-direction: column; align-items: flex-end;">
            <div style="color: #888; font-size: 0.9rem;">Subtotal: ${subtotal} SEK</div>
            <div style="color: #888; font-size: 0.9rem;">Shipping: ${shippingFee} SEK</div>
            <div style="font-size: 1.4rem; font-weight: bold; margin-top: 5px;">Total: ${grandTotal} SEK</div>
        </div>`;

    summary.innerHTML = mainHtml;

    if (miniCart && miniItemsContainer) {
        miniItemsContainer.innerHTML = miniHtml;
        miniTotalSpan.innerText = grandTotal;
        // Only show if cart isn't empty
        if (cart.length > 0) miniCart.classList.remove('hidden');
    }
}

// --- 3. FORM SUBMISSION (THE "DOUBLE SEND" VERSION) ---
const orderForm = document.getElementById('order-form');

if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // Safety check: don't send if cart is empty
        if (cart.length === 0) { 
            showEmptyCartModal(); 
            return; 
        }

        const submitBtn = orderForm.querySelector('.submit-btn');
        submitBtn.innerText = "Sending Order...";
        submitBtn.disabled = true;

        // 1. CALCULATE TOTALS FOR THE EMAIL
        const shippingFee = 49;
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const grandTotal = subtotal + shippingFee;

        // 2. FORMAT THE ITEM LIST
        let formattedCart = "ORDER SUMMARY:\n------------------\n";
        cart.forEach(item => {
            formattedCart += `${item.name} (${item.color}) x${item.quantity} - ${item.price * item.quantity} SEK\n`;
        });
        formattedCart += `------------------\nSHIPPING: ${shippingFee} SEK\nTOTAL: ${grandTotal} SEK`;

        // 3. PREPARE THE DATA (Matches your EmailJS variables)
        const templateParams = {
            "from_name": document.getElementById('cust-name').value,
            "cust-email": document.getElementById('cust-email').value.toLowerCase().trim(),
            "cust_phone": document.getElementById('cust-phone').value,
            "cust_address": `${document.getElementById('cust-street').value}, ${document.getElementById('cust-zip').value}, ${document.getElementById('cust-city').value}`,
            "cart_contents": formattedCart,
            "grand_total": grandTotal,
            "comments": document.getElementById('cust-comments').value
        };

        // 4. THE FIRST SEND: TO YOU (Admin)
        emailjs.send('service_kc38c2o', 'template_tquby7h', templateParams)
            .then(function() {
                console.log("Admin email sent!");

                // 5. THE SECOND SEND: TO CUSTOMER (Confirmation)
                // REPLACE 'YOUR_CONFIRMATION_TEMPLATE_ID' with the ID from EmailJS
                return emailjs.send('service_kc38c2o', 'template_sqo2oxn', templateParams);
            })
            .then(function() {
                console.log("Customer email sent!");
                
                // SUCCESS ACTIONS
                showSuccess(grandTotal); 
                cart = [];
                updateUI();
                orderForm.reset();
                submitBtn.innerText = "Send Order Request";
                submitBtn.disabled = false;
            })
            .catch(function(err) {
                console.error("Email Error:", err);
                alert("Order submitted, but there was an error sending the confirmation email.");
                showSuccess(grandTotal); // Still show the Swish QR so you get paid!
                submitBtn.disabled = false;
            });
    });
}

// --- 4. MODAL LOGIC (Fixed Scroll & Alignment) ---
const modal = document.getElementById("product-modal");

function openModal(name, price, imageArray, description) {
    console.log("Opening Modal:", name);
    document.getElementById("modal-title").innerText = name;
    document.getElementById("modal-desc").innerText = description;
    
    const mainImg = document.getElementById("modal-main-img");
    if (mainImg && imageArray.length > 0) mainImg.src = imageArray[0];

    const thumbContainer = document.getElementById("modal-thumbnails");
    if (thumbContainer) {
        thumbContainer.innerHTML = "";
        imageArray.forEach(imgSrc => {
            const thumb = document.createElement("img");
            thumb.src = imgSrc;
            thumb.classList.add("thumb-item");
            thumb.onclick = () => { if (mainImg) mainImg.src = imgSrc; };
            thumbContainer.appendChild(thumb);
        });
    }
    
    if (modal) {
        modal.style.display = "flex";
        // LOCK SCROLL
        document.body.style.overflow = "hidden";
    }
}

// Function to handle closing and UNLOCKING scroll
function closeModal() {
    if (modal) modal.style.display = "none";
    // UNLOCK SCROLL
    document.body.style.overflow = "auto";
}

// Attach listener to X button
document.querySelector(".close-modal")?.addEventListener('click', closeModal);

// Attach listener to clicking OUTSIDE the modal
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        closeModal();
    }
});

window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

// --- 5. SUCCESS MODAL & SWISH ---
function showSuccess(finalAmount) {
    const overlay = document.getElementById('success-overlay');
    const qrImg = document.getElementById('swish-qr');
    const totalDisplay = document.getElementById('display-grand-total');
    const swishLink = document.getElementById('swish-link');

    const amount = finalAmount || 0;
    const myNumber = "46737764660";
    const shopName = "HANMADE";

    if (totalDisplay) totalDisplay.innerText = amount;

    const swishUrl = `https://app.swish.nu/1/p/sw/?sw=${myNumber}&amt=${amount}&msg=${encodeURIComponent(shopName)}`;

    if (swishLink) swishLink.href = swishUrl;
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(swishUrl)}`;
    }

    if (overlay) overlay.classList.remove('hidden');
}

function closeSuccessOverlay() {
    document.getElementById('success-overlay').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showEmptyCartModal() { document.getElementById('empty-cart-overlay').classList.remove('hidden'); }
function closeEmptyOverlay() { document.getElementById('empty-cart-overlay').classList.add('hidden'); document.body.style.overflow = 'auto'; }

function toggleMiniCart() {
    const miniCart = document.getElementById('mini-cart');
    const btn = document.getElementById('minimize-cart');
    
    if (miniCart) {
        miniCart.classList.toggle('minimized');
        
        // Change the button text based on state
        if (btn) {
            btn.innerText = miniCart.classList.contains('minimized') ? "+" : "−";
        }
    }
}

window.addEventListener('load', () => {
    const miniCartElem = document.getElementById('mini-cart');
    const targetSection = document.getElementById('order');

    if (miniCartElem && targetSection) {
        const cartObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const rect = entry.boundingClientRect;
                
                // 1. If we are currently looking at the order section OR have scrolled past it downwards
                if ((entry.isIntersecting && rect.top < 450) || rect.bottom < 450) {
                    miniCartElem.classList.add('force-hide');
                } else {
                    // 2. We are above the order section (viewing products), show the mini cart if it has items
                    if (cart.length > 0) {
                        miniCartElem.classList.remove('force-hide');
                    }
                }
            });
        }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] });

        cartObserver.observe(targetSection);
    }
});


document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        
        // Close other open FAQ items (optional - remove if you want multiple open)
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) item.classList.remove('active');
        });

        faqItem.classList.toggle('active');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copy-swish-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const realSwishNumber = "0737764660";
            
            navigator.clipboard.writeText(realSwishNumber).then(() => {
                copyBtn.innerText = "Number Copied! ✓";
                copyBtn.style.backgroundColor = "#e8f5e9"; 
                
                setTimeout(() => {
                    copyBtn.innerText = "Copy Number";
                    copyBtn.style.backgroundColor = "#f4f4f4";
                }, 2500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }
});