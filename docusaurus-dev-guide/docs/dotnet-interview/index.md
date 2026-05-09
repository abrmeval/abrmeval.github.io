---
title: ".NET Interview Study Guide 2025"
sidebar_label: "Overview"
sidebar_position: 1
tags: [dotnet, interview, csharp]
---

# .NET Interview Study Guide - 2025 Edition

## Table of Contents

1. [Core C# Fundamentals](#section-1-core-c-fundamentals)
2. [Modern C# Features (C# 10-12, .NET 6-8+)](#section-2-modern-c-features)
3. [Dependency Injection & Architecture](#section-3-dependency-injection-architecture)
4. [Asynchronous Programming](#section-4-asynchronous-programming)
5. [Performance & Memory Management](#section-5-performance-memory-management)
6. [Cloud & Microservices](#section-6-cloud-microservices)
7. [Security](#section-7-security)
8. [Quick Reference Tables](#section-8-quick-reference)

---

## Section 1: Core C# Fundamentals

### 🔹 Method Overriding, Overloading, and Hiding

**Method Overloading** (Compile-time Polymorphism)
- Multiple methods with same name, different parameters
- Resolved at compile time

```csharp
public class Calculator
{
    public int Add(int a, int b) => a + b;
    public double Add(double a, double b) => a + b;
    public int Add(int a, int b, int c) => a + b + c;
}
```

**Method Overriding** (Runtime Polymorphism)
- Redefining virtual/abstract method in derived class
- Uses `override` keyword
- Resolved at runtime

```csharp
public class PaymentProcessor
{
    public virtual decimal ProcessPayment(decimal amount)
    {
        return amount;
    }
}

public class CreditCardProcessor : PaymentProcessor
{
    public override decimal ProcessPayment(decimal amount)
    {
        return amount * 1.03m; // 3% fee
    }
}

// Runtime polymorphism in action
PaymentProcessor processor = new CreditCardProcessor();
var total = processor.ProcessPayment(100m); // Returns 103, not 100
```

**Method Hiding** (Not Recommended)
- Uses `new` keyword to hide base method
- Breaks polymorphism - which method executes depends on reference type, not object type

```csharp
public class Base
{
    public void Display() => Console.WriteLine("Base");
}

public class Derived : Base
{
    public new void Display() => Console.WriteLine("Derived");
}

// Confusing behavior
Derived d = new Derived();
d.Display(); // "Derived"

Base b = d;
b.Display(); // "Base" - unexpected!
```

### 🔹 Task Parallel Library (TPL)

TPL provides high-level abstractions for parallel and asynchronous programming.

```csharp
// Data Parallelism
public void ProcessLargeDataset(List<Order> orders)
{
    Parallel.ForEach(orders, order =>
    {
        ValidateOrder(order);
        CalculateTotals(order);
        ApplyDiscounts(order);
    });
}

// Task-based operations
public async Task<decimal> CalculateTotalRevenueAsync()
{
    var salesTask = CalculateSalesAsync();
    var subscriptionTask = CalculateSubscriptionsAsync();
    var adsTask = CalculateAdvertisingAsync();
    
    await Task.WhenAll(salesTask, subscriptionTask, adsTask);
    
    return salesTask.Result + subscriptionTask.Result + adsTask.Result;
}

// Cancellation support
public async Task<List<string>> SearchAsync(string query, CancellationToken cancellationToken)
{
    return await Task.Run(() =>
    {
        var results = new List<string>();
        for (int i = 0; i < 1000000; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (Matches(i, query))
                results.Add($"Result {i}");
        }
        return results;
    }, cancellationToken);
}
```

### 🔹 Thread vs Task

**Thread**
- Low-level OS thread
- Expensive: ~1MB stack memory per thread
- Manual management required
- Limited composability

**Task**
- High-level abstraction over ThreadPool
- Efficient: threads are reused
- Automatic management
- Composable with async/await

```csharp
// Thread - heavy and manual
public void UsingThread()
{
    var thread = new Thread(() =>
    {
        PerformWork();
    });
    thread.Start();
    thread.Join(); // Wait for completion
}

// Task - lightweight and automatic
public async Task UsingTaskAsync()
{
    await Task.Run(() =>
    {
        PerformWork();
    });
}

// Key difference: Tasks can await without blocking threads
public async Task<List<string>> FetchDataAsync()
{
    // During I/O operations, thread returns to pool
    var response = await httpClient.GetAsync("https://api.example.com");
    var content = await response.Content.ReadAsStringAsync();
    return ParseData(content);
}
```

**When to use Thread**:
- Need specific thread properties (priority, apartment state)
- COM interop requirements
- Very rare in modern code

**When to use Task**:
- Everything else (99% of cases)

### 🔹 IEnumerable vs IQueryable vs List

**IEnumerable<T>**
- In-memory iteration
- LINQ executes in memory
- Use for: in-memory collections

**IQueryable<T>**
- Query expressions
- LINQ translates to SQL
- Use for: database queries

**List<T>**
- Concrete collection
- Already materialized in memory
- Use for: when you need count, indexing, or multiple iterations

```csharp
// ❌ BAD: Loads everything into memory first
public List<Customer> GetCustomers(string city)
{
    IEnumerable<Customer> customers = _context.Customers;
    return customers.Where(c => c.City == city).ToList();
    // SQL: SELECT * FROM Customers
    // Then filters in memory
}

// ✅ GOOD: Filters in database
public List<Customer> GetCustomersCorrect(string city)
{
    IQueryable<Customer> customers = _context.Customers;
    return customers.Where(c => c.City == city).ToList();
    // SQL: SELECT * FROM Customers WHERE City = @city
}

// Composable queries
public IQueryable<Product> BuildQuery(string category = null, decimal? minPrice = null)
{
    IQueryable<Product> query = _context.Products;
    
    if (category != null)
        query = query.Where(p => p.Category == category);
    
    if (minPrice.HasValue)
        query = query.Where(p => p.Price >= minPrice.Value);
    
    return query;
    // All conditions combined into single SQL query when executed
}
```

### 🔹 Array vs ArrayList vs List<T>

**Array**
- Fixed size
- Type-safe
- Best performance
- Use when: size known upfront

**ArrayList** (Legacy - Don't use in new code)
- Dynamic size
- Not type-safe (stores objects)
- Boxing/unboxing overhead
- Use when: maintaining legacy code only

**List<T>**
- Dynamic size
- Type-safe (generic)
- Good performance
- Use when: need dynamic collection (default choice)

```csharp
// Array - fixed size, best performance
int[] numbers = new int[5];
numbers[0] = 10;

// ArrayList - legacy, avoid
ArrayList list = new ArrayList();
list.Add(10);  // Boxing
int value = (int)list[0]; // Unboxing

// List<T> - modern, preferred
List<int> modernList = new List<int>();
modernList.Add(10); // No boxing
int modernValue = modernList[0]; // No unboxing
```

### 🔹 var and Multiple Variable Declaration

```csharp
// ❌ Error: var doesn't support multiple declarators
var x = 10, y = 20; // Compile error CS0819

// ✅ Correct: Separate declarations
var x = 10;
var y = 20;

// ✅ Or use explicit type
int a = 10, b = 20, c = 30;

// Why? var requires initialization to infer type
// Multiple declarators would create ambiguity
```

---

## Section 2: Modern C# Features

### 🔹 Primary Constructors (C# 12)

Eliminates boilerplate for simple classes.

```csharp
// Old way
public class CustomerService_Old
{
    private readonly ILogger<CustomerService> _logger;
    private readonly ICustomerRepository _repository;
    
    public CustomerService_Old(ILogger<CustomerService> logger, ICustomerRepository repository)
    {
        _logger = logger;
        _repository = repository;
    }
}

// New way with primary constructor
public class CustomerService(ILogger<CustomerService> logger, ICustomerRepository repository)
{
    public async Task<Customer> GetCustomerAsync(int id)
    {
        logger.LogInformation("Getting customer {Id}", id);
        return await repository.GetByIdAsync(id);
    }
}
```

### 🔹 Collection Expressions (C# 12)

Unified syntax for collections.

```csharp
// Traditional
var list = new List<int> { 1, 2, 3 };

// Modern
int[] array = [1, 2, 3, 4, 5];
List<int> list = [1, 2, 3, 4, 5];
Span<int> span = [1, 2, 3, 4, 5];

// Spreading
int[] first = [1, 2, 3];
int[] second = [4, 5, 6];
int[] combined = [..first, ..second]; // [1,2,3,4,5,6]
```

### 🔹 Raw String Literals (C# 11)

No more escape sequence headaches.

```csharp
// Old way - painful
var json = "{\n  \"name\": \"John\",\n  \"age\": 30\n}";

// New way - clean
var json = """
    {
      "name": "John",
      "age": 30
    }
    """;

// SQL queries
var sql = """
    SELECT 
        c.CustomerId,
        COUNT(o.OrderId) as OrderCount
    FROM Customers c
    LEFT JOIN Orders o ON c.CustomerId = o.CustomerId
    WHERE c.IsActive = 1
    GROUP BY c.CustomerId
    """;

// With interpolation
var name = "Alice";
var interpolated = $$"""
    {
      "name": "{{name}}",
      "timestamp": "{{DateTime.UtcNow:O}}"
    }
    """;
```

### 🔹 Records, Structs, and Classes

**Class** - Reference type, heap allocated
- Use for: Complex objects with behavior, inheritance needed

**Struct** - Value type, stack allocated
- Use for: Small (<16 bytes), immutable data, performance-critical

**Record** - Reference type with value equality
- Use for: DTOs, immutable data, API models

```csharp
// Class - reference equality
public class CustomerClass
{
    public int Id { get; set; }
    public string Name { get; set; }
}

var c1 = new CustomerClass { Id = 1, Name = "John" };
var c2 = new CustomerClass { Id = 1, Name = "John" };
Console.WriteLine(c1 == c2); // False - different references

// Struct - value type
public readonly struct Point
{
    public int X { get; }
    public int Y { get; }
    
    public Point(int x, int y) => (X, Y) = (x, y);
}

var p1 = new Point(10, 20);
var p2 = p1; // Copies the value
p2.X = 30; // Error - readonly

// Record - value equality
public record CustomerRecord(int Id, string Name);

var r1 = new CustomerRecord(1, "John");
var r2 = new CustomerRecord(1, "John");
Console.WriteLine(r1 == r2); // True - value equality

// Immutable updates with 'with'
var r3 = r1 with { Name = "Jane" };
Console.WriteLine(r1.Name); // "John"
Console.WriteLine(r3.Name); // "Jane"
```

### 🔹 Span<T> and Memory<T>

High-performance alternatives to arrays for performance-critical code.

```csharp
// Traditional - creates substring (allocates new string)
public string GetFirstWord(string text)
{
    int index = text.IndexOf(' ');
    return text.Substring(0, index); // Allocates new string
}

// Modern - no allocation
public ReadOnlySpan<char> GetFirstWordSpan(string text)
{
    int index = text.IndexOf(' ');
    return text.AsSpan(0, index); // No allocation - view into original string
}

// Practical example: parsing
public void ParseCoordinates(string input)
{
    // Input: "10,20,30,40"
    ReadOnlySpan<char> span = input.AsSpan();
    
    while (!span.IsEmpty)
    {
        int commaIndex = span.IndexOf(',');
        ReadOnlySpan<char> numberSpan = commaIndex >= 0 
            ? span.Slice(0, commaIndex) 
            : span;
        
        if (int.TryParse(numberSpan, out int number))
        {
            ProcessNumber(number);
        }
        
        span = commaIndex >= 0 ? span.Slice(commaIndex + 1) : ReadOnlySpan<char>.Empty;
    }
}
```

---

## Section 3: Dependency Injection & Architecture

### 🔹 Service Lifetimes

**Transient**: New instance every request
**Scoped**: One instance per HTTP request/scope
**Singleton**: One instance for application lifetime

```csharp
var builder = WebApplication.CreateBuilder(args);

// Transient - lightweight, stateless
builder.Services.AddTransient<IEmailService, EmailService>();

// Scoped - DbContext, request-specific data
builder.Services.AddScoped<ApplicationDbContext>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Singleton - caching, configuration
builder.Services.AddSingleton<IMemoryCache, MemoryCache>();
builder.Services.AddSingleton<MetricsCollector>();
```

**Common Pitfall**: Injecting scoped into singleton

```csharp
// ❌ WRONG - DbContext is scoped, service is singleton
public class NotificationService // Singleton
{
    private readonly ApplicationDbContext _context; // ❌ Scoped
    
    public NotificationService(ApplicationDbContext context)
    {
        _context = context; // Memory leak, concurrency issues
    }
}

// ✅ CORRECT - Use IServiceProvider
public class NotificationService // Singleton
{
    private readonly IServiceProvider _serviceProvider;
    
    public NotificationService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    
    public async Task SendAsync(string message)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        // Use context safely
    }
}
```

### 🔹 Clean Architecture Principles

**SOLID Principles**

```csharp
// Single Responsibility
public class OrderService // Only handles order business logic
{
    public void CreateOrder(Order order) { }
}

public class OrderNotificationService // Only handles notifications
{
    public void NotifyOrderCreated(Order order) { }
}

// Open/Closed (open for extension, closed for modification)
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(decimal amount);
}

public class CreditCardProcessor : IPaymentProcessor { }
public class PayPalProcessor : IPaymentProcessor { }
// Add new processors without modifying existing code

// Dependency Inversion (depend on abstractions)
public class OrderProcessor
{
    private readonly IPaymentProcessor _payment; // Abstraction, not concrete
    private readonly IOrderRepository _repository;
    
    public OrderProcessor(IPaymentProcessor payment, IOrderRepository repository)
    {
        _payment = payment;
        _repository = repository;
    }
}
```

---

## Section 4: Asynchronous Programming

### 🔹 async/await vs IAsyncEnumerable<T>

**async/await** - Returns complete result

```csharp
// Returns all at once
public async Task<List<Product>> GetProductsAsync()
{
    return await _context.Products.ToListAsync();
    // All products loaded in memory
}
```

**IAsyncEnumerable<T>** - Streams results

```csharp
// Returns items as they're available
public async IAsyncEnumerable<Product> StreamProductsAsync(
    [EnumeratorCancellation] CancellationToken cancellationToken = default)
{
    await foreach (var product in _context.Products.AsAsyncEnumerable())
    {
        cancellationToken.ThrowIfCancellationRequested();
        yield return product;
    }
    // Constant memory usage, immediate processing
}

// Consumer
await foreach (var product in StreamProductsAsync())
{
    await ProcessProductAsync(product);
}
```

### 🔹 ValueTask vs Task

**Task** - Always allocates on heap

**ValueTask** - Can avoid allocation for synchronous results

```csharp
// Task - always allocates
public async Task<Customer> GetCustomerAsync(int id)
{
    return await _repository.GetAsync(id);
    // Every call allocates Task object
}

// ValueTask - avoids allocation when result is cached
public async ValueTask<Customer> GetCustomerOptimizedAsync(int id)
{
    if (_cache.TryGetValue(id, out var cached))
        return cached; // No allocation!
    
    var customer = await _repository.GetAsync(id);
    _cache[id] = customer;
    return customer;
}
```

**When to use ValueTask:**
- Caching scenarios (often synchronous return)
- Pooled operations
- High-frequency calls with fast path

**Don't use ValueTask when:**
- Always async
- Need to await multiple times
- Need to store in field

### 🔹 ConfigureAwait(false)

Tells async not to capture synchronization context.

```csharp
// Library code - use ConfigureAwait(false)
public async Task<byte[]> DownloadAsync(string url)
{
    var response = await _client.GetAsync(url).ConfigureAwait(false);
    var bytes = await response.Content.ReadAsByteArrayAsync().ConfigureAwait(false);
    return bytes;
    // Benefits: better performance, avoids deadlocks
}

// UI code - DON'T use ConfigureAwait(false)
public async Task HandleButtonClick()
{
    LoadingIndicator.Visible = true;
    
    var data = await LoadDataAsync(); // Need to return to UI thread
    
    LoadingIndicator.Visible = false; // Update UI
    DataGrid.ItemsSource = data;
}

// ASP.NET Core - optional (no SynchronizationContext)
[HttpGet]
public async Task<IActionResult> GetData()
{
    var data = await _repository.GetAsync().ConfigureAwait(false);
    return Ok(data);
    // No context in ASP.NET Core, but doesn't hurt
}
```

---

## Section 5: Performance & Memory Management

### 🔹 Garbage Collection

**.NET GC Generations:**
- **Gen 0**: Short-lived objects (collected frequently)
- **Gen 1**: Medium-lived objects (buffer between 0 and 2)
- **Gen 2**: Long-lived objects (large objects, static data)

```csharp
// Understanding allocations
public void AllocationExamples()
{
    // Gen 0 - short-lived
    for (int i = 0; i < 1000; i++)
    {
        var temp = new Customer(); // Allocated to Gen 0
        Process(temp);
    } // Objects die, collected from Gen 0
    
    // Gen 2 - long-lived
    private static readonly List<string> _cache = new(); // Survives to Gen 2
    
    // Large Object Heap (LOH) - objects > 85,000 bytes
    byte[] largeArray = new byte[100_000]; // Allocated directly to LOH
}

// Reducing GC pressure
public class GCOptimization
{
    // ❌ Creates many objects
    public List<string> ProcessBad(List<string> items)
    {
        var results = new List<string>();
        foreach (var item in items)
        {
            results.Add(item.ToUpper());
        }
        return results;
    }
    
    // ✅ Reuses buffer
    private readonly StringBuilder _buffer = new(1024);
    
    public string ProcessGood(List<string> items)
    {
        _buffer.Clear();
        foreach (var item in items)
        {
            _buffer.Append(item.ToUpper());
        }
        return _buffer.ToString();
    }
    
    // ✅ Uses ArrayPool
    public void ProcessWithPool(int size)
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(size);
        try
        {
            // Use buffer
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }
}
```

### 🔹 Caching Strategies

```csharp
// In-Memory Cache
public class ProductService
{
    private readonly IMemoryCache _cache;
    
    public async Task<Product> GetProductAsync(int id)
    {
        return await _cache.GetOrCreateAsync($"product_{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
            return await _repository.GetAsync(id);
        });
    }
}

// Distributed Cache (Redis)
public class DistributedCacheService
{
    private readonly IDistributedCache _cache;
    
    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory)
    {
        var cached = await _cache.GetStringAsync(key);
        
        if (cached != null)
            return JsonSerializer.Deserialize<T>(cached);
        
        var value = await factory();
        var json = JsonSerializer.Serialize(value);
        
        await _cache.SetStringAsync(key, json, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
        });
        
        return value;
    }
}
```

---

## Section 6: Cloud & Microservices

### 🔹 Configuration Management

```csharp
// appsettings.json
{
  "Database": {
    "ConnectionString": "...",
    "MaxRetries": 3
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "Port": 587
  }
}

// Strong-typed configuration
public class DatabaseSettings
{
    public string ConnectionString { get; set; }
    public int MaxRetries { get; set; }
}

// Register
builder.Services.Configure<DatabaseSettings>(
    builder.Configuration.GetSection("Database"));

// Use
public class DataService
{
    private readonly DatabaseSettings _settings;
    
    public DataService(IOptions<DatabaseSettings> options)
    {
        _settings = options.Value;
    }
}

// Environment-specific
// appsettings.Development.json
// appsettings.Production.json

// Azure App Configuration
builder.Configuration.AddAzureAppConfiguration(options =>
{
    options.Connect(connectionString)
           .ConfigureRefresh(refresh =>
           {
               refresh.Register("Settings:Sentinel", refreshAll: true)
                      .SetCacheExpiration(TimeSpan.FromMinutes(5));
           });
});
```

### 🔹 Microservices Communication

```csharp
// gRPC Service
public class ProductService : ProductProto.ProductServiceBase
{
    public override async Task<ProductResponse> GetProduct(
        ProductRequest request,
        ServerCallContext context)
    {
        var product = await _repository.GetAsync(request.Id);
        
        return new ProductResponse
        {
            Id = product.Id,
            Name = product.Name,
            Price = (double)product.Price
        };
    }
}

// Message Bus (RabbitMQ/Azure Service Bus)
public class OrderCreatedEventHandler
{
    public async Task HandleAsync(OrderCreatedEvent @event)
    {
        // Process event asynchronously
        await _inventoryService.ReserveItemsAsync(@event.Items);
        await _notificationService.NotifyAsync(@event.CustomerId);
    }
}

// Resilience with Polly
services.AddHttpClient<IApiClient, ApiClient>()
    .AddPolicyHandler(Policy
        .Handle<HttpRequestException>()
        .WaitAndRetryAsync(3, retryAttempt => 
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))))
    .AddPolicyHandler(Policy
        .TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(10)));
```

### 🔹 Health Checks

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>()
    .AddRedis(redisConnectionString)
    .AddUrlGroup(new Uri("https://api.external.com"), "External API");

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration
            })
        });
        await context.Response.WriteAsync(result);
    }
});
```

---

## Section 7: Security

### 🔹 JWT Authentication

```csharp
// Configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

// Generate token
public string GenerateToken(User user)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Username),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role)
    };
    
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    
    var token = new JwtSecurityToken(
        issuer: _configuration["Jwt:Issuer"],
        audience: _configuration["Jwt:Audience"],
        claims: claims,
        expires: DateTime.Now.AddHours(1),
        signingCredentials: credentials);
    
    return new JwtSecurityTokenHandler().WriteToken(token);
}

