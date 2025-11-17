# Code Quality Guidelines

This document outlines the core principles for all code generated in this project. When writing or modifying code, prioritize these traits in order:

## 1. Readable

Code should be immediately understandable to any developer.

### Practices:
- **Descriptive naming**: Use clear, intention-revealing names for variables, functions, and classes
  - ✅ `getUsersByRegistrationDate()`
  - ❌ `getUsers2()` or `getData()`
- **Single Responsibility**: Each function/class should do one thing well
- **Consistent formatting**: Follow established code style guides for the language
- **Meaningful comments**: Explain *why*, not *what*. Code should be self-documenting where possible
- **Avoid deep nesting**: Prefer early returns and guard clauses over nested conditionals
- **Limit function length**: Keep functions focused and concise (typically under 50 lines)

### Examples:
```javascript
// ❌ Hard to read
function p(u) {
  if(u.a > 18) {
    if(u.v) {
      return true;
    }
  }
  return false;
}

// ✅ Readable
function isEligibleForVoting(user) {
  if (user.age <= 18) return false;
  if (!user.isVerified) return false;
  return true;
}
```

## 2. Maintainable

Code should be easy to modify, extend, and debug.

### Practices:
- **DRY (Don't Repeat Yourself)**: Extract common logic into reusable functions/modules
- **Loose coupling**: Minimize dependencies between components
- **High cohesion**: Keep related functionality together
- **Configuration over hardcoding**: Use environment variables and config files
- **Error handling**: Implement comprehensive error handling with clear messages
- **Logging**: Add strategic logging for debugging and monitoring
- **Documentation**: Maintain up-to-date README, API docs, and inline documentation

### Examples:
```python
# ❌ Hard to maintain
def process_user():
    conn = connect_db("localhost", 5432, "mydb", "user", "pass")
    # ... processing

def update_user():
    conn = connect_db("localhost", 5432, "mydb", "user", "pass")
    # ... updating

# ✅ Maintainable
class DatabaseConfig:
    HOST = os.getenv("DB_HOST", "localhost")
    PORT = os.getenv("DB_PORT", 5432)

class UserRepository:
    def __init__(self, db_connection):
        self.db = db_connection

    def process_user(self):
        # ... processing

    def update_user(self):
        # ... updating
```

## 3. Testable

Code should be designed to facilitate automated testing.

### Practices:
- **Dependency injection**: Pass dependencies as parameters rather than creating them internally
- **Pure functions**: Prefer functions without side effects when possible
- **Separation of concerns**: Separate business logic from I/O operations
- **Avoid global state**: Minimize use of global variables and singletons
- **Mockable dependencies**: Use interfaces/protocols to allow mocking in tests
- **Test coverage**: Aim for high test coverage of critical paths
- **Write tests first**: Consider TDD (Test-Driven Development) for complex features

### Examples:
```typescript
// ❌ Hard to test
class OrderService {
  processOrder(orderId: string) {
    const db = new Database(); // Hard-coded dependency
    const order = db.getOrder(orderId);
    const emailService = new EmailService(); // Another hard-coded dependency
    emailService.send(order.userEmail, "Order confirmed");
  }
}

// ✅ Testable
interface IDatabase {
  getOrder(orderId: string): Order;
}

interface IEmailService {
  send(to: string, message: string): void;
}

class OrderService {
  constructor(
    private db: IDatabase,
    private emailService: IEmailService
  ) {}

  processOrder(orderId: string) {
    const order = this.db.getOrder(orderId);
    this.emailService.send(order.userEmail, "Order confirmed");
  }
}
```

## 4. Scalable (Future-Proof)

Code should be designed to grow and adapt to changing requirements.

### Practices:
- **SOLID principles**: Follow object-oriented design principles
  - Single Responsibility Principle
  - Open/Closed Principle (open for extension, closed for modification)
  - Liskov Substitution Principle
  - Interface Segregation Principle
  - Dependency Inversion Principle
- **Design patterns**: Use appropriate patterns (Factory, Strategy, Observer, etc.)
- **Modular architecture**: Organize code into clear, logical modules/packages
- **API versioning**: Plan for backward compatibility in public APIs
- **Database design**: Use proper normalization and indexing strategies
- **Performance considerations**: Write efficient code, but optimize based on actual metrics
- **Extensibility**: Use abstractions that allow new features without major refactoring

### Examples:
```java
// ❌ Not scalable
class PaymentProcessor {
    public void processPayment(Payment payment) {
        if (payment.getType().equals("CREDIT_CARD")) {
            // Process credit card
        } else if (payment.getType().equals("PAYPAL")) {
            // Process PayPal
        } else if (payment.getType().equals("CRYPTO")) {
            // Process crypto
        }
        // Adding new payment method requires modifying this class
    }
}

// ✅ Scalable
interface PaymentMethod {
    void process(Payment payment);
}

class CreditCardPayment implements PaymentMethod {
    public void process(Payment payment) {
        // Process credit card
    }
}

class PayPalPayment implements PaymentMethod {
    public void process(Payment payment) {
        // Process PayPal
    }
}

class PaymentProcessor {
    private Map<String, PaymentMethod> paymentMethods;

    public PaymentProcessor(Map<String, PaymentMethod> methods) {
        this.paymentMethods = methods;
    }

    public void processPayment(Payment payment) {
        PaymentMethod method = paymentMethods.get(payment.getType());
        if (method != null) {
            method.process(payment);
        } else {
            throw new UnsupportedPaymentMethodException();
        }
    }
    // New payment methods can be added without modifying this class
}
```

## General Guidelines

### Code Review Checklist
Before submitting code, verify:
- [ ] Code is self-documenting with clear names
- [ ] Functions are small and focused
- [ ] No code duplication
- [ ] Error cases are handled
- [ ] Dependencies are injected
- [ ] Unit tests are included
- [ ] Code follows SOLID principles
- [ ] Documentation is updated

### Technology-Specific Considerations
- **JavaScript/TypeScript**: Use TypeScript for type safety; leverage async/await; use modern ES6+ features
- **Python**: Follow PEP 8; use type hints; leverage virtual environments
- **Java**: Use Maven/Gradle for dependency management; follow Java conventions
- **Go**: Follow Go idioms; use interfaces; handle errors explicitly

### Performance vs. Readability
- Prioritize readability first
- Optimize only when necessary (based on profiling)
- Document any performance-critical sections that sacrifice readability

### When to Refactor
Refactor when you notice:
- Code duplication (DRY violation)
- Functions longer than 50 lines
- Classes with too many responsibilities
- Difficult-to-test code
- Code that's hard to understand or modify

## Summary

Remember the priority order:
1. **Readable** - Can anyone understand this?
2. **Maintainable** - Can anyone modify this easily?
3. **Testable** - Can we verify this works?
4. **Scalable** - Can this grow with the project?

When these principles conflict, favor readability and maintainability over premature optimization. Write code for humans first, computers second.
