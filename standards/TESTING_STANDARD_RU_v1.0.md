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
      ╱    ╲       - Критичные пользовательские потоки
     ╱──────╲      - Полная интеграция системы
    ╱        ╲
   ╱──────────╲    Интеграционные тесты (20%)
  ╱            ╲   - API эндпоинты
 ╱              ╲  - Операции с базой данных
╱────────────────╲ - Внешние сервисы

  Unit-тесты (70%)
  - Чистые функции
  - Компоненты
  - Бизнес-логика
```

### 1.2 Требования к покрытию

| Слой | Минимальное покрытие | Целевое покрытие |
|------|---------------------|------------------|
| Unit | 80% | 90% |
| Integration | 60% | 75% |
| E2E | Критичные пути | Все пользовательские потоки |

---

## 2. Unit-тестирование

### 2.1 Что тестировать

**✅ ТЕСТИРОВАТЬ:**
- Чистые функции (детерминированный вывод)
- Бизнес-логику и вычисления
- Трансформации данных
- Рендеринг компонентов (UI)
- Управление состоянием
- Краевые случаи и граничные условия

**❌ НЕ ТЕСТИРОВАТЬ:**
- Сторонние библиотеки (они тестируют себя сами)
- Внутренности фреймворка
- Тривиальные геттеры/сеттеры
- Сгенерированный код

### 2.2 Структура теста (паттерн AAA)

```javascript
describe('calculateDiscount', () => {
  it('должен применять скидку 10% для премиум-пользователей', () => {
    // Arrange
    const user = { tier: 'premium', orders: 15 };
    const price = 100;

    // Act
    const result = calculateDiscount(price, user);

    // Assert
    expect(result).toBe(90);
  });

  it('должен возвращать оригинальную цену для обычных пользователей', () => {
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
<единица>_<сценарий>_<ожидаемыйРезультат>

Примеры:
- calculateDiscount_premiumUser_applies10Percent
- validateEmail_emptyString_returnsFalse
- handleSubmit_validData_callsOnSuccess
- render_loadingState_showsSpinner
```

### 2.4 Правила мокирования

```javascript
// ✅ Хорошо: Мок на границах
jest.mock('@/lib/api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: 'Test' })
}));

// ✅ Хорошо: Использовать фабричные функции
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  ...overrides
});

