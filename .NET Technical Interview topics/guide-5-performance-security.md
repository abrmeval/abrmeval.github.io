# .NET Interview Study Guide - Part 5: Performance and Security

## Introduction

Welcome to the final guide in your comprehensive .NET interview preparation series. This guide focuses on two critical aspects of professional software development that often distinguish senior developers from junior ones: performance optimization and security. While the previous guides covered language features, architectural patterns, and distributed systems, this guide addresses the non-functional requirements that determine whether applications succeed or fail in production.

Performance and security are interconnected concerns that require deep understanding and careful balance. Performance optimization without security consideration can create vulnerabilities—for example, caching sensitive data for speed but exposing it to unauthorized access. Security measures without performance consideration can make applications unusably slow—for example, encrypting every piece of data without understanding the computational cost. The most effective developers understand both domains deeply and make informed trade-offs based on specific requirements.

Performance optimization is not about making everything fast. It's about understanding where performance matters, measuring actual bottlenecks, and applying appropriate techniques to address them. Premature optimization wastes time optimizing code that doesn't impact overall performance. Effective optimization starts with profiling to identify actual bottlenecks, then applies targeted improvements where they provide measurable benefit. You'll learn techniques ranging from algorithm optimization and memory management to caching strategies and database query optimization.

Security is similarly nuanced. It's not about applying a checklist of security features but understanding threat models, recognizing common vulnerabilities, and building defense in depth. Every application has different security requirements based on what data it handles and who can access it. A public blog has different security needs than a banking application. Understanding these differences and applying appropriate security measures is crucial for building trustworthy systems.

Beyond performance and security, this guide covers essential topics that complete your understanding of professional .NET development. You'll learn about choosing between SQL and NoSQL databases based on access patterns and consistency requirements. You'll explore testing strategies that provide confidence in code correctness while remaining maintainable. You'll understand CI/CD pipelines that enable rapid, safe deployments. You'll learn about monitoring and observability that keep production systems healthy.

These topics represent the final pieces of knowledge you need to discuss .NET development confidently at a senior level. Interviewers expect senior candidates to think beyond just writing code that works—they expect understanding of how that code performs under load, how it resists attacks, how it handles different data storage needs, how it's tested and deployed, and how problems are detected and diagnosed in production. This guide provides that understanding.

As you work through these final topics, remember that they build on everything from the previous guides. Performance optimization requires understanding modern C# features that reduce allocations. Security depends on proper use of authentication and authorization patterns. Database selection connects to microservices architecture and data consistency models. Testing strategies relate to dependency injection and clean architecture. Everything connects together to form a complete picture of professional .NET development.

Let's begin with performance optimization, understanding how to identify bottlenecks and apply appropriate techniques to make applications fast where it matters.

---

## 49. Performance Optimization Techniques

Performance optimization in .NET applications requires a systematic approach: measure first, identify bottlenecks, optimize the right areas, and validate improvements. Random optimization without measurement wastes time and often makes code more complex without meaningful performance gains. Understanding which techniques to apply in which situations separates developers who can write fast code from those who just write code and hope it's fast.

### Measuring Performance: Profiling and Benchmarking

Before optimizing anything, you must measure current performance to identify actual bottlenecks. Profiling tools show where your application spends time and allocates memory. Benchmarking provides precise measurements of specific code sections to validate that optimizations actually improve performance.

```csharp
// Using BenchmarkDotNet for precise performance measurement
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]
public class StringConcatenationBenchmarks
{
    private const int Iterations = 1000;
    
    [Benchmark(Baseline = true)]
    public string UsingStringConcatenation()
    {
        string result = "";
        for (int i = 0; i < Iterations; i++)
        {
            result += "item" + i;
        }
        return result;
        
        // Performance: ~50ms
        // Memory: ~500KB allocated
        // Creates 1000+ string objects
    }
    
    [Benchmark]
    public string UsingStringBuilder()
    {
        var sb = new StringBuilder();
        for (int i = 0; i < Iterations; i++)
        {
            sb.Append("item");
            sb.Append(i);
        }
        return sb.ToString();
        
        // Performance: ~0.05ms (1000x faster!)
        // Memory: ~20KB allocated
        // Reuses internal buffer
    }
    
    [Benchmark]
    public string UsingStringCreate()
    {
        return string.Create(Iterations * 10, Iterations, (span, count) =>
        {
            int pos = 0;
            for (int i = 0; i < count; i++)
            {
                "item".AsSpan().CopyTo(span.Slice(pos));
                pos += 4;
                
                var numberSpan = span.Slice(pos);
                i.TryFormat(numberSpan, out int written);
                pos += written;
            }
        });
        
        // Performance: ~0.03ms (even faster!)
        // Memory: ~10KB allocated
        // Zero intermediate allocations
    }
}

// Profiling in production with Application Insights
public class OrderService
{
    private readonly TelemetryClient _telemetry;
    
    public async Task<Order> ProcessOrderAsync(int orderId)
    {
        using var operation = _telemetry.StartOperation<RequestTelemetry>("ProcessOrder");
        
        try
        {
            // Track database query performance
            using (_telemetry.StartOperation<DependencyTelemetry>("LoadOrder"))
            {
                var order = await _repository.GetByIdAsync(orderId);
            }
            
            // Track external API call performance
            using (_telemetry.StartOperation<DependencyTelemetry>("ValidatePayment"))
            {
                await _paymentService.ValidateAsync(order.PaymentId);
            }
            
            return order;
        }
        catch (Exception ex)
        {
            operation.Telemetry.Success = false;
            _telemetry.TrackException(ex);
            throw;
        }
    }
}
```

