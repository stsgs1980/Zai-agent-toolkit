# Standard: Error Recovery v1.0 (EN)

> ID: STD-ERR-002
> Version: 1.0
> Level: **[C] Critical**
> Last Updated: 2026-05
> Related: STD-ERR-001, STD-AGENT-002, STD-SEC-001

---

## 1. Introduction

This standard covers error recovery strategies and monitoring/alerting for resilient systems. It addresses how to recover from failures using retry logic, circuit breakers, and fallback mechanisms, as well as how to observe and alert on error patterns.

Core error handling — including error classification, error object structure, try-catch patterns, logging standards, API error responses, and frontend error handling — is defined in **STD-ERR-001**.

---

## 2. Retry Logic

### 2.1 Retry with Exponential Backoff

```typescript
// lib/retry.ts
interface RetryConfig {
  maxAttempts: number;
  delay: number;        // Base delay in ms
  maxDelay: number;     // Max delay in ms
  backoff: 'linear' | 'exponential';
  retryIf: (error: Error) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!config.retryIf(error)) {
        throw error;
      }

      if (attempt === config.maxAttempts) {
        throw error;
      }

      const delay = config.backoff === 'exponential'
        ? Math.min(config.delay * Math.pow(2, attempt - 1), config.maxDelay)
        : config.delay * attempt;

      await sleep(delay);
    }
  }

  throw lastError;
}

// Usage
const result = await withRetry(
  () => fetchExternalAPI(),
  {
    maxAttempts: 3,
    delay: 1000,
    maxDelay: 10000,
    backoff: 'exponential',
    retryIf: (error) => error instanceof ExternalServiceError,
  }
);
```

---

## 3. Circuit Breaker

### 3.1 Circuit Breaker Pattern

```typescript
// lib/circuit-breaker.ts
enum State { CLOSED, OPEN, HALF_OPEN }

class CircuitBreaker {
  private state = State.CLOSED;
  private failures = 0;
  private lastFailureTime: number;

  constructor(
    private threshold: number,
    private timeout: number,
    private halfOpenRequests: number = 1
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === State.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = State.HALF_OPEN;
      } else {
        throw new CircuitOpenError('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = State.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = State.OPEN;
    }
  }
}
```

---

## 4. Fallback Mechanisms

### 4.1 Graceful Degradation

```typescript
// lib/fallback.ts
async function getUser(id: string): Promise<User> {
  try {
    // Primary source
    return await database.getUser(id);
  } catch (error) {
    logger.warn({ error, userId: id }, 'Database fetch failed, trying cache');

    try {
      // Fallback: cache
      const cached = await cache.get(`user:${id}`);
      if (cached) return cached;
    } catch (cacheError) {
      logger.error({ cacheError }, 'Cache fallback failed');
    }

    // Final fallback: stale data or default
    throw new ExternalServiceError('User service');
  }
}
```

---

## 5. Monitoring & Alerting

### 5.1 Error Metrics

```typescript
// Key metrics to track
const errorMetrics = {
  // Counters
  errors_total: counter,           // Total errors by code
  errors_by_endpoint: counter,     // Errors by API endpoint
  errors_by_service: counter,      // Errors by service

  // Rates
  error_rate: gauge,               // Errors per minute
  error_rate_p95: histogram,       // 95th percentile response time on errors

  // Recovery
  retry_success_rate: gauge,       // Successful retries
  circuit_breaker_opens: counter,  // Circuit breaker activations
};
```

### 5.2 Alerting Rules

```yaml
# alerts/errors.yml
groups:
  - name: error-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"

      - alert: CriticalError
        expr: increase(errors_total{code="INTERNAL_ERROR"}[1h]) > 5
        labels:
          severity: critical
        annotations:
          summary: "Critical internal errors detected"

      - alert: CircuitBreakerOpen
        expr: increase(circuit_breaker_opens[5m]) > 0
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker opened for {{ $labels.service }}"
```

---

## 6. Integration with Orchestration

Recovery patterns must integrate cleanly with orchestrated multi-agent workflows as defined in **STD-AGENT-002**. The following sections describe how retry, circuit breaker, and fallback mechanisms interact with the orchestration layer.

