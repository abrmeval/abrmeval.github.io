---
title: "Global Validation Handler in ASP.NET Core"
sidebar_label: "Global Validation"
sidebar_position: 3
tags: [aspnet, validation]
---

# Global Validation Handler in ASP.NET Core: A Complete Guide

## Understanding the Problem: Why Global Validation?

When you build an API with dozens or hundreds of endpoints, you quickly face a repetitive challenge. Every controller action needs to check if the incoming model is valid, and if not, return a properly formatted error response. Without a centralized approach, you end up writing the same validation-checking boilerplate in every single action method:

```csharp
// This pattern repeated across every endpoint becomes tedious and error-prone
[HttpPost]
public async Task<IActionResult> CreateProduct(CreateProductRequest request)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }
    
    // Actual business logic here...
}
```

The problems with this approach compound quickly. Developers forget to add the check in some actions. The error response format varies depending on who wrote the code. When you need to change how validation errors are reported (perhaps to match a new API standard), you have to hunt down every location and update it manually.

A global validation handler solves all of these problems by centralizing validation logic in one place. Validation happens automatically before your action code runs, and every validation failure produces a consistent, well-formatted response. Your controllers become cleaner, focused purely on business logic rather than infrastructure concerns.

## The Two Pillars: Data Annotations and FluentValidation

Before diving into global handlers, let's understand the two primary validation approaches in .NET, since your global handler needs to work with whichever approach you choose.

### Data Annotations: The Built-In Approach

Data Annotations come with .NET and use attributes directly on your model properties. The framework automatically validates these when model binding occurs:

```csharp
/// <summary>
/// Request model for creating a new product.
/// Data annotations provide declarative, attribute-based validation.
/// </summary>
public class CreateProductRequest
{
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 100 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Price is required")]
    [Range(0.01, 999999.99, ErrorMessage = "Price must be between $0.01 and $999,999.99")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Category ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Category ID must be a positive number")]
    public int CategoryId { get; set; }

    [RegularExpression(@"^[A-Z]{2,4}-\d{4,8}$", ErrorMessage = "SKU must match format: XX-0000 to XXXX-00000000")]
    public string? Sku { get; set; }
}
```

Data Annotations work well for straightforward validation rules, but they become unwieldy for complex scenarios like conditional validation, cross-property validation, or rules that require database lookups.

### FluentValidation: The Flexible Approach

FluentValidation separates validation logic from your models entirely, placing it in dedicated validator classes. This approach offers more flexibility and testability:

```csharp
/// <summary>
/// Validator for CreateProductRequest using FluentValidation.
/// Separating validation into dedicated classes improves testability
/// and handles complex validation scenarios more elegantly.
/// </summary>
public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    // Dependencies can be injected for database lookups or other checks
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;

    public CreateProductRequestValidator(
        IProductRepository productRepository,
        ICategoryRepository categoryRepository)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;

        // Simple property validations - these mirror what annotations would do
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required")
            .Length(3, 100).WithMessage("Name must be between 3 and 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than zero")
            .LessThanOrEqualTo(999999.99m).WithMessage("Price cannot exceed $999,999.99");

        // Complex validation: verify category exists in database
        RuleFor(x => x.CategoryId)
            .MustAsync(CategoryExistsAsync)
            .WithMessage("The specified category does not exist");

        // Cross-property validation: SKU required for physical products
        RuleFor(x => x.Sku)
            .NotEmpty()
            .When(x => x.CategoryId != 0) // Assuming 0 means digital product
            .WithMessage("SKU is required for physical products");

        // Uniqueness validation: ensure SKU isn't already in use
        RuleFor(x => x.Sku)
            .MustAsync(SkuIsUniqueAsync)
            .When(x => !string.IsNullOrEmpty(x.Sku))
            .WithMessage("This SKU is already in use by another product");
    }

    private async Task<bool> CategoryExistsAsync(int categoryId, CancellationToken cancellationToken)
    {
        return await _categoryRepository.ExistsAsync(categoryId, cancellationToken);
    }

    private async Task<bool> SkuIsUniqueAsync(string? sku, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(sku)) return true;
        return !await _productRepository.SkuExistsAsync(sku, cancellationToken);
    }
}
```

