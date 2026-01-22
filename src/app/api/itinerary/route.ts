import { ollama } from "ai-sdk-ollama";
import {
  generateText,
  Output,
} from "ai";
import { z } from 'zod/v3';

import { NextResponse } from "next/server";
import { Flight } from "@/app/model/flight.model";

// Allow streaming responses up to 30 seconds to address typically longer responses from LLMs
export const maxDuration = 30;

// Post request handler
export async function POST(req: Request) {
  const { origin, destination } = await req.json();

  try {
    const result = await generateText({
      model: ollama("qwen3:8b"),
      output: Output.object({
        schema: z.object({
          origin: z.string().describe("The origin of the trip"),
          destination: z.string().describe("The destination of the trip"),
          flights: z.array(z.custom<Flight>()).describe("List of available flights"),
          hotel: z.string().describe("Name and address of the recommended hotel for the stay"),
          itinerary: z.string().describe("Day-by-day itinerary for the trip including sites and dining options")
        }),
      }),
      prompt: `Generate a detailed day-by-day itinerary for a trip from ${origin} to ${destination}. 
      Include key sites to see, things to do, and hotel and dining recommendations. 
      Also, recommend suitable outbound and return flights based on typical options available.`,
    });

    // Return generated content
    return NextResponse.json(result.content);
  } catch (e) {
    console.error(e);
    return new NextResponse(
      "Unable to generate a plan. Please try again later!"
    );
  }
}
