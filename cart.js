"use strict";

window.cartManager = (() => {
  const products = window.products;
  const storageKey = "my-store-cart";

  // اعتبارسنجی اطلاعات ذخیره‌شده
  function normalizeCartData(saved) {
    try {
      if (!saved) return [];

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      const quantitiesById = new Map();

      for (const item of parsed) {
        if (
          !item ||
          !Number.isSafeInteger(item.id) ||
          item.id <= 0 ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity <= 0 ||
          item.quantity > 99
        ) {
          continue;
        }

        const currentQuantity = quantitiesById.get(item.id) || 0;

        quantitiesById.set(
          item.id,
          Math.min(99, currentQuantity + item.quantity),
        );
      }

      return Array.from(quantitiesById, ([id, quantity]) => ({
        id,
        quantity,
      }));
    } catch {
      return [];
    }
  }

  // خواندن سبد خرید
  function loadCart() {
    try {
      const saved = localStorage.getItem(storageKey);
      return normalizeCartData(saved);
    } catch {
      return [];
    }
  }

  // وضعیت داخلی سبد خرید
  let cart = loadCart();

  // ذخیره سبد خرید
  function saveCart() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.warn("ذخیره‌سازی سبد خرید ناموفق بود:", error);
      return false;
    }
  }

  // دریافت یک نسخه از اطلاعات سبد
  function getItems() {
    return cart.map((item) => ({ ...item }));
  }

  // افزودن محصول
  function add(id) {
    if (!Number.isSafeInteger(id)) {
      return "invalid";
    }

    const productExists = products.some((product) => product.id === id);

    if (!productExists) {
      return "invalid";
    }

    const existingItem = cart.find((item) => item.id === id);

    if (existingItem) {
      if (existingItem.quantity >= 99) {
        return "limit";
      }

      existingItem.quantity += 1;
    } else {
      cart.push({ id, quantity: 1 });
    }

    return saveCart() ? "success" : "storage-error";
  }

  // تغییر تعداد محصول
  function changeQuantity(id, change) {
    if (!Number.isSafeInteger(id)) return "invalid";

    if (change !== 1 && change !== -1) return "invalid";

    const item = cart.find((item) => item.id === id);

    if (!item) return "invalid";

    const nextQuantity = item.quantity + change;

    if (nextQuantity <= 0) {
      cart = cart.filter((item) => item.id !== id);
    } else if (nextQuantity <= 99) {
      item.quantity = nextQuantity;
    } else {
      return "limit";
    }

    return saveCart() ? "success" : "storage-error";
  }

  // حذف محصول
  function remove(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      return "invalid";
    }

    const exists = cart.some((item) => item.id === id);

    if (!exists) return "invalid";

    cart = cart.filter((item) => item.id !== id);

    return saveCart() ? "success" : "storage-error";
  }

  // خالی کردن سبد خرید
  function clear() {
    cart = [];
    return saveCart() ? "success" : "storage-error";
  }

  return {
    getItems,
    add,
    changeQuantity,
    remove,
    clear,
  };
})();
