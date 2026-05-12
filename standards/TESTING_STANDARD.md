# Testing Standard v1.0

**Standard ID:** STD-TEST-001
**Version:** 1.0
**Status:** Active
**Applies to:** All projects with code

---

## 1. Testing Pyramid

### 1.1 Layer Distribution

```
        ╱╲
       ╱  ╲        E2E Tests (10%)
      ╱    ╲       - Critical user flows
     ╱──────╲      - Full system integration
    ╱        ╲
   ╱──────────╲    Integration Tests (20%)
  ╱            ╲   - API endpoints
 ╱              ╲  - Database operations
╱────────────────╲ - External services

  Unit Tests (70%)
  - Pure functions
  - Components
  - Business logic
```

### 1.2 Coverage Requirements

| Layer | Minimum Coverage | Target Coverage |
|-------|------------------|-----------------|
| Unit | 80% | 90% |
| Integration | 60% | 75% |
| E2E | Critical paths | All user flows |

---

## 2. Unit Testing

### 2.1 What to Test

**[OK] DO Test:**
- Pure functions (deterministic output)
- Business logic and calculations
- Data transformations
- Component rendering (UI)
- State management
- Edge cases and boundary conditions

**[FAIL] DON'T Test:**
- Third-party libraries (they test themselves)
- Framework internals
- Trivial getters/setters
- Generated code

### 2.2 Test Structure (AAA Pattern)

```javascript
describe('calculateDiscount', () => {
  it('should apply 10% discount for premium users', () => {
    // Arrange
    const user = { tier: 'premium', orders: 15 };
    const price = 100;

    // Act
    const result = calculateDiscount(price, user);

    // Assert
    expect(result).toBe(90);
  });

  it('should return original price for non-premium users', () => {
    // Arrange
    const user = { tier: 'regular', orders: 5 };
    const price = 100;

    // Act
    const result = calculateDiscount(price, user);

    // Assert
    expect(result).toBe(100);
  });
});
```

### 2.3 Naming Convention

```
<unit>_<scenario>_<expectedResult>

Examples:
- calculateDiscount_premiumUser_applies10Percent
- validateEmail_emptyString_returnsFalse
- handleSubmit_validData_callsOnSuccess
- render_loadingState_showsSpinner
```

### 2.4 Mocking Guidelines

```javascript
// [OK] Good: Mock at boundaries
jest.mock('@/lib/api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: 'Test' })
}));

// [OK] Good: Use factory functions
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  ...overrides
});

// [FAIL] Bad: Over-mocking internals
jest.mock('./utils', () => ({
  // Testing implementation details
  helper: jest.fn().mockReturnValue('mocked')
}));
```

---

## 3. Integration Testing

### 3.1 API Testing

```typescript
// tests/integration/api/users.test.ts
import { createTestServer, createTestUser } from '@/test/helpers';

describe('POST /api/users', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    await server.db.clear();
  });

  it('should create user with valid data', async () => {
    const response = await server
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      email: 'test@example.com',
      name: 'Test'
    });
  });

  it('should reject duplicate email', async () => {
    await createTestUser({ email: 'existing@example.com' });

    const response = await server
      .post('/api/users')
      .send({ email: 'existing@example.com', name: 'Test' });

    expect(response.status).toBe(409);
  });
});
```

### 3.2 Database Testing

```typescript
// Use transactions for isolation
describe('UserRepository', () => {
  let tx: Transaction;

  beforeEach(async () => {
    tx = await db.beginTx();
  });

  afterEach(async () => {
    await tx.rollback();
  });

  it('should create and find user', async () => {
    const user = await tx.users.create({ email: 'test@example.com' });
    const found = await tx.users.findByEmail('test@example.com');

    expect(found).toEqual(user);
  });
});
```

### 3.3 External Services

```typescript
// Use contract testing for external APIs
describe('PaymentService', () => {
  it('should process payment', async () => {
    // Mock external service
    nock('https://api.stripe.com')
      .post('/v1/charges')
      .reply(200, { id: 'ch_123', status: 'succeeded' });

    const result = await paymentService.charge({
      amount: 1000,
      token: 'tok_test'
    });

    expect(result.status).toBe('succeeded');
  });
});
```

---

## 4. E2E Testing

### 4.1 Critical Flows (Must Test)

```
┌─────────────────────────────────────────┐
│           E2E Test Scenarios            │
├─────────────────────────────────────────┤
│ 1. User Registration → Login → Logout   │
│ 2. Product Browse → Cart → Checkout     │
│ 3. Search → Filter → Results            │
│ 4. Profile Update → Save → Verify       │
│ 5. Error States → Recovery              │
└─────────────────────────────────────────┘
```

