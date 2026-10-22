import User from '../models/User.js';
import Collection from '../models/Collection.js';
import API from '../models/API.js';
import MockServer from '../models/MockServer.js';
import MockRule from '../models/MockRule.js';
import Environment from '../models/Environment.js';
import TestSuite from '../models/TestSuite.js';
import TestCase from '../models/TestCase.js';
import TestRun from '../models/TestRun.js';
import TrafficLog from '../models/TrafficLog.js';
import ApiVersion from '../models/ApiVersion.js';
import logger from '../utils/logger.js';

export const seedDatabase = async () => {
  try {
    // 1. Seed Demo User
    const userCount = await User.countDocuments();
    let defaultUser;
    if (userCount === 0) {
      defaultUser = await User.create({
        name: 'Alex Rivera',
        email: 'alex@apiforge.dev',
        password: 'Password123!',
        role: 'Lead Architect',
      });
      logger.info('Default demo user seeded: alex@apiforge.dev');
    } else {
      defaultUser = await User.findOne({ email: 'alex@apiforge.dev' });
    }

    // 2. Seed Collections
    const colCount = await Collection.countDocuments();
    if (colCount === 0) {
      await Collection.create([
        {
          customId: 'col-users',
          name: 'User Management & Auth API',
          description: 'Endpoints for registration, session tokens, user profile lookups, and account settings.',
          baseUrl: 'https://api.apiforge.dev/v1',
          category: 'Core Services',
          version: 'v2.1.0',
          status: 'active',
          endpointsCount: 3,
        },
        {
          customId: 'col-payments',
          name: 'Payment & Billing Gateway',
          description: 'Stripe and PayPal gateway webhooks, payment intents, subscriptions, and invoice generation.',
          baseUrl: 'https://api.apiforge.dev/v1/payments',
          category: 'Finance',
          version: 'v1.4.2',
          status: 'active',
          endpointsCount: 3,
        },
        {
          customId: 'col-catalog',
          name: 'Product Inventory & Catalog',
          description: 'E-commerce product listings, inventory queries, stock deductions, and warehouse sync.',
          baseUrl: 'https://api.apiforge.dev/v2/catalog',
          category: 'E-Commerce',
          version: 'v3.0.0-beta',
          status: 'beta',
          endpointsCount: 3,
        },
        {
          customId: 'col-notifications',
          name: 'Notifications & Dispatcher',
          description: 'Transactional email, SMS alert dispatchers, push notifications, and webhook receiver.',
          baseUrl: 'https://api.apiforge.dev/v1/notify',
          category: 'Utility',
          version: 'v1.0.0',
          status: 'active',
          endpointsCount: 1,
        },
      ]);
      logger.info('Default collections seeded.');
    }

    // 3. Seed Endpoints / APIs
    const apiCount = await API.countDocuments();
    if (apiCount === 0) {
      await API.create([
        {
          customId: 'ep-users-1',
          collectionId: 'col-users',
          name: 'Get Current Authenticated User',
          method: 'GET',
          path: '/users/me',
          description: 'Returns profile metadata and role permissions for the authenticated session.',
          headers: [
            { key: 'Authorization', value: 'Bearer {{token}}', enabled: true },
            { key: 'Accept', value: 'application/json', enabled: true },
          ],
          queryParams: [],
          requestBody: '',
          responseExample: {
            status: 200,
            body: {
              id: 'usr_84920',
              name: 'Alex Rivera',
              email: 'alex@apiforge.dev',
              role: 'Lead Architect',
            },
          },
        },
        {
          customId: 'ep-users-2',
          collectionId: 'col-users',
          name: 'Authenticate & Issue Token',
          method: 'POST',
          path: '/auth/login',
          description: 'Validates user credentials and issues a signed JWT Bearer token.',
          headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
          queryParams: [],
          requestBody: JSON.stringify({ email: 'alex@apiforge.dev', password: '••••••••••••' }, null, 2),
          responseExample: {
            status: 200,
            body: {
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              expiresIn: 3600,
            },
          },
        },
        {
          customId: 'ep-users-3',
          collectionId: 'col-users',
          name: 'Delete User Account',
          method: 'DELETE',
          path: '/users/:id',
          description: 'Permanently deletes user profile and invalidates active session tokens.',
          headers: [{ key: 'Authorization', value: 'Bearer {{token}}', enabled: true }],
          queryParams: [],
          requestBody: '',
          responseExample: { status: 204, body: null },
        },
        {
          customId: 'ep-payments-1',
          collectionId: 'col-payments',
          name: 'Create Payment Intent',
          method: 'POST',
          path: '/intents',
          description: 'Initializes a Stripe-compatible payment intent with currency and metadata.',
          headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
          queryParams: [],
          requestBody: JSON.stringify({ amount: 4900, currency: 'usd' }, null, 2),
          responseExample: { status: 201, body: { clientSecret: 'pi_3MtwBwLkdIwHu7ix28a3tqPa' } },
        },
        {
          customId: 'ep-catalog-1',
          collectionId: 'col-catalog',
          name: 'Search Product Catalog',
          method: 'GET',
          path: '/products',
          description: 'Fuzzy query product inventory with category and stock filters.',
          headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
          queryParams: [
            { key: 'q', value: 'wireless', enabled: true },
            { key: 'limit', value: '20', enabled: true },
          ],
          requestBody: '',
          responseExample: {
            status: 200,
            body: {
              total: 142,
              results: [{ id: 'prd_01', name: 'Pro Audio Headset', price: 199.99, stock: 45 }],
            },
          },
        },
      ]);
      logger.info('Default APIs/endpoints seeded.');
    }

    // 4. Seed Mock Servers
    const msCount = await MockServer.countDocuments();
    if (msCount === 0) {
      await MockServer.create([
        {
          customId: 'msrv-auth',
          name: 'Auth & Identity Virtual Server',
          description: 'Simulates JWT token generation, user profiles, session validation, and permission checks.',
          baseUrl: 'https://mock.apiforge.dev/v1/auth',
          status: 'active',
          environment: 'Development',
          port: 8081,
          defaultLatencyMs: 80,
          isSimulated: true,
          endpointsCount: 2,
        },
        {
          customId: 'msrv-payments',
          name: 'Stripe & Billing Gateway Mock',
          description: 'Virtual payment intents, subscriptions, webhooks, invoice status changes, and refund rules.',
          baseUrl: 'https://mock.apiforge.dev/v1/payments',
          status: 'active',
          environment: 'Staging',
          port: 8082,
          defaultLatencyMs: 150,
          isSimulated: true,
          endpointsCount: 1,
        },
        {
          customId: 'msrv-catalog',
          name: 'Product Inventory & Catalog Virtual API',
          description: 'E-commerce product lists, dynamic inventory deduction, and category navigation.',
          baseUrl: 'https://mock.apiforge.dev/v2/catalog',
          status: 'paused',
          environment: 'Development',
          port: 8083,
          defaultLatencyMs: 40,
          isSimulated: true,
          endpointsCount: 2,
        },
      ]);
      logger.info('Default mock servers seeded.');
    }

    // 5. Seed Mock Rules
    const mrCount = await MockRule.countDocuments();
    if (mrCount === 0) {
      await MockRule.create([
        {
          customId: 'mrule-auth-admin',
          serverId: 'msrv-auth',
          name: 'Elevated SuperAdmin Profile',
          description: 'Returns unrestricted system capabilities when query parameter role=admin',
          enabled: true,
          priority: 1,
          conditions: [
            { id: 'c1', type: 'method', operator: 'equals', field: '', value: 'GET', enabled: true },
            { id: 'c2', type: 'path', operator: 'equals', field: '', value: '/users/me', enabled: true },
            { id: 'c3', type: 'param', operator: 'equals', field: 'role', value: 'admin', enabled: true },
          ],
          response: {
            statusCode: 200,
            bodyType: 'json',
            body: JSON.stringify(
              {
                id: 'usr_root_001',
                name: 'Root Administrator',
                role: 'superadmin',
                permissions: ['*'],
              },
              null,
              2
            ),
            headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
            delayMs: 10,
          },
        },
        {
          customId: 'mrule-payments-declined',
          serverId: 'msrv-payments',
          name: 'Simulated Insufficient Funds 402',
          description: 'Returns HTTP 402 Payment Required when payment intent amount exceeds 9999',
          enabled: true,
          priority: 1,
          conditions: [
            { id: 'c1', type: 'method', operator: 'equals', field: '', value: 'POST', enabled: true },
            { id: 'c2', type: 'path', operator: 'equals', field: '', value: '/intents', enabled: true },
          ],
          response: {
            statusCode: 402,
            bodyType: 'json',
            body: JSON.stringify(
              {
                error: {
                  code: 'card_declined',
                  decline_code: 'insufficient_funds',
                  message: 'Your test card has insufficient funds.',
                },
              },
              null,
              2
            ),
            headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
            delayMs: 250,
          },
        },
      ]);
      logger.info('Default mock rules seeded.');
    }

    // 6. Seed Environments
    const envCount = await Environment.countDocuments();
    if (envCount === 0) {
      await Environment.create([
        {
          customId: 'env-dev',
          name: 'Development',
          description: 'Local and developer sandbox environment for rapid API testing and rapid iteration',
          baseUrl: 'https://api.apiforge.dev/v1',
          isDefault: true,
          isActive: true,
          color: 'emerald',
          variables: [
            {
              id: 'var-dev-1',
              key: 'BASE_URL',
              value: 'https://api.apiforge.dev/v1',
              isSecret: false,
              enabled: true,
              description: 'Developer sandbox base URL',
            },
            {
              id: 'var-dev-2',
              key: 'API_KEY',
              value: 'ak_dev_sample_9a8b7c6d5e4f3a2b',
              isSecret: true,
              enabled: true,
              description: 'Developer sandbox sample API key (masked)',
            },
            {
              id: 'var-dev-3',
              key: 'TOKEN',
              value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dev_mock_payload.sample_sig',
              isSecret: true,
              enabled: true,
              description: 'Mock development JWT bearer token',
            },
          ],
        },
        {
          customId: 'env-staging',
          name: 'Staging',
          description: 'Pre-production staging cluster mirroring production topology and mock services',
          baseUrl: 'https://staging.apiforge.dev/v1',
          isDefault: false,
          isActive: false,
          color: 'amber',
          variables: [
            {
              id: 'var-stg-1',
              key: 'BASE_URL',
              value: 'https://staging.apiforge.dev/v1',
              isSecret: false,
              enabled: true,
              description: 'Pre-production cluster base URL',
            },
            {
              id: 'var-stg-2',
              key: 'API_KEY',
              value: 'ak_stg_secure_88a99b11c22d33e4',
              isSecret: true,
              enabled: true,
              description: 'Staging integration API secret key',
            },
          ],
        },
        {
          customId: 'env-prod',
          name: 'Production',
          description: 'Live production API cluster serving public clients and customer webhooks',
          baseUrl: 'https://api.production.apiforge.com/v1',
          isDefault: false,
          isActive: false,
          color: 'rose',
          variables: [
            {
              id: 'var-prd-1',
              key: 'BASE_URL',
              value: 'https://api.production.apiforge.com/v1',
              isSecret: false,
              enabled: true,
              description: 'Global production gateway URL',
            },
          ],
        },
      ]);
      logger.info('Default environments seeded.');
    }

    // 7. Seed Test Suites & Cases
    const suiteCount = await TestSuite.countDocuments();
    if (suiteCount === 0) {
      await TestSuite.create([
        {
          customId: 'suite-auth',
          name: 'Identity & Authentication Suite',
          description: 'Validates JWT token issuance, session refresh, and unauthenticated route rejection',
          environmentId: 'env-dev',
          schedule: 'Nightly',
          lastRunAt: new Date(Date.now() - 3600000),
          lastStatus: 'passed',
          passRate: 100,
        },
        {
          customId: 'suite-catalog',
          name: 'E-Commerce Catalog Regression',
          description: 'Tests product pagination, category filtering, search relevancy, and inventory patch',
          environmentId: 'env-staging',
          schedule: 'On Deploy',
          lastRunAt: new Date(Date.now() - 7200000),
          lastStatus: 'passed',
          passRate: 100,
        },
      ]);

      await TestCase.create([
        {
          customId: 'tc-auth-1',
          suiteId: 'suite-auth',
          name: 'Admin Authentication Token Exchange',
          description: 'Sends credentials payload and verifies bearer JWT returned with 200/201 status',
          method: 'POST',
          url: 'https://jsonplaceholder.typicode.com/posts',
          headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
          params: [],
          auth: { type: 'noauth' },
          bodyType: 'json',
          jsonBody: JSON.stringify({ email: 'alex@apiforge.dev', password: 'samplePassword' }, null, 2),
          enabled: true,
          order: 1,
          assertions: [
            { id: 'asrt-1-1', type: 'status_code_equals', target: '', value: '201', description: 'Returns 201 Created', enabled: true },
            { id: 'asrt-1-2', type: 'response_time_below', target: '', value: '2500', description: 'Response completes within SLA', enabled: true },
            { id: 'asrt-1-3', type: 'json_field_exists', target: 'id', value: '', description: 'Response contains generated ID', enabled: true },
          ],
        },
        {
          customId: 'tc-auth-2',
          suiteId: 'suite-auth',
          name: 'Retrieve Current User Profile',
          description: 'Queries user details and asserts schema contract',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users/1',
          headers: [{ id: 'h2', key: 'Accept', value: 'application/json', enabled: true }],
          params: [],
          auth: { type: 'noauth' },
          bodyType: 'none',
          enabled: true,
          order: 2,
          assertions: [
            { id: 'asrt-2-1', type: 'status_code_equals', target: '', value: '200', description: 'Status code equals 200 OK', enabled: true },
            { id: 'asrt-2-2', type: 'response_contains_text', target: '', value: 'name', description: 'Response body contains name', enabled: true },
          ],
        },
      ]);
      logger.info('Default test suites and test cases seeded.');
    }

    // 8. Seed API Versions
    const verCount = await ApiVersion.countDocuments();
    if (verCount === 0) {
      await ApiVersion.create([
        {
          customId: 'ver-v1',
          versionNumber: 'v1',
          status: 'Deprecated',
          description: 'Initial legacy release providing monolithic user and catalog routes.',
          releaseNotes: 'Supported basic HTTP REST endpoints before microservice decomposition.',
          changes: [
            {
              id: 'ch-1',
              type: 'added',
              title: 'Initial Endpoints Deployed',
              description: 'Created basic /users and /catalog paths',
              timestamp: new Date('2026-06-10T12:00:00Z'),
              author: 'Alex Rivera',
            },
          ],
          endpoints: [
            { endpoint: '/users', method: 'GET', description: 'List all users', supportedIn: ['v1', 'v2', 'v3'] },
            { endpoint: '/users', method: 'POST', description: 'Create user', supportedIn: ['v1', 'v2', 'v3'] },
            { endpoint: '/auth/login', method: 'POST', description: 'Authenticate user', supportedIn: ['v1', 'v2', 'v3'] },
          ],
        },
        {
          customId: 'ver-v2',
          versionNumber: 'v2',
          status: 'Active',
          description: 'Current production release with standardized JSON envelopes and OAuth2.',
          releaseNotes: 'Introduces structured schemas, dynamic mock engine, and test suites.',
          changes: [
            {
              id: 'ch-2',
              type: 'added',
              title: 'OAuth2 Authentication',
              description: 'Replaced legacy session tokens with signed JWT tokens',
              timestamp: new Date('2026-08-15T09:30:00Z'),
              author: 'Alex Rivera',
            },
          ],
          endpoints: [
            { endpoint: '/users', method: 'GET', description: 'List all users', supportedIn: ['v1', 'v2', 'v3'] },
            { endpoint: '/users/me', method: 'GET', description: 'Authenticated profile', supportedIn: ['v2', 'v3'] },
            { endpoint: '/auth/login', method: 'POST', description: 'Authenticate user', supportedIn: ['v1', 'v2', 'v3'] },
            { endpoint: '/products', method: 'GET', description: 'Catalog listings', supportedIn: ['v2', 'v3'] },
          ],
        },
        {
          customId: 'ver-v3',
          versionNumber: 'v3',
          status: 'Draft',
          description: 'Next generation preview featuring GraphQL gateways and WebSocket subscriptions.',
          releaseNotes: 'Work in progress preview for real-time telemetry streaming.',
          changes: [
            {
              id: 'ch-3',
              type: 'added',
              title: 'WebSocket Realtime Subscriptions',
              description: 'Added socket endpoints for continuous telemetry streaming',
              timestamp: new Date('2026-10-01T15:00:00Z'),
              author: 'Alex Rivera',
            },
          ],
          endpoints: [
            { endpoint: '/users', method: 'GET', description: 'List all users', supportedIn: ['v1', 'v2', 'v3'] },
            { endpoint: '/users/me', method: 'GET', description: 'Authenticated profile', supportedIn: ['v2', 'v3'] },
            { endpoint: '/products', method: 'GET', description: 'Catalog listings', supportedIn: ['v2', 'v3'] },
            { endpoint: '/telemetry/stream', method: 'GET', description: 'WebSocket stream', supportedIn: ['v3'] },
          ],
        },
      ]);
      logger.info('Default API versions seeded.');
    }

    // 9. Seed Traffic Logs
    const trafCount = await TrafficLog.countDocuments();
    if (trafCount === 0) {
      const sampleLogs = [
        {
          requestId: 'req_live_101',
          method: 'GET',
          url: 'https://api.apiforge.dev/v1/users/me',
          endpoint: '/users/me',
          statusCode: 200,
          statusText: 'OK',
          durationMs: 84,
          responseSize: 1024,
          environment: 'Development',
          timestamp: new Date(Date.now() - 120000),
        },
        {
          requestId: 'req_live_102',
          method: 'POST',
          url: 'https://api.apiforge.dev/v1/auth/login',
          endpoint: '/auth/login',
          statusCode: 200,
          statusText: 'OK',
          durationMs: 142,
          responseSize: 512,
          environment: 'Development',
          timestamp: new Date(Date.now() - 90000),
        },
        {
          requestId: 'req_live_103',
          method: 'GET',
          url: 'https://api.apiforge.dev/v2/catalog/products',
          endpoint: '/products',
          statusCode: 200,
          statusText: 'OK',
          durationMs: 110,
          responseSize: 4096,
          environment: 'Staging',
          timestamp: new Date(Date.now() - 60000),
        },
        {
          requestId: 'req_live_104',
          method: 'POST',
          url: 'https://api.apiforge.dev/v1/payments/intents',
          endpoint: '/intents',
          statusCode: 402,
          statusText: 'Payment Required',
          durationMs: 310,
          responseSize: 256,
          environment: 'Staging',
          error: 'Insufficient funds on card',
          timestamp: new Date(Date.now() - 30000),
        },
        {
          requestId: 'req_live_105',
          method: 'GET',
          url: 'https://api.apiforge.dev/v1/unknown-route',
          endpoint: '/unknown-route',
          statusCode: 404,
          statusText: 'Not Found',
          durationMs: 45,
          responseSize: 128,
          environment: 'Development',
          error: 'Endpoint route not found',
          timestamp: new Date(Date.now() - 10000),
        },
      ];
      await TrafficLog.create(sampleLogs);
      logger.info('Sample traffic logs seeded.');
    }
  } catch (err) {
    logger.error('Error seeding database:', err);
  }
};

export default seedDatabase;
