// cart-tests.js

const products = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
];

// این تابع منطق اعتبارسنجی loadCart را مستقل آزمایش می‌کند.
function normalizeCart(saved) {
  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    const validIds = new Set(products.map((product) => product.id));
    const quantitiesById = new Map();

    for (const item of parsed) {
      if (
        !item ||
        !Number.isSafeInteger(item.id) ||
        !validIds.has(item.id) ||
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

// ابزار ساده برای نمایش نتیجهٔ هر آزمون
function test(name, actual, expected) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);

  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`);
  console.log("نتیجه:", actual);

  if (!passed) {
    console.log("انتظار:", expected);
  }

  console.log("--------------------");
}

// آزمون ۱: متن JSON خراب
test("JSON نامعتبر", normalizeCart('[{"id": 1, "quantity": 2}'), []);

// آزمون ۲: رد کردن شناسهٔ ناموجود
test(
  "رد کردن ردیف نامعتبر",
  normalizeCart('[{"id": 1, "quantity": 2}, {"id": 999, "quantity": 1}]'),
  [{ id: 1, quantity: 2 }],
);

// آزمون ۳: ادغام ردیف‌های تکراری و رعایت سقف ۹۹
test(
  "محدود کردن تعداد به ۹۹",
  normalizeCart('[{"id": 1, "quantity": 80}, {"id": 1, "quantity": 30}]'),
  [{ id: 1, quantity: 99 }],
);