### 6.1 Error Propagation in Orchestrated Workflows

When a subagent encounters a recoverable error, the orchestrator must decide whether to:

1. **Retry within the subagent** — handled transparently, no escalation.
2. **Escalate to the orchestrator** — when the subagent has exhausted its retry budget or the error is not locally recoverable.
3. **Fail the workflow step** — when the error is irrecoverable and no fallback exists.

Error propagation follows the escalation ladder defined in STD-AGENT-002. Each step in the ladder must preserve the original error context (error ID, code, cause chain) so that the orchestrator has full visibility into the failure origin.

### 6.2 Retry at Subagent Level vs Orchestration Level

| Aspect | Subagent-Level Retry | Orchestration-Level Retry |
|--------|----------------------|--------------------------|
| Scope | Single operation within one subagent | Entire workflow step (may re-invoke subagent) |
| Latency cost | Low (same process) | High (re-initialization possible) |
| State management | Subagent manages own state | Orchestrator must checkpoint and restore |
| When to use | Transient failures (network, timeout) | Subagent total failure, resource contention |
| Config | Subagent's own `RetryConfig` | Orchestrator's step-level retry policy |

**Rule of thumb**: Always retry at the lowest level first. Escalate to orchestration-level retry only when the subagent cannot recover internally.

### 6.3 Circuit Breaker for External Service Calls in Subagents

Each subagent that calls external services (APIs, databases, third-party tools) must maintain its own circuit breaker instance. This ensures:

- **Isolation**: A failing external service in one subagent does not block other subagents.
- **Fast failure**: The circuit breaker allows the subagent to fail quickly and report the open-circuit state to the orchestrator, rather than hanging on repeated timeouts.
- **Orchestrator awareness**: When a subagent reports a `CircuitOpenError`, the orchestrator may choose to:
  - Switch to an alternative subagent (if available).
  - Apply a workflow-level fallback.
  - Pause the workflow and wait for the circuit to transition to half-open.

```typescript
// Example: Subagent with circuit breaker
const githubCB = new CircuitBreaker({ threshold: 5, timeout: 30000 });

async function fetchGitHubData(repo: string) {
  return githubCB.execute(() => githubApi.get(`/repos/${repo}`));
}
```

---

## 7. Recovery Decision Matrix

```text
Error Type                | Recovery Strategy                    | Max Retries | Backoff
Network timeout           | Retry with exponential backoff       | 3           | 1s, 2s, 4s
External service unavail. | Circuit breaker + fallback           | 3           | Exponential
Validation error          | No retry (fix input)                 | 0           | N/A
Authentication error      | No retry (re-auth)                   | 0           | N/A
Rate limit exceeded       | Retry after retryAfter               | 1           | retryAfter value
Internal error            | Fallback + alert                     | 1           | Immediate
```

---

## 8. Checklist

### Recovery-Specific Items

- [ ] Retry logic is in place for external calls
- [ ] Circuit breakers configured for critical services
- [ ] Fallback mechanisms defined for primary service failures
- [ ] Retry backoff strategy is appropriate (exponential for network, immediate for internal)
- [ ] Circuit breaker thresholds and timeouts are tuned per service
- [ ] Alerts are set up for error rate spikes and circuit breaker openings
- [ ] Recovery strategies are appropriate for each error category
- [ ] Orchestration-level retry is only used when subagent-level retry is exhausted
- [ ] Subagent circuit breaker states are visible to the orchestrator

---

## 9. Cross-References

| Standard | Relationship |
|----------|-------------|
| STD-ERR-001 | Core error handling (classification, structure, patterns) |
| STD-AGENT-002 | Orchestration error propagation (escalation ladder) |
| STD-SEC-001 | Security error handling (sensitive data in logs) |
| STD-GIT-002 | Sandbox git error recovery (deadlock, network failures) |

---

## 10. References

- OWASP Error Handling: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices#1-error-handling-practices
- Circuit Breaker Pattern: https://martinfowler.com/bliki/CircuitBreaker.html

---

## 11. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05 | Extracted from STD-ERR-001 v1.0. Contains retry logic, circuit breaker, fallback mechanisms, monitoring and alerting, and orchestration integration. |

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