Measurement reveals where optimization effort should focus. If 90% of request time is spent in database queries, optimizing string concatenation won't help. If memory allocations cause frequent garbage collection, reducing allocations provides immediate benefit. Always measure before and after optimization to validate improvements.

### Reducing Memory Allocations

Garbage collection pauses occur when the runtime needs to reclaim memory from objects that are no longer referenced. Frequent allocations, especially of large objects, increase GC pressure and degrade performance. Reducing allocations through object pooling, struct usage, and span-based APIs significantly improves performance in hot paths.

```csharp
// High allocation rate - creates GC pressure
public class HighAllocationService
{
    public async Task ProcessDataAsync(Stream dataStream)
    {
        while (true)
        {
            // Allocates new 8KB buffer for every read
            var buffer = new byte[8192];
            int bytesRead = await dataStream.ReadAsync(buffer, 0, buffer.Length);
            
            if (bytesRead == 0)
                break;
            
            ProcessBuffer(buffer, bytesRead);
        }
        
        // Problem: If processing 1GB of data, this allocates
        // and discards ~130,000 8KB buffers
        // Causes frequent Gen 0 collections
    }
}

// Low allocation using ArrayPool
public class LowAllocationService
{
    public async Task ProcessDataAsync(Stream dataStream)
    {
        // Rent buffer from pool
        var buffer = ArrayPool<byte>.Shared.Rent(8192);
        
        try
        {
            while (true)
            {
                int bytesRead = await dataStream.ReadAsync(buffer, 0, buffer.Length);
                
                if (bytesRead == 0)
                    break;
                
                ProcessBuffer(buffer, bytesRead);
            }
        }
        finally
        {
            // Return buffer to pool for reuse
            ArrayPool<byte>.Shared.Return(buffer);
        }
        
        // Benefit: Reuses same buffer, zero allocations
        // Dramatically reduces GC pressure
    }
}

// Using Span to avoid string allocations
public class SpanOptimizations
{
    // Traditional approach - allocates substring
    public bool StartsWithPrefix_Slow(string input, string prefix)
    {
        if (input.Length < prefix.Length)
            return false;
        
        // Allocates new string for substring
        string beginning = input.Substring(0, prefix.Length);
        return beginning == prefix;
    }
    
    // Span approach - zero allocations
    public bool StartsWithPrefix_Fast(ReadOnlySpan<char> input, ReadOnlySpan<char> prefix)
    {
        if (input.Length < prefix.Length)
            return false;
        
        // Slices the span - no allocation
        return input.Slice(0, prefix.Length).SequenceEqual(prefix);
    }
    
    // Even simpler with built-in method
    public bool StartsWithPrefix_Simplest(ReadOnlySpan<char> input, ReadOnlySpan<char> prefix)
    {
        return input.StartsWith(prefix);
    }
}

// Object pooling for complex objects
public class ObjectPoolExample
{
    private static readonly ObjectPool<StringBuilder> _stringBuilderPool = 
        new DefaultObjectPoolProvider().CreateStringBuilderPool();
    
    public string FormatCustomerData(Customer customer)
    {
        // Rent StringBuilder from pool
        var sb = _stringBuilderPool.Get();
        
        try
        {
            sb.Clear();
            sb.AppendLine($"Customer: {customer.Name}");
            sb.AppendLine($"Email: {customer.Email}");
            sb.AppendLine($"Orders: {customer.OrderCount}");
            
            return sb.ToString();
        }
        finally
        {
            // Return to pool for reuse
            _stringBuilderPool.Return(sb);
        }
    }
}
```

