
/**
 * Get price range information for a place
 * @param {number} priceLevel - Price level from Google Places (0-4)
 * @returns {object|null} Price information with symbol, label, and estimate
 */
export const getPriceRangeInfo = (priceLevel) => {
  if (priceLevel === undefined || priceLevel === null || priceLevel === 0) {
    return null;
  }

  const priceRanges = {
    1: { 
      label: "Inexpensive", 
      symbol: "$", 
      estimate: "$10-20 per person",
      color: "text-green-400"
    },
    2: { 
      label: "Moderate", 
      symbol: "$$", 
      estimate: "$20-40 per person",
      color: "text-yellow-400"
    },
    3: { 
      label: "Expensive", 
      symbol: "$$$", 
      estimate: "$40-80 per person",
      color: "text-orange-400"
    },
    4: { 
      label: "Very Expensive", 
      symbol: "$$$$", 
      estimate: "$80+ per person",
      color: "text-red-400"
    }
  };

  return priceRanges[priceLevel] || null;
};

/**
 * Get just the price symbol (for compact displays)
 */
export const getPriceSymbol = (priceLevel) => {
  const info = getPriceRangeInfo(priceLevel);
  return info?.symbol || null;
};

/**
 * Get formatted price display for compact views
 */
export const getCompactPriceDisplay = (priceLevel) => {
  const info = getPriceRangeInfo(priceLevel);
  if (!info) return null;
  
  return {
    symbol: info.symbol,
    label: info.label,
    color: info.color
  };
};

/**
 * Get full price display for detailed views
 */
export const getFullPriceDisplay = (priceLevel) => {
  const info = getPriceRangeInfo(priceLevel);
  if (!info) return null;
  
  return {
    symbol: info.symbol,
    label: info.label,
    estimate: info.estimate,
    color: info.color
  };
};
