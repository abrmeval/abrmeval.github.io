---
title: "Azure Functions Hosting Plans"
sidebar_label: "Hosting Plans"
sidebar_position: 2
tags: [azure, azure-functions]
---

# Azure Functions Hosting Plans: A Complete Guide to Choosing Your Execution Model

## The Fundamental Question: Where Does Your Code Actually Run?

When you write an Azure Function, you're writing code that needs to execute somewhere. That "somewhere" is the hosting plan—the underlying compute infrastructure that runs your worker processes, handles scaling, and determines how you're billed. Choosing the right plan isn't just a technical decision; it's a business decision that affects your costs, performance characteristics, and operational model.

Think of hosting plans like choosing transportation for a journey. You could take a taxi (Consumption plan)—you only pay when you're moving, but you might wait for one to arrive. You could lease a car (Premium plan)—it's always ready when you need it, and you can get a bigger one if needed, but you pay whether you drive or not. You could buy a fleet of vehicles (Dedicated plan)—maximum control and capacity, but significant fixed costs. Or you could use a new ride-share model (Flex Consumption)—combines pay-per-use with guaranteed availability.

Each option makes sense in different contexts. Understanding those contexts deeply will help you make the right choice for your specific needs.

## The Consumption Plan: True Serverless Computing

The Consumption plan represents the original vision of serverless computing in its purest form. You deploy your code, Azure runs it when triggered, and you pay only for the resources consumed during execution. When your functions aren't running, you pay nothing. When demand spikes, Azure automatically scales out to handle the load.

### How Consumption Plan Billing Works

Billing in the Consumption plan has two components: execution count and resource consumption. Execution count is simply how many times your functions run. Resource consumption is measured in gigabyte-seconds (GB-s), which combines the memory your function uses with how long it runs.

```
Resource Consumption = Memory Allocation × Execution Time

Example:
- Function uses 256 MB (0.25 GB) of memory
- Runs for 500 milliseconds (0.5 seconds)
- Resource consumption = 0.25 GB × 0.5 s = 0.125 GB-s

If this function runs 1 million times per month:
- Execution charges: 1,000,000 executions
- Resource charges: 1,000,000 × 0.125 GB-s = 125,000 GB-s
```

Azure provides a generous free grant each month: 1 million executions and 400,000 GB-s. For many development scenarios, small applications, and moderate workloads, you might never pay anything at all.

```csharp
/// <summary>
/// Example function optimized for Consumption plan efficiency.
/// Key strategies: minimize memory usage, execute quickly, avoid unnecessary work.
/// </summary>
public class ConsumptionOptimizedFunctions
{
    private readonly IProductRepository _repository;
    private readonly ILogger<ConsumptionOptimizedFunctions> _logger;

    public ConsumptionOptimizedFunctions(
        IProductRepository repository,
        ILogger<ConsumptionOptimizedFunctions> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [Function("GetProduct")]
    public async Task<HttpResponseData> GetProduct(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "products/{id}")] 
        HttpRequestData request,
        string id)
    {
        // In Consumption plan, every millisecond costs money (however small)
        // Optimize for fast execution paths
        
        // Quick validation - fail fast for invalid input
        if (string.IsNullOrEmpty(id) || !Guid.TryParse(id, out _))
        {
            return request.CreateResponse(HttpStatusCode.BadRequest);
        }

        // Direct database query - avoid unnecessary processing
        var product = await _repository.GetByIdAsync(id);

        if (product == null)
        {
            return request.CreateResponse(HttpStatusCode.NotFound);
        }

        // Efficient response creation
        var response = request.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(product);
        return response;
    }

    /// <summary>
    /// Queue-triggered function showing batch processing for efficiency.
    /// Processing messages in batches reduces per-message overhead.
    /// </summary>
    [Function("ProcessOrdersBatch")]
    public async Task ProcessOrders(
        [QueueTrigger("orders", Connection = "StorageConnection")] 
        QueueMessage[] messages)  // Batch processing - more efficient than single messages
    {
        _logger.LogInformation("Processing batch of {Count} orders", messages.Length);

        // Process all messages in the batch
        // This is more efficient than starting a new function invocation for each message
        var tasks = messages.Select(async message =>
        {
            var order = JsonSerializer.Deserialize<Order>(message.MessageText);
            await ProcessSingleOrder(order!);
        });

        await Task.WhenAll(tasks);
    }

    private async Task ProcessSingleOrder(Order order)
    {
        // Order processing logic
        await Task.CompletedTask;
    }
}
```

