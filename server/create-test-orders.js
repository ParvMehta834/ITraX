const axios = require('axios');

// JWT token for admin (you can modify this to match your actual admin token)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsIm5hbWUiOiJBZG1pbiBVc2VyIiwicm9sZSI6ImFkbWluIn0.4-5lS0jNZzX8l_vAzL_9mXYPJXpd_dH8YZzT8vKzLko';

const API_BASE_URL = 'http://localhost:4000/api/orders';

const orders = [
  {
    orderId: 'ORD-2024-001',
    assetName: 'MacBook Pro 16" M3',
    quantity: 5,
    supplier: 'Apple Business',
    orderDate: new Date('2024-01-15'),
    estimatedDelivery: new Date('2024-02-15'),
    currentLocation: 'In Transit',
    status: 'InTransit'
  },
  {
    orderId: 'ORD-2024-002',
    assetName: 'Dell UltraSharp 4K Monitor',
    quantity: 10,
    supplier: 'Dell Computers',
    orderDate: new Date('2024-01-20'),
    estimatedDelivery: new Date('2024-02-10'),
    currentLocation: 'Office Reception',
    status: 'Delivered'
  },
  {
    orderId: 'ORD-2024-003',
    assetName: 'Wireless Keyboard & Mouse Set',
    quantity: 20,
    supplier: 'Logitech',
    orderDate: new Date('2024-02-01'),
    estimatedDelivery: new Date('2024-02-20'),
    currentLocation: 'Distribution Center',
    status: 'Processing'
  },
  {
    orderId: 'ORD-2024-004',
    assetName: 'USB-C Docking Station',
    quantity: 8,
    supplier: 'Anker',
    orderDate: new Date('2024-02-03'),
    estimatedDelivery: new Date('2024-02-25'),
    currentLocation: 'Warehouse',
    status: 'Ordered'
  },
  {
    orderId: 'ORD-2024-005',
    assetName: 'HP LaserJet Pro Printer',
    quantity: 3,
    supplier: 'HP Inc',
    orderDate: new Date('2024-01-25'),
    estimatedDelivery: new Date('2024-02-18'),
    currentLocation: 'Out for Delivery',
    status: 'OutForDelivery'
  }
];

const createOrders = async () => {
  console.log('Creating test orders...\n');
  
  for (const order of orders) {
    try {
      const response = await axios.post(API_BASE_URL, order, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Created: ${order.orderId}`);
    } catch (error) {
      console.log(`❌ Failed: ${order.orderId}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }
  }
  
  console.log('\n✓ Done!');
};

createOrders();