Reducing allocations has cascading benefits. Fewer allocations mean less work for the garbage collector, which means fewer and shorter GC pauses. This translates to better throughput, lower latency, and more predictable performance under load.

### Database Query Optimization

Database queries often represent the biggest performance bottleneck in applications. A slow database query can make an entire request slow, regardless of how optimized the application code is. Understanding query execution plans, proper indexing, and efficient query patterns is crucial.

```csharp
// Inefficient query - N+1 problem
public async Task<List<OrderDto>> GetOrdersWithDetails_Slow(int customerId)
{
    // First query: Get orders
    var orders = await _context.Orders
        .Where(o => o.CustomerId == customerId)
        .ToListAsync();
    
    // N additional queries: Get customer for each order
    foreach (var order in orders)
    {
        // This executes a separate query for EACH order
        order.Customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == order.CustomerId);
    }
    
    return orders.Select(o => new OrderDto
    {
        OrderId = o.Id,
        CustomerName = o.Customer.Name,
        Total = o.Total
    }).ToList();
    
    // Problem: If customer has 100 orders, this executes 101 queries
    // Network roundtrips kill performance
}

// Optimized query - eager loading
public async Task<List<OrderDto>> GetOrdersWithDetails_Fast(int customerId)
{
    // Single query with JOIN
    var orders = await _context.Orders
        .Include(o => o.Customer) // Generates JOIN in SQL
        .Where(o => o.CustomerId == customerId)
        .Select(o => new OrderDto // Project to DTO in database
        {
            OrderId = o.Id,
            CustomerName = o.Customer.Name,
            Total = o.Total
        })
        .ToListAsync();
    
    return orders;
    
    // Benefit: Single database query with JOIN
    // 100x faster for large result sets
}

// Using compiled queries for repeated queries
public class CompiledQueryExample
{
    // Define compiled query once
    private static readonly Func<ApplicationDbContext, int, Task<Customer>> 
        GetCustomerById = EF.CompileAsyncQuery(
            (ApplicationDbContext context, int customerId) =>
                context.Customers
                    .Include(c => c.Orders)
                    .FirstOrDefault(c => c.Id == customerId));
    
    public async Task<Customer> GetCustomerAsync(int customerId)
    {
        // Use compiled query - faster on repeated execution
        return await GetCustomerById(_context, customerId);
        
        // Benefit: Query plan is cached and reused
        // Saves query compilation time on each execution
    }
}

// Pagination for large result sets
public async Task<PagedResult<OrderDto>> GetOrdersPaged(
    int customerId,
    int page,
    int pageSize)
{
    // Get total count (separate optimized query)
    var totalCount = await _context.Orders
        .Where(o => o.CustomerId == customerId)
        .CountAsync();
    
    // Get only requested page
    var orders = await _context.Orders
        .Where(o => o.CustomerId == customerId)
        .OrderByDescending(o => o.OrderDate)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(o => new OrderDto
        {
            OrderId = o.Id,
            OrderDate = o.OrderDate,
            Total = o.Total
        })
        .ToListAsync();
    
    return new PagedResult<OrderDto>
    {
        Items = orders,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize
    };
    
    // Benefit: Only loads data actually needed
    // Doesn't transfer thousands of rows the user won't see
}

// Using AsNoTracking for read-only queries
public async Task<List<ProductDto>> GetProductCatalog()
{
    // No tracking - faster for read-only scenarios
    return await _context.Products
        .AsNoTracking() // Don't track changes
        .Where(p => p.IsActive)
        .Select(p => new ProductDto
        {
            Id = p.Id,
            Name = p.Name,
            Price = p.Price
        })
        .ToListAsync();
    
    // Benefit: EF doesn't create change tracking snapshots
    // Lower memory usage and faster queries
}
```

Database optimization often provides the biggest performance wins because databases are typically the slowest part of the request pipeline. A query that takes 500ms can be reduced to 10ms with proper indexing and query structure, providing a 50x speedup that no amount of application code optimization could match.

### Caching Strategies

Caching stores frequently accessed data in fast storage to avoid repeatedly computing or fetching it. Effective caching dramatically reduces load on databases and external services while improving response times. However, caching introduces complexity around cache invalidation and stale data.

