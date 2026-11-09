"use strict";

// 1. داده‌های نمونه محصولات
const products = window.products;

// 2. دسترسی به عناصر HTML
const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const sortSelect = document.querySelector("#sort");

const productsContainer = document.querySelector("#products");
const resultCount = document.querySelector("#result-count");

const cartItemsContainer = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const clearCartButton = document.querySelector("#clear-cart");
const cartStorageMessage = document.querySelector("#cart-storage-message");
const apiStatus = document.querySelector("#api-status");

// 3. وضعیت برنامه

let productsState = "success";

function loadPreference(key, allowedValues, fallback) {
  try {
    const savedValue = localStorage.getItem(key);

    return allowedValues.includes(savedValue) ? savedValue : fallback;
  } catch {
    return fallback;
  }
}

const appState = {
  searchText: "",

  selectedCategory: loadPreference(
    "selectedCategory",
    [
      "all",
      "audio",
      "accessories",
      "storage",
      "beauty",
      "fragrances",
      "furniture",
      "groceries",
    ],
    "all",
  ),

  sortOrder: loadPreference("sortOrder", ["default", "low", "high"], "default"),
};

try {
  appState.searchText = localStorage.getItem("searchTerm") || "";
} catch {
  appState.searchText = "";
}

// هماهنگ‌کردن عناصر HTML با وضعیت بازیابی‌شده
searchInput.value = appState.searchText;
categorySelect.value = appState.selectedCategory;
sortSelect.value = appState.sortOrder;
// فقط شناسه محصول و تعداد را ذخیره می‌کنیم.
let cart = cartManager.getItems();
const money = new Intl.NumberFormat("fa-IR");

function formatPrice(price) {
  return `${money.format(price)} تومان`;
}

// 4. بارگذاری امن‌تر سبد ذخیره‌شده

function showCartStorageMessage(message) {
  cartStorageMessage.textContent = message;
  cartStorageMessage.hidden = message === "";
}

function handleCartStorageResult(result) {
  if (result === "storage-error") {
    showCartStorageMessage(
      "ذخیره‌سازی سبد خرید ناموفق بود. ممکن است تغییرات پس از تازه‌سازی صفحه از بین بروند.",
    );
  } else if (result === "success") {
    showCartStorageMessage("");
  }
}

function refreshCart() {
  cart = cartManager.getItems();
  renderCart();
}

