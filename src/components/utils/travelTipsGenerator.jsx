/**
 * Generate travel tips for a specific day using Gemini AI
 */
export async function generateDayTips(dayData, destination) {
  if (!dayData?.places || dayData.places.length === 0) {
    return {};
  }

  const placesContext = dayData.places
    .map((place, idx) => `${idx + 1}. ${place.name} (${place.address || destination})`)
    .join('\n');

  const prompt = `You are a professional travel curator for Walvee. Generate short, inspiring travel tips for a day in ${destination}.

**Today's Itinerary:**
${placesContext}

**Instructions:**
- Create brief, editorial-style tips for each period of the day (max 2 lines each)
- Be natural, warm, and helpful — like a knowledgeable local friend
- Focus on practical insights: timing, atmosphere, what to expect
- Only include periods that are relevant based on the places listed
- If a period doesn't have relevant activities, omit it

**Output Format (JSON):**
{
  "morning": "short tip if there are morning activities",
  "lunch": "short tip if there are lunch spots or mid-day activities",
  "afternoon": "short tip if there are afternoon activities",
  "evening": "short tip if there are evening activities",
  "night": "short tip if there are nighttime activities"
}

**Important:**
- Maximum 2 lines per tip
- No emojis
- Be specific to the actual places in the itinerary
- Omit periods without relevant activities (don't return empty strings)`;

  try {
    const response = await invokeLLM({
      prompt: prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          morning: { type: "string" },
          lunch: { type: "string" },
          afternoon: { type: "string" },
          evening: { type: "string" },
          night: { type: "string" }
        }
      }
    });

    const filteredTips = {};
    Object.keys(response).forEach(key => {
      if (response[key] && response[key].trim().length > 0) {
        filteredTips[key] = response[key].trim();
      }
    });

    return filteredTips;
  } catch (error) {
    console.error('[TravelTips] Error generating tips:', error);
    return {};
  }
}

/**
 * Generate tips for all days in a trip
 */
export async function generateTripTips(itinerary, destination) {
  if (!itinerary || itinerary.length === 0) {
    return itinerary;
  }

  const enrichedItinerary = [];

  for (const day of itinerary) {
    const tips = await generateDayTips(day, destination);
    enrichedItinerary.push({
      ...day,
      ...tips
    });
  }

  return enrichedItinerary;
}

/**
 * Check if a day needs tips regeneration
 */
export function dayNeedsRegeneration(oldDay, newDay) {
  if (!oldDay || !newDay) return true;
  
  const oldPlaces = oldDay.places || [];
  const newPlaces = newDay.places || [];
  
  if (oldPlaces.length !== newPlaces.length) return true;
  
  for (let i = 0; i < oldPlaces.length; i++) {
    if (oldPlaces[i].place_id !== newPlaces[i].place_id) return true;
    if (oldPlaces[i].name !== newPlaces[i].name) return true;
  }
  
  return false;
}