```csharp
// In-memory caching with IMemoryCache
public class ProductService
{
    private readonly IMemoryCache _cache;
    private readonly IProductRepository _repository;
    
    public async Task<Product> GetProductAsync(int productId)
    {
        var cacheKey = $"product_{productId}";
        
        // Try to get from cache
        if (_cache.TryGetValue(cacheKey, out Product product))
        {
            return product;
        }
        
        // Cache miss - load from database
        product = await _repository.GetByIdAsync(productId);
        
        // Store in cache with expiration
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
            SlidingExpiration = TimeSpan.FromMinutes(2)
        };
        
        _cache.Set(cacheKey, product, cacheOptions);
        
        return product;
    }
    
    public async Task UpdateProductAsync(Product product)
    {
        await _repository.UpdateAsync(product);
        
        // Invalidate cache on update
        var cacheKey = $"product_{product.Id}";
        _cache.Remove(cacheKey);
    }
}

// Distributed caching with Redis
public class DistributedCacheService
{
    private readonly IDistributedCache _cache;
    
    public async Task<string> GetOrCreateAsync(
        string key,
        Func<Task<string>> factory,
        TimeSpan expiration)
    {
        // Try to get from distributed cache
        var cachedValue = await _cache.GetStringAsync(key);
        
        if (cachedValue != null)
        {
            return cachedValue;
        }
        
        // Cache miss - generate value
        var value = await factory();
        
        // Store in distributed cache
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration
        };
        
        await _cache.SetStringAsync(key, value, options);
        
        return value;
    }
}

// Cache-aside pattern with complex objects
public class CustomerService
{
    private readonly IDistributedCache _cache;
    private readonly ICustomerRepository _repository;
    
    public async Task<Customer> GetCustomerAsync(int customerId)
    {
        var cacheKey = $"customer_{customerId}";
        
        // Try cache first
        var cachedBytes = await _cache.GetAsync(cacheKey);
        
        if (cachedBytes != null)
        {
            // Deserialize from cache
            return JsonSerializer.Deserialize<Customer>(cachedBytes);
        }
        
        // Cache miss - load from database
        var customer = await _repository.GetByIdAsync(customerId);
        
        if (customer != null)
        {
            // Serialize and cache
            var serialized = JsonSerializer.SerializeToUtf8Bytes(customer);
            await _cache.SetAsync(
                cacheKey,
                serialized,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
                });
        }
        
        return customer;
    }
}

// Response caching for HTTP endpoints
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    [ResponseCache(Duration = 60)] // Cache for 60 seconds
    public async Task<ActionResult<List<ProductDto>>> GetProducts()
    {
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }
    
    [HttpGet("{id}")]
    [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "id" })]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var product = await _productService.GetByIdAsync(id);
        return Ok(product);
    }
}
```

Effective caching requires understanding your data access patterns. Cache data that's expensive to compute or fetch and accessed frequently. Don't cache data that changes constantly or is rarely accessed. Implement proper cache invalidation to prevent serving stale data. Use distributed caching for web farms where multiple servers need to share cache.

### Asynchronous Programming Best Practices

Asynchronous code improves scalability by freeing threads during I/O operations, allowing a server to handle more concurrent requests with the same resources. However, improper async usage can actually hurt performance through context switching overhead and allocation waste.

```csharp
// Good async usage - I/O bound operations
public class GoodAsyncExamples
{
    public async Task<Order> GetOrderWithDetailsAsync(int orderId)
    {
        // Parallel async operations
        var orderTask = _orderRepository.GetByIdAsync(orderId);
        var customerTask = _customerRepository.GetByIdAsync(orderId);
        
        await Task.WhenAll(orderTask, customerTask);
        
        var order = await orderTask;
        var customer = await customerTask;
        
        order.Customer = customer;
        return order;
        
        // Benefit: Both queries run in parallel
        // Halves the total time compared to sequential
    }
}

// Bad async usage - CPU bound operations
public class BadAsyncExamples
{
    // DON'T DO THIS - no benefit for CPU-bound work
    public async Task<int> CalculateFactorial(int n)
    {
        return await Task.Run(() =>
        {
            int result = 1;
            for (int i = 2; i <= n; i++)
            {
                result *= i;
            }
            return result;
        });
        
        // Problem: Task.Run adds overhead without benefit
        // CPU-bound work should be synchronous
        // Or use parallel processing for large datasets
    }
    
    // CORRECT - synchronous for CPU-bound work
    public int CalculateFactorial_Correct(int n)
    {
        int result = 1;
        for (int i = 2; i <= n; i++)
        {
            result *= i;
        }
        return result;
    }
}

// Avoiding async/await overhead with ValueTask
public class ValueTaskOptimizations
{
    private readonly Dictionary<int, Product> _cache = new();
    
    // Returns ValueTask to avoid allocation when cached
    public ValueTask<Product> GetProductAsync(int productId)
    {
        // Synchronous path - cache hit
        if (_cache.TryGetValue(productId, out var product))
        {
            return new ValueTask<Product>(product);
        }
        
        // Asynchronous path - cache miss
        return new ValueTask<Product>(LoadProductAsync(productId));
    }
    
    private async Task<Product> LoadProductAsync(int productId)
    {
        var product = await _repository.GetByIdAsync(productId);
        _cache[productId] = product;
        return product;
    }
}
```

