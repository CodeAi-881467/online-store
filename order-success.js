"use strict";

const successMessage = document.querySelector("#order-success-message");

const orderDetails = document.querySelector("#order-details");
const orderIdElement = document.querySelector("#order-id");
const orderCustomerElement = document.querySelector("#order-customer");
const orderTotalElement = document.querySelector("#order-total");
const orderPageTitle = document.querySelector("#order-page-title");

const ordersStorageKey = "my-store-orders";
const money = new Intl.NumberFormat("fa-IR");

function formatPrice(price) {
  return money.format(price) + " تومان";
}

function loadOrder() {
  try {
    const savedOrders = localStorage.getItem(ordersStorageKey);

    if (!savedOrders) return null;

    const orders = JSON.parse(savedOrders);

    if (!Array.isArray(orders)) return null;

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");

    if (!orderId) return null;

    return orders.find((order) => order.id === orderId) || null;
  } catch (error) {
    console.warn("خواندن سفارش ناموفق بود:", error);
    return null;
  }
}

function renderOrder() {
  const order = loadOrder();

  if (!order) {
    orderPageTitle.textContent = "سفارش پیدا نشد";

    successMessage.textContent =
      "اطلاعات سفارش پیدا نشد. ممکن است سفارش حذف شده باشد.";

    orderDetails.hidden = true;

    orderPageTitle.focus();
    return;
  }

  orderPageTitle.textContent = "سفارش شما ثبت شد!";

  orderIdElement.textContent = order.id;
  orderCustomerElement.textContent = order.customer.name;
  orderTotalElement.textContent = formatPrice(order.total);

  successMessage.textContent =
    "سفارش آزمایشی شما با موفقیت ثبت و ذخیره شده است.";

  const params = new URLSearchParams(window.location.search);

  if (params.get("cartClear") === "failed") {
    successMessage.textContent +=
      " توجه: پاک‌سازی سبد خرید ناموفق بود. ممکن است محصولات همچنان در سبد باقی مانده باشند.";
  }

  orderDetails.hidden = false;

  orderPageTitle.focus();
}

renderOrder();
