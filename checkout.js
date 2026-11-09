"use strict";

const checkoutItems = document.querySelector("#checkout-items");
const checkoutTotal = document.querySelector("#checkout-total");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutMessage = document.querySelector("#checkout-message");

const nameInput = document.querySelector("#customer-name");
const phoneInput = document.querySelector("#customer-phone");
const addressInput = document.querySelector("#customer-address");

const nameError = document.querySelector("#name-error");
const phoneError = document.querySelector("#phone-error");
const addressError = document.querySelector("#address-error");

const submitButton = checkoutForm.querySelector('button[type="submit"]');

const products = window.products;
const money = new Intl.NumberFormat("fa-IR");

const ordersStorageKey = "my-store-orders";

function formatPrice(price) {
  return money.format(price) + " تومان";
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
        typeof product.price === "number" &&
        Number.isSafeInteger(product.price) &&
        product.price > 0,
    );
  } catch {
    return [];
  }
}

const apiProducts = loadApiProductsFromStorage();

function renderCheckout() {
  const cart = cartManager.getItems();

  checkoutItems.replaceChildren();

  if (cart.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "سبد خرید شما خالی است.";

    const backLink = document.createElement("a");
    backLink.href = "index.html";
    backLink.textContent = "بازگشت به فروشگاه";

    checkoutItems.append(emptyMessage, backLink);
    checkoutTotal.textContent = formatPrice(0);
    checkoutForm.hidden = true;

    return;
  }

  checkoutForm.hidden = false;

  let total = 0;

  for (const item of cart) {
    const product = [...products, ...apiProducts].find(
      (product) => product.id === item.id,
    );

    if (!product) continue;

    const itemTotal = product.price * item.quantity;
    total += itemTotal;

    const row = document.createElement("div");
    row.className = "checkout-item";

    const name = document.createElement("span");
    name.textContent = product.name;

    const quantity = document.createElement("span");
    quantity.textContent = `تعداد: ${money.format(item.quantity)}`;

    const price = document.createElement("span");
    price.textContent = formatPrice(itemTotal);

    row.append(name, quantity, price);
    checkoutItems.append(row);
  }

  checkoutTotal.textContent = formatPrice(total);
}

function normalizePhone(phone) {
  return phone
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\s()-]/g, "");
}

function setFieldError(input, errorElement, message) {
  errorElement.textContent = message;

  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

function clearFieldError(input, errorElement) {
  setFieldError(input, errorElement, "");
}

function focusFirstInvalidField() {
  const invalidInput = checkoutForm.querySelector('[aria-invalid="true"]');

  if (invalidInput) {
    invalidInput.focus();
  }
}

function validateName() {
  const value = nameInput.value.trim();

  if (value.length < 3) {
    setFieldError(nameInput, nameError, "نام باید حداقل ۳ کاراکتر داشته باشد.");
    return false;
  }

  clearFieldError(nameInput, nameError);
  return true;
}

function validatePhone() {
  const value = normalizePhone(phoneInput.value.trim());

  if (!/^\+?[0-9]{7,15}$/.test(value)) {
    setFieldError(
      phoneInput,
      phoneError,
      "شماره تماس باید شامل ۷ تا ۱۵ رقم معتبر باشد.",
    );
    return false;
  }

  clearFieldError(phoneInput, phoneError);
  return true;
}

function validateAddress() {
  const value = addressInput.value.trim();

  if (value.length < 10) {
    setFieldError(
      addressInput,
      addressError,
      "نشانی باید حداقل ۱۰ کاراکتر داشته باشد.",
    );
    return false;
  }

  clearFieldError(addressInput, addressError);
  return true;
}

function createOrderId() {
  if (crypto.randomUUID) {
    return "ORDER-" + crypto.randomUUID();
  }

  return "ORDER-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function createOrder() {
  const cart = cartManager.getItems();

  const items = cart
    .map((item) => {
      const product = [...products, ...apiProducts].find(
        (product) => product.id === item.id,
      );

      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      };
    })
    .filter((item) => item !== null);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return {
    id: createOrderId(),

    customer: {
      name: nameInput.value.trim(),
      phone: normalizePhone(phoneInput.value.trim()),
      address: addressInput.value.trim(),
    },

    items,
    total,
    createdAt: new Date().toISOString(),
  };
}

function saveOrder(order) {
  try {
    const savedOrders = localStorage.getItem(ordersStorageKey);
    const parsedOrders = savedOrders ? JSON.parse(savedOrders) : [];

    if (!Array.isArray(parsedOrders)) {
      throw new Error("Invalid orders data");
    }

    parsedOrders.push(order);

    localStorage.setItem(ordersStorageKey, JSON.stringify(parsedOrders));

    return true;
  } catch (error) {
    console.warn("ذخیره سفارش ناموفق بود:", error);
    return false;
  }
}

nameInput.addEventListener("input", validateName);
phoneInput.addEventListener("input", validatePhone);
addressInput.addEventListener("input", validateAddress);

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (submitButton.disabled) return;

  checkoutMessage.textContent = "";

  const cart = cartManager.getItems();

  if (cart.length === 0) {
    checkoutForm.hidden = true;
    checkoutMessage.textContent =
      "سبد خرید خالی است و امکان ثبت سفارش وجود ندارد.";
    return;
  }

  const isNameValid = validateName();
  const isPhoneValid = validatePhone();
  const isAddressValid = validateAddress();

  if (!isNameValid || !isPhoneValid || !isAddressValid) {
    checkoutMessage.textContent = "لطفاً خطاهای فرم را برطرف کنید.";

    focusFirstInvalidField();

    return;
  }

  const order = createOrder();

  if (!order) {
    checkoutMessage.textContent = "اطلاعات محصولات سبد خرید معتبر نیست.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "در حال ثبت سفارش...";

  const saved = saveOrder(order);

  if (!saved) {
    submitButton.disabled = false;
    submitButton.textContent = "ثبت سفارش آزمایشی";

    checkoutMessage.textContent =
      "ذخیره سفارش ناموفق بود. لطفاً دوباره تلاش کنید.";
    return;
  }

  const clearResult = cartManager.clear();

  const params = new URLSearchParams();
  params.set("orderId", order.id);

  if (clearResult !== "success") {
    params.set("cartClear", "failed");
  }

  window.location.href = "order-success.html?" + params.toString();
});

renderCheckout();