Given your work with FluentValidation in Azure Functions, you're already familiar with this pattern. The question becomes: how do we make these validators run automatically and produce consistent error responses globally?

## Approach 1: ASP.NET Core's Built-In Automatic Validation

ASP.NET Core APIs with the `[ApiController]` attribute get automatic validation for free. When model binding fails or `ModelState` is invalid, the framework automatically returns a 400 Bad Request before your action code even runs:

```csharp
// The [ApiController] attribute enables automatic model validation
// Invalid requests never reach your action code
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateProductRequest request)
    {
        // If we reach this line, ModelState is guaranteed valid
        // No manual validation check needed!
        var product = await _productService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }
}
```

The default response format follows the RFC 7807 Problem Details standard:

```json
{
    "type": "https://tools.ietf.org/html/rfc7807",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "traceId": "00-abc123...",
    "errors": {
        "Name": ["Product name is required"],
        "Price": ["Price must be greater than zero"]
    }
}
```

### Customizing the Default Validation Response

While the default format is reasonable, most APIs want customized error responses. You configure this behavior in `Program.cs` by modifying `ApiBehaviorOptions`:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // This factory runs whenever automatic validation fails
        options.InvalidModelStateResponseFactory = context =>
        {
            // Extract all validation errors from ModelState
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => ToCamelCase(kvp.Key), // Convert property names to camelCase
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );

            // Create your custom error response format
            var response = new ValidationErrorResponse
            {
                Status = StatusCodes.Status400BadRequest,
                Message = "Validation failed",
                Errors = errors,
                Timestamp = DateTime.UtcNow,
                TraceId = context.HttpContext.TraceIdentifier
            };

            return new BadRequestObjectResult(response)
            {
                ContentTypes = { "application/json" }
            };
        };
    });

// Helper method to convert PascalCase to camelCase for JSON consistency
static string ToCamelCase(string str)
{
    if (string.IsNullOrEmpty(str) || !char.IsUpper(str[0]))
        return str;
    
    return char.ToLowerInvariant(str[0]) + str[1..];
}
```

```csharp
/// <summary>
/// Standardized validation error response format.
/// Using a consistent structure across all endpoints simplifies client-side error handling.
/// </summary>
public class ValidationErrorResponse
{
    public int Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, string[]> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; }
    public string? TraceId { get; set; }
}
```

This now produces your custom format:

```json
{
    "status": 400,
    "message": "Validation failed",
    "errors": {
        "name": ["Product name is required"],
        "price": ["Price must be greater than zero"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "traceId": "abc123..."
}
```

## Approach 2: Action Filter for Global Validation

Action filters provide more control over the validation pipeline. They run after model binding but before your action executes, giving you a perfect interception point:

```csharp
/// <summary>
/// Action filter that validates incoming requests and returns standardized error responses.
/// This filter runs for all controller actions, providing consistent validation behavior.
/// </summary>
public class ValidationActionFilter : IAsyncActionFilter
{
    private readonly ILogger<ValidationActionFilter> _logger;

    public ValidationActionFilter(ILogger<ValidationActionFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context, 
        ActionExecutionDelegate next)
    {
        // Check if ModelState contains any validation errors
        if (!context.ModelState.IsValid)
        {
            _logger.LogWarning(
                "Validation failed for {ActionName} on {Controller}. Errors: {ErrorCount}",
                context.ActionDescriptor.DisplayName,
                context.Controller.GetType().Name,
                context.ModelState.ErrorCount);

            // Build detailed error response
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .SelectMany(kvp => kvp.Value!.Errors.Select(e => new ValidationError
                {
                    Field = FormatFieldName(kvp.Key),
                    Message = e.ErrorMessage,
                    // Include attempted value for debugging (be careful with sensitive data)
                    AttemptedValue = kvp.Value.AttemptedValue
                }))
                .ToList();

            var response = new DetailedValidationErrorResponse
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Failed",
                Detail = "One or more fields contain invalid values. Please review the errors and try again.",
                Instance = context.HttpContext.Request.Path,
                Errors = errors,
                Timestamp = DateTime.UtcNow,
                TraceId = context.HttpContext.TraceIdentifier
            };

            // Short-circuit the pipeline - action won't execute
            context.Result = new BadRequestObjectResult(response);
            return;
        }

        // Validation passed - continue to the action
        await next();
    }

    /// <summary>
    /// Converts nested property paths to a readable format.
    /// "Items[0].ProductId" becomes "items[0].productId"
    /// </summary>
    private static string FormatFieldName(string fieldName)
    {
        if (string.IsNullOrEmpty(fieldName))
            return fieldName;

        // Handle nested properties and array indices
        var parts = fieldName.Split('.');
        for (int i = 0; i < parts.Length; i++)
        {
            if (!string.IsNullOrEmpty(parts[i]) && char.IsUpper(parts[i][0]))
            {
                // Handle array notation: Items[0] -> items[0]
                var bracketIndex = parts[i].IndexOf('[');
                if (bracketIndex > 0)
                {
                    parts[i] = char.ToLowerInvariant(parts[i][0]) + parts[i][1..];
                }
                else
                {
                    parts[i] = char.ToLowerInvariant(parts[i][0]) + parts[i][1..];
                }
            }
        }

        return string.Join(".", parts);
    }
}

/// <summary>
/// Detailed error information for a single validation failure.
/// </summary>
public class ValidationError
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? AttemptedValue { get; set; }
}

