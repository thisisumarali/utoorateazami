// Utility for order management and local persistence (frontend ready for fullstack backend)

export const VALID_PROMOS = {
  UTOOR10: { percent: 10, label: "10% Welcome Discount" },
  WELCOME10: { percent: 10, label: "10% First Order Discount" },
  AZAMI15: { percent: 15, label: "15% Special Connoisseur Discount" },
};

export const POPULAR_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Sialkot",
  "Gujranwala",
  "Quetta",
];

export function generateOrderId() {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `UA-${randomDigits}`;
}

export function saveOrderToStorage(orderData) {
  if (typeof window === "undefined") return orderData;
  try {
    const existing = JSON.parse(localStorage.getItem("utoorateazami_orders") || "[]");
    const updated = [orderData, ...existing];
    localStorage.setItem("utoorateazami_orders", JSON.stringify(updated));
    return orderData;
  } catch (err) {
    console.error("Failed to save order to localStorage:", err);
    return orderData;
  }
}

export function getSavedOrders() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("utoorateazami_orders") || "[]");
  } catch (err) {
    console.error("Failed to get orders from localStorage:", err);
    return [];
  }
}
