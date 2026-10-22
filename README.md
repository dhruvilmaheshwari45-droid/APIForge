# APIForge — Professional API Development, Mocking & Testing Platform

APIForge is a full-featured, enterprise-grade API development and testing studio built on the **MERN** stack (MongoDB, Express.js, React 18, Node.js) with Tailwind CSS, Recharts, and Socket.io.

---

## 🚀 Key Modules & Capabilities

1. **Authentication & Access Control**
   - User registration and JWT-based authentication.
   - Bearer token authorization interceptor on all API requests.
   - Profile verification via `/api/auth/me`.
   - 1-click Quick Demo Account login (`alex@apiforge.dev` / `Password123!`).

2. **Dashboard & Platform Telemetry**
   - Key operational metrics: Total Collections, Endpoints, Test Runs, Traffic requests, and P95 Latency.
   - Interactive charts: Request volume trends and HTTP status distribution.
   - Recent API traffic feed and quick-launch modal workflows.

3. **API Collection & Endpoint Management**
   - Hierarchical collection organization with category tags and request counts.
   - Full CRUD on API endpoints across standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`).
   - Query parameters, custom request headers, and authentication configuration.

4. **Interactive Request Builder & Execution Service**
   - Request dispatching with customizable timeout and abort signal support.
   - Dual execution model: direct browser dispatch or server-side CORS execution proxy (`/api/apis/execute`).
   - Detailed response viewer: status code badges, millisecond duration, byte payload size, formatted JSON preview, response headers, and request timeline.
   - Local and persistent execution history.

5. **Virtual Mock Servers & Dynamic Response Rules**
   - Virtual mock servers with simulated ports, latency, and operational status (`active` / `paused`).
   - Rule builder supporting conditional response logic (`AND` / `OR` logic).
   - Match criteria on HTTP method, path, query params, headers, bearer token presence, and body fields.
   - Custom HTTP status codes, delays, and simulated mock payloads.

6. **Environment & Variable Scoping**
   - Pre-configured `Development`, `Staging`, and `Production` environments plus custom environments.
   - Dynamic template variable resolution (`{{BASE_URL}}`, `{{API_KEY}}`, `{{TOKEN}}`).
   - Variable encryption & masking toggles for sensitive credentials.
   - Environment duplication, key validation, and duplicate key detection.

7. **Automated Test Suites & Assertion Engine**
   - Test suites with configurable schedules and pass-rate tracking.
   - Structured assertion builder without arbitrary `eval` execution:
     - `status_code_equals`
     - `response_contains_text`
     - `json_field_equals`
     - `response_time_below`
     - `header_exists`
     - `json_field_exists`
   - Sequential execution runner with progress indicators and full audit logs persisted to MongoDB (`TestRun`).

8. **API Traffic Monitoring & Real-Time Telemetry**
   - Telemetry table with multi-dimensional filtering (method, status code group, environment, time range).
   - Live WebSocket connection (`socket.io-client` ➔ `/socket.io`) streaming new requests (`traffic:new`).
   - Detailed request/response inspection drawer with sensitive token masking.

9. **Performance Analytics & Benchmarks**
   - Dynamic SLA percentile computations: Average Response Time, P95, P99, Requests per Minute (RPM), and Error Rate.
   - Responsive Recharts visualizations:
     1. Latency over time
     2. Throughput (RPM) over time
     3. Error rate curve
     4. HTTP status distribution
     5. Per-endpoint benchmark rankings

10. **API Versioning & Matrix Comparison**
    - Semantic version management (`v1`, `v2`, `v3`) with lifecycle states (`Draft`, `Active`, `Deprecated`, `Archived`).
    - Unified matrix diff comparison table across versions with visual indicators for added, modified, and deprecated endpoints.
    - Version changelog audit trail.

---

## 🛠️ Project Structure

```
apiforge/
├── backend/                  # Express.js REST API & MongoDB Database
│   ├── config/               # Database connector (with in-memory fallback) & seeder
│   ├── controllers/          # Controllers for all 10 platform modules
│   ├── middleware/           # JWT auth and centralized error handler
│   ├── models/               # 12 Mongoose models
│   ├── routes/               # 12 REST route definitions
│   ├── services/             # Mock rule evaluator & automated test runner
│   ├── utils/                # JWT helpers and logger
│   ├── server.js             # Express bootstrap + Socket.io server
│   ├── package.json
│   ├── .env.example
│   └── test_all.cjs          # Automated 29-point E2E verification suite
│
├── frontend/                 # React 18 + Vite SPA
│   ├── public/               # Static assets & SVG favicon
│   ├── src/
│   │   ├── components/       # Layout, common UI, modals, drawers, charts
│   │   ├── context/          # AppContext and ToastContext
│   │   ├── data/             # Seed data and baseline datasets
│   │   ├── pages/            # 14 platform pages (Dashboard, APIs, Mocks, Tests, etc.)
│   │   ├── services/         # Dual-sync client services (Axios + localStorage cache)
│   │   ├── utils/            # Variable resolver, formatters, assertion evaluators
│   │   ├── App.jsx           # Declarative React Router setup with friendly aliases
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js        # Reverse proxy (/api and /socket.io -> port 5000)
│   └── package.json
│
├── .gitignore                # Root gitignore
└── README.md                 # Complete documentation
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP port | `5000` |
| `MONGODB_URI` | MongoDB connection string (auto-fallbacks to in-memory if offline) | `mongodb://localhost:27017/apiforge` |
| `JWT_SECRET` | Secret key used to sign JWT session tokens | Strong random string (min 32 chars) |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `CLIENT_URL` | Allowed origin for CORS | `http://localhost:3000` |
| `NODE_ENV` | Runtime environment mode | `development` / `production` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL (proxied by default via Vite) | `/api` |
| `VITE_SOCKET_URL` | Socket.io server URL | `http://localhost:5000` |

---

## 🏃 Running the Application

### 1. Start the Backend Server

```bash
cd backend
npm install
npm run dev
# or: node server.js
```
*The backend runs on `http://localhost:5000`.*
*If a local MongoDB instance is not detected, it automatically launches an in-memory MongoDB database and seeds initial demo data.*

### 2. Start the Frontend Application

```bash
cd frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:3000` and automatically proxies `/api` and `/socket.io` calls to port 5000.*

---

## 🧪 Automated Testing & Verification

Run the end-to-end automated verification script:

```bash
cd backend
node test_all.cjs
```

All 29 critical test cases across all modules will execute and report pass/fail results.

---

## 🚢 Production Deployment Recommendations

1. **Database**: Use a managed MongoDB Atlas cluster with TLS enabled. Update `MONGODB_URI` in `backend/.env`.
2. **Reverse Proxy / Ingress**: Run Nginx or Caddy in front of the application:
   - Route `/api/*` and `/socket.io/*` to Node.js backend (`localhost:5000`).
   - Serve static frontend files from `frontend/dist/`.
3. **Process Management**: Use `pm2` or Docker containers for zero-downtime restarts:
   ```bash
   pm2 start backend/server.js --name "apiforge-api"
   ```
4. **Build Optimization**: Run `npm run build` in `frontend/` to generate production assets in `frontend/dist/`.
5. **Security**:
   - Ensure `JWT_SECRET` is set to an unpredictable, high-entropy 256-bit key.
   - Configure HTTP Strict Transport Security (HSTS) and CSP headers.
