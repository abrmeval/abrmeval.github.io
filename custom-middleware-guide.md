# Custom Middleware in ASP.NET Core: A Complete Guide

## What is Middleware?

Middleware is the fundamental building block of the ASP.NET Core request processing pipeline. Think of it like a series of connected pipes where water (the HTTP request) flows through each pipe in sequence, and each pipe can inspect, modify, or even stop the flow entirely.

Every HTTP request that enters your ASP.NET Core application passes through a chain of middleware components. Each component has the power to perform operations before and after the next component in the pipeline, creating a bidirectional processing model that's both elegant and powerful.

## The Request Pipeline Mental Model

Imagine the pipeline as a stack of donuts on a stick. When a request comes in, it enters through the top donut, passes through each one in order, reaches the innermost component (typically your controller or endpoint), and then travels back out through each donut in reverse order. This gives every middleware two opportunities to act: once on the way in (before the next middleware) and once on the way out (after the next middleware completes).

```
Request → Middleware 1 → Middleware 2 → Middleware 3 → Endpoint
                                                          ↓
Response ← Middleware 1 ← Middleware 2 ← Middleware 3 ←────┘
```

This bidirectional flow is why middleware is perfect for cross-cutting concerns like logging (log both the incoming request and outgoing response), authentication (validate before processing, potentially modify response headers after), and performance monitoring (capture timing for the entire request lifecycle).

## How Middleware Works Internally

At its core, middleware in ASP.NET Core follows a simple delegate pattern. The framework defines a `RequestDelegate` which represents a function that takes an `HttpContext` and returns a `Task`:

```csharp
// This is the fundamental signature that powers the entire pipeline
public delegate Task RequestDelegate(HttpContext context);
```

Each middleware component receives the `HttpContext` (containing both the request and response) and a reference to the next middleware in the chain. The middleware decides whether to call the next component, what to do before calling it, and what to do after it returns.

## Creating Custom Middleware: Three Approaches

### Approach 1: Inline Middleware with Use, Map, and Run

The simplest way to add middleware is inline in your `Program.cs`. This approach works well for quick, simple logic or prototyping:

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Use: Adds middleware that calls the next middleware
app.Use(async (context, next) =>
{
    // Code here runs BEFORE the next middleware
    var requestPath = context.Request.Path;
    Console.WriteLine($"Incoming request to: {requestPath}");
    
    // Call the next middleware in the pipeline
    await next(context);
    
    // Code here runs AFTER the next middleware returns
    Console.WriteLine($"Response status: {context.Response.StatusCode}");
});

// Map: Branches the pipeline based on request path
app.Map("/api/health", healthApp =>
{
    healthApp.Run(async context =>
    {
        await context.Response.WriteAsync("Healthy!");
    });
});

// Run: Terminal middleware that doesn't call next
app.Run(async context =>
{
    await context.Response.WriteAsync("Hello from terminal middleware!");
});

app.Run();
```

Understanding the distinction between `Use`, `Map`, and `Run` is crucial:

The `Use` extension adds middleware that typically calls the next delegate. It's the workhorse for most middleware scenarios where you want to process the request, let the rest of the pipeline handle it, and then potentially do something with the response.

The `Map` extension creates a branch in the pipeline based on the request path. When a request matches the specified path, it goes down that branch instead of continuing along the main pipeline. This is useful for creating isolated sub-applications or handling specific route prefixes differently.

The `Run` extension adds terminal middleware that never calls the next delegate. It's the end of the line for any request that reaches it. You typically use this for fallback handlers or endpoints that don't need further processing.

### Approach 2: Convention-Based Middleware Classes

For reusable, testable middleware, create a dedicated class following the convention-based pattern:

```csharp
/// <summary>
/// Middleware that measures and logs the time taken to process each request.
/// This demonstrates the complete lifecycle of a middleware component.
/// </summary>
public class RequestTimingMiddleware
{
    // The next middleware in the pipeline - injected via constructor
    private readonly RequestDelegate _next;
    
    // Dependencies can be injected via constructor for singleton-scoped services
    private readonly ILogger<RequestTimingMiddleware> _logger;

    public RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
    {
        // The framework automatically passes the next delegate
        _next = next;
        _logger = logger;
    }

