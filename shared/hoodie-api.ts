import axios from 'axios';

export async function createMerchOrder(item: string) {
  try {
    const response = await axios.post(
      'https://api.printful.com/orders',
      {
        recipient: { name: 'User', address: '123 St' },
        items: [{ variant_id: 1234, quantity: 1, name: item }],
      },
      { headers: { Authorization: `Bearer ${process.env.PRINTFUL_KEY}` } }
    );
    return response.data;
  } catch (e) {
    console.error('Merch API failed:', e);
  }
}
