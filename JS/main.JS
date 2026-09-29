const productCards = Array.from(document.querySelectorAll(".product_card"));
const searchForm = document.querySelector(".search_box");
const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const headerCounts = document.querySelectorAll(".header_icon .Count");
const productSlider = document.querySelector(".slide_product");

const categoryAliases = {
    Electronics: "electronics",
    Fashion: "watches",
    Phones: "phones & tablets",
    TV: "tv & monitors",
    Watches: "watches",
    Toys: "toys & games",
    Home: "home & kitchen",
};

function readStorage(key, fallback) {
    try {
        const savedValue = localStorage.getItem(key);
        return savedValue === null ? fallback : JSON.parse(savedValue);
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        return;
    }
}

const savedCart = readStorage("pickora-cart", {});
const cartItems = savedCart && typeof savedCart === "object" && !Array.isArray(savedCart)
    ? savedCart
    : {};
const savedWishlist = readStorage("pickora-wishlist", []);
const wishlist = new Set(Array.isArray(savedWishlist) ? savedWishlist : []);

function getProductName(card) {
    return card.querySelector(".product_info h3")?.textContent.trim() ?? "";
}

function updateHeaderCounts() {
    const wishlistCount = headerCounts[0];
    const cartCount = headerCounts[1];
    const totalCartItems = Object.values(cartItems).reduce((total, quantity) => {
        const itemQuantity = Number(quantity);
        return total + (Number.isFinite(itemQuantity) && itemQuantity > 0 ? itemQuantity : 0);
    }, 0);

    if (wishlistCount) {
        wishlistCount.textContent = String(wishlist.size);
    }

    if (cartCount) {
        cartCount.textContent = String(totalCartItems);
    }
}

function updateWishlistButtons() {
    productCards.forEach((card) => {
        const button = card.querySelector(".wishlist");
        const icon = button?.querySelector("i");

        if (!button || !icon) {
            return;
        }

        const isSaved = wishlist.has(getProductName(card));
        button.setAttribute("aria-pressed", String(isSaved));
        button.setAttribute("aria-label", isSaved ? "Remove from wishlist" : "Add to wishlist");
        icon.classList.toggle("fa-solid", isSaved);
        icon.classList.toggle("fa-regular", !isSaved);
    });
}

const emptyState = document.createElement("p");
emptyState.className = "products_empty";
emptyState.setAttribute("role", "status");
emptyState.textContent = "No products match your search.";
emptyState.hidden = true;

if (productSlider) {
    productSlider.insertAdjacentElement("afterend", emptyState);
}

function filterProducts() {
    const query = searchInput?.value.trim().toLowerCase() ?? "";
    const selectedCategory = categorySelect?.value ?? "All";
    const categoryQuery = categoryAliases[selectedCategory]?.toLowerCase() ?? "";
    let visibleProducts = 0;

    productCards.forEach((card) => {
        const cardText = card.textContent.toLowerCase();
        const categoryText = card.querySelector(".product_category")?.textContent.toLowerCase() ?? "";
        const matchesSearch = !query || cardText.includes(query);
        const matchesCategory = !categoryQuery || categoryText.includes(categoryQuery);

        card.hidden = !(matchesSearch && matchesCategory);
        visibleProducts += card.hidden ? 0 : 1;
    });

    emptyState.hidden = visibleProducts > 0;
    window.productSwiper?.update();
}

searchInput?.addEventListener("input", filterProducts);
categorySelect?.addEventListener("change", filterProducts);

searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
});

document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const cartButton = event.target.closest(".add_cart");
    const wishlistButton = event.target.closest(".wishlist");

    if (cartButton) {
        event.preventDefault();
        const card = cartButton.closest(".product_card");
        const productName = card ? getProductName(card) : "";

        if (productName) {
            cartItems[productName] = (Number(cartItems[productName]) || 0) + 1;
            writeStorage("pickora-cart", cartItems);
            updateHeaderCounts();
        }

        return;
    }

    if (wishlistButton) {
        event.preventDefault();
        const card = wishlistButton.closest(".product_card");
        const productName = card ? getProductName(card) : "";

        if (!productName) {
            return;
        }

        if (wishlist.has(productName)) {
            wishlist.delete(productName);
        } else {
            wishlist.add(productName);
        }

        writeStorage("pickora-wishlist", Array.from(wishlist));
        updateWishlistButtons();
        updateHeaderCounts();
    }
});

updateWishlistButtons();
updateHeaderCounts();
filterProducts();