    // The method must be named Invoke or InvokeAsync
    // It receives HttpContext and can accept scoped services as additional parameters
    public async Task InvokeAsync(HttpContext context)
    {
        // BEFORE: Code here runs before the rest of the pipeline
        var stopwatch = Stopwatch.StartNew();
        var requestId = Guid.NewGuid().ToString("N")[..8];
        
        // Add a header so downstream code can reference this request
        context.Items["RequestId"] = requestId;
        
        _logger.LogInformation(
            "Request {RequestId} started: {Method} {Path}",
            requestId,
            context.Request.Method,
            context.Request.Path);

        try
        {
            // Pass control to the next middleware
            await _next(context);
        }
        finally
        {
            // AFTER: Code here runs after the rest of the pipeline completes
            stopwatch.Stop();
            
            _logger.LogInformation(
                "Request {RequestId} completed in {ElapsedMs}ms with status {StatusCode}",
                requestId,
                stopwatch.ElapsedMilliseconds,
                context.Response.StatusCode);
        }
    }
}
```

To register convention-based middleware, create an extension method for clean, discoverable configuration:

```csharp
/// <summary>
/// Extension methods for registering custom middleware in the application pipeline.
/// Following this pattern keeps Program.cs clean and middleware configuration discoverable.
/// </summary>
public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseRequestTiming(this IApplicationBuilder app)
    {
        return app.UseMiddleware<RequestTimingMiddleware>();
    }
}

// In Program.cs - clean and expressive
app.UseRequestTiming();
```

### Approach 3: Factory-Based Middleware with IMiddleware

When your middleware needs scoped dependencies (services created fresh for each request), implement the `IMiddleware` interface:

```csharp
/// <summary>
/// Middleware that validates API keys using a scoped database context.
/// Implements IMiddleware for proper scoped dependency injection.
/// </summary>
public class ApiKeyValidationMiddleware : IMiddleware
{
    // Scoped dependencies are injected per-request when using IMiddleware
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ApiKeyValidationMiddleware> _logger;

    public ApiKeyValidationMiddleware(
        ApplicationDbContext dbContext,
        ILogger<ApiKeyValidationMiddleware> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // Skip validation for non-API routes
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await next(context);
            return;
        }

        // Extract API key from header
        if (!context.Request.Headers.TryGetValue("X-API-Key", out var apiKeyHeader))
        {
            _logger.LogWarning("API request without API key from {IP}", 
                context.Connection.RemoteIpAddress);
            
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "API key required" });
            return;
        }

        // Validate against database (using scoped DbContext)
        var apiKey = apiKeyHeader.ToString();
        var isValid = await _dbContext.ApiKeys
            .AnyAsync(k => k.Key == apiKey && k.IsActive && k.ExpiresAt > DateTime.UtcNow);

        if (!isValid)
        {
            _logger.LogWarning("Invalid API key attempted: {KeyPrefix}...", 
                apiKey[..Math.Min(8, apiKey.Length)]);
            
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid or expired API key" });
            return;
        }

        // Key is valid - continue to next middleware
        await next(context);
    }
}
```

Factory-based middleware requires explicit service registration:

```csharp
// In Program.cs - must register as a service
builder.Services.AddScoped<ApiKeyValidationMiddleware>();

// Then use it in the pipeline
app.UseMiddleware<ApiKeyValidationMiddleware>();
```

## When to Implement Custom Middleware

### Ideal Use Cases for Custom Middleware

**Cross-cutting concerns that apply to many or all requests** are the primary candidates. These are behaviors that shouldn't be duplicated in every controller or service:

Request logging and correlation ID generation ensures every request can be traced through your system. By adding a correlation ID at the middleware level, all downstream logging automatically includes it.

Performance monitoring and metrics collection captures timing data for every request without modifying business logic. This data feeds into dashboards and alerting systems.

Global exception handling catches unhandled exceptions, logs them appropriately, and returns consistent error responses. This prevents stack traces from leaking to clients while ensuring nothing goes unlogged.

Authentication and authorization verification at the pipeline level ensures security checks happen before any business code executes. While ASP.NET Core provides built-in middleware for this, custom requirements often warrant custom middleware.

Request and response transformation handles concerns like compression, encryption, or format conversion uniformly across the application.

Rate limiting and throttling protects your API from abuse by tracking and limiting requests at the infrastructure level, before consuming expensive resources.

**Health checks and diagnostics** can short-circuit processing early, returning status information without invoking the full application stack.

### When NOT to Use Middleware

Understanding when middleware isn't the right tool is equally important:

**Business logic belongs in services and controllers.** Middleware should be agnostic to your domain. If you find yourself checking for specific entity types or business rules in middleware, that logic probably belongs elsewhere.

**Route-specific behavior often fits better in action filters.** If logic only applies to certain controllers or actions, action filters provide more targeted, discoverable configuration.

**Model validation and transformation** at the controller level is handled well by model binding and validation attributes. Middleware operates before model binding, so it works with raw request data.

**Response caching for specific endpoints** works better with the built-in response caching attributes or output caching, which integrate with the framework's caching infrastructure.

## Middleware Order: Why It Matters

The order in which you add middleware to the pipeline is critical. Each middleware only sees what previous middleware has done and can only affect what happens after it. Consider this pipeline:

```csharp
var app = builder.Build();

