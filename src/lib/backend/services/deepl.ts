/**
 * DeepL Service Client
 * For translating non-English content
 */

import { getServiceConfig } from '../config';
import type { TranslateTextsInput, TranslateTextsOutput } from '../types';

export class DeepLClient {
  private config = getServiceConfig().deepl;

  async translateTexts(input: TranslateTextsInput): Promise<TranslateTextsOutput> {
    const { texts, target_lang } = input;

    // Filter out texts that are already in target language
    const textsToTranslate = texts.filter(
      (t) => t.lang.toLowerCase() !== target_lang.toLowerCase()
    );

    if (textsToTranslate.length === 0) {
      return {
        translations: texts.map((t) => ({
          id: t.id,
          translated: t.text,
        })),
      };
    }

    const response = await fetch(`${this.config.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: textsToTranslate.map((t) => t.text),
        target_lang: target_lang.toUpperCase(),
        source_lang: textsToTranslate[0]?.lang?.toUpperCase(), // Optional
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map back to original order
    const translationMap = new Map<string, string>();
    
    textsToTranslate.forEach((t, idx) => {
      translationMap.set(t.id, data.translations[idx]?.text || t.text);
    });

    // Keep originals for already-translated texts
    texts.forEach((t) => {
      if (!translationMap.has(t.id)) {
        translationMap.set(t.id, t.text);
      }
    });

    return {
      translations: texts.map((t) => ({
        id: t.id,
        translated: translationMap.get(t.id) || t.text,
      })),
    };
  }

  async detectLanguage(text: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/detect`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      return 'en'; // Default to English on error
    }

    const data = await response.json();
    return data.detections?.[0]?.language?.toLowerCase() || 'en';
  }
}

let deeplClient: DeepLClient | null = null;

export function getDeepLClient(): DeepLClient {
  if (!deeplClient) {
    deeplClient = new DeepLClient();
  }
  return deeplClient;
}