### The Cold Start Challenge

The Consumption plan's most discussed characteristic is the "cold start" phenomenon. When no worker instance exists to handle your function (because it's been idle or you're scaling up), Azure must allocate resources, start a worker process, load your code, and initialize your application. This can add noticeable latency—anywhere from a few hundred milliseconds to several seconds depending on your application's complexity.

Cold starts occur in several scenarios: when your function hasn't been invoked for a while (typically 20+ minutes of inactivity), when a sudden traffic spike requires new instances beyond what's currently running, and when Azure's infrastructure needs to rebalance workloads.

```csharp
/// <summary>
/// Startup configuration optimized to minimize cold start impact.
/// Every service you register and every initialization you perform adds to cold start time.
/// </summary>
var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        // STRATEGY 1: Lazy initialization for expensive services
        // The service isn't created until first use, spreading the cost
        services.AddSingleton<Lazy<IExpensiveService>>(sp =>
            new Lazy<IExpensiveService>(() => 
                new ExpensiveService(sp.GetRequiredService<IConfiguration>())));

        // STRATEGY 2: Use lightweight implementations where possible
        // MemoryCache is faster to initialize than distributed cache clients
        services.AddMemoryCache();

        // STRATEGY 3: Configure HttpClient efficiently
        // HttpClientFactory manages connection pooling and lifecycle
        services.AddHttpClient("ExternalApi", client =>
        {
            client.BaseAddress = new Uri("https://api.example.com");
        });

        // STRATEGY 4: Avoid synchronous initialization in constructors
        // Services that need async setup should use IHostedService or lazy patterns
        services.AddSingleton<IDatabaseConnectionPool, LazyDatabasePool>();

        // STRATEGY 5: Register only what you need
        // Every service adds to startup time, even if it's not used in every function
    })
    .Build();
```

### Consumption Plan Limits and Constraints

The Consumption plan imposes certain limits that you must design around. Function execution is limited to 10 minutes by default (configurable up to 10 minutes for HTTP triggers, longer for other triggers). Memory is capped at 1.5 GB per instance. Outbound connections have limits that can affect high-throughput scenarios.

These constraints exist because Azure must manage resources across many tenants on shared infrastructure. Understanding them helps you design functions that work well within the model rather than fighting against it.

## The Premium Plan: Always Ready, Still Elastic

The Premium plan addresses the Consumption plan's cold start problem while maintaining automatic scaling. At its core, you pay to keep a minimum number of worker instances warm and ready at all times. When demand exceeds that baseline, additional instances spin up just like in Consumption plan.

### How Premium Plan Works

You configure a minimum instance count (the "always ready" instances), and those workers stay running continuously. They're pre-warmed with your code loaded and your dependency injection container initialized. When a request arrives, a warm worker handles it immediately—no cold start delay.

```
Premium Plan Configuration:

Minimum Instances: 2          ← Always running, always warm
Maximum Instances: 10         ← Upper limit for scale-out
                              
Traffic Pattern:
├─ Light load (10 req/sec)  → 2 instances handle it (your minimum)
├─ Medium load (50 req/sec) → 2 instances might still suffice
├─ Heavy load (200 req/sec) → Scales to 5 instances
├─ Spike (500 req/sec)      → Scales toward 10 instances
└─ Back to light            → Scales back down to 2 (but never below)
```

Premium plan billing has two components: the baseline cost for your always-ready instances (charged continuously) and additional costs for scale-out instances (charged per-second while running). This creates a predictable baseline cost with variable overflow costs during high-demand periods.