// 1. Exception handling wraps everything - must be first
app.UseExceptionHandler("/error");

// 2. HTTPS redirection happens before any processing
app.UseHttpsRedirection();

// 3. Static files can short-circuit before authentication
app.UseStaticFiles();

// 4. Routing determines which endpoint will handle the request
app.UseRouting();

// 5. CORS must come after routing but before auth for preflight requests
app.UseCors();

// 6. Authentication identifies who the user is
app.UseAuthentication();

// 7. Authorization determines what the user can access
app.UseAuthorization();

// 8. Custom middleware for logging, metrics, etc.
app.UseRequestTiming();

// 9. Endpoints execute the actual request handlers
app.MapControllers();
```

Getting this order wrong leads to subtle bugs. For example, placing authentication before routing means authentication runs even for routes that don't require it. Placing exception handling after other middleware means exceptions in that middleware won't be caught.

## Advanced Middleware Patterns

### Conditional Middleware Execution

Sometimes middleware should only run for certain requests. Use `UseWhen` for conditional branching that rejoins the main pipeline:

```csharp
// Only apply API key validation to /api routes, then rejoin main pipeline
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/api"),
    appBuilder => appBuilder.UseMiddleware<ApiKeyValidationMiddleware>());

// MapWhen creates a permanent branch (doesn't rejoin)
app.MapWhen(
    context => context.Request.Query.ContainsKey("debug"),
    appBuilder => appBuilder.Run(async context =>
    {
        await context.Response.WriteAsJsonAsync(new
        {
            headers = context.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()),
            path = context.Request.Path.Value,
            query = context.Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString())
        });
    }));
```

### Response Body Manipulation

Modifying the response body requires careful handling because the response stream is forward-only by default:

```csharp
/// <summary>
/// Middleware that wraps all API responses in a standard envelope format.
/// Demonstrates response body manipulation by replacing the response stream.
/// </summary>
public class ResponseWrappingMiddleware
{
    private readonly RequestDelegate _next;

    public ResponseWrappingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only wrap API responses
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        // Capture the original response body stream
        var originalBodyStream = context.Response.Body;

        try
        {
            // Replace with a memory stream we can read from
            using var memoryStream = new MemoryStream();
            context.Response.Body = memoryStream;

            // Let the rest of the pipeline write to our memory stream
            await _next(context);

            // Read what was written
            memoryStream.Position = 0;
            var responseBody = await new StreamReader(memoryStream).ReadToEndAsync();

            // Create wrapped response
            var wrappedResponse = new
            {
                success = context.Response.StatusCode >= 200 && context.Response.StatusCode < 300,
                statusCode = context.Response.StatusCode,
                timestamp = DateTime.UtcNow,
                data = string.IsNullOrEmpty(responseBody) ? null : JsonSerializer.Deserialize<object>(responseBody)
            };

            // Write the wrapped response to the original stream
            context.Response.Body = originalBodyStream;
            context.Response.ContentType = "application/json";
            
            await context.Response.WriteAsJsonAsync(wrappedResponse);
        }
        finally
        {
            // Ensure we restore the original stream
            context.Response.Body = originalBodyStream;
        }
    }
}
```

### Middleware with Options Pattern

For configurable middleware, follow the options pattern that ASP.NET Core uses throughout:

```csharp
/// <summary>
/// Configuration options for the rate limiting middleware.
/// </summary>
public class RateLimitingOptions
{
    public int MaxRequestsPerMinute { get; set; } = 60;
    public int MaxRequestsPerHour { get; set; } = 1000;
    public bool IncludeRetryAfterHeader { get; set; } = true;
    public Func<HttpContext, string>? ClientIdResolver { get; set; }
}

