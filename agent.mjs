import OpenAI from "openai";

const CITY = "Glasnevin, Ireland";
const client = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1", // Ollama local server URL
});

// Weather descriptions mapping based on weather codes from the API
const weatherDescriptions = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy with frost",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "rain showers",
  82: "heavy rain showers",
  95: "thunderstorm",
};

async function getTomorrowForecast(city) {
  const locationRespose = await fetch(
    // Fetch the geographical coordinates for the specified city
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  );
  const locationData = await locationRespose.json(); // Parse the JSON response to get location data
  const location = locationData.results[0]; // Get the first result from the location search

  if (!location) { // If no location is found, throw an error
    throw new Error(`Location not found for city: ${city}`);
  }

  // Fetch the weather forecast for the specified location
  const forecastResponse = await fetch(
    "https://api.open-meteo.com/v1/forecast?" +
      `latitude=${location.latitude}` +
      `&longitude=${location.longitude}` +
      "&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m" +
      "&forecast_days=2" +
      "&timezone=auto"
  );

  const forecastData = await forecastResponse.json();
  const tomorrow = new Date(); // Get the current date and time
  tomorrow.setDate(tomorrow.getDate() + 1); // Move to the next day
  const tomorrowDate = tomorrow.toLocaleDateString("en-CA", {
    timeZone: forecastData.timezone, // Use the timezone from the forecast data to format the date correctly
  });

  const hourlyForecast = forecastData.hourly.time
    .map((time, index) => ({ // Map each hourly forecast to an object with relevant weather details
      time,
      temperature: forecastData.hourly.temperature_2m[index],
      feelsLike: forecastData.hourly.apparent_temperature[index],
      rainChance: forecastData.hourly.precipitation_probability[index],
      wind: forecastData.hourly.wind_speed_10m[index],
      condition: weatherDescriptions[forecastData.hourly.weather_code[index]] ?? "unknown",
    }))
    .filter((hour) => hour.time.startsWith(tomorrowDate)); // Keep only the hourly forecasts for tomorrow

    return {
    location: `${location.name}, ${location.country}`,
    date: tomorrowDate,
    hourlyForecast,
  };
}

function clothingAdvice(hourlyForecast) {
  const temperatures = hourlyForecast.map((hour) => hour.feelsLike); // Extract the feels-like temperatures for all hours
  const highestRainChance = Math.max(
    ...hourlyForecast.map((hour) => hour.rainChance)
  ); // Determine the highest chance of rain throughout the day
  const strongestWind = Math.max(...hourlyForecast.map((hour) => hour.wind)); // Determine the strongest wind speed throughout the day
  const coldest = Math.min(...temperatures); // Determine the coldest feels-like temperature
  const warmest = Math.max(...temperatures); // Determine the warmest feels-like temperature

  const advice = [];

  if (coldest < 5) advice.push("Wear a warm coat, jumper, and trousers.");
  else if (coldest < 12) advice.push("Wear a jacket or warm layers.");
  else if (warmest < 20) advice.push("A light jacket or jumper should be comfortable.");
  else advice.push("Light clothing should be suitable.");

  if (highestRainChance >= 50) advice.push("Take a waterproof coat or umbrella.");
  if (strongestWind >= 25) advice.push("It may be windy, so choose an outer layer.");
  if (warmest - coldest >= 8) advice.push("Use layers because the temperature changes through the day.");

  return advice.join(" ");
}

const forecast = await getTomorrowForecast(CITY);

// Filter the hourly forecast into different segments of the day for easier analysis
const commuteToCollege = forecast.hourlyForecast.filter((hour) =>
  ["07:00", "08:00", "09:00"].includes(hour.time.slice(11))
);

// Filter the hourly forecast for the evening commute, 5pm-7pm
const commuteHome = forecast.hourlyForecast.filter((hour) =>
  ["17:00", "18:00", "19:00"].includes(hour.time.slice(11))
);

// Filter the hourly forecast for the main college day, 9am-5pm
const collegeDay = forecast.hourlyForecast.filter((hour) => {
  const hourNumber = Number(hour.time.slice(11, 13));
  return hourNumber >= 9 && hourNumber <= 17;
});

const formatHours = (hours) =>
  hours
    .map(
      (hour) =>
        `${hour.time.slice(11)}: ${hour.temperature}C, feels ${hour.feelsLike}C, ` +
        `${hour.condition}, rain ${hour.rainChance}%, wind ${hour.wind} km/h`
    )
    .join("\n");

const dayTemperatures = collegeDay.map((hour) => hour.temperature);
const highestDayRainChance = Math.max(
  ...collegeDay.map((hour) => hour.rainChance)
);

const input = `
Tomorrow in ${forecast.location} (${forecast.date}).

Morning commute, 7am-9am:
${formatHours(commuteToCollege)}

College day, 9am-5pm:
Temperature range: ${Math.min(...dayTemperatures)}C to ${Math.max(...dayTemperatures)}C.
Highest rain chance: ${highestDayRainChance}%.
Weather details:
${formatHours(collegeDay)}

Evening commute, 5pm-7pm:
${formatHours(commuteHome)}

Reply using exactly these four short sections:

Morning commute (7am-9am)
- Brief weather summary and whether rain is likely.

College day (9am-5pm)
- Temperature range, main conditions, and rain risk.

Evening commute (5pm-7pm)
- Brief weather summary and whether rain is likely.

What to wear
- Give practical clothing, shoe, and umbrella advice for a student travelling to college.
- Maximum three bullet points.

Do not show every hourly forecast. Do not add introductions, conclusions, or extra sections. Do not invent weather data.
`;

const response = await client.chat.completions.create({
  model: "qwen2.5:3b",
  messages: [
    {
      role: "system",
      content: "You are a practical personal weather planner.",
    },
    {
      role: "user",
      content: input,
    },
  ],
});

console.log(response.choices[0].message.content); // Output the weather summary response from the AI model