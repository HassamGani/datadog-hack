/**
 * Freepik API Integration
 * For generating visual assets and chart annotations
 */

export interface FreepikAsset {
  id: string;
  url: string;
  type: 'icon' | 'illustration' | 'photo';
  tags: string[];
}

export class FreepikClient {
  private apiKey: string;
  private baseUrl = 'https://api.freepik.com/v1';

  constructor() {
    // Try to load from centralized api-keys.ts
    try {
      // @ts-ignore
      const { API_KEYS } = require('../../api-keys');
      this.apiKey = API_KEYS?.freepik?.apiKey || '';
    } catch {
      // Fallback to environment variable
      this.apiKey = process.env.FREEPIK_API_KEY || '';
    }
  }

  /**
   * Search for financial icons
   */
  async searchIcons(query: string, limit: number = 10): Promise<FreepikAsset[]> {
    if (!this.apiKey) {
      console.warn('Freepik API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/resources?term=${encodeURIComponent(query)}&filters[content_type]=icon&limit=${limit}`,
        {
          headers: {
            'X-Freepik-API-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Freepik API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.data.map((item: any) => ({
        id: item.id,
        url: item.image?.source?.url || item.url,
        type: 'icon' as const,
        tags: item.tags || [],
      }));
    } catch (error) {
      console.error('Freepik search error:', error);
      return [];
    }
  }

  /**
   * Get icon for market event type
   */
  async getEventIcon(eventType: string): Promise<string | null> {
    const iconMap: Record<string, string> = {
      earnings: 'chart-earnings',
      news: 'newspaper',
      filing: 'document',
      spike: 'arrow-up',
      drop: 'arrow-down',
      anomaly: 'alert',
      merger: 'handshake',
      dividend: 'coin',
    };

    const query = iconMap[eventType.toLowerCase()] || eventType;
    const icons = await this.searchIcons(query, 1);

    return icons.length > 0 ? icons[0].url : null;
  }

  /**
   * Generate annotation visuals for chart
   */
  async generateAnnotationVisuals(annotationType: string): Promise<{
    icon: string | null;
    color: string;
    shape: string;
  }> {
    const icon = await this.getEventIcon(annotationType);

    // Map annotation types to visual styles
    const styles: Record<string, { color: string; shape: string }> = {
      earnings: { color: '#4CAF50', shape: 'diamond' },
      news: { color: '#2196F3', shape: 'circle' },
      spike: { color: '#FF5722', shape: 'triangle-up' },
      drop: { color: '#F44336', shape: 'triangle-down' },
      filing: { color: '#9C27B0', shape: 'square' },
      default: { color: '#607D8B', shape: 'circle' },
    };

    const style = styles[annotationType.toLowerCase()] || styles.default;

    return {
      icon,
      color: style.color,
      shape: style.shape,
    };
  }

  /**
   * Get chart background assets
   */
  async getChartBackgrounds(theme: 'light' | 'dark' = 'dark'): Promise<FreepikAsset[]> {
    const query = `${theme} financial background`;
    return await this.searchIcons(query, 5);
  }
}

let freepikClient: FreepikClient | null = null;

export function getFreepikClient(): FreepikClient {
  if (!freepikClient) {
    freepikClient = new FreepikClient();
  }
  return freepikClient;
}