```csharp
/// <summary>
/// Program.cs configuration taking advantage of Premium plan capabilities.
/// With guaranteed warm instances, you can afford heavier initialization.
/// </summary>
var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()  // ASP.NET Core integration
    .ConfigureServices(services =>
    {
        // PREMIUM ADVANTAGE: Pre-warm expensive resources
        // These initialize at startup and stay ready
        services.AddSingleton<ISearchIndex>(sp =>
        {
            // In Consumption, this initialization adds to cold start
            // In Premium, it happens once and stays warm
            var config = sp.GetRequiredService<IConfiguration>();
            var client = new SearchIndexClient(
                new Uri(config["Search:Endpoint"]!),
                new AzureKeyCredential(config["Search:ApiKey"]!));
            return new SearchIndex(client);
        });

        // PREMIUM ADVANTAGE: Connection pools stay alive
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                // Connection pool persists across invocations in warm instances
                sqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
            });
        });

        // PREMIUM ADVANTAGE: Full middleware pipeline without cold start penalty
        services.AddControllers(options =>
        {
            options.Filters.Add<ValidationFilter>();
            options.Filters.Add<AuditingFilter>();
        });

        // Enhanced features available in Premium
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();
    })
    .Build();
```

### Premium Plan Tiers and Instance Sizes

Premium plan offers different instance sizes to match your workload requirements. Unlike Consumption plan where memory is fixed, Premium lets you choose:

The **EP1** tier provides 1 vCPU and 3.5 GB memory per instance. Suitable for most API workloads and moderate processing tasks.

The **EP2** tier provides 2 vCPUs and 7 GB memory per instance. Better for CPU-intensive workloads or functions that need more memory.

The **EP3** tier provides 4 vCPUs and 14 GB memory per instance. Designed for heavy computational work or large data processing.

Choosing the right tier involves balancing performance needs against cost. A single EP3 instance costs more than four EP1 instances, so unless your workload genuinely benefits from more cores on a single instance (rather than parallelism across instances), smaller instances often provide better value.

### Virtual Network Integration

Premium plan supports virtual network (VNet) integration, allowing your functions to access resources inside private networks. This is crucial for enterprise scenarios where databases, internal APIs, and other services aren't exposed to the public internet.

```csharp
/// <summary>
/// Function accessing private resources through VNet integration.
/// This pattern only works with Premium or Dedicated plans.
/// </summary>
public class PrivateNetworkFunctions
{
    private readonly HttpClient _internalApiClient;
    private readonly ILogger<PrivateNetworkFunctions> _logger;

    public PrivateNetworkFunctions(
        IHttpClientFactory httpClientFactory,
        ILogger<PrivateNetworkFunctions> logger)
    {
        // This client can reach internal endpoints because of VNet integration
        _internalApiClient = httpClientFactory.CreateClient("InternalApi");
        _logger = logger;
    }

    [Function("GetInternalData")]
    public async Task<HttpResponseData> GetInternalData(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "internal/{resourceId}")] 
        HttpRequestData request,
        string resourceId)
    {
        // This call goes through the VNet to a private endpoint
        // The internal API is not accessible from the public internet
        var internalResponse = await _internalApiClient.GetAsync(
            $"http://internal-api.private.local/resources/{resourceId}");

        if (!internalResponse.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Internal API returned {StatusCode} for resource {ResourceId}",
                internalResponse.StatusCode,
                resourceId);
            
            return request.CreateResponse(HttpStatusCode.BadGateway);
        }

        var data = await internalResponse.Content.ReadAsStringAsync();
        
        var response = request.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json");
        await response.WriteStringAsync(data);
        return response;
    }
}

// Configuration in Program.cs for internal API client
services.AddHttpClient("InternalApi", client =>
{
    // This URL is only resolvable within the VNet
    client.BaseAddress = new Uri("http://internal-api.private.local");
    client.Timeout = TimeSpan.FromSeconds(30);
});
```

### When to Choose Premium Plan

Premium plan makes sense when cold start latency is unacceptable for your use case—for example, customer-facing APIs where response time directly affects user experience. It's also the right choice when you need VNet integration to access private resources, when your functions run long enough that Consumption plan's execution limits become problematic (Premium supports up to 60 minutes), or when you have predictable baseline traffic that justifies the always-on cost.

Calculate whether Premium makes financial sense by comparing the baseline cost against what you'd pay in Consumption plan for equivalent usage. If your functions run frequently enough, Consumption plan's per-execution charges can exceed Premium's fixed costs.

## The Dedicated (App Service) Plan: Maximum Control

The Dedicated plan runs your functions on App Service infrastructure—the same platform that hosts traditional ASP.NET web applications. You allocate specific VM sizes, and your functions run on those dedicated resources. There's no automatic scale-to-zero; you pay for the VMs whether your functions run or not.

### Understanding Dedicated Plan Trade-offs