### Interview Talking Points

When discussing performance optimization in interviews, emphasize the importance of measuring before optimizing to identify actual bottlenecks. Discuss techniques like reducing allocations through ArrayPool and Span, optimizing database queries with eager loading and pagination, implementing effective caching strategies, and proper asynchronous programming patterns. Mention that performance optimization requires understanding trade-offs between code complexity and actual performance gains. Understanding these techniques demonstrates the ability to build scalable, performant applications rather than just functional ones.

---

## 50. Security Best Practices

Security in .NET applications requires defense in depth—multiple layers of protection that work together to prevent attacks. No single security measure is perfect, but combining authentication, authorization, input validation, data protection, and secure coding practices creates robust defenses against common threats.

### Authentication and Authorization

Authentication verifies who users are, while authorization determines what they can do. Modern .NET applications typically use JWT tokens for stateless authentication and claims-based authorization for fine-grained access control.

```csharp
// JWT authentication configuration
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = Configuration["Jwt:Issuer"],
                    ValidAudience = Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(Configuration["Jwt:SecretKey"])),
                    ClockSkew = TimeSpan.Zero // Remove default 5 minute leeway
                };
                
                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        if (context.Exception is SecurityTokenExpiredException)
                        {
                            context.Response.Headers.Add("Token-Expired", "true");
                        }
                        return Task.CompletedTask;
                    }
                };
            });
        
        services.AddAuthorization(options =>
        {
            // Policy-based authorization
            options.AddPolicy("RequireAdministratorRole",
                policy => policy.RequireRole("Administrator"));
            
            options.AddPolicy("RequireManagerOrHigher",
                policy => policy.RequireAssertion(context =>
                    context.User.IsInRole("Manager") ||
                    context.User.IsInRole("Administrator")));
            
            options.AddPolicy("RequireCustomerAccess",
                policy => policy.Requirements.Add(new CustomerAccessRequirement()));
        });
        
        services.AddScoped<IAuthorizationHandler, CustomerAccessHandler>();
    }
}

// Custom authorization requirement
public class CustomerAccessRequirement : IAuthorizationRequirement
{
}

public class CustomerAccessHandler : AuthorizationHandler<CustomerAccessRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CustomerAccessRequirement requirement)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // Get customer ID from route
        var customerId = httpContext.GetRouteValue("customerId")?.ToString();
        
        // Check if user owns this customer record
        if (userId == customerId || context.User.IsInRole("Administrator"))
        {
            context.Succeed(requirement);
        }
        
        return Task.CompletedTask;
    }
}

// Using authorization in controllers
[ApiController]
[Route("api/customers")]
[Authorize] // Requires authentication
public class CustomersController : ControllerBase
{
    [HttpGet("{customerId}")]
    [Authorize(Policy = "RequireCustomerAccess")] // Custom policy
    public async Task<ActionResult<CustomerDto>> GetCustomer(int customerId)
    {
        // User is authenticated and authorized
        var customer = await _customerService.GetByIdAsync(customerId);
        return Ok(customer);
    }
    
    [HttpDelete("{customerId}")]
    [Authorize(Roles = "Administrator")] // Role-based
    public async Task<ActionResult> DeleteCustomer(int customerId)
    {
        await _customerService.DeleteAsync(customerId);
        return NoContent();
    }
}
```

### Input Validation and Sanitization

Never trust user input. All data from clients must be validated and sanitized to prevent injection attacks, script execution, and data corruption.

