import { tool } from 'ai';
import { z } from 'zod/v3';

import { FCDOResponse } from '../model/fcdo.model';

export const fcdoTool = tool({
  description: 
  'Display the FCDO guidance for a destination',
  inputSchema: z.object({
    country: z.string().describe('The country of the location to get the guidance for')
  }),
  outputSchema: z.object({
    country: z.string().describe('The location we have guidance for'),
    status: z.string().optional().describe('The current FCDO alert status for the location'),
    url: z.string().optional().describe('The URL to the FCDO guidance for the location'),
    message: z.string().optional().describe('An optional message, e.g. for errors')
  }),
  execute: async function ({ country }) {
    const url = `https://www.gov.uk/api/content/foreign-travel-advice/${country.toLowerCase()}`;
    
    try {
      const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      const fcdoResponse: FCDOResponse = await response.json();

      const alertStatus: string = fcdoResponse.details.alert_status.length == 0 ? 'OK' : 
      fcdoResponse.details.alert_status[0]?.replaceAll('_', ' ');

      return { 
        country: country,
        status: alertStatus, 
        url: `https://www.gov.uk${fcdoResponse.basePath}`
      };
    } catch(e) {
      console.error(e);
      return { 
        message: 'Unable to obtain FCDO information', 
        country: country
      };
    }
  }
});
