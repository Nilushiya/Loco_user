import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_KEY = "APP_CART";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type Cart = {
  storeId: string;
  storeName: string;
  storeArea: string;
  items: Record<string, CartItem>;
};

export const getCart = async (): Promise<Cart | null> => {
  const data = await AsyncStorage.getItem(CART_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveCart = async (cart: Cart) => {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const clearCart = async () => {
  await AsyncStorage.removeItem(CART_KEY);
};