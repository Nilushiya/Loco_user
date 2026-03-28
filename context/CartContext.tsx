import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Cart, CartItem, clearCart, getCart, saveCart } from "../utils/cartStorage";

type CartContextValue = {
  cart?: Cart | null;
  isLoading: boolean;
  addItem: (
    storeId: string,
    storeName: string,
    storeArea: string,
    item: { id: string; name: string; price: number; image: string }
  ) => void;
  removeItem: (storeId: string, itemId: string) => void;
  clearAll: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCart().then((stored) => {
      setCart(stored);
      setIsLoading(false);
    });
  }, []);

  const addItem = useCallback(
    (
      storeId: string,
      storeName: string,
      storeArea: string,
      item: { id: string; name: string; price: number; image: string }
    ) => {
      setCart((prev) => {
        // If switching stores, start fresh
        const existingItems = prev?.storeId === storeId ? prev.items : {};
        const key = `${storeId}-${item.id}`;
        const existing = existingItems[key];

        const updated: Record<string, CartItem> = {
          ...existingItems,
          [key]: {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: existing ? existing.quantity + 1 : 1,
          },
        };

        const newCart: Cart = { storeId, storeName, storeArea, items: updated };
        saveCart(newCart);
        return newCart;
      });
    },
    []
  );

  const removeItem = useCallback((storeId: string, itemId: string) => {
    setCart((prev) => {
      if (!prev || prev.storeId !== storeId) return prev;

      const key = `${storeId}-${itemId}`;
      const existing = prev.items[key];
      if (!existing) return prev;

      const updated = { ...prev.items };

      if (existing.quantity <= 1) {
        delete updated[key];
      } else {
        updated[key] = { ...existing, quantity: existing.quantity - 1 };
      }

      if (Object.keys(updated).length === 0) {
        clearCart();
        return null;
      }

      const newCart: Cart = { ...prev, items: updated };
      saveCart(newCart);
      return newCart;
    });
  }, []);

  const clearAll = useCallback(async () => {
    await clearCart();
    setCart(null);
  }, []);

  return (
    <CartContext.Provider value={{ cart, isLoading, addItem, removeItem, clearAll }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