Dedicated plan gives you the most control and the most predictable performance, but it trades away serverless benefits. Your functions are always warm (no cold starts), you can run them for unlimited duration, and you have full control over the machine size. However, you must manually configure scaling (or use App Service autoscale rules), and you pay continuously regardless of actual usage.

```csharp
/// <summary>
/// Configuration for functions running on Dedicated (App Service) plan.
/// You have more resources and fewer constraints, enabling different patterns.
/// </summary>
var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services =>
    {
        // DEDICATED ADVANTAGE: No execution time limits
        // Long-running background processing is fine
        services.AddHostedService<LongRunningBackgroundService>();

        // DEDICATED ADVANTAGE: Predictable resources
        // Can rely on consistent memory availability
        services.AddSingleton<ILargeInMemoryCache, GigabyteCache>();

        // DEDICATED ADVANTAGE: Traditional scaling patterns work
        // Can use session state, sticky sessions, etc.
        services.AddDistributedMemoryCache();
        services.AddSession(options =>
        {
            options.IdleTimeout = TimeSpan.FromMinutes(30);
        });

        // Full database connection pooling without concerns about
        // connections being dropped during scale-in
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MinBatchSize(5);
                sqlOptions.MaxBatchSize(100);
            });
        });
    })
    .Build();

/// <summary>
/// Long-running background service that only makes sense in Dedicated plan.
/// This continuously runs, processing work without time limits.
/// </summary>
public class LongRunningBackgroundService : BackgroundService
{
    private readonly ILogger<LongRunningBackgroundService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public LongRunningBackgroundService(
        ILogger<LongRunningBackgroundService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background processing service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IWorkProcessor>();

                // This could run for hours - no timeout concerns
                await processor.ProcessPendingWorkAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error in background processing");
            }

            // Wait before checking for more work
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
```

### Dedicated Plan Use Cases

Dedicated plan fits scenarios where you need guaranteed resources that don't scale to zero, where you're already using App Service for web applications and want to co-locate functions, where you need to run functions for hours or days without time limits, or where you require features like deployment slots, custom domains with SSL, and other App Service capabilities.

It's also useful when your organization prefers a traditional capacity planning model—deciding in advance how much compute to provision rather than letting the platform decide dynamically.

## The Flex Consumption Plan: The Modern Hybrid

The Flex Consumption plan is Microsoft's newest offering, designed to combine the best aspects of Consumption and Premium plans. It maintains the pay-per-use model of Consumption while offering more control over scaling behavior and reducing cold start impact.

### How Flex Consumption Differs

Flex Consumption introduces several innovations. You can choose your instance memory size (512 MB, 2048 MB, or 4096 MB), allowing you to match resources to workload requirements. You configure concurrency settings that determine how many concurrent executions each instance handles. The platform uses "always ready instances" that you can configure to stay warm, similar to Premium plan but with more granular billing.

```
Flex Consumption Configuration:

Instance Memory: 2048 MB              ← Choose your instance size
Maximum Instance Count: 100           ← Upper scaling limit
HTTP Concurrency: 16                  ← Requests per instance
Always Ready Instances: 1             ← Minimum warm instances
                                      
Scaling Behavior:
├─ Low traffic      → 1 instance (your always-ready minimum)
├─ 20 concurrent    → 2 instances (16 each, rounded up)  
├─ 100 concurrent   → 7 instances
├─ 500 concurrent   → 32 instances
└─ Idle             → Back to 1 always-ready instance

Billing:
├─ Always-ready instances → Charged per-second while allocated
├─ On-demand instances    → Charged per-second while running
└─ Execution count        → Standard per-execution charges
```

### Configuring Flex Consumption

Configuration for Flex Consumption includes both code-level settings and Azure resource configuration:

```json
// host.json settings for Flex Consumption
{
  "version": "2.0",
  "flexConsumption": {
    "instanceMemoryMB": 2048,
    "maximumInstanceCount": 100,
    "alwaysReady": [
      {
        "name": "http",
        "instanceCount": 1
      }
    ]
  },
  "extensions": {
    "http": {
      "routePrefix": "api"
    }
  },
  "concurrency": {
    "dynamicConcurrencyEnabled": true,
    "snapshotPersistenceEnabled": true
  }
}
```