/// <summary>
/// RFC 7807-inspired response with additional detail for debugging.
/// </summary>
public class DetailedValidationErrorResponse
{
    public int Status { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public string Instance { get; set; } = string.Empty;
    public List<ValidationError> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; }
    public string? TraceId { get; set; }
}
```

Register the filter globally in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register the filter as a service so DI works
builder.Services.AddScoped<ValidationActionFilter>();

builder.Services.AddControllers(options =>
{
    // Add as a global filter - runs for all actions
    options.Filters.Add<ValidationActionFilter>();
});

// Important: Disable the default automatic validation to avoid double-handling
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});
```

## Approach 3: Integrating FluentValidation Globally

For projects using FluentValidation, you want validators to run automatically and their results to flow into the same global handling mechanism. The FluentValidation.AspNetCore package made this easy, but it's now deprecated. Here's the modern approach using manual integration:

```csharp
/// <summary>
/// Action filter that manually invokes FluentValidation validators.
/// This replaces the deprecated automatic validation from FluentValidation.AspNetCore.
/// </summary>
public class FluentValidationActionFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<FluentValidationActionFilter> _logger;

    public FluentValidationActionFilter(
        IServiceProvider serviceProvider,
        ILogger<FluentValidationActionFilter> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        // Iterate through all action arguments to find ones with validators
        foreach (var argument in context.ActionArguments)
        {
            if (argument.Value is null)
                continue;

            var argumentType = argument.Value.GetType();
            
            // Construct the validator type: IValidator<ArgumentType>
            var validatorType = typeof(IValidator<>).MakeGenericType(argumentType);
            
            // Try to resolve a validator from DI
            var validator = _serviceProvider.GetService(validatorType) as IValidator;
            
            if (validator is null)
                continue; // No validator registered for this type

            _logger.LogDebug(
                "Running FluentValidation for {ArgumentType} in {Action}",
                argumentType.Name,
                context.ActionDescriptor.DisplayName);

            // Create validation context and run validation
            var validationContext = new ValidationContext<object>(argument.Value);
            var validationResult = await validator.ValidateAsync(
                validationContext, 
                context.HttpContext.RequestAborted);

            // If validation failed, add errors to ModelState
            if (!validationResult.IsValid)
            {
                foreach (var error in validationResult.Errors)
                {
                    context.ModelState.AddModelError(error.PropertyName, error.ErrorMessage);
                }
            }
        }

        // Now check combined ModelState (Data Annotations + FluentValidation)
        if (!context.ModelState.IsValid)
        {
            var errors = BuildErrorResponse(context);
            context.Result = new BadRequestObjectResult(errors);
            return;
        }

        await next();
    }

    private ValidationErrorResponse BuildErrorResponse(ActionExecutingContext context)
    {
        var errors = context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => ToCamelCase(kvp.Key),
                kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
            );

        return new ValidationErrorResponse
        {
            Status = StatusCodes.Status400BadRequest,
            Message = "Validation failed",
            Errors = errors,
            Timestamp = DateTime.UtcNow,
            TraceId = context.HttpContext.TraceIdentifier
        };
    }

    private static string ToCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str) || !char.IsUpper(str[0]))
            return str;
        return char.ToLowerInvariant(str[0]) + str[1..];
    }
}
```

