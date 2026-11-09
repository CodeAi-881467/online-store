"use strict";

window.productApi = (() => {
  const apiUrl = "https://dummyjson.com/products?limit=30";

  const categoryLabels = {
    beauty: "زیبایی و مراقبت",
    fragrances: "عطر و ادکلن",
    furniture: "خانه و مبلمان",
    groceries: "مواد غذایی",
  };

  function normalizeProduct(item) {
    if (
      !item ||
      !Number.isSafeInteger(item.id) ||
      item.id <= 0 ||
      typeof item.title !== "string" ||
      item.title.trim() === "" ||
      typeof item.price !== "number" ||
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      typeof item.category !== "string" ||
      !Object.hasOwn(categoryLabels, item.category)
    ) {
      return null;
    }

    const id = 10000 + item.id;
    const price = Math.round(item.price * 10000);

    if (
      !Number.isSafeInteger(id) ||
      !Number.isSafeInteger(price) ||
      price <= 0
    ) {
      return null;
    }

    const description =
      typeof item.description === "string" && item.description.trim() !== ""
        ? item.description.trim()
        : "توضیحی برای این محصول ثبت نشده است.";

    return {
      id,
      name: item.title,
      category: item.category,
      categoryLabel: categoryLabels[item.category],
      price,
      icon: "🛍️",
      description,
    };
  }

  async function getProducts() {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data !== "object" || !Array.isArray(data.products)) {
      throw new Error("ساختار پاسخ API معتبر نیست.");
    }

    return data.products
      .map(normalizeProduct)
      .filter((product) => product !== null);
  }

  return {
    getProducts,
  };
})();
