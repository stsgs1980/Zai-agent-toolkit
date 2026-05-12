# Стандарт тестирования v1.0

**ID стандарта:** STD-TEST-001
**Версия:** 1.0
**Статус:** Активен
**Применяется к:** Всем проектам с кодом

---

## 1. Пирамида тестирования

### 1.1 Распределение по слоям

```
        ╱╲
       ╱  ╲        E2E тесты (10%)
      ╱    ╲       - Критичные пользовательские сценарии
     ╱──────╲      - Полная интеграция системы
    ╱        ╲
   ╱──────────╲    Интеграционные тесты (20%)
  ╱            ╲   - API эндпоинты
 ╱              ╲  - Операции с базой данных
╱────────────────╲ - Внешние сервисы

  Юнит-тесты (70%)
  - Чистые функции
  - Компоненты
  - Бизнес-логика
```

### 1.2 Требования к покрытию

| Слой | Минимальное покрытие | Целевое покрытие |
|------|---------------------|------------------|
| Юнит | 80% | 90% |
| Интеграция | 60% | 75% |
| E2E | Критичные пути | Все пользовательские сценарии |

---

## 2. Юнит-тестирование

### 2.1 Что тестировать

**[OK] ТЕСТИРУЙТЕ:**
- Чистые функции (детерминированный вывод)
- Бизнес-логику и вычисления
- Преобразования данных
- Рендеринг компонентов (UI)
- Управление состоянием
- Граничные случаи и пограничные условия

**[FAIL] НЕ ТЕСТИРУЙТЕ:**
- Сторонние библиотеки (они тестируют себя сами)
- Внутренности фреймворка
- Тривиальные геттеры/сеттеры
- Сгенерированный код

### 2.2 Структура теста (Паттерн AAA)

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

### 2.3 Соглашение об именовании

```
<unit>_<scenario>_<expectedResult>

Примеры:
- calculateDiscount_premiumUser_applies10Percent
- validateEmail_emptyString_returnsFalse
- handleSubmit_validData_callsOnSuccess
- render_loadingState_showsSpinner
```

### 2.4 Руководство по мокам

```javascript
// [OK] Хорошо: Мок на границах
jest.mock('@/lib/api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: 'Test' })
}));

// [OK] Хорошо: Используйте фабричные функции
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  ...overrides
});

// [FAIL] Плохо: Чрезмерный мокинг внутренностей
jest.mock('./utils', () => ({
  // Тестирование деталей реализации
  helper: jest.fn().mockReturnValue('mocked')
}));
```

---

## 3. Интеграционное тестирование

### 3.1 Тестирование API

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

### 3.2 Тестирование базы данных

```typescript
// Используйте транзакции для изоляции
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

### 3.3 Внешние сервисы

```typescript
// Используйте контрактное тестирование для внешних API
describe('PaymentService', () => {
  it('should process payment', async () => {
    // Мок внешнего сервиса
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

## 4. E2E тестирование

### 4.1 Критичные сценарии (Обязательно тестировать)

```
┌─────────────────────────────────────────┐
│         E2E тестовые сценарии           │
├─────────────────────────────────────────┤
│ 1. Регистрация → Логин → Логаут         │
│ 2. Просмотр товаров → Корзина → Чекаут  │
│ 3. Поиск → Фильтрация → Результаты      │
│ 4. Обновление профиля → Сохранение      │
│ 5. Состояния ошибок → Восстановление    │
└─────────────────────────────────────────┘
```

### 4.2 Пример на Playwright

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page, 'user@test.com', 'password');
  });

  test('complete purchase flow', async ({ page }) => {
    // Добавить товар в корзину
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('.cart-count')).toHaveText('1');

    // Перейти к чекауту
    await page.click('[data-testid="checkout-btn"]');
    await expect(page).toHaveURL(/\/checkout/);

    // Заполнить платёжные данные
    await page.fill('[name="card-number"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');

    // Отправить
    await page.click('[data-testid="place-order"]');

    // Проверить успех
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('.order-number')).toBeVisible();
  });

  test('shows error for declined card', async ({ page }) => {
    // ... тест обработки ошибок
  });
});
```

### 4.3 Best Practices E2E

| Практика | Описание |
|----------|----------|
| Используйте data-testid | `data-testid="submit-btn"` для стабильных селекторов |
| Ждите состояния | `await expect(locator).toBeVisible()` не `waitForTimeout` |
| Изолируйте тесты | Каждый тест должен быть независимым |
| Очищайте состояние | Сброс БД или использование тестовых фикстур |
| Параллельный запуск | Настройте workers для скорости |

---

## 5. Управление тестовыми данными

### 5.1 Фабрики

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

### 5.2 Фикстуры

```typescript
// test/fixtures/index.ts
export const fixtures = {
  admin: () => userFactory.create({ role: 'admin' }),
  customer: () => userFactory.create({ role: 'customer' }),

  product: () => productFactory.create(),
  order: (user, products) => orderFactory.create({ userId: user.id, products }),

  // Сложная установка
  completedOrder: async () => {
    const user = await fixtures.customer();
    const product = await fixtures.product();
    return fixtures.order(user, [product]);
  }
};
```

---

## 6. Интеграция CI/CD

### 6.1 Стадии пайплайна

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

| Gate | Требование | Действие |
|------|------------|----------|
| Юнит покрытие | >= 80% | Блокировать merge |
| Покрытие нового кода | >= 90% | Блокировать merge |
| E2E критичные пути | 100% pass | Блокировать merge |
| Перформанс-тесты | Нет регрессии > 10% | Предупреждение |

---

## 7. Снэпшот-тестирование

### 7.1 Когда использовать

**[OK] Хорошо для:**
- Рендеринга UI-компонентов
- Структуры ответов API
- Сгенерированного вывода

**[FAIL] Плохо для:**
- Динамических данных (timestamps, UUIDs)
- Больших объектов (обременительно поддерживать)

### 7.2 Пример

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

## 8. Перформанс-тестирование

### 8.1 Нагрузочное тестирование

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

## 9. Чек-лист качества тестов

### Перед мёрджем

- [ ] Все существующие тесты проходят
- [ ] Новый код покрыт тестами
- [ ] Покрытие соответствует порогу
- [ ] Нет пропущенных тестов без причины
- [ ] Моки на границах
- [ ] Тесты детерминированы
- [ ] Нет захардкоженных учётных данных
- [ ] E2E тесты покрывают критичные пути

### Code Review

- [ ] Тесты читаемы
- [ ] Граничные случаи покрыты
- [ ] Пути ошибок протестированы
- [ ] Нет взаимозависимостей тестов
- [ ] Описательные имена тестов

---

## 10. Рекомендации по стеку тестирования

### Frontend

```
├── Vitest / Jest        # Юнит-тесты
├── React Testing Library # Тесты компонентов
├── Playwright / Cypress  # E2E тесты
├── MSW                   # Мокинг API
└── @faker-js/faker       # Тестовые данные
```

### Backend

```
├── Vitest / Jest        # Юнит-тесты
├── Supertest            # API тесты
├── Playwright           # E2E тесты
├── Nock / MSW           # Мокинг внешних API
└── K6 / Artillery       # Нагрузочные тесты
```

---

## Ссылки

- Документация Jest: https://jestjs.io/
- Документация Vitest: https://vitest.dev/
- Документация Playwright: https://playwright.dev/
- Testing Library: https://testing-library.com/
- Документация K6: https://k6.io/

---

*Стандарт STD-TEST-001 v1.0 — Часть agent-toolkit*
