import { createAzure } from "@ai-sdk/azure";
import { ollama } from "ai-sdk-ollama";
import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  ModelMessage
} from "ai";
import { NextResponse } from "next/server";

import { weatherTool } from "@/app/ai/weather.tool";
import { fcdoTool } from "@/app/ai/fcdo.tool";
import { flightTool } from "@/app/ai/flights.tool";

import { getSimilarMessages, persistMessage } from "@/app/util/elasticsearch";
import { summarizeMessage } from "@/app/util/context";

// Allow streaming responses up to 30 seconds to address typically longer responses from LLMs
export const maxDuration = 30;

const tools = {
  flights: flightTool,
  weather: weatherTool,
  fcdo: fcdoTool
};

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY
});

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

    const result = await streamText({
      //model: azure("gpt-4o"),
      model: ollama("qwen3:8b"),
      system: `You are a helpful assistant that returns travel itineraries based on location, 
      the FCDO guidance from the specified tool, the available flights from the flight tool (default origin airport is London), 
      and the weather captured from the weather tool. 
      
      Use the flight information from the flight tool only to recommend possible flights in the itinerary.
      You must also return a day-by-day textual itinerary of sites to see and things to do based on the weather result.
      Reuse and adapt past itineraries for the same destination if one exists in your memory.
      If the FCDO tool warns against travel DO NOT generate recommendations of things to do, and explain why.`,

      //If the user requests to book a trip trigger the booking tool to offer to book the trip along with the itinerary generation. 
      //Proceed with the booking if they approve.`,
      messages: allMessages,
      stopWhen: stepCountIs(2),
      tools,
      onFinish: async ({ text }) => {
        if (text.length > 5) {
          const summary = await summarizeMessage(text);
          const finalMessage = { role: "system", content: summary } as ModelMessage;
          await persistMessage(finalMessage, id);
        }
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
