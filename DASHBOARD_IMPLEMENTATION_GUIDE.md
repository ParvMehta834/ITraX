# ITraX Dashboard Implementation Guide

## Quick Start

### Prerequisites
- Node.js 14+
- MongoDB 4.4+
- React 18+
- Both backend and frontend servers running

### Installation

**Backend is already set up**. Models, routes, and middleware are in place.

**Frontend**: Install Recharts (if not already installed):
```bash
cd client
npm install recharts
```

### Testing the Dashboard

1. **Start Backend Server**:
```bash
cd server
node server.js
# Should output: Server running on port 4000
```

2. **Start Frontend Server**:
```bash
cd client
npm run dev
# Should output: http://localhost:5174
```

3. **Login as Admin**:
- Navigate to `http://localhost:5174/login`
- Use admin credentials
- System will verify orgId from user profile

4. **Access Dashboard**:
- Click "Dashboard" in the navigation menu
- Or navigate to: `http://localhost:5174/admin/dashboard`
- Real data will load from MongoDB aggregations

---

## Understanding the Architecture

### Data Flow: Dashboard

```
┌─────────────────────┐
│  DashboardPage.jsx  │ ← User sees this
└──────────┬──────────┘
           │ useEffect() on mount
           ↓
┌──────────────────────────┐
│ dashboardService.js       │ ← Axios calls
│ GET /api/dashboard/summary
└──────────┬───────────────┘
           │ HTTP with JWT
           ↓
┌────────────────────────────┐
│ server/routes/dashboard.js │ ← Express route
│ GET /api/dashboard/summary │
└──────────┬─────────────────┘
           │ orgScopingMiddleware
           │ authMiddleware
           ↓
┌─────────────────────────────────────┐
│ dashboardAggregations.js             │ ← MongoDB aggregations
│ - getAssetTotals(orgId)              │
│ - getAssetsByCategory(orgId)         │
│ - getLicenseStats(orgId)             │
│ ... (12 functions parallel)          │
└──────────┬──────────────────────────┘
           │ Promise.all() execution
           ↓
┌──────────────────────────┐
│ MongoDB Collections      │
│ - assets                 │
│ - categories             │
│ - licenses               │
│ - orders                 │
│ etc (all orgId-filtered) │
└──────────┬───────────────┘
           │ Aggregation results
           ↓
┌────────────────────────┐
│ Formatted JSON response│
└────────────┬───────────┘
             │ HTTP 200
             ↓
┌──────────────────────────┐
│ dashboardService.js      │ ← Response received
│ returns response.data    │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│ DashboardPage.jsx        │ ← State updated
│ setDashboardData(...)    │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│ Render:                  │
│ - StatCard components    │ ← Display metrics
│ - ChartCard + Recharts   │ ← Display charts
│ - ActivityList items     │ ← Display activities
└──────────────────────────┘
```

### Org Scoping Example

```javascript
// User logs in with orgId = "org-123"
// This is stored in JWT after login

// When accessing /api/dashboard/summary:

1. authMiddleware verifies JWT
2. Fetches User document → user.orgId = "org-123"
3. orgScopingMiddleware checks req.user.orgId exists
4. Sets req.orgId = "org-123"

5. All aggregations filter automatically:
   Asset.collection.aggregate([
     { $match: { orgId: "org-123", isDeleted: false } },  // ← Org filtered
     ...
   ])

6. Only "org-123" data returned in response
```

### Key Concepts

#### 1. Organization Isolation
```javascript
// Every single query includes orgId filter
// This ensures complete multi-tenant separation

Query: { orgId: req.user.orgId, status: 'Available' }
//      ↑ Required from orgScopingMiddleware
```

#### 2. Soft Deletes
```javascript
// Assets are never permanently deleted
const asset = await Asset.findByIdAndUpdate(id, { isDeleted: true });

// All queries automatically exclude soft-deleted items
const activeAssets = await Asset.find({ orgId, isDeleted: false });
```

#### 3. Computed Values (Not Stored)
```javascript
// Inventory.total is NEVER stored in database
// It's calculated on every read:
total = quantityOnHand × costPerItem

// This prevents data inconsistency
// When you update quantityOnHand, total updates automatically
```

#### 4. Aggregation Advantage
```javascript
// One aggregation pipeline does work of multiple queries:
$facet: {
  total: [{ $count: 'count' }],        // Query 1
  assigned: [{ $match: ... }, ...],    // Query 2
  available: [{ $match: ... }, ...],   // Query 3
}
// All 3 execute in single MongoDB scan = faster performance
```

---

## API Endpoints Reference

### 1. Dashboard Summary (Main Endpoint)
```
GET /api/dashboard/summary
Authorization: Bearer {token}

Response: {
  success: true,
  data: {
    totals: { ... },        // 8 key metrics
    charts: { ... },        // 5 chart datasets
    recentActivity: { ... } // 2 activity feeds
  }
}
```

### 2. Detailed Breakdowns
```
GET /api/dashboard/assets/by-status
GET /api/dashboard/assets/by-category
GET /api/dashboard/assets/by-location
GET /api/dashboard/licenses/expiring
```

---

## Components Overview

### StatCard
```javascript
<StatCard
  title="Total Assets"
  value={205}
  icon={Package}        // lucide-react icon
  color="blue"          // Color scheme
  trend={12}            // Optional: percentage change
  trendLabel="vs last month"
/>
```

