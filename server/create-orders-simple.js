#!/usr/bin/env node
const http = require('http');

const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsIm5hbWUiOiJBZG1pbiBVc2VyIiwicm9sZSI6ImFkbWluIn0.4-5lS0jNZzX8l_vAzL_9mXYPJXpd_dH8YZzT8vKzLko';

const orders = [
  {
    orderId: 'ORD-2024-001',
    assetName: 'MacBook Pro 16"',
    quantity: 5,
    supplier: 'Apple',
    estimatedDelivery: new Date('2024-02-15').toISOString().split('T')[0],
    currentLocation: 'In Transit',
    status: 'InTransit'
  },
  {
    orderId: 'ORD-2024-002',
    assetName: 'Dell Monitor',
    quantity: 10,
    supplier: 'Dell',
    estimatedDelivery: new Date('2024-02-10').toISOString().split('T')[0],
    currentLocation: 'Office',
    status: 'Delivered'
  },
  {
    orderId: 'ORD-2024-003',
    assetName: 'Keyboards',
    quantity: 20,
    supplier: 'Logitech',
    estimatedDelivery: new Date('2024-02-20').toISOString().split('T')[0],
    currentLocation: 'Distribution',
    status: 'Processing'
  }
];

let created = 0;

const makeRequest = (order, callback) => {
  const postData = JSON.stringify(order);
  
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log(`✓ Created: ${order.orderId}`);
        created++;
      } else {
        console.log(`✗ Failed: ${order.orderId} (${res.statusCode})`);
      }
      callback();
    });
  });

  req.on('error', (err) => {
    console.log(`✗ Error: ${order.orderId} - ${err.message}`);
    callback();
  });

  req.write(postData);
  req.end();
};

console.log('Creating test orders...\n');

let index = 0;
const createNext = () => {
  if (index < orders.length) {
    makeRequest(orders[index], () => {
      index++;
      createNext();
    });
  } else {
    console.log(`\n✓ Done! Created ${created}/${orders.length} orders`);
    process.exit(0);
  }
};

createNext();

setTimeout(() => {
  console.log('Timeout - exiting');
  process.exit(1);
}, 10000);
