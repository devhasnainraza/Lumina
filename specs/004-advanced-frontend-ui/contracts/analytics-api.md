# Analytics API Contract

**Base URL**: `${NEXT_PUBLIC_API_URL}/api/analytics`  
**Version**: 1.0  
**Authentication**: Required (JWT Bearer token)

---

## GET /api/analytics/dashboard

Get comprehensive usage statistics and analytics for the authenticated user.

### Request

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```typescript
{
  period?: "7d" | "30d";   // Time period (default "7d")
}
```

**Example**:
```
GET /api/analytics/dashboard?period=30d
```

### Response

**Success (200 OK)**:
```typescript
{
  stats: {
    queryCount: number;      // Total queries sent
    documentCount: number;   // Total documents uploaded
    sessionCount: number;    // Total chat sessions
    tokenUsage?: number;     // Optional token usage
  };
  activityTimeline: Array<{
    date: string;            // ISO 8601 date (YYYY-MM-DD)
    count: number;           // Query count for that date
  }>;
  documentTypes: {
    pdf: number;
    docx: number;
    txt: number;
  };
  storageUsed: number;       // Bytes
  storageLimit?: number;     // Optional bytes limit
}
```

**Example**:
```json
{
  "stats": {
    "queryCount": 127,
    "documentCount": 15,
    "sessionCount": 8,
    "tokenUsage": 45000
  },
  "activityTimeline": [
    { "date": "2026-05-06", "count": 12 },
    { "date": "2026-05-07", "count": 18 },
    { "date": "2026-05-08", "count": 15 },
    { "date": "2026-05-09", "count": 22 },
    { "date": "2026-05-10", "count": 19 },
    { "date": "2026-05-11", "count": 24 },
    { "date": "2026-05-12", "count": 17 }
  ],
  "documentTypes": {
    "pdf": 10,
    "docx": 3,
    "txt": 2
  },
  "storageUsed": 52428800,
  "storageLimit": 1073741824
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token

---

## Frontend Integration

### Analytics Dashboard Hook

```typescript
// hooks/useAnalytics.ts
export function useAnalytics(period: '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const response = await apiClient.get('/api/analytics/dashboard', {
        params: { period },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Usage Example

```typescript
// app/(dashboard)/analytics/page.tsx
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const { data, isLoading } = useAnalytics(period);

  if (isLoading) return <AnalyticsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Queries"
          value={data.stats.queryCount}
          icon={MessageSquare}
        />
        <StatsCard
          title="Documents"
          value={data.stats.documentCount}
          icon={FileText}
        />
        <StatsCard
          title="Chat Sessions"
          value={data.stats.sessionCount}
          icon={MessagesSquare}
        />
        <StatsCard
          title="Storage Used"
          value={formatBytes(data.storageUsed)}
          icon={HardDrive}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityChart data={data.activityTimeline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentTypesChart data={data.documentTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Chart Components

### Activity Timeline Chart

```typescript
// components/analytics/ActivityChart.tsx
import { Line } from 'recharts';

export function ActivityChart({ data }: { data: ActivityDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(date) => new Date(date).toLocaleDateString()}
          formatter={(value) => [`${value} queries`, 'Count']}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#7C3AED"
          strokeWidth={2}
          dot={{ fill: '#7C3AED' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Document Types Chart

```typescript
// components/analytics/DocumentTypesChart.tsx
import { Pie } from 'recharts';

export function DocumentTypesChart({ data }: { data: DocumentTypeStats }) {
  const chartData = [
    { name: 'PDF', value: data.pdf, fill: '#7C3AED' },
    { name: 'DOCX', value: data.docx, fill: '#06B6D4' },
    { name: 'TXT', value: data.txt, fill: '#10B981' },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={80}
          dataKey="value"
        />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

---

## Utility Functions

### Format Bytes

```typescript
// lib/utils/format.ts
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
```

### Format Number

```typescript
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
```

---

## Notes

### Backend Implementation Status

The analytics endpoint may not be fully implemented in the current backend. If the endpoint returns 404, the frontend should:

1. Show a placeholder message: "Analytics coming soon"
2. Display mock data for development/demo purposes
3. Gracefully handle the missing endpoint without breaking the UI

### Mock Data for Development

```typescript
// lib/api/analytics.ts
const MOCK_ANALYTICS: AnalyticsDashboard = {
  stats: {
    queryCount: 127,
    documentCount: 15,
    sessionCount: 8,
  },
  activityTimeline: generateMockTimeline(7),
  documentTypes: { pdf: 10, docx: 3, txt: 2 },
  storageUsed: 52428800,
};

export const analyticsApi = {
  getDashboard: async (period: '7d' | '30d' = '7d') => {
    try {
      const response = await apiClient.get('/api/analytics/dashboard', {
        params: { period },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Endpoint not implemented, return mock data
        console.warn('Analytics endpoint not available, using mock data');
        return MOCK_ANALYTICS;
      }
      throw error;
    }
  },
};
```
