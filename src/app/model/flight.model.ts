export type Flight = {
  origin: Location;
  destination: Location;
  airline: string;
  flight_number: string;
  departure_date: Date;
  currency: string;
  price: number;
};

export const locations = ["London", "Glasgow", "Berlin", "Munich", "Dublin", "Barcelona", "Paris", "Mauritius",
   "Amsterdam", "Iran", "Madrid", "New York", "Las Vegas", "Seattle", "Prague", "Sao Paulo", "Sydney", "Warsaw"] as const;
export type Location = typeof locations[number];