```csharp
// Input validation with FluentValidation
public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.CustomerId)
            .GreaterThan(0)
            .WithMessage("Customer ID must be positive");
        
        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Order must contain at least one item");
        
        RuleForEach(x => x.Items)
            .SetValidator(new OrderItemValidator());
        
        RuleFor(x => x.ShippingAddress)
            .NotEmpty()
            .MaximumLength(500)
            .WithMessage("Shipping address is required and must be under 500 characters");
        
        RuleFor(x => x.Email)
            .EmailAddress()
            .WithMessage("Invalid email format");
    }
}

// SQL injection prevention with parameterized queries
public class SecureDatabaseAccess
{
    // WRONG - vulnerable to SQL injection
    public async Task<Customer> GetCustomer_Unsafe(string email)
    {
        // DON'T DO THIS
        var sql = $"SELECT * FROM Customers WHERE Email = '{email}'";
        return await _connection.QueryFirstOrDefaultAsync<Customer>(sql);
        
        // Attack: email = "'; DROP TABLE Customers; --"
        // Executes: SELECT * FROM Customers WHERE Email = ''; DROP TABLE Customers; --'
    }
    
    // CORRECT - parameterized query
    public async Task<Customer> GetCustomer_Safe(string email)
    {
        var sql = "SELECT * FROM Customers WHERE Email = @Email";
        return await _connection.QueryFirstOrDefaultAsync<Customer>(
            sql,
            new { Email = email });
        
        // Parameter is safely escaped
        // No SQL injection possible
    }
    
    // Even better - use EF Core
    public async Task<Customer> GetCustomer_EFCore(string email)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == email);
        
        // EF Core automatically uses parameterized queries
        // Completely safe from SQL injection
    }
}

// XSS prevention with output encoding
public class XssPreventionExample
{
    // WRONG - vulnerable to XSS
    [HttpPost("comment")]
    public IActionResult AddComment_Unsafe(string comment)
    {
        // Storing raw HTML from user
        _repository.AddComment(comment);
        return Ok();
        
        // Attack: comment = "<script>alert('XSS')</script>"
        // When displayed, executes JavaScript in other users' browsers
    }
    
    // CORRECT - sanitize input
    [HttpPost("comment")]
    public IActionResult AddComment_Safe(string comment)
    {
        // HTML encode user input
        var sanitized = HttpUtility.HtmlEncode(comment);
        _repository.AddComment(sanitized);
        return Ok();
        
        // Stored as: &lt;script&gt;alert('XSS')&lt;/script&gt;
        // Displays as text, doesn't execute
    }
    
    // For rich text, use approved HTML sanitizer
    public string SanitizeRichText(string html)
    {
        var sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Add("b");
        sanitizer.AllowedTags.Add("i");
        sanitizer.AllowedTags.Add("p");
        // Don't allow <script>, <iframe>, etc.
        
        return sanitizer.Sanitize(html);
    }
}
```

### Data Protection and Encryption

Sensitive data must be encrypted both in transit (HTTPS) and at rest (database encryption). Passwords must never be stored in plain text—use strong hashing with salt.

```csharp
// Password hashing with ASP.NET Core Identity
public class PasswordHashingExample
{
    private readonly IPasswordHasher<User> _passwordHasher;
    
    public async Task<User> RegisterUserAsync(string email, string password)
    {
        var user = new User
        {
            Email = email,
            UserName = email
        };
        
        // Hash password with built-in strong hashing
        user.PasswordHash = _passwordHasher.HashPassword(user, password);
        
        await _userRepository.AddAsync(user);
        return user;
        
        // Stored hash example:
        // AQAAAAEAACcQAAAAEFtOkKZ5xFKzxQZJvF7...
        // Algorithm identifier + salt + hash
    }
    
    public async Task<bool> ValidatePasswordAsync(string email, string password)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
            return false;
        
        // Verify password against hash
        var result = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            password);
        
        return result == PasswordVerificationResult.Success;
    }
}

// Data encryption with Data Protection API
public class SensitiveDataEncryption
{
    private readonly IDataProtector _protector;
    
    public SensitiveDataEncryption(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("SensitiveData");
    }
    
    public string EncryptSocialSecurity(string ssn)
    {
        return _protector.Protect(ssn);
    }
    
    public string DecryptSocialSecurity(string encryptedSsn)
    {
        return _protector.Unprotect(encryptedSsn);
    }
}

// Secure configuration with Azure Key Vault
public class SecureConfigurationExample
{
    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration((context, config) =>
            {
                if (!context.HostingEnvironment.IsDevelopment())
                {
                    var builtConfig = config.Build();
                    var keyVaultEndpoint = builtConfig["KeyVault:Endpoint"];
                    
                    // Load secrets from Azure Key Vault
                    config.AddAzureKeyVault(
                        new Uri(keyVaultEndpoint),
                        new DefaultAzureCredential());
                }
            });
}
```

### Interview Talking Points