Register FluentValidation validators and the filter:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register all validators from the assembly containing CreateProductRequestValidator
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductRequestValidator>();

// Register the filter
builder.Services.AddScoped<FluentValidationActionFilter>();

builder.Services.AddControllers(options =>
{
    options.Filters.Add<FluentValidationActionFilter>();
});

// Suppress default validation to avoid double-handling
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});
```

## Approach 4: MediatR Pipeline Behavior for CQRS Architectures

If your application uses MediatR for CQRS patterns, validation fits naturally into the pipeline as a behavior that runs before handlers:

```csharp
/// <summary>
/// MediatR pipeline behavior that validates all requests before they reach their handlers.
/// This approach works beautifully with CQRS architectures where commands/queries flow through MediatR.
/// </summary>
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    private readonly ILogger<ValidationBehavior<TRequest, TResponse>> _logger;

    public ValidationBehavior(
        IEnumerable<IValidator<TRequest>> validators,
        ILogger<ValidationBehavior<TRequest, TResponse>> logger)
    {
        _validators = validators;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;

        if (!_validators.Any())
        {
            _logger.LogDebug("No validators found for {RequestName}", requestName);
            return await next();
        }

        _logger.LogDebug(
            "Validating {RequestName} with {ValidatorCount} validators",
            requestName,
            _validators.Count());

        // Run all validators in parallel for efficiency
        var context = new ValidationContext<TRequest>(request);
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        // Collect all failures across all validators
        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count > 0)
        {
            _logger.LogWarning(
                "Validation failed for {RequestName}. Failures: {Failures}",
                requestName,
                string.Join(", ", failures.Select(f => $"{f.PropertyName}: {f.ErrorMessage}")));

            // Throw a custom exception that can be caught by middleware
            throw new ValidationException(failures);
        }

        return await next();
    }
}

/// <summary>
/// Custom exception for validation failures.
/// This allows middleware to catch and format validation errors consistently.
/// </summary>
public class ValidationException : Exception
{
    public IReadOnlyList<ValidationFailure> Failures { get; }
    
    public Dictionary<string, string[]> ErrorDictionary => Failures
        .GroupBy(f => f.PropertyName)
        .ToDictionary(
            g => ToCamelCase(g.Key),
            g => g.Select(f => f.ErrorMessage).ToArray());

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : base("One or more validation failures occurred.")
    {
        Failures = failures.ToList();
    }