// Use in controller
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        // Access user claims
    }
}
```

### 🔹 Input Validation

```csharp
// Model validation
public class CreateProductRequest
{
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }
    
    [Range(0.01, 1000000)]
    public decimal Price { get; set; }
    
    [EmailAddress]
    public string ContactEmail { get; set; }
}

// FluentValidation
public class CreateProductValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .Length(3, 100);
        
        RuleFor(x => x.Price)
            .GreaterThan(0)
            .LessThanOrEqualTo(1000000);
        
        RuleFor(x => x.ContactEmail)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.ContactEmail));
    }
}

// SQL Injection prevention
// ❌ NEVER do this
public List<User> GetUsersBad(string username)
{
    var query = $"SELECT * FROM Users WHERE Username = '{username}'";
    // SQL Injection vulnerable!
}

// ✅ Always use parameterized queries
public List<User> GetUsersGood(string username)
{
    return _context.Users
        .Where(u => u.Username == username)
        .ToList();
    // EF Core uses parameters automatically
}
```

---

## Section 8: Quick Reference

### Service Lifetimes

| Lifetime | Scope | Use Case |
|----------|-------|----------|
| Transient | Per request | Stateless, lightweight services |
| Scoped | Per HTTP request | DbContext, request-specific data |
| Singleton | Application lifetime | Caching, configuration |

### Collection Types

| Type | Memory | Mutability | Equality | Use Case |
|------|--------|------------|----------|----------|
| Array | Stack/Heap | Mutable | Reference | Fixed size, best performance |
| List<T> | Heap | Mutable | Reference | Dynamic collections |
| ImmutableList<T> | Heap | Immutable | Value | Thread-safe, functional |
| Span<T> | Stack | Mutable | N/A | High-performance slicing |

### Async Patterns

| Pattern | Use Case | Performance |
|---------|----------|-------------|
| Task | Standard async operations | Good |
| ValueTask | Cached/synchronous results | Better (no allocation) |
| IAsyncEnumerable | Streaming data | Best (constant memory) |

### Type Comparison

| Feature | Class | Struct | Record |
|---------|-------|--------|--------|
| Memory | Heap | Stack | Heap |
| Equality | Reference | Value | Value |
| Inheritance | Yes | No | Yes |
| Mutability | Mutable | Mutable | Immutable |
| Use Case | Complex objects | Small values | DTOs |

---

## Practical Tips for Interviews

### 1. **Explain Trade-offs**
Don't just say "use X". Explain why X over Y:
- "I'd use IQueryable here because it translates to SQL, avoiding loading all data into memory"
- "ValueTask makes sense because this method has a cache with 80% hit rate"

### 2. **Show Real-World Awareness**
- Mention performance implications
- Discuss scalability concerns
- Consider maintenance and readability

### 3. **Code Quality Matters**
- Use meaningful variable names
- Add comments for complex logic
- Handle errors appropriately
- Consider thread safety

### 4. **Know Your Fundamentals**
- Stack vs Heap
- Value types vs Reference types
- Synchronous vs Asynchronous
- Stateful vs Stateless

---

## Sources for Further Study

### Official Documentation
- **Microsoft Learn**: https://learn.microsoft.com/dotnet
- **.NET API Browser**: https://learn.microsoft.com/dotnet/api
- **C# Language Reference**: https://learn.microsoft.com/dotnet/csharp
- **ASP.NET Core**: https://learn.microsoft.com/aspnet/core

### Performance & Best Practices
- **.NET Blog**: https://devblogs.microsoft.com/dotnet
- **Performance Improvements**: Search for "Performance Improvements in .NET X"
- **BenchmarkDotNet**: https://benchmarkdotnet.org
- **Stephen Cleary's Blog**: https://blog.stephencleary.com (async/await expert)

### Advanced Topics
- **.NET Runtime GitHub**: https://github.com/dotnet/runtime
- **ASP.NET Core GitHub**: https://github.com/dotnet/aspnetcore
- **C# Language Design**: https://github.com/dotnet/csharplang

### Books
- "C# in Depth" by Jon Skeet
- "CLR via C#" by Jeffrey Richter
- "Concurrency in C# Cookbook" by Stephen Cleary
- "ASP.NET Core in Action" by Andrew Lock

### Video Resources
- **Microsoft .NET YouTube**: https://www.youtube.com/@dotnet
- **.NET Conf**: Annual conference recordings
- **NDC Conferences**: High-quality .NET presentations

### Community
- **Stack Overflow**: Tags [c#], [.net], [asp.net-core]
- **Reddit**: r/dotnet, r/csharp
- **.NET Foundation**: https://dotnetfoundation.org
- **Weekly Newsletter**: https://www.dotnetweekly.com

---

## Final Thoughts

Success in .NET interviews comes from:

1. **Deep Understanding** - Know the "why", not just the "what"
2. **Practical Experience** - Build projects, contribute to open source
3. **Performance Awareness** - Understand implications of your choices
4. **Modern Practices** - Stay updated with latest features
5. **Communication** - Explain your thought process clearly

Good luck with your interview preparation! 🚀