// ❌ Плохо: Избыточное мокирование внутренностей
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

  it('должен создать пользователя с валидными данными', async () => {
    const response = await server
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      email: 'test@example.com',
      name: 'Test'
    });
  });

  it('должен отклонить дублирующийся email', async () => {
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
// Использовать транзакции для изоляции
describe('UserRepository', () => {
  let tx: Transaction;

  beforeEach(async () => {
    tx = await db.beginTx();
  });

  afterEach(async () => {
    await tx.rollback();
  });

  it('должен создать и найти пользователя', async () => {
    const user = await tx.users.create({ email: 'test@example.com' });
    const found = await tx.users.findByEmail('test@example.com');

    expect(found).toEqual(user);
  });
});
```

### 3.3 Внешние сервисы

```typescript
// Использовать контрактное тестирование для внешних API
describe('PaymentService', () => {
  it('должен обработать платёж', async () => {
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

### 4.1 Критичные потоки (Обязательно тестировать)

```
┌─────────────────────────────────────────┐
│           E2E тестовые сценарии         │
├─────────────────────────────────────────┤
│ 1. Регистрация -> Логин -> Логаут       │
│ 2. Просмотр товаров -> Корзина -> Чекаут│
│ 3. Поиск -> Фильтрация -> Результаты    │
│ 4. Обновление профиля -> Сохранение     │
│ 5. Состояния ошибок -> Восстановление   │
└─────────────────────────────────────────┘
```

### 4.2 Пример на Playwright

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Поток оформления заказа', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page, 'user@test.com', 'password');
  });

  test('полный поток покупки', async ({ page }) => {
    // Добавить товар в корзину
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('.cart-count')).toHaveText('1');

    // Перейти к оформлению
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

  test('показывает ошибку для отклонённой карты', async ({ page }) => {
    // ... тест обработки ошибок
  });
});
```

### 4.3 Best practices E2E

| Практика | Описание |
|----------|----------|
| Использовать data-testid | `data-testid="submit-btn"` для стабильных селекторов |
| Ждать состояния | `await expect(locator).toBeVisible()` не `waitForTimeout` |
| Изолировать тесты | Каждый тест должен быть независимым |
| Очищать состояние | Сброс БД или использование тестовых фикстур |
| Параллельный запуск | Настроить workers для скорости |

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

  // Сложная настройка
  completedOrder: async () => {
    const user = await fixtures.customer();
    const product = await fixtures.product();
    return fixtures.order(user, [product]);
  }
};
```

---

## 6. Интеграция CI/CD

### 6.1 Этапы пайплайна

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
| Unit Coverage | >= 80% | Блокировать merge |
| New Code Coverage | >= 90% | Блокировать merge |
| E2E Critical Paths | 100% pass | Блокировать merge |
| Performance Tests | Без регрессии > 10% | Предупреждение |

---

## 7. Snapshot-тестирование

### 7.1 Когда использовать

**✅ Подходит для:**
- Рендеринг UI-компонентов
- Структура ответа API
- Сгенерированный вывод

**❌ Не подходит для:**
- Динамические данные (timestamps, UUIDs)
- Большие объекты (нагрузка на поддержку)

### 7.2 Пример

```typescript
// React component snapshot
expect(container).toMatchSnapshot();

// API response snapshot с динамическими полями
expect(response.body).toMatchInlineSnapshot({
  id: expect.any(String),
  createdAt: expect.any(String),
  // ... статические поля
});
```

---

## 8. Тестирование производительности

### 8.1 Нагрузочное тестирование

```typescript
// tests/performance/api.load.test.ts
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Разгон
    { duration: '1m', target: 20 },   // Стабильная нагрузка
    { duration: '30s', target: 0 },   // Снижение
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% менее 500мс
    http_req_failed: ['rate<0.01'],   // <1% ошибок
  },
};

export default function () {
  const res = http.get('https://api.example.com/users');
  check(res, {
    'статус 200': (r) => r.status === 200,
    'время ответа < 500мс': (r) => r.timings.duration < 500,
  });
}
```

---

## 9. Чек-лист качества тестов

### Перед слиянием

- [ ] Все существующие тесты проходят
- [ ] Новый код имеет тесты
- [ ] Покрытие соответствует порогу
- [ ] Нет пропущенных тестов без причины
- [ ] Моки на границах
- [ ] Тесты детерминированы
- [ ] Нет хардкоженных учётных данных
- [ ] E2E тесты покрывают критичные пути

### Code Review

- [ ] Тесты читаемые
- [ ] Краевые случаи покрыты
- [ ] Пути ошибок протестированы
- [ ] Нет взаимозависимостей тестов
- [ ] Описательные имена тестов

---

## 10. Рекомендации по стеку тестирования

### Frontend

```
├── Vitest / Jest        # Unit-тесты
├── React Testing Library # Тесты компонентов
├── Playwright / Cypress  # E2E тесты
├── MSW                   # Мокирование API
└── @faker-js/faker       # Тестовые данные
```

### Backend

```
├── Vitest / Jest        # Unit-тесты
├── Supertest            # API тесты
├── Playwright           # E2E тесты
├── Nock / MSW           # Мокирование внешних API
└── K6 / Artillery       # Нагрузочные тесты
```

---

## Ссылки

- Jest документация: https://jestjs.io/
- Vitest документация: https://vitest.dev/
- Playwright документация: https://playwright.dev/
- Testing Library: https://testing-library.com/
- K6 документация: https://k6.io/

---

*Стандарт STD-TEST-001 v1.0 — Часть agent-toolkit*
