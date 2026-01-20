import { generateText } from "ai";
import { ollama } from "ai-sdk-ollama";

/*
* Summarize message via LLM to reduce size for storage
* @param message: original message
* @returns summarized message
*/
export async function summarizeMessage(message: string): Promise<string> {
   try{
    const { text } = await generateText({
      model: ollama("qwen3:8b"),
      prompt: `Summarize the following chat message:
            ${message}`,
    });

    // Print character counts
    console.log(`Character counts: original ${message.length} 
          versus summarized ${text.length}`);

    return text;
   } catch(e) {
    console.error("Unable to summarize message", e);
    return message;
   }
}