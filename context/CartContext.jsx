"use client";

import { createContext, useContext, useState, useEffect } from "react";
import CartDrawer from "@/components/CartDrawer";
import QuickViewModal from "@/components/QuickViewModal";
import SearchModal from "@/components/SearchModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CheckCircle } from "lucide-react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("utoorateazami_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
        } else {
          // Default initial item for demo presence
          setCartItems([
            {
              id: "silver-oud-3ml",
              productId: "silver-oud",
              name: "SILVER OUD",
              image: "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png",
              size: "3ml",
              price: 500,
              quantity: 1,
            },
          ]);
        }
      } else {
        setCartItems([
          {
            id: "silver-oud-3ml",
            productId: "silver-oud",
            name: "SILVER OUD",
            image: "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png",
            size: "3ml",
            price: 500,
            quantity: 1,
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load cart from storage", err);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("utoorateazami_cart", JSON.stringify(cartItems));
    } catch (err) {
      console.error("Failed to persist cart to storage", err);
    }
  }, [cartItems, isLoaded]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2800);
  };

  const addToCart = (newItem) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === newItem.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
    showToast(`Added ${newItem.name} (${newItem.size}) to your bag!`);
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
    );
  };

  const removeItem = (itemId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        quickViewProduct,
        setQuickViewProduct,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        showToast,
      }}
    >
      {children}

      {/* Global Modals & Notifications */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />

      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={addToCart}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(product) => setQuickViewProduct(product)}
      />

      <WhatsAppButton />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1917] text-white px-4 py-3 rounded-xs shadow-2xl flex items-center gap-2.5 border border-[#BC8242]/40 animate-slideUp text-xs font-semibold">
          <CheckCircle size={16} className="text-[#BC8242] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
