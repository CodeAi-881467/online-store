"use strict";

const productDetail = document.querySelector("#product-detail");

const products = window.products;

// بازیابی محصولات API از localStorage
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

// اضافه کردن محصولات API به آرایه مشترک محصولات
const savedApiProducts = loadApiProductsFromStorage();

for (const apiProduct of savedApiProducts) {
  const alreadyExists = products.some(
    (product) => product.id === apiProduct.id,
  );

  if (!alreadyExists) {
    products.push(apiProduct);
  }
}

const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));

const product = products.find((item) => item.id === productId);

const money = new Intl.NumberFormat("fa-IR");

function formatPrice(price) {
  return money.format(price) + " تومان";
}

// ساخت و نمایش اطلاعات محصول
function renderProductDetail() {
  if (!Number.isSafeInteger(productId) || !product) {
    const errorTitle = document.createElement("h1");
    errorTitle.id = "product-page-title";
    errorTitle.tabIndex = -1;
    errorTitle.textContent = "محصول موردنظر پیدا نشد.";

    const backLink = document.createElement("a");
    backLink.href = "index.html";
    backLink.className = "back-link";
    backLink.textContent = "بازگشت به فروشگاه";

    productDetail.replaceChildren(errorTitle, backLink);

    errorTitle.focus();
    return;
  }

  const visual = document.createElement("div");
  visual.className = "detail-visual";
  visual.setAttribute("aria-hidden", "true");
  visual.textContent = product.icon;

  const name = document.createElement("h1");
  name.id = "product-page-title";
  name.tabIndex = -1;
  name.textContent = product.name;

  const category = document.createElement("p");
  category.className = "detail-category";
  category.textContent = "دسته‌بندی: " + product.categoryLabel;

  const description = document.createElement("p");
  description.className = "detail-description";
  description.textContent = product.description;

  const price = document.createElement("p");
  price.className = "detail-price";
  price.textContent = formatPrice(product.price);

  const cartQuantity = document.createElement("p");
  cartQuantity.className = "detail-cart-quantity";

  // به‌روزرسانی تعداد محصول در سبد
  function updateCartQuantity() {
    const item = cartManager.getItems().find((item) => item.id === product.id);

    const quantity = item ? item.quantity : 0;

    cartQuantity.textContent = `تعداد این محصول در سبد خرید: ${money.format(quantity)}`;

    return quantity;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.textContent = "افزودن به سبد خرید";
  button.setAttribute("aria-label", `افزودن ${product.name} به سبد خرید`);

  let buttonState = "idle";

  function updateButton() {
    if (buttonState === "idle") {
      button.textContent = "افزودن به سبد خرید";
      button.setAttribute("aria-label", `افزودن ${product.name} به سبد خرید`);
      button.disabled = false;
    } else if (buttonState === "success") {
      button.textContent = "افزوده شد ✓";
      button.setAttribute(
        "aria-label",
        `${product.name} با موفقیت به سبد خرید اضافه شد`,
      );
      button.disabled = false;
    } else if (buttonState === "limit") {
      button.textContent = "حداکثر تعداد مجاز";
      button.setAttribute(
        "aria-label",
        `حداکثر تعداد مجاز برای ${product.name} در سبد خرید`,
      );
      button.disabled = true;
    } else if (buttonState === "storage-error") {
      button.textContent = "افزوده شد (ذخیره نشد)";
      button.setAttribute(
        "aria-label",
        `${product.name} به سبد اضافه شد اما ذخیره نشد`,
      );
      button.disabled = false;
    }
  }

  const message = document.createElement("p");
  message.className = "detail-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");

  button.addEventListener("click", () => {
    const result = cartManager.add(product.id);

    const quantity = updateCartQuantity();

    buttonState = result;
    updateButton();

    if (result === "success") {
      message.textContent = `محصول با موفقیت به سبد خرید اضافه شد. تعداد فعلی: ${money.format(quantity)}.`;
    } else if (result === "storage-error") {
      message.textContent = `محصول به سبد اضافه شد، اما ذخیره‌سازی ناموفق بود. تعداد فعلی: ${money.format(quantity)}.`;
    } else if (result === "limit") {
      message.textContent =
        "حداکثر تعداد مجاز این محصول در سبد خرید ۹۹ عدد است.";
    } else {
      buttonState = "idle";
      updateButton();

      message.textContent = "افزودن محصول به سبد خرید امکان‌پذیر نبود.";
    }
  });

  updateButton();
  updateCartQuantity();

  productDetail.replaceChildren(
    visual,
    name,
    category,
    description,
    price,
    cartQuantity,
    button,
    message,
  );

  name.focus();
}

renderProductDetail();
