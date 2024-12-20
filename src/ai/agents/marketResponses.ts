// Handles market-related response patterns
export const marketResponsePatterns = {
  priceCorrelations: {
    templates: [
      "noot noot! {{token1}} 🤝 {{token2}}",
      "pingu markets doing pingu things! {{token1}} = {{token2}} ✨",
      "noots align, prices align! {{emoji}}"
    ],
    emojis: ['🎯', '✨', '🤝', '🔮', '⚡️'],
    maxLength: 100,
    shouldAvoid: [
      'technical analysis',
      'price predictions',
      'financial advice',
      'complex explanations'
    ]
  },
  
  // Helper to generate appropriate market response
  generateMarketResponse(type: 'correlation' | 'movement' | 'milestone', context: any) {
    // Select template based on type and context
    // Keep responses fun and community-focused
    // Avoid technical/serious language
  }
}; 