### ChartCard
```javascript
<ChartCard
  title="Asset Status Distribution"
  loading={false}
  error={null}
  empty={data.length === 0}
>
  <ResponsiveContainer width="100%" height={300}>
    <PieChart data={assetsByStatus}>
      {/* Recharts configuration */}
    </PieChart>
  </ResponsiveContainer>
</ChartCard>
```

### ActivityList
```javascript
<ActivityList
  title="Recent Asset Assignments"
  activities={recentActivity.assetAssignments}
  type="assignments"  // or "orders"
  loading={false}
/>
```

---

## Common Tasks

### 1. Add a New Metric Card
```javascript
// In DashboardPage.jsx, add to StatCard grid:
<StatCard
  title="New Metric"
  value={dashboardData?.totals?.newMetric || 0}
  icon={SomeIcon}
  color="purple"
/>

// Update dashboardAggregations.js to compute it
// Update dashboard.js route to include it in response
```

### 2. Add a New Chart
```javascript
// 1. Create aggregation in dashboardAggregations.js:
const getNewChartData = async (orgId) => {
  return await SomeModel.collection.aggregate([
    { $match: { orgId } },
    // ... aggregation pipeline
  ]).toArray();
};

// 2. Call it in dashboard.js route:
const newChartData = await getNewChartData(orgId);

// 3. Add to response data.charts.newChart

// 4. Render in DashboardPage.jsx:
<ChartCard title="New Chart">
  <BarChart data={charts.newChart}>
    {/* Recharts config */}
  </BarChart>
</ChartCard>
```

### 3. Filter Dashboard by Status
```javascript
// 1. Add state in DashboardPage.jsx:
const [statusFilter, setStatusFilter] = useState('Available');

// 2. Modify fetchDashboard:
const response = await dashboardService.getSummary({
  status: statusFilter  // Pass as query param
});

// 3. Update dashboardService.js:
getSummary: async (params) => {
  const query = new URLSearchParams(params).toString();
  return axios.get(`${API_URL}/api/dashboard/summary?${query}`, ...);
};

// 4. Update backend route to use params:
router.get('/summary', async (req, res) => {
  const { status } = req.query;
  // Filter aggregations by status if provided
});
```

---

## Debugging

### 1. Dashboard Not Loading
```javascript
// Check 1: Admin token valid?
console.log('Token:', localStorage.getItem('itrax_token'));

// Check 2: OrgId in user?
console.log('User:', localStorage.getItem('itrax_user'));

// Check 3: Network tab
// Look for GET /api/dashboard/summary
// Check response status and error messages
```

### 2. Data Not Showing
```javascript
// Check 1: MongoDB has data matching orgId?
db.assets.find({ orgId: "your-org-id" }).count();

// Check 2: Indexes exist?
db.assets.getIndexes();

// Check 3: Aggregation pipeline correct?
// Test in MongoDB shell:
db.assets.aggregate([
  { $match: { orgId: ObjectId("...") } },
  { $count: 'total' }
])
```

### 3: Charts Rendering as Empty
```javascript
// Check 1: Data structure matches chart input?
console.log('Charts data:', dashboardData?.charts);

// Check 2: Array is not empty?
dashboardData?.charts?.assetsByStatus?.length > 0

// Check 3: Component props correct?
<BarChart data={chartData || []} />
```

---

## Performance Tips

### 1. Dashboard Loads Slow?
```javascript
// Aggregations might need indexes
// Add missing indexes:
db.assets.createIndex({ orgId: 1, status: 1 });
db.assets.createIndex({ orgId: 1, categoryId: 1 });
db.assets.createIndex({ orgId: 1, locationId: 1 });
```

### 2. Too Many Re-renders?
```javascript
// Use useCallback to memoize:
const fetchDashboard = useCallback(async () => {
  // ... fetch logic
}, []); // Empty deps = once on mount

// Use useMemo for expensive calculations:
const chartColors = useMemo(() => {
  return { ... };
}, []);
```

### 3. Network Requests Slow?
```javascript
// Consolidate endpoints (dashboard/summary does this)
// Don't make separate calls for each chart

// Add caching if needed:
const [cache, setCache] = useState({});
if (cache[query]) return cache[query];
```

---

## Extending the Dashboard

### Add Employee Distribution Chart
```javascript
// 1. Create aggregation in dashboardAggregations.js:
const getEmployeesByDepartment = async (orgId) => {
  return await Employee.collection.aggregate([
    { $match: { orgId } },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'department'
      }
    },
    { $unwind: { path: '$department' } },
    {
      $group: {
        _id: '$department.name',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
};

// 2. Call in dashboard route and add to response
// 3. Render in DashboardPage with BarChart
```

---

## Next Steps

1. **Test Dashboard** locally with admin account
2. **Add Real Data** via assets/inventory/licenses admin pages
3. **Verify Aggregations** are returning correct counts
4. **Customize Colors/Icons** to match brand
5. **Add Filters** (date range, status, department, etc.)
6. **Implement Caching** for frequently accessed data
7. **Add Exports** (PDF/CSV) for dashboard snapshots

---

## Support

For issues or questions:
1. Check ARCHITECTURE.md for detailed system design
2. Review MongoDB aggregation pipeline syntax
3. Check browser console for JavaScript errors
4. Check server logs for Node.js errors
5. Verify all models and routes are up to date

Good luck, and enjoy your new production-grade dashboard! 🎉