When discussing security in interviews, emphasize defense in depth with multiple protection layers. Discuss authentication versus authorization and policy-based access control. Explain input validation, SQL injection prevention through parameterized queries, and XSS prevention through output encoding. Mention password hashing with salt, data encryption at rest and in transit, and secure secret storage in Key Vault. Understanding security demonstrates professional-level awareness of application vulnerabilities and protection strategies.

---

*[Continuing with remaining topics 51-54 in condensed format to complete Guide 5...]*

## 51. SQL vs NoSQL Database Selection

Choosing between SQL and NoSQL databases depends on data structure, consistency requirements, query patterns, and scale needs.

```csharp
// SQL databases - structured data, ACID transactions
// Use when: Complex joins, strict consistency, reporting queries
public class SqlDatabaseExample
{
    // Relational model with foreign keys
    public class Order
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public Customer Customer { get; set; }
        public List<OrderLine> OrderLines { get; set; }
    }
    
    // Complex query with joins
    public async Task<List<OrderReport>> GetOrderReport()
    {
        return await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.OrderLines)
            .ThenInclude(ol => ol.Product)
            .Where(o => o.OrderDate >= DateTime.Now.AddMonths(-1))
            .GroupBy(o => o.Customer.Region)
            .Select(g => new OrderReport
            {
                Region = g.Key,
                TotalOrders = g.Count(),
                TotalRevenue = g.Sum(o => o.Total)
            })
            .ToListAsync();
    }
}

// NoSQL databases - flexible schema, horizontal scaling
// Use when: High write throughput, denormalized data, simple queries
public class NoSqlDatabaseExample
{
    private readonly CosmosClient _cosmosClient;
    
    // Document model - self-contained
    public class OrderDocument
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }
        
        public string CustomerId { get; set; }
        public string CustomerName { get; set; } // Denormalized
        public List<OrderLineDocument> Items { get; set; }
        public decimal Total { get; set; }
        public DateTime OrderDate { get; set; }
    }
    
    // Point read - extremely fast
    public async Task<OrderDocument> GetOrder(string orderId, string customerId)
    {
        var container = _cosmosClient.GetContainer("store", "orders");
        var response = await container.ReadItemAsync<OrderDocument>(
            orderId,
            new PartitionKey(customerId));
        
        return response.Resource;
        
        // Single-digit millisecond latency
        // Much faster than SQL joins
    }
}
```

**Key Points**: Use SQL for complex relationships, transactions, and analytical queries. Use NoSQL for high throughput, flexible schemas, and simple access patterns. Consider hybrid approaches using both for different parts of your system.

## 52. Testing Strategies

Comprehensive testing provides confidence in code correctness while remaining maintainable. Different test types serve different purposes.

```csharp
// Unit tests - fast, isolated, test single components
public class OrderServiceTests
{
    [Fact]
    public async Task CreateOrder_ValidRequest_ReturnsOrder()
    {
        // Arrange
        var mockRepository = new Mock<IOrderRepository>();
        var service = new OrderService(mockRepository.Object);
        var request = new CreateOrderRequest
        {
            CustomerId = 1,
            Items = new List<OrderItem> { /* ... */ }
        };
        
        // Act
        var result = await service.CreateOrderAsync(request);
        
        // Assert
        Assert.NotNull(result);
        mockRepository.Verify(r => r.AddAsync(It.IsAny<Order>()), Times.Once);
    }
}

// Integration tests - test multiple components together
public class OrderApiIntegrationTests : IClassFixture<WebApplicationFactory<Startup>>
{
    private readonly HttpClient _client;
    
    public OrderApiIntegrationTests(WebApplicationFactory<Startup> factory)
    {
        _client = factory.CreateClient();
    }
    
    [Fact]
    public async Task CreateOrder_ReturnsCreatedOrder()
    {
        // Arrange
        var request = new CreateOrderRequest { /* ... */ };
        var content = JsonContent.Create(request);
        
        // Act
        var response = await _client.PostAsync("/api/orders", content);
        
        // Assert
        response.EnsureSuccessStatusCode();
        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        Assert.NotNull(order);
    }
}
```

**Key Points**: Unit tests verify individual components in isolation. Integration tests verify components working together. E2E tests verify complete user scenarios. Balance test pyramid with more unit tests than integration tests, and more integration tests than E2E tests.

## 53. CI/CD Pipelines

Automated pipelines enable rapid, safe deployments through consistent build, test, and deployment processes.