### 4.2 Playwright Example

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page, 'user@test.com', 'password');
  });

  test('complete purchase flow', async ({ page }) => {
    // Add item to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('.cart-count')).toHaveText('1');

    // Go to checkout
    await page.click('[data-testid="checkout-btn"]');
    await expect(page).toHaveURL(/\/checkout/);

    // Fill payment
    await page.fill('[name="card-number"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');

    // Submit
    await page.click('[data-testid="place-order"]');

    // Verify success
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('.order-number')).toBeVisible();
  });

  test('shows error for declined card', async ({ page }) => {
    // ... test error handling
  });
});
```

### 4.3 E2E Best Practices

| Practice | Description |
|----------|-------------|
| Use data-testid | `data-testid="submit-btn"` for stable selectors |
| Wait for state | `await expect(locator).toBeVisible()` not `waitForTimeout` |
| Isolate tests | Each test should be independent |
| Clean state | Reset DB or use test fixtures |
| Parallel runs | Configure workers for speed |

---

## 5. Test Data Management

### 5.1 Factories

```typescript
// test/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export const userFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    createdAt: new Date(),
    ...overrides
  }),

  buildMany: (count: number, overrides = {}) =>
    Array.from({ length: count }, () => userFactory.build(overrides)),

  create: async (overrides = {}) => {
    const data = userFactory.build(overrides);
    return db.users.create(data);
  }
};
```

### 5.2 Fixtures

```typescript
// test/fixtures/index.ts
export const fixtures = {
  admin: () => userFactory.create({ role: 'admin' }),
  customer: () => userFactory.create({ role: 'customer' }),

  product: () => productFactory.create(),
  order: (user, products) => orderFactory.create({ userId: user.id, products }),

  // Complex setup
  completedOrder: async () => {
    const user = await fixtures.customer();
    const product = await fixtures.product();
    return fixtures.order(user, [product]);
  }
};
```

---

## 6. CI/CD Integration

### 6.1 Pipeline Stages

```yaml
# .github/workflows/test.yml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration
    needs: unit

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
    needs: integration
```

### 6.2 Quality Gates

| Gate | Requirement | Action |
|------|-------------|--------|
| Unit Coverage | ≥ 80% | Block merge |
| New Code Coverage | ≥ 90% | Block merge |
| E2E Critical Paths | 100% pass | Block merge |
| Performance Tests | No regression > 10% | Warning |

---

## 7. Snapshot Testing

### 7.1 When to Use

**[OK] Good for:**
- UI component rendering
- API response structure
- Generated output

**[FAIL] Bad for:**
- Dynamic data (timestamps, UUIDs)
- Large objects (maintenance burden)

### 7.2 Example

```typescript
// React component snapshot
expect(container).toMatchSnapshot();

// API response snapshot with dynamic fields
expect(response.body).toMatchInlineSnapshot({
  id: expect.any(String),
  createdAt: expect.any(String),
  // ... static fields
});
```

---

## 8. Performance Testing

### 8.1 Load Testing

```typescript
// tests/performance/api.load.test.ts
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up
    { duration: '1m', target: 20 },   // Steady
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

export default function () {
  const res = http.get('https://api.example.com/users');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 9. Test Quality Checklist

### Before Merging

- [ ] All existing tests pass
- [ ] New code has tests
- [ ] Coverage meets threshold
- [ ] No skipped tests without reason
- [ ] Mocks are at boundaries
- [ ] Tests are deterministic
- [ ] No hardcoded credentials
- [ ] E2E tests cover critical paths

### Code Review

- [ ] Tests are readable
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] No test interdependencies
- [ ] Descriptive test names

---

## 10. Testing Stack Recommendations

### Frontend

```
├── Vitest / Jest        # Unit tests
├── React Testing Library # Component tests
├── Playwright / Cypress  # E2E tests
├── MSW                   # API mocking
└── @faker-js/faker       # Test data
```

### Backend

```
├── Vitest / Jest        # Unit tests
├── Supertest            # API tests
├── Playwright           # E2E tests
├── Nock / MSW           # External API mocking
└── K6 / Artillery       # Load tests
```

---

## References

- Jest Documentation: https://jestjs.io/
- Vitest Documentation: https://vitest.dev/
- Playwright Documentation: https://playwright.dev/
- Testing Library: https://testing-library.com/
- K6 Documentation: https://k6.io/

---

*Standard STD-TEST-001 v1.0 — Part of agent-toolkit*
