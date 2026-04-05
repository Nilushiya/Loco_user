export type OrderStatus = "Ongoing" | "Completed" | "Canceled";

export type OrderRecord = {
  id: string;
  tripId: string;
  type: string;
  status: OrderStatus;
  amount: number;
  subtotal: number;
  deliveryFee: number;
  date: string;
  userName: string;
  userPhone: string;
  pickup: string;
  dropoff: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  paymentMethod: string;
  driver?: {
    name: string;
    rating: number;
    vehicle: string;
    company: string;
  };
};

export const MOCK_ORDERS: OrderRecord[] = [
  {
    id: "176368746",
    tripId: "1318757694",
    type: "Food",
    status: "Completed",
    amount: 1069,
    subtotal: 980,
    deliveryFee: 89,
    date: "2026-03-06T21:07:00.000Z",
    userName: "Thenujan",
    userPhone: "0705054864",
    pickup: "[Momos Chinese Cuisine (Mahara)] - 142, Kandy Road, Mahara, Kadawatha",
    dropoff: "10, Kandy Road, Mahara, Gampaha",
    items: [
      { name: "Chicken Kottu", quantity: 1, price: 980 },
      { name: "Veg Spring Roll", quantity: 2, price: 150 },
    ],
    paymentMethod: "YONO Bank **** 8551",
    driver: {
      name: "Roshan",
      rating: 4.6,
      vehicle: "BJT4666",
      company: "Food Plus",
    },
  },
  {
    id: "176368747",
    tripId: "1318757695",
    type: "Food",
    status: "Ongoing",
    amount: 144.42,
    subtotal: 120.0,
    deliveryFee: 24.42,
    date: "2026-03-09T05:52:00.000Z",
    userName: "Thenujan",
    userPhone: "0705054864",
    pickup: "No: 69, Jaffna-Kankesanthurai Road, Chunnakam",
    dropoff: "10, Kali Kovil Road, Chunnakam, Jaffna",
    items: [
      { name: "Idiyappam", quantity: 2, price: 60 },
      { name: "Milk Rice", quantity: 1, price: 40 },
    ],
    paymentMethod: "Cash on Delivery",
  },
  {
    id: "176368748",
    tripId: "1318757696",
    type: "Food",
    status: "Canceled",
    amount: 780,
    subtotal: 700,
    deliveryFee: 80,
    date: "2026-02-28T18:30:00.000Z",
    userName: "Thenujan",
    userPhone: "0705054864",
    pickup: "Station Road, Colombo Fort",
    dropoff: "46, Galle Road, Colombo 03",
    items: [
      { name: "Fish Roll", quantity: 1, price: 500 },
      { name: "Soda", quantity: 1, price: 120 },
    ],
    paymentMethod: "Credit Card **** 2244",
  },
];

