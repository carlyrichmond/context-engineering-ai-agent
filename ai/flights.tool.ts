import { tool } from 'ai';
import { z } from 'zod/v3';

import { Flight } from '../model/flight.model';
import { client, flightIndex } from '../util/elasticsearch';

function extractFlights(response: { hits?: { hits?: { _source: Flight }[] } }): (Flight | undefined) {
    if (response.hits && Array.isArray(response.hits.hits)) {
        return response.hits.hits.map((hit: { _source: Flight; }) => hit._source)[0];
    }
    return undefined;
}

export const flightTool = tool({
  description:
    "Get flight information for a given destination from Elasticsearch, both outbound and return journeys",
  inputSchema: z.object({
    destination: z.string().describe("The destination we are flying to"),
    origin: z.string().describe("The origin we are flying from").default("London"),
  }),
  outputSchema: z.object({
    outbound: z.custom<Flight>().describe("List of outbound flights"),
    inbound: z.custom<Flight>().describe("List of return flights")
  }),
  execute: async function ({ destination, origin }) {
    try {
      const responses = await client.msearch({
        searches: [
          { index: flightIndex },
          {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      origin: origin,
                    },
                  },
                  {
                    match: {
                      destination: destination,
                    },
                  },
                ],
              },
            },
          },

          // Return leg
          { index: flightIndex },
          {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      origin: destination,
                    },
                  },
                  {
                    match: {
                      destination: origin,
                    },
                  },
                ],
              },
            },
          },
        ],
      });

      if (responses.responses.length < 2) {
        throw new Error("Unable to obtain flight data");
      }

      return {
        outbound: extractFlights(responses.responses[0] as { hits?: { hits?: { _source: Flight }[] } }),
        inbound: extractFlights(responses.responses[1] as { hits?: { hits?: { _source: Flight }[] } })
      };
    } catch (e) {
      console.error(e);
      return {
        message: "Unable to obtain flight information"
      };
    }
  },
});