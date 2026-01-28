/**
 * Hoodie/Merch API
 * Handles merchandise orders, inventory, and fulfillment
 * Integrated with payment processing and shipping APIs
 */

import { Router, Request, Response } from 'express';

const router = Router();

interface MerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  imageUrl: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  createdAt: number;
  updatedAt: number;
}

interface OrderItem {
  itemId: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
}

interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Mock inventory
const merchInventory: MerchItem[] = [
  {
    id: 'hoodie-001',
    name: 'Milla AI Hoodie - Classic Black',
    description: 'Premium quality hoodie with Milla AI logo',
    price: 49.99,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Navy', 'Gray'],
    inStock: true,
    imageUrl: '/images/merch/hoodie-black.jpg',
  },
  {
    id: 'tshirt-001',
    name: 'Milla AI T-Shirt',
    description: 'Comfortable cotton t-shirt with AI-inspired design',
    price: 24.99,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Blue'],
    inStock: true,
    imageUrl: '/images/merch/tshirt.jpg',
  },
  {
    id: 'cap-001',
    name: 'Milla AI Cap',
    description: 'Adjustable cap with embroidered logo',
    price: 19.99,
    sizes: ['One Size'],
    colors: ['Black', 'White', 'Red'],
    inStock: true,
    imageUrl: '/images/merch/cap.jpg',
  },
];

// Mock orders storage
const orders: Map<string, Order> = new Map();

/**
 * GET /api/merch - Get all merchandise items
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { inStock } = req.query;

    let items = merchInventory;

    if (inStock === 'true') {
      items = items.filter(item => item.inStock);
    }

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error: any) {
    console.error('[MerchAPI] Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchandise items',
    });
  }
});

/**
 * GET /api/merch/:id - Get specific item
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = merchInventory.find(i => i.id === id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    res.json({
      success: true,
      item,
    });
  } catch (error: any) {
    console.error('[MerchAPI] Error fetching item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item',
    });
  }
});

/**
 * POST /api/merch/order - Create new order
 */
router.post('/order', async (req: Request, res: Response) => {
  try {
    const { userId, items, shippingAddress } = req.body;

    // Validate input
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data',
      });
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.street) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shipping address',
      });
    }

    // Calculate total
    let total = 0;
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const merchItem = merchInventory.find(m => m.id === item.itemId);
      
      if (!merchItem) {
        return res.status(400).json({
          success: false,
          error: `Item not found: ${item.itemId}`,
        });
      }

      if (!merchItem.inStock) {
        return res.status(400).json({
          success: false,
          error: `Item out of stock: ${merchItem.name}`,
        });
      }

      const itemTotal = merchItem.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        itemId: item.itemId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: merchItem.price,
      });
    }

    // Create order
    const orderId = generateOrderId();
    const order: Order = {
      id: orderId,
      userId,
      items: orderItems,
      total,
      status: 'pending',
      shippingAddress,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    orders.set(orderId, order);

    console.log(`[MerchAPI] Created order ${orderId} for user ${userId}, total: $${total.toFixed(2)}`);

    // In production, this would:
    // 1. Process payment
    // 2. Create shipping label
    // 3. Send confirmation email
    // 4. Update inventory

    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully',
    });
  } catch (error: any) {
    console.error('[MerchAPI] Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
});

/**
 * GET /api/merch/orders/:userId - Get user's orders
 */
router.get('/orders/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userOrders = Array.from(orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      orders: userOrders,
      count: userOrders.length,
    });
  } catch (error: any) {
    console.error('[MerchAPI] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
});

/**
 * GET /api/merch/order/:orderId - Get specific order
 */
router.get('/order/:orderId', (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('[MerchAPI] Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
    });
  }
});

/**
 * PATCH /api/merch/order/:orderId - Update order status
 */
router.patch('/order/:orderId', (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const { status } = req.body;

    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    order.status = status;
    order.updatedAt = Date.now();

    console.log(`[MerchAPI] Updated order ${orderId} status to ${status}`);

    res.json({
      success: true,
      order,
      message: 'Order status updated',
    });
  } catch (error: any) {
    console.error('[MerchAPI] Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order',
    });
  }
});

/**
 * Generate unique order ID
 */
function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export default router;
