import { Client } from "@elastic/elasticsearch";
import { ModelMessage } from "ai";

import { locations } from "../model/flight.model";

export const flightIndex: string = "upcoming-flight-data";
export const client: Client = new Client({
  node: process.env.ELASTIC_ENDPOINT,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY || "",
  },
});

const messageIndex: string = "chat-messages";

/**
 * Create the chat messages index if it does not already exist
 */
async function createMessagesIndexIfNotExists() {
  if (!(await client.indices.exists({ index: messageIndex }))) {
    await client.indices.create({
      index: messageIndex,
      mappings: {
        properties: {
          "chat-id": { type: "keyword" },
          message: {
            type: "object",
            properties: {
              role: { type: "keyword" },
              content: { type: "semantic_text", inference_id: ".elser-2-elasticsearch" },
            },
          },
          "@timestamp": { type: "date" },
        },
      },
    });
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/**
 * Persist a chat message to Elasticsearch
 * @param message: current message
 * @param id: unique chat id
 */
export async function persistMessage(message: ModelMessage, id: string) {
  try {
    await createMessagesIndexIfNotExists();
    await client.index({
      index: messageIndex,
      document: {
        "chat-id": id,
        message: message,
        "@timestamp": new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("Unable to persist message", e);
  }
}

/**
 * Get similar chat messages from Elasticsearch based on semantic search
 * @param content: current message content
 * @returns
 */
export async function getSimilarMessages(content: string): Promise<ModelMessage[]> {
  if (!(await client.indices.exists({ index: messageIndex }))) {
    return [];
  }

  const location = findLocationInMessage(content);

  try {
    const result = await client.search<{ message: ModelMessage }>({
      index: messageIndex,
      query: {
        bool: {
          should: [
            {
              match: {
                "message.content": {
                  query: location,
                  boost: 1,
                },
              },
            }
          ],
        },
      },
      sort: [{ "@timestamp": "asc" }],
      size: 20,
    });

    return result.hits.hits.map((hit) => hit._source?.message as ModelMessage);
  } catch (e) {
    console.error("Unable to retrieve messages", e);
    return [];
  }
}

/**
 * Find the location mentioned in the message content
 * @param messageContent 
 * @returns 
 */
function findLocationInMessage(messageContent: string): string {
    for (const location of locations) {
        if (messageContent.toLowerCase().includes(location.toLowerCase()) 
        && !messageContent.toLowerCase().includes(`from ${location.toLowerCase()}`)) {
            return location;
        }
    }

    return "";
}
