require('dotenv').config();
const connectDB = require('./src/config/db');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');
const Asset = require('./src/models/Asset');
const Category = require('./src/models/Category');
const Location = require('./src/models/Location');
const License = require('./src/models/License');

async function seedIYT(){
  await connectDB();
  // create categories and locations
  const laptopCat = await Category.findOneAndUpdate({ name: 'Laptop' }, { name: 'Laptop', description: 'Portable computers' }, { upsert: true, new: true });
  const routerCat = await Category.findOneAndUpdate({ name: 'Router' }, { name: 'Router', description: 'Network devices' }, { upsert: true, new: true });

  const hq = await Location.findOneAndUpdate({ name: 'IYT HQ' }, { name: 'IYT HQ', type: 'Office', address: '10 IYT Plaza', city: 'Metropolis', state: 'State' }, { upsert: true, new: true });

  // employees
  const pass = await bcrypt.hash('IytPass1!', 10);
  const u1 = await User.findOneAndUpdate({ email: 'ivan@iyt.local' }, { firstName: 'Ivan', lastName: 'Petrov', email: 'ivan@iyt.local', passwordHash: pass, role: 'EMPLOYEE' }, { upsert: true, new: true });
  const u2 = await User.findOneAndUpdate({ email: 'yana@iyt.local' }, { firstName: 'Yana', lastName: 'Kovacs', email: 'yana@iyt.local', passwordHash: pass, role: 'EMPLOYEE' }, { upsert: true, new: true });

  // assets
  await Asset.findOneAndUpdate({ assetId: 'IYT-LAP-001' }, { assetId: 'IYT-LAP-001', categoryId: laptopCat._id, manufacturer: 'HP', model: 'EliteBook 840', status: 'ASSIGNED', currentEmployeeId: u1._id, currentLocationId: hq._id, purchaseDate: new Date('2024-05-01') }, { upsert: true });
  await Asset.findOneAndUpdate({ assetId: 'IYT-RT-001' }, { assetId: 'IYT-RT-001', categoryId: routerCat._id, manufacturer: 'Ubiquiti', model: 'EdgeRouter X', status: 'AVAILABLE', currentLocationId: hq._id, purchaseDate: new Date('2023-11-10') }, { upsert: true });

  // license
  await License.findOneAndUpdate({ name: 'IYT Dev Tools' }, { name: 'IYT Dev Tools', seats: 5, renewalDate: new Date(Date.now()+1000*60*60*24*40), cost: 200 }, { upsert: true });

  console.log('IYT seed complete');
  process.exit(0);
}

seedIYT().catch(err=>{console.error(err); process.exit(1)});
