export interface MemeConfig {
  themes: string[];
  styles: string[];
  contrasts: string[];
  visualElements: {
    required: string[];
    optional: string[];
  };
}

export const memeConfig: MemeConfig = {
  themes: [
    'crypto',
    'everyday_life',
    'street culture',
    'memecoins',
    'bitcoin'
  ],
  styles: [
    'dank',
    'deep_fried',
    'weirdcorecore',
    '4chan',
  ],
  contrasts: [
    'formal_vs_casual',
    'cute_vs_serious',
    'traditional_vs_crypto',
    'expectation_vs_reality'
  ],
  visualElements: {
    required: ['film_grain', 'noise'],
    optional: ['photocollage', 'mixed_styles']
  }
}; 