```csharp
/// <summary>
/// Functions optimized for Flex Consumption plan characteristics.
/// Takes advantage of configurable concurrency and memory.
/// </summary>
public class FlexOptimizedFunctions
{
    private readonly IProductService _productService;
    private readonly ILogger<FlexOptimizedFunctions> _logger;

    public FlexOptimizedFunctions(
        IProductService productService,
        ILogger<FlexOptimizedFunctions> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// HTTP function designed for high concurrency per instance.
    /// Flex Consumption lets you handle many concurrent requests per instance,
    /// which is more efficient than spinning up new instances for each request.
    /// </summary>
    [Function("SearchProducts")]
    public async Task<HttpResponseData> SearchProducts(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "products/search")] 
        HttpRequestData request)
    {
        var query = System.Web.HttpUtility.ParseQueryString(request.Url.Query);
        var searchTerm = query["q"] ?? "";
        var page = int.TryParse(query["page"], out var p) ? p : 1;

        // With higher concurrency per instance, efficient async code matters more
        // This function might be running 16+ times concurrently on one instance
        var results = await _productService.SearchAsync(searchTerm, page, pageSize: 20);

        var response = request.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(results);
        return response;
    }

    /// <summary>
    /// Memory-intensive function benefiting from Flex's configurable instance size.
    /// With 2048 MB or 4096 MB instances, you can process larger datasets in memory.
    /// </summary>
    [Function("ProcessLargeDataset")]
    public async Task<HttpResponseData> ProcessLargeDataset(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "data/process")] 
        HttpRequestData request)
    {
        // With 2048 MB+ instances, we can load substantial data into memory
        var requestBody = await request.ReadAsStringAsync();
        var dataset = JsonSerializer.Deserialize<LargeDataset>(requestBody!);

        if (dataset?.Items == null)
        {
            return request.CreateResponse(HttpStatusCode.BadRequest);
        }

        _logger.LogInformation(
            "Processing dataset with {ItemCount} items",
            dataset.Items.Count);

        // In-memory processing that would fail in 256 MB Consumption instances
        var processedResults = dataset.Items
            .AsParallel()  // Take advantage of multiple cores in larger instances
            .Select(ProcessItem)
            .ToList();

        var response = request.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new { ProcessedCount = processedResults.Count });
        return response;
    }

    private ProcessedItem ProcessItem(DataItem item)
    {
        // CPU-intensive processing
        return new ProcessedItem { Id = item.Id, Result = ComputeResult(item) };
    }

    private string ComputeResult(DataItem item) => $"Processed-{item.Id}";
}

public class LargeDataset
{
    public List<DataItem>? Items { get; set; }
}

public class DataItem
{
    public string Id { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
}

public class ProcessedItem
{
    public string Id { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
}
```

### Flex Consumption's Sweet Spot

Flex Consumption works best for applications that have variable traffic patterns (benefiting from scale-to-zero during quiet periods) but need predictable performance during active periods (benefiting from always-ready instances). It's particularly good when you know your workload characteristics well enough to configure appropriate concurrency and memory settings.

The plan also supports private networking features, making it suitable for enterprise scenarios that previously required Premium plan.

## Comparing Plans: A Decision Framework

Let me provide a structured way to think about choosing between plans based on your specific requirements.

### Decision Factor 1: Cost Sensitivity vs Performance Needs

If minimizing cost is paramount and you can tolerate occasional cold starts, Consumption plan is your starting point. The free tier covers many scenarios entirely, and pay-per-use means you never pay for idle capacity.

If cold start latency is unacceptable but you still want elastic scaling, Premium plan provides always-warm instances with the ability to scale beyond that baseline.

If you need predictable costs and consistent performance regardless of traffic patterns, Dedicated plan offers fixed resources at fixed prices.

If you want to balance cost optimization with performance guarantees, Flex Consumption offers a middle ground with configurable always-ready instances.

### Decision Factor 2: Networking Requirements

If your functions only access public endpoints, any plan works. If your functions need to access resources inside a private virtual network, you need Premium, Flex Consumption, or Dedicated plan. Consumption plan doesn't support VNet integration.

### Decision Factor 3: Execution Duration

If your functions complete quickly (under 5 minutes), any plan works fine. If you need extended execution times (up to 60 minutes), Premium or Flex Consumption support this. If you need unlimited execution duration, Dedicated plan removes all time constraints.