    private static string ToCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str) || !char.IsUpper(str[0]))
            return str;
        return char.ToLowerInvariant(str[0]) + str[1..];
    }
}
```

Handle the `ValidationException` in global exception-handling middleware:

```csharp
/// <summary>
/// Middleware that catches ValidationException and returns appropriate error responses.
/// </summary>
public class ValidationExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ValidationExceptionMiddleware> _logger;

    public ValidationExceptionMiddleware(RequestDelegate next, ILogger<ValidationExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation exception caught in middleware");
            
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var response = new ValidationErrorResponse
            {
                Status = StatusCodes.Status400BadRequest,
                Message = "Validation failed",
                Errors = ex.ErrorDictionary,
                Timestamp = DateTime.UtcNow,
                TraceId = context.TraceIdentifier
            };

            await context.Response.WriteAsJsonAsync(response);
        }
    }
}
```

Register MediatR with the validation behavior:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register FluentValidation validators
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductCommandValidator>();

// Register MediatR with the validation pipeline behavior
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining<CreateProductCommandHandler>();
    
    // Add validation behavior to the pipeline - runs before handlers
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});

var app = builder.Build();

// Add middleware to handle ValidationException
app.UseMiddleware<ValidationExceptionMiddleware>();
```

## Comprehensive Solution: Combining All Approaches

In production applications, you often want multiple validation layers working together. Here's a complete setup that handles Data Annotations, FluentValidation, and provides consistent error responses:

```csharp
// Program.cs - Complete validation setup

var builder = WebApplication.CreateBuilder(args);

// ============================================
// 1. Register FluentValidation validators
// ============================================
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ============================================
// 2. Configure controllers with global filters
// ============================================
builder.Services.AddControllers(options =>
{
    // Global filter for combined validation
    options.Filters.Add<CombinedValidationFilter>();
})
.ConfigureApiBehaviorOptions(options =>
{
    // Suppress automatic validation - we handle it in our filter
    options.SuppressModelStateInvalidFilter = true;
});

// ============================================
// 3. Register custom services
// ============================================
builder.Services.AddScoped<CombinedValidationFilter>();

var app = builder.Build();

// ============================================
// 4. Configure middleware pipeline
// ============================================
app.UseExceptionHandler("/error");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

```csharp
/// <summary>
/// Comprehensive validation filter that combines Data Annotations and FluentValidation,
/// producing unified error responses regardless of which validation mechanism caught the error.
/// </summary>
public class CombinedValidationFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CombinedValidationFilter> _logger;

    public CombinedValidationFilter(
        IServiceProvider serviceProvider,
        ILogger<CombinedValidationFilter> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        // Step 1: ModelState already contains Data Annotation validation results
        // Step 2: Run FluentValidation for each argument that has a validator
        await RunFluentValidationAsync(context);

        // Step 3: If any validation failed, return standardized error response
        if (!context.ModelState.IsValid)
        {
            LogValidationFailure(context);
            context.Result = CreateErrorResponse(context);
            return;
        }

        await next();
    }

    private async Task RunFluentValidationAsync(ActionExecutingContext context)
    {
        foreach (var (key, value) in context.ActionArguments)
        {
            if (value is null) continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(value.GetType());
            
            if (_serviceProvider.GetService(validatorType) is not IValidator validator)
                continue;

            var validationContext = new ValidationContext<object>(value);
            var result = await validator.ValidateAsync(
                validationContext,
                context.HttpContext.RequestAborted);

            foreach (var error in result.Errors)
            {
                context.ModelState.AddModelError(error.PropertyName, error.ErrorMessage);
            }
        }
    }

    private void LogValidationFailure(ActionExecutingContext context)
    {
        var endpoint = context.ActionDescriptor.DisplayName;
        var errorSummary = string.Join("; ", context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .SelectMany(e => e.Value!.Errors.Select(err => $"{e.Key}: {err.ErrorMessage}")));

        _logger.LogWarning(
            "Validation failed for {Endpoint}. Errors: {Errors}",
            endpoint,
            errorSummary);
    }

    private static IActionResult CreateErrorResponse(ActionExecutingContext context)
    {
        var errors = context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => FormatPropertyName(kvp.Key),
                kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
            );

        var response = new ApiErrorResponse
        {
            Type = "https://httpstatuses.com/400",
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation Error",
            Detail = "One or more validation errors occurred. Please check the errors property for details.",
            Instance = context.HttpContext.Request.Path,
            Errors = errors,
            Extensions = new Dictionary<string, object?>
            {
                ["timestamp"] = DateTime.UtcNow,
                ["traceId"] = context.HttpContext.TraceIdentifier
            }
        };

        return new BadRequestObjectResult(response);
    }

    private static string FormatPropertyName(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;
        
        // Handle nested paths like "Items[0].ProductId"
        var segments = name.Split('.');
        return string.Join(".", segments.Select(segment =>
        {
            if (string.IsNullOrEmpty(segment) || !char.IsUpper(segment[0]))
                return segment;
            return char.ToLowerInvariant(segment[0]) + segment[1..];
        }));
    }
}