/// <summary>
/// Middleware that enforces rate limits using a sliding window algorithm.
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly RateLimitingOptions _options;
    private readonly IMemoryCache _cache;

    public RateLimitingMiddleware(
        RequestDelegate next,
        IOptions<RateLimitingOptions> options,
        IMemoryCache cache)
    {
        _next = next;
        _options = options.Value;
        _cache = cache;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Resolve client identifier (IP by default, or custom resolver)
        var clientId = _options.ClientIdResolver?.Invoke(context) 
            ?? context.Connection.RemoteIpAddress?.ToString() 
            ?? "unknown";

        var cacheKey = $"ratelimit:{clientId}";
        
        // Get or create request tracking for this client
        var requestCount = _cache.GetOrCreate(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
            return 0;
        });

        if (requestCount >= _options.MaxRequestsPerMinute)
        {
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            
            if (_options.IncludeRetryAfterHeader)
            {
                context.Response.Headers["Retry-After"] = "60";
            }
            
            await context.Response.WriteAsJsonAsync(new 
            { 
                error = "Rate limit exceeded",
                retryAfterSeconds = 60
            });
            return;
        }

        // Increment counter
        _cache.Set(cacheKey, requestCount + 1, TimeSpan.FromMinutes(1));

        await _next(context);
    }
}

/// <summary>
/// Extension methods for rate limiting middleware registration.
/// </summary>
public static class RateLimitingMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(
        this IApplicationBuilder app,
        Action<RateLimitingOptions>? configureOptions = null)
    {
        var options = new RateLimitingOptions();
        configureOptions?.Invoke(options);
        
        return app.UseMiddleware<RateLimitingMiddleware>(Options.Create(options));
    }
}

// Usage in Program.cs
app.UseRateLimiting(options =>
{
    options.MaxRequestsPerMinute = 100;
    options.ClientIdResolver = ctx => ctx.User.Identity?.Name ?? ctx.Connection.RemoteIpAddress?.ToString();
});
```

## Testing Custom Middleware

Middleware should be thoroughly tested. Here's a pattern for unit testing:

```csharp
public class RequestTimingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_LogsRequestDuration()
    {
        // Arrange
        var logger = new Mock<ILogger<RequestTimingMiddleware>>();
        var context = new DefaultHttpContext();
        context.Request.Method = "GET";
        context.Request.Path = "/api/test";

        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new RequestTimingMiddleware(next, logger.Object);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled, "Next middleware should be called");
        Assert.True(context.Items.ContainsKey("RequestId"), "RequestId should be added to Items");
        
        // Verify logging was called (simplified - production tests would be more specific)
        logger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeast(2));
    }

    [Fact]
    public async Task InvokeAsync_LogsEvenWhenNextThrows()
    {
        // Arrange
        var logger = new Mock<ILogger<RequestTimingMiddleware>>();
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/failing";

        RequestDelegate next = (ctx) => throw new InvalidOperationException("Test exception");

        var middleware = new RequestTimingMiddleware(next, logger.Object);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => middleware.InvokeAsync(context));
        
        // Verify completion log still fired (in finally block)
        logger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("completed")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}
```

For integration testing with `WebApplicationFactory`:

```csharp
public class MiddlewareIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public MiddlewareIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task RequestTimingMiddleware_AddsCorrelationIdHeader()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/test");

        // Assert - verify middleware effects are visible in response
        // (You might expose correlation ID in a response header for testing)
        Assert.True(response.Headers.Contains("X-Correlation-Id"));
    }
}
```

## Common Pitfalls and Best Practices

**Always call next() unless you intend to short-circuit.** Forgetting to await `next(context)` means the rest of your pipeline never executes. This is a common source of "my endpoint never gets called" bugs.

**Don't modify the response after calling next().** Once the response has started being written to the client, you cannot modify headers or status codes. Check `context.Response.HasStarted` before attempting modifications.

**Be careful with exception handling.** If your middleware catches exceptions, ensure you either handle them completely or rethrow them. Swallowing exceptions silently makes debugging nightmarish.

**Use async all the way.** Never use `.Result` or `.Wait()` on tasks in middleware. This blocks threads and can cause deadlocks under load.

**Consider performance implications.** Middleware runs for every request (unless conditionally applied). Avoid expensive operations like database queries unless absolutely necessary, and consider caching results.

**Don't store state in middleware fields.** Convention-based middleware is singleton by default. Any mutable instance fields will be shared across all requests, causing race conditions. Use `HttpContext.Items` for per-request state.

## Summary

Custom middleware is a powerful tool for implementing cross-cutting concerns in ASP.NET Core applications. The key concepts to remember are the bidirectional request/response flow, the three creation approaches (inline, convention-based, and factory-based), the critical importance of middleware ordering, and the appropriate use cases where middleware shines versus where other patterns work better.

When you implement middleware thoughtfully, following the patterns and practices outlined here, you create infrastructure that's transparent, testable, and maintainable. Your business logic stays focused on domain concerns while cross-cutting infrastructure handles the plumbing consistently across your entire application.