### Decision Factor 4: Scaling Characteristics

If you want fully automatic scaling with no management, Consumption or Flex Consumption handle this transparently. If you want automatic scaling with guaranteed minimum capacity, Premium plan provides this. If you prefer manual scaling control or integration with App Service autoscale rules, Dedicated plan offers traditional scaling models.

```csharp
/// <summary>
/// Helper class that demonstrates how to detect and adapt to hosting plan characteristics.
/// </summary>
public static class HostingPlanDetector
{
    public static HostingPlanInfo GetCurrentPlan()
    {
        // Environment variables help detect the hosting context
        var websiteSku = Environment.GetEnvironmentVariable("WEBSITE_SKU");
        var functionsWorkerRuntime = Environment.GetEnvironmentVariable("FUNCTIONS_WORKER_RUNTIME");
        var instanceMemory = Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_MEMORY_MB");

        // Consumption plan typically has no SKU set or specific SKU
        // Premium plans have SKU like "ElasticPremium"
        // Dedicated plans have SKU like "Standard", "Premium", etc.

        var plan = websiteSku?.ToLowerInvariant() switch
        {
            null or "" or "dynamic" => HostingPlan.Consumption,
            "elasticpremium" => HostingPlan.Premium,
            "flexconsumption" => HostingPlan.FlexConsumption,
            _ => HostingPlan.Dedicated
        };

        return new HostingPlanInfo
        {
            Plan = plan,
            InstanceMemoryMB = int.TryParse(instanceMemory, out var mem) ? mem : 1536,
            WorkerRuntime = functionsWorkerRuntime ?? "dotnet-isolated"
        };
    }
}

public enum HostingPlan
{
    Consumption,
    Premium,
    FlexConsumption,
    Dedicated
}

public class HostingPlanInfo
{
    public HostingPlan Plan { get; set; }
    public int InstanceMemoryMB { get; set; }
    public string WorkerRuntime { get; set; } = string.Empty;
}

/// <summary>
/// Service that adapts its behavior based on hosting plan capabilities.
/// </summary>
public class PlanAwareService
{
    private readonly HostingPlanInfo _planInfo;
    private readonly ILogger<PlanAwareService> _logger;

    public PlanAwareService(ILogger<PlanAwareService> logger)
    {
        _planInfo = HostingPlanDetector.GetCurrentPlan();
        _logger = logger;

        _logger.LogInformation(
            "Running on {Plan} plan with {Memory}MB per instance",
            _planInfo.Plan,
            _planInfo.InstanceMemoryMB);
    }

    public int GetOptimalBatchSize()
    {
        // Adjust batch sizes based on available resources
        return _planInfo.Plan switch
        {
            HostingPlan.Consumption => 10,      // Conservative for limited memory
            HostingPlan.FlexConsumption => 50,  // Larger instances available
            HostingPlan.Premium => 100,         // Generous resources
            HostingPlan.Dedicated => 200,       // Full VM resources
            _ => 10
        };
    }

    public TimeSpan GetOperationTimeout()
    {
        // Adjust timeouts based on plan limits
        return _planInfo.Plan switch
        {
            HostingPlan.Consumption => TimeSpan.FromMinutes(5),    // Stay well under 10-minute limit
            HostingPlan.FlexConsumption => TimeSpan.FromMinutes(30),
            HostingPlan.Premium => TimeSpan.FromMinutes(30),
            HostingPlan.Dedicated => TimeSpan.FromHours(2),        // No limit
            _ => TimeSpan.FromMinutes(5)
        };
    }
}
```

## Cost Estimation: Real Numbers

Understanding costs helps make informed decisions. Here are approximate calculations (prices vary by region and change over time—always check current Azure pricing):

### Consumption Plan Cost Example

```
Scenario: API receiving 5 million requests/month
Average execution time: 200ms
Memory usage: 256 MB (0.25 GB)

Calculations:
- Execution count: 5,000,000 - 1,000,000 free = 4,000,000 billable
- Execution cost: 4,000,000 × $0.0000002 = $0.80

- GB-seconds: 5,000,000 × 0.2s × 0.25GB = 250,000 GB-s
- GB-s after free tier: 250,000 - 400,000 = 0 (covered by free tier)
- Resource cost: $0

Total monthly cost: ~$0.80
```

