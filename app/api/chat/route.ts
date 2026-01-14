import { openai } from '@ai-sdk/openai';
import { streamText, stepCountIs, convertToModelMessages, ModelMessage } from "ai";
import { NextResponse } from "next/server";

import { weatherTool } from "@/app/ai/weather.tool";
import { fcdoTool } from "@/app/ai/fcdo.tool";
import { flightTool } from "@/app/ai/flights.tool";
import { getSimilarMessages, persistMessage } from "@/app/util/elasticsearch";

// Allow streaming responses up to 30 seconds to address typically longer responses from LLMs
export const maxDuration = 30;

const tools = {
  flights: flightTool,
  weather: weatherTool,
  fcdo: fcdoTool,
};

// Post request handler
export async function POST(req: Request) {
  const { messages, id } = await req.json();

  // Get chat history by chat id
  const lastMessageIndex = messages.length > 0 ? messages.length - 1 : 0;
  const messageContent = messages[lastMessageIndex].parts
    .map((part: { text: string }) =>
      "text" in part && typeof part.text === "string" ? part.text : ""
    )
    .join(" ");

  const previousMessages = await getSimilarMessages(messageContent);
  

  try {
    const convertedMessages = await convertToModelMessages(messages);
    const allMessages: ModelMessage[] =
      previousMessages.concat(convertedMessages);
      
    const result = streamText({
      model: openai("gpt-4o"),
      system:
        `You are a helpful assistant that returns travel itineraries based on location, 
      the FCDO guidance from the specified tool, the available flights from the flight tool, 
      and the weather captured from the displayWeather tool.
      Use the flight information from tool getFlights only to recommend possible flights in the itinerary.
      You must also return a day-by-day textual itinerary of sites to see and things to do based on the weather result.
      Reuse and adapt past itineraries for the same destination if one exists in your memory.
      If the FCDO tool warns against travel DO NOT generate recommendations of things to do, and explain why.`,
      messages: allMessages,
      stopWhen: stepCountIs(2),
      onFinish: async ({ text }) => {
        const finalMessage = { role: "system", content: text } as ModelMessage;
        await persistMessage(finalMessage, id);
      },
    });

    // Return data stream to allow the useChat hook to handle the results as they are streamed through for a better user experience
    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error(e);
    return new NextResponse(
      "Unable to generate a plan. Please try again later!"
    );
  }
}