/// <summary>
/// API error response following RFC 7807 Problem Details specification
/// with extensions for additional context.
/// </summary>
public class ApiErrorResponse
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("detail")]
    public string Detail { get; set; } = string.Empty;

    [JsonPropertyName("instance")]
    public string Instance { get; set; } = string.Empty;

    [JsonPropertyName("errors")]
    public Dictionary<string, string[]> Errors { get; set; } = new();

    [JsonExtensionData]
    public Dictionary<string, object?> Extensions { get; set; } = new();
}
```

## Validation Error Response Design Principles

Regardless of which approach you use, your error responses should follow these principles for the best developer experience on the consuming side:

**Consistency matters above all else.** Every validation error, whether from Data Annotations, FluentValidation, or custom logic, should produce responses in exactly the same format. Clients should never have to handle multiple error response structures.

**Use standard HTTP status codes correctly.** Validation failures are always 400 Bad Request. Don't use 422 Unprocessable Entity unless you have a specific reason—most APIs standardize on 400 for all client input errors.

**Include machine-readable error identification.** Property names in errors should match exactly what the client sent (in the same casing they used, typically camelCase for JSON APIs). This allows client-side frameworks to automatically map errors to form fields.

**Provide human-readable messages.** Error messages should be ready to display to end users. Avoid technical jargon like "value cannot be null for non-nullable type" and instead use "Name is required."

**Add debugging context.** Include trace IDs, timestamps, and request paths to help with debugging. These don't need to be shown to end users but are invaluable when investigating issues.

## Testing Global Validation

Testing your validation setup ensures it works correctly across all scenarios:

```csharp
public class ValidationFilterTests
{
    [Fact]
    public async Task InvalidModel_ReturnsStandardizedErrorResponse()
    {
        // Arrange
        var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        var invalidRequest = new { Name = "", Price = -5 }; // Invalid values

        // Act
        var response = await client.PostAsJsonAsync("/api/products", invalidRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadFromJsonAsync<ApiErrorResponse>();
        
        Assert.NotNull(content);
        Assert.Equal(400, content.Status);
        Assert.Contains("name", content.Errors.Keys); // camelCase property name
        Assert.Contains("price", content.Errors.Keys);
    }

    [Fact]
    public async Task ValidModel_PassesValidation()
    {
        // Arrange
        var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        var validRequest = new 
        { 
            Name = "Valid Product", 
            Price = 29.99m,
            CategoryId = 1 
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/products", validRequest);

        // Assert
        Assert.NotEqual(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
```

## Summary

Global validation handling transforms scattered, inconsistent validation code into a centralized, maintainable system. The key decisions you need to make are which validation library to use (Data Annotations for simplicity, FluentValidation for complex scenarios, or both), which integration approach fits your architecture (action filters for traditional MVC, pipeline behaviors for MediatR/CQRS), and what your standardized error response format should look like.

The investment in setting up global validation pays dividends immediately: cleaner controllers, consistent client experiences, easier debugging, and confidence that no endpoint accidentally skips validation. Whether you choose the built-in `ApiBehaviorOptions` customization for simple needs or a full `IAsyncActionFilter` implementation for complete control, the patterns in this guide give you the foundation to handle validation elegantly across your entire application.