### Premium Plan Cost Example

```
Scenario: Same API, but cold starts are unacceptable
Configuration: EP1 (1 vCPU, 3.5 GB), minimum 2 instances

Calculations:
- Base cost: 2 instances × 730 hours × $0.173/hour = ~$253/month
- Additional scale-out: Assume 20% of time at 4 instances
  146 hours × 2 additional × $0.173 = ~$50/month

Total monthly cost: ~$303
```

### Flex Consumption Cost Example

```
Scenario: Same API with Flex Consumption
Configuration: 2048 MB instances, 1 always-ready instance

Calculations:
- Always-ready: 1 instance × 730 hours × ~$0.10/hour = ~$73/month
- On-demand execution: Similar to Consumption pricing
- Execution cost: ~$1 (slightly higher than base Consumption)

Total monthly cost: ~$74-80
```

The Flex Consumption plan often hits a sweet spot: much cheaper than Premium for maintaining warm instances, but with better cold start performance than pure Consumption.

## Migration Considerations

Moving between plans requires planning. Code generally works across plans, but you may need to adjust timeouts, batch sizes, and resource expectations. Configuration files like `host.json` may have plan-specific settings.

```csharp
/// <summary>
/// Configuration that adapts based on target hosting plan.
/// Useful when deploying the same codebase to different environments.
/// </summary>
public static class PlanSpecificConfiguration
{
    public static IHostBuilder ConfigureForTargetPlan(
        this IHostBuilder builder, 
        string targetPlan)
    {
        return builder.ConfigureServices((context, services) =>
        {
            switch (targetPlan.ToLowerInvariant())
            {
                case "consumption":
                    ConfigureForConsumption(services);
                    break;
                case "premium":
                    ConfigureForPremium(services);
                    break;
                case "flex":
                    ConfigureForFlexConsumption(services);
                    break;
                case "dedicated":
                    ConfigureForDedicated(services);
                    break;
            }
        });
    }

    private static void ConfigureForConsumption(IServiceCollection services)
    {
        // Lightweight services, lazy initialization
        services.AddMemoryCache(options =>
        {
            options.SizeLimit = 50 * 1024 * 1024; // 50 MB limit
        });
    }

    private static void ConfigureForPremium(IServiceCollection services)
    {
        // Can afford heavier services
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = Environment.GetEnvironmentVariable("REDIS_CONNECTION");
        });
    }

    private static void ConfigureForFlexConsumption(IServiceCollection services)
    {
        // Balance between Consumption and Premium
        services.AddMemoryCache(options =>
        {
            options.SizeLimit = 200 * 1024 * 1024; // 200 MB limit
        });
    }

    private static void ConfigureForDedicated(IServiceCollection services)
    {
        // Full resources available
        services.AddMemoryCache(); // No size limit needed
        services.AddHostedService<BackgroundProcessingService>();
    }
}
```

## Summary: Choosing Your Path

Each Azure Functions hosting plan serves different needs, and understanding those needs helps you make the right choice.

The **Consumption plan** embodies serverless ideals: pay only for what you use, scale automatically, and let the platform handle infrastructure. It's ideal for variable workloads, development environments, and scenarios where occasional cold starts are acceptable.

The **Premium plan** adds reliability to the serverless model with always-warm instances, VNet integration, and extended execution times. It's ideal for production APIs, enterprise applications with network security requirements, and workloads where consistent low latency matters.

The **Flex Consumption plan** represents the evolution of serverless, combining pay-per-use economics with configurable performance characteristics. It's ideal for workloads that benefit from larger instances, need some warm capacity without full Premium costs, or require fine-grained control over scaling behavior.

The **Dedicated plan** provides traditional hosting with Functions' programming model. It's ideal for organizations that prefer capacity planning, need unlimited execution duration, or want to consolidate with existing App Service deployments.

For your Azure Functions development, I'd suggest starting with Consumption plan during development (free tier covers most development scenarios), moving to Flex Consumption or Premium for production depending on your latency requirements and budget, and only considering Dedicated plan if you have specific requirements around unlimited execution time or existing App Service infrastructure.

The isolated worker model you've been using works across all these plans, and the ASP.NET Core integration we discussed enhances your capabilities on any of them. Your choice of plan affects how your code runs, but not how you write it—a testament to the good abstraction Azure Functions provides.
