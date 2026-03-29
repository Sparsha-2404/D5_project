import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (service, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === service._id);
      if (existing) {
        return prev.map((item) =>
          item._id === service._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...service, quantity }];
    });
  };

  const removeFromCart = (serviceId) => {
    setCart((prev) => prev.filter((item) => item._id !== serviceId));
  };

  const updateQuantity = (serviceId, quantity) => {
    if (quantity <= 0) return removeFromCart(serviceId);
    setCart((prev) =>
      prev.map((item) => (item._id === serviceId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