// 5. جست‌وجو، فیلتر و مرتب‌سازی
function getVisibleProducts() {
  const normalizedSearch = appState.searchText.toLocaleLowerCase("fa");

  const visible = products.filter((product) => {
    const normalizedName = product.name.toLocaleLowerCase("fa");

    const matchesSearch = normalizedName.includes(normalizedSearch);

    const matchesCategory =
      appState.selectedCategory === "all" ||
      product.category === appState.selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (appState.sortOrder === "low") {
    visible.sort((a, b) => a.price - b.price);
  } else if (appState.sortOrder === "high") {
    visible.sort((a, b) => b.price - a.price);
  }

  return visible;
}

// 6. نمایش محصولات

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const visual = document.createElement("div");
  visual.className = "product-visual";
  visual.setAttribute("aria-hidden", "true");
  visual.textContent = product.icon;

  const info = document.createElement("div");
  info.className = "product-info";

  const title = document.createElement("h3");
  title.textContent = product.name;

  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = product.categoryLabel;

  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = formatPrice(product.price);

  const detailsLink = document.createElement("a");
  detailsLink.className = "details-link";
  detailsLink.href = `product.html?id=${product.id}`;
  detailsLink.textContent = "مشاهده جزئیات";
  detailsLink.setAttribute("aria-label", `مشاهده جزئیات ${product.name}`);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.dataset.action = "add";
  button.dataset.id = String(product.id);
  button.textContent = "افزودن به سبد";
  button.setAttribute("aria-label", `افزودن ${product.name} به سبد خرید`);

  info.append(title, category, price, detailsLink, button);

  card.append(visual, info);

  return card;
}

function createProductMessage(message) {
  const element = document.createElement("p");

  element.className = "empty-message";
  element.textContent = message;

  return element;
}

function renderProducts() {
  const visible = getVisibleProducts();

  productsContainer.replaceChildren();

  productsState = getProductsState(products, visible);

  resultCount.textContent = `${money.format(visible.length)} محصول پیدا شد.`;

  switch (productsState) {
    case "empty": {
      const message = createProductMessage(
        "در حال حاضر محصولی برای نمایش وجود ندارد.",
      );

      productsContainer.append(message);
      break;
    }

    case "no-results": {
      const message = createProductMessage("محصولی با این مشخصات پیدا نشد.");

      productsContainer.append(message);
      break;
    }

    case "success": {
      for (const product of visible) {
        const card = createProductCard(product);
        productsContainer.append(card);
      }

      break;
    }
  }
}

function getProductsState(allProducts, visibleProducts) {
  if (allProducts.length === 0) {
    return "empty";
  }

  if (visibleProducts.length === 0) {
    return "no-results";
  }

  return "success";
}
// 7. افزودن محصول به سبد خرید

// 8. تغییر تعداد یا حذف محصول

// 9. نمایش سبد خرید و محاسبه مجموع
function renderCart() {
  cartItemsContainer.replaceChildren();

  let total = 0;
  let totalQuantity = 0;

  for (const item of cart) {
    const product = products.find((product) => product.id === item.id);

    if (!product) continue;

    total += product.price * item.quantity;
    totalQuantity += item.quantity;

    const row = document.createElement("div");
    row.className = "cart-row";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const price = document.createElement("p");
    price.textContent = formatPrice(product.price * item.quantity);

    const controls = document.createElement("div");
    controls.className = "cart-controls";

    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.className = "quantity-button";
    decrease.dataset.action = "decrease";
    decrease.dataset.id = String(item.id);
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `کاهش تعداد ${product.name}`);

    const quantity = document.createElement("span");
    quantity.textContent = money.format(item.quantity);

    const increase = document.createElement("button");
    increase.type = "button";
    increase.className = "quantity-button";
    increase.dataset.action = "increase";
    increase.dataset.id = String(item.id);
    increase.textContent = "+";
    increase.setAttribute("aria-label", `افزایش تعداد ${product.name}`);
    increase.disabled = item.quantity >= 99;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.dataset.action = "remove";
    remove.dataset.id = String(item.id);
    remove.textContent = "حذف";
    remove.setAttribute("aria-label", `حذف ${product.name} از سبد خرید`);

    controls.append(decrease, quantity, increase, remove);
    row.append(title, price, controls);
    cartItemsContainer.append(row);
  }

  if (cart.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "سبد خرید خالی است.";
    cartItemsContainer.append(message);
  }

  cartCount.textContent = money.format(totalQuantity);
  cartTotal.textContent = formatPrice(total);
}

// 10. راه‌اندازی رویدادهای رابط کاربری

function initializeEventListeners() {
  searchInput.addEventListener("input", () => {
    appState.searchText = searchInput.value.trim();
    try {
      localStorage.setItem("searchTerm", appState.searchText);
    } catch {
      // جست‌وجو همچنان در همین اجرای صفحه کار می‌کند.
    }

    renderProducts();
  });

  categorySelect.addEventListener("change", () => {
    appState.selectedCategory = categorySelect.value;
    try {
      localStorage.setItem("selectedCategory", appState.selectedCategory);
    } catch {
      // فیلتر در همین اجرای صفحه همچنان کار می‌کند.
    }

    renderProducts();
  });

  sortSelect.addEventListener("change", () => {
    appState.sortOrder = sortSelect.value;
    try {
      localStorage.setItem("sortOrder", appState.sortOrder);
    } catch {
      // مرتب‌سازی در همین اجرای صفحه همچنان کار می‌کند.
    }

    renderProducts();
  });

  productsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='add']");

    if (!button || !productsContainer.contains(button)) return;

    addToCart(Number(button.dataset.id));
  });

  cartItemsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !cartItemsContainer.contains(button)) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "increase") changeQuantity(id, 1);
    if (action === "decrease") changeQuantity(id, -1);
    if (action === "remove") removeFromCart(id);
  });

  clearCartButton.addEventListener("click", () => {
    const result = cartManager.clear();

    handleCartStorageResult(result);

    refreshCart();
  });
}
// بعدا اضافه شد

