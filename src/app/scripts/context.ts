import { Client } from "@elastic/elasticsearch";

const index: string = "chat-messages";
const client: Client = new Client({
  node: process.env.ELASTIC_ENDPOINT,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY || "",
  },
});

/*
 * Generate old messages with a timestamp 2 weeks in the past
 */
async function generateOldMessages() {
  // Get all messages
  const messageResponse = await client.search({
    index: index,
    size: 1000,
    query: {
      match_all: {},
    },
  });

  // Get 3 week old timestamp
  const oldTimestamp = new Date();
  oldTimestamp.setDate(oldTimestamp.getDate() - 21);

  // Index new messages with old timestamp
  for (const hit of messageResponse.hits.hits) {
    const newMessage = { ...hit._source };
    newMessage["@timestamp"] = oldTimestamp.toISOString();

    await client.index({
      index: index,
      document: newMessage,
    });
  }
}

/*
 * Prune messages older than 2 weeks from the chat-messages index (temporal)
 */
async function pruneMessagesByDate() {
  // Get message count from index
  const initialCountResponse = await client.count({
    index: index,
  });
  console.log(`Initial memory count: ${initialCountResponse.count} messages`);

  // Delete messages older than 2 weeks
  const response = await client.deleteByQuery({
    index: index,
    refresh: true,
    query: {
      range: {
        "@timestamp": {
          lt: "now-14d",
        },
      },
    },
  });

  // Log deleted count
  console.log(`Pruned ${response.deleted} messages`);

  // Log new message count
  const countResponse = await client.count({
    index: index,
  });
  console.log(`New memory count: ${countResponse.count} messages`);
}

generateOldMessages().then(() => {
  // Delete old messages by date
  pruneMessagesByDate();
});