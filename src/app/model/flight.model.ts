import { z } from "zod";

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

// Zod schema for flight data returned from Elasticsearch.
// departure_date is stored as a Date by the ingestion script but Elasticsearch
// returns it as an ISO string, so we type it as string here.
export const flightSchema = z.object({
  origin: z.enum(locations),
  destination: z.enum(locations),
  airline: z.string(),
  flight_number: z.string(),
  departure_date: z.string(),
  currency: z.string(),
  price: z.number(),
});