```yaml
# Azure DevOps pipeline example
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - task: UseDotNet@2
            inputs:
              version: '8.x'
          
          - task: DotNetCoreCLI@2
            displayName: 'Restore'
            inputs:
              command: 'restore'
          
          - task: DotNetCoreCLI@2
            displayName: 'Build'
            inputs:
              command: 'build'
              arguments: '--configuration Release'
          
          - task: DotNetCoreCLI@2
            displayName: 'Test'
            inputs:
              command: 'test'
              arguments: '--configuration Release --collect:"XPlat Code Coverage"'
          
          - task: DotNetCoreCLI@2
            displayName: 'Publish'
            inputs:
              command: 'publish'
              arguments: '--configuration Release --output $(Build.ArtifactStagingDirectory)'
          
          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'drop'

  - stage: Deploy
    dependsOn: Build
    jobs:
      - deployment: DeployToProduction
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'MyAzureSubscription'
                    appName: 'my-api-app'
                    package: '$(Pipeline.Workspace)/drop/*.zip'
```

**Key Points**: Automate build, test, and deployment. Run tests on every commit. Deploy to staging before production. Use blue-green deployments for zero-downtime updates. Implement automated rollback on failure.

## 54. Monitoring and Observability

Monitoring provides visibility into production system health and performance through metrics, logs, and distributed tracing.

```csharp
// Structured logging with Serilog
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .Enrich.FromLogContext()
            .WriteTo.Console()
            .WriteTo.ApplicationInsights(TelemetryConverter.Traces)
            .CreateLogger();
        
        services.AddLogging(builder =>
        {
            builder.AddSerilog();
        });
        
        services.AddApplicationInsightsTelemetry();
    }
}

// Logging with correlation IDs
public class OrderController : ControllerBase
{
    private readonly ILogger<OrderController> _logger;
    
    [HttpPost]
    public async Task<IActionResult> CreateOrder(CreateOrderRequest request)
    {
        var correlationId = Guid.NewGuid();
        
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId,
            ["CustomerId"] = request.CustomerId
        }))
        {
            _logger.LogInformation("Creating order for customer {CustomerId}", request.CustomerId);
            
            try
            {
                var order = await _orderService.CreateOrderAsync(request);
                _logger.LogInformation("Order created successfully: {OrderId}", order.Id);
                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create order");
                throw;
            }
        }
    }
}

// Health checks for monitoring
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("database")
            .AddCheck<RedisHealthCheck>("redis")
            .AddCheck<DiskSpaceHealthCheck>("diskspace");
    }
    
    public void Configure(IApplicationBuilder app)
    {
        app.UseHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = async (context, report) =>
            {
                context.Response.ContentType = "application/json";
                var response = new
                {
                    status = report.Status.ToString(),
                    checks = report.Entries.Select(e => new
                    {
                        name = e.Key,
                        status = e.Value.Status.ToString(),
                        description = e.Value.Description
                    })
                };
                await context.Response.WriteAsJsonAsync(response);
            }
        });
    }
}
```

**Key Points**: Use structured logging with correlation IDs for distributed tracing. Implement health checks for monitoring system components. Track metrics like request rates, error rates, and latencies. Use Application Insights or similar for centralized observability. Set up alerts for critical issues.

---

## Summary and Key Takeaways

Congratulations! You've completed the entire .NET interview preparation series, covering 54 essential topics across five comprehensive guides.

### Performance and Security Mastery

You understand systematic performance optimization through profiling and benchmarking. You can reduce allocations with ArrayPool and Span, optimize database queries with proper indexing and eager loading, implement effective caching strategies, and use async programming appropriately. You know security best practices including authentication and authorization, input validation, SQL injection prevention, XSS protection, password hashing, and data encryption.

### Complete .NET Knowledge

Across all five guides, you've mastered:
- **Core C# fundamentals**: Method polymorphism, concurrency, equality, collections
- **Modern features**: LINQ, records, pattern matching, C# 12 features, Span/Memory
- **Cloud-native architecture**: Microservices, containers, service discovery, gRPC
- **Enterprise patterns**: CQRS, Event Sourcing, DDD, Repository/UnitOfWork
- **Production readiness**: Performance, security, testing, CI/CD, monitoring

### Interview Confidence

You can now discuss .NET development at a senior level, understanding not just how to write code but how to architect systems, optimize performance, ensure security, choose appropriate technologies, and operate applications in production. You can articulate trade-offs, explain when patterns apply, and demonstrate deep understanding of the platform.

Use these guides as reference material before interviews, reviewing topics relevant to the position. Focus on understanding concepts deeply rather than memorizing answers. Practice explaining topics out loud to solidify understanding. Good luck with your interviews!

---

*End of Guide 5: Performance and Security*
*End of Complete .NET Interview Preparation Series*
EOF
