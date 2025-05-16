
// API Configuration
const API_BASE_URL = 'https://dummyjson.com';
const PRODUCTS_PER_PAGE = 16;

// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allCategories = [];

// Cart functionality
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(el => {
        el.textContent = count;
    });
}

function addToCart(productId, quantity = 1, productData) {
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productData.id,
            name: productData.title,
            price: productData.price,
            image: productData.thumbnail,
            quantity: quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
}

function updateCartItemQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    return cart;
}

function calculateCartTotal() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? (subtotal > 50 ? 0 : 5.99) : 0;
    const total = subtotal + shipping;

    return {
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2)
    };
}

// API Functions
async function fetchProducts(options = {}) {
    let url = `${API_BASE_URL}/products`;

    if (options.category) {
        url = `${API_BASE_URL}/products/category/${options.category}`;
    } else if (options.search) {
        url = `${API_BASE_URL}/products/search?q=${options.search}`;
    } else if (options.sortBy) {
        url = `${API_BASE_URL}/products?sortBy=${options.sortBy}&order=${options.order || 'asc'}`;
    }

    if (options.limit) {
        url += (url.includes('?') ? '&' : '?') + `limit=${options.limit}`;
    }

    if (options.skip) {
        url += (url.includes('?') ? '&' : '?') + `skip=${options.skip}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.products || data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function fetchProductById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/categories`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// Page-specific functionality
async function initHomePage() {
    const featuredGrid = document.querySelector('.featured-products .products-grid');
    const moreProductsGrid = document.getElementById('more-products-grid');

    // Fetch featured products (first 6)
    const featuredProducts = await fetchProducts({ limit: 8 });

    if (featuredGrid && featuredProducts.length > 0) {
        featuredGrid.innerHTML = featuredProducts.map(product => `
            <div class="product-card">
                <img src="${product.thumbnail}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="rating">Rating: ${product.rating}/5</p>
                    <a href="product.html?id=${product.id}" class="btn">View Details</a>
                </div>
            </div>
        `).join('');
    }

    // Fetch more products (next 6)
    const moreProducts = await fetchProducts({ limit: 8, skip: 8 });

    if (moreProductsGrid && moreProducts.length > 0) {
        moreProductsGrid.innerHTML = moreProducts.map(product => `
            <div class="product-card">
                <img src="${product.thumbnail}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="rating">Rating: ${product.rating}/5</p>
                    <a href="product.html?id=${product.id}" class="btn">View Details</a>
                </div>
            </div>
        `).join('');
    } else if (moreProductsGrid) {
        document.querySelector('.more-products').style.display = 'none';
    }
}

async function initProductsPage() {
    const productsGrid = document.querySelector('.products-grid');
    const categoryFilter = document.getElementById('category-filter');
    const sortBy = document.getElementById('sort-by');

    // Load categories
    allCategories = await fetchCategories();
    // console.log('Categories:', allCategories);
    // allCategories.map(category => {
    //     console.log(category.name);
    // })

    if (categoryFilter) {
        categoryFilter.innerHTML = `
            <option value="all">All Categories</option>
            ${allCategories.map(category => `
                <option value="${category.slug}">${category.name.replace(/-/g, ' ')}</option>
            `).join('')}
        `;
    }

    async function displayProducts(productsToDisplay) {
        if (!productsToDisplay) {
            productsToDisplay = await fetchProducts({ limit: PRODUCTS_PER_PAGE });
        }

        if (productsGrid) {
            productsGrid.innerHTML = productsToDisplay.map(product => `
                <div class="product-card">
                    <img src="${product.thumbnail}" alt="${product.title}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-title">${product.title}</h3>
                        <p class="price">$${product.price.toFixed(2)}</p>
                        <p class="rating">Rating: ${product.rating}/5</p>
                        <p class="category">${product.category.replace(/-/g, ' ')}</p>
                        <div class="actions">
                            <a href="product.html?id=${product.id}" class="btn">View Details</a>
                            <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Add event listeners to add to cart buttons
            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', async () => {
                    const productId = parseInt(button.getAttribute('data-id'));
                    const product = await fetchProductById(productId);
                    if (product) {
                        addToCart(productId, 1, product);
                        alert('Product added to cart!');
                    }
                });
            });
        }
    }

    async function filterAndSortProducts() {
        const category = categoryFilter ? categoryFilter.value : 'all';
        const sortOption = sortBy ? sortBy.value : 'default';

        let productsToDisplay;

        // Filter by category
        if (category !== 'all') {
            productsToDisplay = await fetchProducts({ category });
        } else {
            productsToDisplay = await fetchProducts({ limit: PRODUCTS_PER_PAGE });
        }

        // Sort products
        if (sortOption === 'price-low') {
            productsToDisplay.sort((a, b) => a.price - b.price);
        } else if (sortOption === 'price-high') {
            productsToDisplay.sort((a, b) => b.price - a.price);
        } else if (sortOption === 'rating') {
            productsToDisplay.sort((a, b) => b.rating - a.rating);
        }

        displayProducts(productsToDisplay);
    }

    // Initial display
    await filterAndSortProducts();

    // Event listeners for filters
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndSortProducts);
    }
    if (sortBy) {
        sortBy.addEventListener('change', filterAndSortProducts);
    }
}

async function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = await fetchProductById(productId);

    if (!product) {
        window.location.href = 'products.html';
        return;
    }

    // Remove all loading spinners
    const loadingSpinners = document.querySelectorAll('.loading-spinner');
    loadingSpinners.forEach(spinner => {
        spinner.style.display = 'none';
    });

    // Display product details
    // document.getElementById('product-title').textContent = product.title;
    productTitle = document.getElementById('product-title');
    productTitle.textContent = product.title;
    productTitle.style.display = 'block';

    productPrice = document.getElementById('product-price');
    productPrice.textContent = `$${product.price.toFixed(2)}`;
    productPrice.style.display = 'block';

    productDesc = document.getElementById('product-description')
    productDesc.textContent = product.description;
    productDesc.style.display = 'block';

    productOptions = document.getElementById('product-options');
    productOptions.style.display = 'block';

    addToCartButton = document.getElementById('add-to-cart');
    addToCartButton.style.display = 'block';

    // Display images
    const mainImage = document.getElementById('main-product-image');
    mainImage.src = product.thumbnail;
    mainImage.alt = product.title;
    mainImage.style.display = 'block';

    const thumbnailContainer = document.querySelector('.thumbnail-container');
    if (product.images && product.images.length > 0) {
        thumbnailContainer.innerHTML = product.images.map((image, index) => `
            <img src="${image}" alt="${product.title} thumbnail ${index + 1}" 
                 class="thumbnail ${index === 0 ? 'active' : ''}" 
                 data-image="${image}">
        `).join('');

        // Thumbnail click event
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.getAttribute('data-image');
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
    }

    // Add to cart button
    document.getElementById('add-to-cart').addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        addToCart(product.id, quantity, product);
        alert('Product added to cart!');
    });
}

// Cart and Checkout functionality
function initCartPage() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const emptyCartMessage = document.querySelector('.empty-cart-message');
    const summaryItemsContainer = document.querySelector('.summary-items');
    const { subtotal, shipping, total } = calculateCartTotal();

    document.getElementById('subtotal').textContent = `$${subtotal}`;
    document.getElementById('shipping').textContent = `$${shipping}`;
    document.getElementById('total').textContent = `$${total}`;

    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        summaryItemsContainer.innerHTML = '';
    } else {
        emptyCartMessage.style.display = 'none';

        // Display cart items
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="images/${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="decrease">-</button>
                        <input type="number" value="${item.quantity}" min="1">
                        <button class="increase">+</button>
                    </div>
                </div>
                <button class="remove-item">×</button>
            </div>
        `).join('');

        // Display summary items
        summaryItemsContainer.innerHTML = cart.map(item => `
            <div class="summary-item">
                <span>${item.name} (${item.quantity})</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        // Add event listeners
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => {
                const productId = parseInt(button.closest('.cart-item').getAttribute('data-id'));
                removeFromCart(productId);
                initCartPage(); // Refresh cart display
            });
        });

        document.querySelectorAll('.cart-item-quantity input').forEach(input => {
            input.addEventListener('change', () => {
                const productId = parseInt(input.closest('.cart-item').getAttribute('data-id'));
                const quantity = parseInt(input.value) || 1;
                updateCartItemQuantity(productId, quantity);
                initCartPage(); // Refresh cart display
            });
        });

        document.querySelectorAll('.decrease').forEach(button => {
            button.addEventListener('click', () => {
                const input = button.nextElementSibling;
                let value = parseInt(input.value) || 1;
                if (value > 1) {
                    input.value = value - 1;
                    const event = new Event('change');
                    input.dispatchEvent(event);
                }
            });
        });

        document.querySelectorAll('.increase').forEach(button => {
            button.addEventListener('click', () => {
                const input = button.previousElementSibling;
                let value = parseInt(input.value) || 1;
                input.value = value + 1;
                const event = new Event('change');
                input.dispatchEvent(event);
            });
        });
    }
}

// Checkout functionality
function initCheckoutPage() {
    const { total } = calculateCartTotal();
    document.getElementById('order-total').textContent = `$${total}`;

    // Display order items in summary
    const summaryItemsContainer = document.querySelector('.summary-items');
    summaryItemsContainer.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} (${item.quantity})</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    // Form submission
    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, you would process payment here
        alert('Order placed successfully! Thank you for your purchase.');
        // Clear cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        // Redirect to home
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    });
}

// Initialize page based on current URL
document.addEventListener('DOMContentLoaded', async () => {
    updateCartCount();

    const path = window.location.pathname;
    const page = path.split('/').pop();

    switch (page) {
        case 'index.html':
        case '':
            await initHomePage();
            break;
        case 'products.html':
            await initProductsPage();
            break;
        case 'product.html':
            await initProductPage();
            break;
        case 'cart.html':
            initCartPage();
            break;
        case 'checkout.html':
            initCheckoutPage();
            break;
    }
});