function addToCart(id) {
  const result = cartManager.add(id);

  handleCartStorageResult(result);

  refreshCart();
}

function changeQuantity(id, change) {
  const result = cartManager.changeQuantity(id, change);

  handleCartStorageResult(result);

  refreshCart();

  const action = change > 0 ? "increase" : "decrease";
  restoreCartFocus(id, action);
}

function removeFromCart(id) {
  const result = cartManager.remove(id);

  handleCartStorageResult(result);

  refreshCart();

  const remainingButtons = cartItemsContainer.querySelectorAll(
    "button[data-action]",
  );

  if (remainingButtons.length > 0) {
    remainingButtons[0].focus();
  } else {
    clearCartButton.focus();
  }
}

function restoreCartFocus(id, action) {
  const selector = `button[data-action="${action}"][data-id="${id}"]`;
  const targetButton = cartItemsContainer.querySelector(selector);

  if (targetButton && !targetButton.disabled) {
    targetButton.focus();
    return;
  }

  const firstCartButton = cartItemsContainer.querySelector(
    "button[data-action]",
  );

  if (firstCartButton) {
    firstCartButton.focus();
    return;
  }

  clearCartButton.focus();
}

function loadApiProductsFromStorage() {
  try {
    const saved = localStorage.getItem("apiProducts");

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (product) =>
        product &&
        Number.isSafeInteger(product.id) &&
        product.id >= 10000 &&
        typeof product.name === "string" &&
        product.name.trim() !== "" &&
        typeof product.category === "string" &&
        typeof product.categoryLabel === "string" &&
        typeof product.description === "string" &&
        typeof product.icon === "string" &&
        Number.isSafeInteger(product.price) &&
        product.price > 0,
    );
  } catch {
    return [];
  }
}

const savedApiProducts = loadApiProductsFromStorage();

for (const product of savedApiProducts) {
  const alreadyExists = products.some((item) => item.id === product.id);

  if (!alreadyExists) {
    products.push(product);
  }
}

// 11. نمایش اولیه محصولات محلی و سبد خرید

initializeEventListeners();

renderProducts();
renderCart();

// 12. دریافت محصولات از API
async function loadApiProducts() {
  showApiStatus("در حال دریافت محصولات از سرور...");

  try {
    const apiProducts = await window.productApi.getProducts();

    const existingIds = new Set(products.map((product) => product.id));

    const newProducts = apiProducts.filter(
      (product) => !existingIds.has(product.id),
    );

    products.push(...newProducts);
    try {
      localStorage.setItem(
        "apiProducts",
        JSON.stringify(products.filter((product) => product.id >= 10000)),
      );
    } catch (error) {
      console.warn("ذخیره محصولات API ناموفق بود:", error);
    }

    renderProducts();
    renderCart();

    showApiStatus(`${apiProducts.length} محصول از سرور دریافت شد.`);

    console.log(`${newProducts.length} محصول جدید از API اضافه شد.`);
  } catch (error) {
    console.error("دریافت محصولات از API ناموفق بود:", error);

    showApiStatus(
      "دریافت محصولات جدید ناموفق بود. محصولات قبلی همچنان در دسترس هستند.",
    );
  }
}

loadApiProducts();

function showApiStatus(message, isVisible = true) {
  apiStatus.textContent = message;
  apiStatus.hidden = !isVisible;
}
// شروع دریافت محصولات
