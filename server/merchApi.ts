// hoodie-api.ts - Simple merch API (expand with Stripe integration)
import axios from 'axios';
import { log } from './vite';

export interface MerchItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  category?: string;
}

/**
 * Get merchandise items, particularly hoodies
 * This is a placeholder implementation that will be expanded with Stripe integration
 * @returns Array of merchandise items
 */
export async function getMerchItems(): Promise<MerchItem[]> {
  try {
    // Placeholder URL - replace with actual merch API endpoint
    const apiUrl = process.env.MERCH_API_URL || 'https://api.merchempire.com/items';
    
    log(`Fetching merch items from ${apiUrl}`);
    const { data } = await axios.get<MerchItem[]>(apiUrl);
    
    // Filter for hoodies and related items
    const hoodieItems = data.filter(item => 
      item.name.toLowerCase().includes('hoodie') ||
      item.category?.toLowerCase() === 'apparel'
    );
    
    log(`Found ${hoodieItems.length} hoodie items`);
    return hoodieItems;
  } catch (error) {
    log(`Merch API error: ${error}`);
    console.error('Merch API error:', error);
    
    // Return sample items as fallback for development
    return [
      {
        id: 'hoodie-001',
        name: 'Milla-Rayne Empire Hoodie',
        price: 49.99,
        description: 'Premium quality hoodie with empire logo',
        category: 'apparel',
      },
      {
        id: 'hoodie-002',
        name: 'Milla-Rayne Tech Hoodie',
        price: 59.99,
        description: 'Tech-inspired design for developers',
        category: 'apparel',
      },
    ];
  }
}

/**
 * Get a specific merch item by ID
 * @param itemId - The item ID to fetch
 * @returns The merch item or null if not found
 */
export async function getMerchItem(itemId: string): Promise<MerchItem | null> {
  try {
    const items = await getMerchItems();
    return items.find(item => item.id === itemId) || null;
  } catch (error) {
    console.error('Error fetching merch item:', error);
    return null;
  }
}

/**
 * Initialize Stripe checkout session (placeholder for future implementation)
 * @param itemId - The item ID to purchase
 * @returns Checkout session URL
 */
export async function createCheckoutSession(itemId: string): Promise<string> {
  log(`Creating checkout session for item ${itemId}`);
  
  // TODO: Implement Stripe integration
  // This is a placeholder that returns a mock URL
  const item = await getMerchItem(itemId);
  
  if (!item) {
    throw new Error('Item not found');
  }
  
  // In production, this would create a Stripe checkout session
  // and return the session URL
  return `https://checkout.merchempire.com/session/${itemId}`;
}
