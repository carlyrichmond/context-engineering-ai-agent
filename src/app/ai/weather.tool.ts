import { tool } from 'ai';
import { z } from 'zod/v3';

import { WeatherResponse } from '../model/weather.model';

export const weatherTool = tool({
  description: 
  'Display the weather for a holiday location',
  inputSchema: z.object({
    location: z.string().describe('The location to get the weather for')
  }),
  outputSchema: z.object({
    location: z.string().describe('The location to get the weather for'),
    condition: z.string().optional().describe('The current weather condition'),
    condition_image: z.string().optional().describe('An image representing the current weather condition'),
    temperature: z.number().optional().describe('The current temperature in Celsius'),
    feels_like_temperature: z.number().optional().describe('What the temperature feels like in Celsius'),
    humidity: z.number().optional().describe('The current humidity percentage'),
    message: z.string().optional().describe('An optional message, e.g. for errors')
  }),
  execute: async ({ location }: { location: string}) => {
    // While a historical forecast may be better, this example gets the next 3 days
    const url = `https://api.weatherapi.com/v1/forecast.json?q=${location}&days=3&key=${process.env.WEATHER_API_KEY}`;
    
    try {
      const response = await fetch(url);
      const weather : WeatherResponse = await response.json();
      return { 
        location: location, 
        condition: weather.current.condition.text, 
        condition_image: weather.current.condition.icon,
        temperature: Math.round(weather.current.temp_c),
        feels_like_temperature: Math.round(weather.current.feelslike_c),
        humidity: weather.current.humidity
      };
    } catch(e) {
      console.error(e);
      return { 
        message: 'Unable to obtain weather information', 
        location: location
      };
    }
  }
});