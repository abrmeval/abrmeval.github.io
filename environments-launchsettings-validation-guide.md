# Environments, Launch Profiles, and Configuration Validation in ASP.NET Core

## The Philosophy Behind Environments

Every application behaves differently depending on where it runs. During development, you want verbose logging, detailed error pages, and perhaps a local database. In production, you need optimized performance, minimal logging overhead, and connections to production services. Staging environments mirror production but might connect to test databases. Each context demands different configuration.

ASP.NET Core solves this through a first-class concept called "environments." Rather than scattering `if (isProduction)` checks throughout your code, you declare which environment you're running in, and the framework automatically adjusts its behavior and loads the appropriate configuration. This separation keeps your code clean and your configuration manageable.

Think of environments like wearing different outfits for different occasions. You don't rebuild yourself each morning—you're the same person—but you dress appropriately for a job interview versus a beach day versus a formal dinner. Your application is the same codebase, but it "dresses" itself appropriately for development, staging, or production.

## Understanding the ASPNETCORE_ENVIRONMENT Variable

The entire environment system hinges on a single environment variable: `ASPNETCORE_ENVIRONMENT`. When your application starts, it reads this variable to determine which environment it's running in. If the variable isn't set, the application defaults to "Production" as a safety measure—you never want to accidentally run with development settings in production.

```csharp
/// <summary>
/// Demonstrates how to access and respond to the current environment.
/// The IWebHostEnvironment service is the primary way to check environment status.
/// </summary>
public class EnvironmentDemoController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<EnvironmentDemoController> _logger;

    public EnvironmentDemoController(
        IWebHostEnvironment environment,
        ILogger<EnvironmentDemoController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpGet("environment-info")]
    public IActionResult GetEnvironmentInfo()
    {
        // The EnvironmentName property contains the raw value of ASPNETCORE_ENVIRONMENT
        // Common values: "Development", "Staging", "Production"
        // But you can use any string you want for custom environments
        var info = new
        {
            // The exact string value from the environment variable
            EnvironmentName = _environment.EnvironmentName,
            
            // Convenience methods for checking standard environments
            // These perform case-insensitive comparisons
            IsDevelopment = _environment.IsDevelopment(),
            IsStaging = _environment.IsStaging(),
            IsProduction = _environment.IsProduction(),
            
            // You can check for custom environments too
            IsQA = _environment.IsEnvironment("QA"),
            IsUAT = _environment.IsEnvironment("UAT"),
            
            // Other useful properties from IWebHostEnvironment
            ApplicationName = _environment.ApplicationName,
            ContentRootPath = _environment.ContentRootPath,
            WebRootPath = _environment.WebRootPath
        };

        _logger.LogInformation(
            "Environment info requested. Running in {Environment}",
            _environment.EnvironmentName);

        return Ok(info);
    }
}
```

The `IWebHostEnvironment` service provides convenient methods like `IsDevelopment()`, `IsStaging()`, and `IsProduction()` that perform case-insensitive comparisons. This means "development", "Development", and "DEVELOPMENT" all match when you call `IsDevelopment()`. For custom environments, use `IsEnvironment("YourCustomName")`.

## The launchSettings.json File: Development Convenience

When you run your application during development (pressing F5 in Visual Studio or running `dotnet run`), something magical happens. The tooling reads a file called `launchSettings.json` from the `Properties` folder and uses it to configure how your application starts. This file exists purely for development convenience—it never gets deployed to production.

```json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  
  // iisSettings configures IIS Express (Visual Studio's built-in web server)
  "iisSettings": {
    "windowsAuthentication": false,
    "anonymousAuthentication": true,
    "iisExpress": {
      "applicationUrl": "http://localhost:52431",
      "sslPort": 44380
    }
  },
  
  // profiles defines different ways to launch your application
  // Each profile is a complete launch configuration
  "profiles": {
    
    // Profile for running with Kestrel directly (most common for development)
    "Development": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": "swagger",
      "applicationUrl": "https://localhost:7234;http://localhost:5234",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "LOGGING__LOGLEVEL__DEFAULT": "Debug",
        "FEATURE_FLAGS__ENABLENEWUI": "true"
      }
    },
    
    // Profile that mimics staging environment locally
    "Staging-Local": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "applicationUrl": "https://localhost:7235;http://localhost:5235",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Staging",
        "LOGGING__LOGLEVEL__DEFAULT": "Information",
        "DATABASE__CONNECTIONSTRING": "Server=staging-db;Database=MyApp;..."
      }
    },
    
    // Profile for testing production-like settings locally
    "Production-Local": {
      "commandName": "Project",
      "dotnetRunMessages": false,
      "launchBrowser": false,
      "applicationUrl": "https://localhost:7236",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Production",
        "LOGGING__LOGLEVEL__DEFAULT": "Warning"
      }
    },
    
    // Profile for running inside IIS Express
    "IIS Express": {
      "commandName": "IISExpress",
      "launchBrowser": true,
      "launchUrl": "swagger",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    
    // Profile for running in a Docker container
    "Docker": {
      "commandName": "Docker",
      "launchBrowser": true,
      "launchUrl": "{Scheme}://{ServiceHost}:{ServicePort}/swagger",
      "publishAllPorts": true,
      "useSSL": true
    }
  }
}
```

Let me explain each important property in a launch profile. The `commandName` tells the tooling how to run your application. "Project" means run directly with Kestrel using `dotnet run`. "IISExpress" means use IIS Express as the web server. "Docker" means build and run in a container.

The `applicationUrl` specifies which URLs Kestrel listens on. You can specify multiple URLs separated by semicolons. The `https://localhost:7234;http://localhost:5234` format means "listen on both HTTPS port 7234 and HTTP port 5234."

The `environmentVariables` section is where the magic happens for configuration. Any environment variables you define here are set before your application starts. Notice how `ASPNETCORE_ENVIRONMENT` is set here—this is how different profiles can simulate different environments. The double-underscore syntax (`LOGGING__LOGLEVEL__DEFAULT`) maps to nested configuration keys (`Logging:LogLevel:Default`).

## How Configuration Builds Upon Environments

ASP.NET Core's configuration system is designed to layer multiple sources, with later sources overriding earlier ones. Understanding this layering is crucial for managing environment-specific settings effectively.

```csharp
/// <summary>
/// Demonstrates the configuration loading order and how environments affect it.
/// This is what happens inside WebApplication.CreateBuilder() by default.
/// </summary>
public static class ConfigurationExplainer
{
    public static void ExplainConfigurationOrder(WebApplicationBuilder builder)
    {
        // The default configuration sources load in this order:
        // Each source can override values from previous sources
        
        // 1. appsettings.json (base configuration, always loaded)
        //    Contains default values that apply to all environments
        
        // 2. appsettings.{Environment}.json (environment-specific overrides)
        //    For example: appsettings.Development.json, appsettings.Production.json
        //    Only the file matching the current environment is loaded
        
        // 3. User Secrets (Development environment only)
        //    Stored outside your project, never committed to source control
        //    Perfect for API keys and connection strings during development
        
        // 4. Environment Variables
        //    These override everything from JSON files
        //    Great for containerized deployments and CI/CD pipelines
        
        // 5. Command Line Arguments
        //    Highest priority, override everything else
        //    Useful for one-off testing: dotnet run --MyKey=MyValue
    }
}
```

Here's how this looks with actual configuration files:

```json
// appsettings.json - Base configuration for all environments
{
  "Application": {
    "Name": "MyAwesomeApi",
    "Version": "1.0.0"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Database": {
    "CommandTimeout": 30,
    "EnableRetry": true,
    "MaxRetryCount": 3
  },
  "Cache": {
    "DefaultExpirationMinutes": 60
  },
  "FeatureFlags": {
    "EnableNewDashboard": false,
    "EnableBetaFeatures": false
  }
}
```

```json
// appsettings.Development.json - Development-specific overrides
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "Database": {
    "ConnectionString": "Server=localhost;Database=MyApp_Dev;Trusted_Connection=true;",
    "CommandTimeout": 60
  },
  "FeatureFlags": {
    "EnableNewDashboard": true,
    "EnableBetaFeatures": true
  },
  "DeveloperSettings": {
    "ShowDetailedErrors": true,
    "EnableSwagger": true,
    "SeedDatabaseOnStartup": true
  }
}
```

```json
// appsettings.Production.json - Production-specific overrides
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Database": {
    "CommandTimeout": 15,
    "MaxRetryCount": 5
  },
  "Cache": {
    "DefaultExpirationMinutes": 120
  },
  "DeveloperSettings": {
    "ShowDetailedErrors": false,
    "EnableSwagger": false,
    "SeedDatabaseOnStartup": false
  }
}
```

Notice how the production configuration doesn't include a connection string. Sensitive values like connection strings, API keys, and secrets should never live in configuration files that get committed to source control. Instead, they come from environment variables or secret management systems like Azure Key Vault.

## The Options Pattern: Strongly-Typed Configuration

Raw configuration values as strings are error-prone and hard to maintain. The Options pattern binds configuration sections to strongly-typed C# classes, giving you compile-time safety and IntelliSense support.

```csharp
/// <summary>
/// Configuration class for database settings.
/// Property names must match the JSON keys (case-insensitive).
/// </summary>
public class DatabaseOptions
{
    // This constant defines the configuration section name
    // Used when binding: services.Configure<DatabaseOptions>(config.GetSection(DatabaseOptions.SectionName))
    public const string SectionName = "Database";

    public string ConnectionString { get; set; } = string.Empty;
    public int CommandTimeout { get; set; } = 30;
    public bool EnableRetry { get; set; } = true;
    public int MaxRetryCount { get; set; } = 3;
}

/// <summary>
/// Configuration for feature flags that control application behavior.
/// </summary>
public class FeatureFlagOptions
{
    public const string SectionName = "FeatureFlags";

    public bool EnableNewDashboard { get; set; }
    public bool EnableBetaFeatures { get; set; }
}

/// <summary>
/// Developer-specific settings that change behavior during development.
/// </summary>
public class DeveloperOptions
{
    public const string SectionName = "DeveloperSettings";

    public bool ShowDetailedErrors { get; set; }
    public bool EnableSwagger { get; set; }
    public bool SeedDatabaseOnStartup { get; set; }
}
```

Register these options in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Bind configuration sections to options classes
// The configuration system automatically finds the right values based on environment
builder.Services.Configure<DatabaseOptions>(
    builder.Configuration.GetSection(DatabaseOptions.SectionName));

builder.Services.Configure<FeatureFlagOptions>(
    builder.Configuration.GetSection(FeatureFlagOptions.SectionName));

builder.Services.Configure<DeveloperOptions>(
    builder.Configuration.GetSection(DeveloperOptions.SectionName));

// Now inject IOptions<T>, IOptionsSnapshot<T>, or IOptionsMonitor<T> where needed
```

The three interfaces for consuming options each serve different purposes. `IOptions<T>` is singleton-scoped and reads values once at startup—use it when values don't change during runtime. `IOptionsSnapshot<T>` is scoped and re-reads values on each request—use it when you need to pick up configuration changes without restarting. `IOptionsMonitor<T>` is singleton-scoped but provides change notifications—use it when you need to react to configuration changes in long-lived services.

## Configuration Validation: Catching Problems Early

Here's where many applications fall short. They load configuration, bind it to options classes, and hope for the best. When a required configuration value is missing or invalid, the application might start successfully but fail mysteriously later when that configuration is actually used. By then, you're debugging production issues rather than catching problems at startup.

ASP.NET Core provides several approaches to validate configuration, each with different trade-offs.

### Approach 1: Data Annotations Validation

The simplest approach uses the same Data Annotations you know from model validation:

```csharp
using System.ComponentModel.DataAnnotations;

/// <summary>
/// Database configuration with Data Annotations validation.
/// The framework validates these attributes when the options are first accessed.
/// </summary>
public class DatabaseOptions
{
    public const string SectionName = "Database";

    [Required(ErrorMessage = "Database connection string is required")]
    [MinLength(10, ErrorMessage = "Connection string appears to be invalid (too short)")]
    public string ConnectionString { get; set; } = string.Empty;

    [Range(1, 300, ErrorMessage = "Command timeout must be between 1 and 300 seconds")]
    public int CommandTimeout { get; set; } = 30;

    public bool EnableRetry { get; set; } = true;

    [Range(0, 10, ErrorMessage = "Max retry count must be between 0 and 10")]
    public int MaxRetryCount { get; set; } = 3;
}

/// <summary>
/// API configuration demonstrating various validation attributes.
/// </summary>
public class ApiOptions
{
    public const string SectionName = "Api";

    [Required]
    [Url(ErrorMessage = "Base URL must be a valid URL")]
    public string BaseUrl { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^[a-zA-Z0-9]{32,64}$", 
        ErrorMessage = "API key must be 32-64 alphanumeric characters")]
    public string ApiKey { get; set; } = string.Empty;

    [Range(1, 60, ErrorMessage = "Timeout must be between 1 and 60 seconds")]
    public int TimeoutSeconds { get; set; } = 30;

    [Range(1, 1000, ErrorMessage = "Rate limit must be between 1 and 1000 requests per minute")]
    public int RateLimitPerMinute { get; set; } = 100;
}
```

Enable Data Annotations validation when registering options:

```csharp
var builder = WebApplication.CreateBuilder(args);

// The ValidateDataAnnotations() method enables attribute-based validation
// The ValidateOnStart() method runs validation during application startup
// rather than waiting until the options are first accessed
builder.Services.AddOptions<DatabaseOptions>()
    .Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();  // Fail fast if configuration is invalid

builder.Services.AddOptions<ApiOptions>()
    .Bind(builder.Configuration.GetSection(ApiOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

The `ValidateOnStart()` method is crucial. Without it, validation only runs when someone first requests `IOptions<T>`. With it, validation runs during application startup, and the application refuses to start if configuration is invalid. This "fail fast" behavior is exactly what you want—better to discover missing configuration immediately than have a production incident at 3 AM.

### Approach 2: IValidateOptions for Complex Validation

Data Annotations handle simple cases well, but complex validation scenarios—like validating relationships between properties or performing async validation—require a more powerful approach:

```csharp
/// <summary>
/// Complex validator for DatabaseOptions that checks relationships between settings
/// and performs validation that Data Annotations cannot express.
/// </summary>
public class DatabaseOptionsValidator : IValidateOptions<DatabaseOptions>
{
    private readonly IWebHostEnvironment _environment;

    // You can inject services into validators for environment-aware validation
    public DatabaseOptionsValidator(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public ValidateOptionsResult Validate(string? name, DatabaseOptions options)
    {
        var failures = new List<string>();

        // Basic presence validation
        if (string.IsNullOrWhiteSpace(options.ConnectionString))
        {
            failures.Add("Database connection string is required");
        }
        else
        {
            // Validate connection string format and content
            if (!options.ConnectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase) &&
                !options.ConnectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
            {
                failures.Add("Connection string must contain a Server or Data Source specification");
            }

            // Environment-specific validation
            if (_environment.IsProduction())
            {
                // In production, connection strings should use encrypted connections
                if (!options.ConnectionString.Contains("Encrypt=true", StringComparison.OrdinalIgnoreCase) &&
                    !options.ConnectionString.Contains("TrustServerCertificate=", StringComparison.OrdinalIgnoreCase))
                {
                    failures.Add("Production connection strings should specify encryption settings");
                }

                // Production shouldn't use local databases
                if (options.ConnectionString.Contains("localhost", StringComparison.OrdinalIgnoreCase) ||
                    options.ConnectionString.Contains("(local)", StringComparison.OrdinalIgnoreCase))
                {
                    failures.Add("Production cannot use localhost database connections");
                }
            }
        }

        // Validate logical relationships between settings
        if (options.EnableRetry && options.MaxRetryCount == 0)
        {
            failures.Add("When EnableRetry is true, MaxRetryCount must be greater than 0");
        }

        if (!options.EnableRetry && options.MaxRetryCount > 0)
        {
            // This is a warning scenario - not necessarily an error
            // but indicates possibly misconfigured settings
            failures.Add("MaxRetryCount is set but EnableRetry is false - retries will not occur");
        }

        // Range validation with context
        if (options.CommandTimeout < 5 && _environment.IsProduction())
        {
            failures.Add("Production command timeout should be at least 5 seconds to handle load");
        }

        // Return result
        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }
}
```

Register the validator alongside the options:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register the options
builder.Services.AddOptions<DatabaseOptions>()
    .Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName))
    .ValidateOnStart();

// Register the custom validator - it will be discovered automatically
builder.Services.AddSingleton<IValidateOptions<DatabaseOptions>, DatabaseOptionsValidator>();
```

### Approach 3: Validation in the Bind Delegate

For simpler validation that doesn't need dependency injection, you can validate directly in a configuration delegate:

```csharp
builder.Services.AddOptions<CacheOptions>()
    .Bind(builder.Configuration.GetSection("Cache"))
    .Validate(options =>
    {
        // Simple validation logic right here
        if (options.DefaultExpirationMinutes <= 0)
            return false;
        
        if (options.MaxCacheSize < options.MinCacheSize)
            return false;
        
        return true;
    }, "Cache configuration is invalid: check expiration and size settings")
    .ValidateOnStart();
```

### Approach 4: Comprehensive Startup Validation Service

For applications with many configuration sections, consider a dedicated service that validates everything at startup and provides clear diagnostics:

```csharp
/// <summary>
/// Service that performs comprehensive configuration validation at application startup.
/// Validates all configuration sections and provides detailed error reporting.
/// </summary>
public class ConfigurationValidationService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ConfigurationValidationService> _logger;
    private readonly IHostApplicationLifetime _lifetime;

    public ConfigurationValidationService(
        IServiceProvider serviceProvider,
        IWebHostEnvironment environment,
        ILogger<ConfigurationValidationService> logger,
        IHostApplicationLifetime lifetime)
    {
        _serviceProvider = serviceProvider;
        _environment = environment;
        _logger = logger;
        _lifetime = lifetime;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Validating configuration for environment: {Environment}",
            _environment.EnvironmentName);

        var validationResults = new List<ConfigurationValidationResult>();

        // Validate each options type by requesting it
        // The options framework will run registered validators
        validationResults.Add(ValidateOptions<DatabaseOptions>("Database"));
        validationResults.Add(ValidateOptions<ApiOptions>("Api"));
        validationResults.Add(ValidateOptions<FeatureFlagOptions>("FeatureFlags"));
        validationResults.Add(ValidateOptions<CacheOptions>("Cache"));

        // Perform cross-section validation
        validationResults.Add(ValidateCrossSectionRules());

        // Report results
        var failures = validationResults.Where(r => !r.IsValid).ToList();
        
        if (failures.Any())
        {
            _logger.LogError("Configuration validation failed with {FailureCount} errors:", failures.Count);
            
            foreach (var failure in failures)
            {
                _logger.LogError(
                    "  [{Section}] {Error}",
                    failure.SectionName,
                    failure.ErrorMessage);
            }

            // In production, we want to stop the application if configuration is invalid
            // In development, we might want to continue with warnings
            if (_environment.IsProduction())
            {
                _logger.LogCritical("Application cannot start with invalid configuration in Production");
                _lifetime.StopApplication();
            }
            else
            {
                _logger.LogWarning(
                    "Continuing despite configuration errors because environment is {Environment}",
                    _environment.EnvironmentName);
            }
        }
        else
        {
            _logger.LogInformation("All configuration validation passed successfully");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private ConfigurationValidationResult ValidateOptions<TOptions>(string sectionName) 
        where TOptions : class
    {
        try
        {
            // Requesting the options triggers validation
            var options = _serviceProvider.GetRequiredService<IOptions<TOptions>>();
            _ = options.Value; // Access the value to trigger validation

            return new ConfigurationValidationResult
            {
                SectionName = sectionName,
                IsValid = true
            };
        }
        catch (OptionsValidationException ex)
        {
            return new ConfigurationValidationResult
            {
                SectionName = sectionName,
                IsValid = false,
                ErrorMessage = string.Join("; ", ex.Failures)
            };
        }
        catch (Exception ex)
        {
            return new ConfigurationValidationResult
            {
                SectionName = sectionName,
                IsValid = false,
                ErrorMessage = $"Unexpected error: {ex.Message}"
            };
        }
    }

    private ConfigurationValidationResult ValidateCrossSectionRules()
    {
        try
        {
            var dbOptions = _serviceProvider.GetRequiredService<IOptions<DatabaseOptions>>().Value;
            var cacheOptions = _serviceProvider.GetRequiredService<IOptions<CacheOptions>>().Value;

            // Example cross-section rule: cache expiration shouldn't exceed database timeout
            // (this is contrived but shows the pattern)
            if (cacheOptions.DefaultExpirationMinutes * 60 < dbOptions.CommandTimeout)
            {
                return new ConfigurationValidationResult
                {
                    SectionName = "Cross-Section",
                    IsValid = false,
                    ErrorMessage = "Cache expiration should be longer than database command timeout"
                };
            }

            return new ConfigurationValidationResult
            {
                SectionName = "Cross-Section",
                IsValid = true
            };
        }
        catch (Exception ex)
        {
            return new ConfigurationValidationResult
            {
                SectionName = "Cross-Section",
                IsValid = false,
                ErrorMessage = ex.Message
            };
        }
    }
}

public class ConfigurationValidationResult
{
    public string SectionName { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
}

public class CacheOptions
{
    public int DefaultExpirationMinutes { get; set; }
    public int MaxCacheSize { get; set; }
    public int MinCacheSize { get; set; }
}
```

Register the validation service:

```csharp
// This hosted service runs at application startup
builder.Services.AddHostedService<ConfigurationValidationService>();
```

## Environment-Specific Code Paths

Sometimes you need to execute entirely different code based on the environment, not just different configuration values. The `IWebHostEnvironment` service and `Program.cs` configuration support this cleanly:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Environment-specific service registration
if (builder.Environment.IsDevelopment())
{
    // Use in-memory implementations for faster development iteration
    builder.Services.AddSingleton<ICacheService, InMemoryCacheService>();
    builder.Services.AddSingleton<IEmailService, ConsoleEmailService>();
    
    // Add development-only services
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}
else
{
    // Use real implementations in non-development environments
    builder.Services.AddSingleton<ICacheService, RedisCacheService>();
    builder.Services.AddSingleton<IEmailService, SendGridEmailService>();
}

// Environment-specific configuration sources
if (builder.Environment.IsProduction())
{
    // In production, add Azure Key Vault as a configuration source
    var keyVaultUri = builder.Configuration["KeyVault:Uri"];
    if (!string.IsNullOrEmpty(keyVaultUri))
    {
        builder.Configuration.AddAzureKeyVault(
            new Uri(keyVaultUri),
            new DefaultAzureCredential());
    }
}

var app = builder.Build();

// Environment-specific middleware pipeline
if (app.Environment.IsDevelopment())
{
    // Detailed error pages only in development
    app.UseDeveloperExceptionPage();
    
    // Swagger UI only in development
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Production error handling redirects to an error page
    app.UseExceptionHandler("/error");
    
    // Enforce HTTPS in production
    app.UseHsts();
}

// Common middleware for all environments
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

## Testing Configuration and Environment Handling

Proper testing ensures your configuration works correctly across all environments. Here's how to test environment-specific behavior:

```csharp
/// <summary>
/// Tests for configuration validation and environment-specific behavior.
/// </summary>
public class ConfigurationTests
{
    [Fact]
    public void DatabaseOptions_WithValidConfiguration_PassesValidation()
    {
        // Arrange
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:ConnectionString"] = "Server=localhost;Database=Test;Trusted_Connection=true;",
                ["Database:CommandTimeout"] = "30",
                ["Database:EnableRetry"] = "true",
                ["Database:MaxRetryCount"] = "3"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<DatabaseOptions>()
            .Bind(configuration.GetSection("Database"))
            .ValidateDataAnnotations();

        var provider = services.BuildServiceProvider();

        // Act
        var options = provider.GetRequiredService<IOptions<DatabaseOptions>>().Value;

        // Assert
        Assert.Equal("Server=localhost;Database=Test;Trusted_Connection=true;", options.ConnectionString);
        Assert.Equal(30, options.CommandTimeout);
        Assert.True(options.EnableRetry);
    }

    [Fact]
    public void DatabaseOptions_WithMissingConnectionString_ThrowsValidationException()
    {
        // Arrange
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:CommandTimeout"] = "30"
                // ConnectionString is intentionally missing
            })
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<DatabaseOptions>()
            .Bind(configuration.GetSection("Database"))
            .ValidateDataAnnotations();

        var provider = services.BuildServiceProvider();

        // Act & Assert
        var optionsAccessor = provider.GetRequiredService<IOptions<DatabaseOptions>>();
        
        var exception = Assert.Throws<OptionsValidationException>(() => _ = optionsAccessor.Value);
        Assert.Contains("ConnectionString", exception.Message);
    }

    [Theory]
    [InlineData("Development", true)]
    [InlineData("Staging", false)]
    [InlineData("Production", false)]
    public void DeveloperSettings_VaryByEnvironment(string environment, bool expectedSwaggerEnabled)
    {
        // Arrange
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<DeveloperOptions>()
            .Bind(configuration.GetSection("DeveloperSettings"));

        var provider = services.BuildServiceProvider();

        // Act
        var options = provider.GetRequiredService<IOptions<DeveloperOptions>>().Value;

        // Assert
        Assert.Equal(expectedSwaggerEnabled, options.EnableSwagger);
    }
}

/// <summary>
/// Integration tests that verify the application starts correctly in different environments.
/// </summary>
public class EnvironmentIntegrationTests
{
    [Theory]
    [InlineData("Development")]
    [InlineData("Staging")]
    [InlineData("Production")]
    public async Task Application_StartsSuccessfully_InAllEnvironments(string environment)
    {
        // Arrange
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", environment);
        
        // Provide required configuration that might differ per environment
        var configuration = new Dictionary<string, string?>
        {
            ["Database:ConnectionString"] = "Server=test;Database=test;Trusted_Connection=true;Encrypt=true;"
        };

        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment(environment);
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(configuration);
                });
            });

        // Act
        var client = factory.CreateClient();
        var response = await client.GetAsync("/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

## Summary: Bringing It All Together

Environments, launch profiles, and configuration validation work together to create a robust system for managing application behavior across different deployment contexts.

The `ASPNETCORE_ENVIRONMENT` variable is the foundation—a single setting that tells your application which environment it's running in. The `launchSettings.json` file provides convenient profile definitions for development, letting you quickly switch between configurations without changing code or deployed configuration files. The configuration system layers multiple sources (JSON files, environment variables, secrets) with environment-specific overrides, ensuring the right values reach your application.

Configuration validation is your safety net. Data Annotations provide simple declarative validation, `IValidateOptions<T>` handles complex scenarios with full dependency injection support, and `ValidateOnStart()` ensures problems are caught immediately rather than lurking until runtime. Environment-aware validation can enforce stricter rules in production than development.

The "fail fast" philosophy underpins all of this. When configuration is invalid, the application should refuse to start rather than running with broken settings. This principle, combined with comprehensive validation and clear error messages, transforms configuration problems from mysterious runtime failures into immediately obvious startup errors—exactly where you want to catch them.

This foundation connects directly to your Azure work. Azure App Service, Azure Functions, and Container Apps all use environment variables for configuration, making the patterns here directly applicable. Azure Key Vault integration slots cleanly into the configuration system, and the validation patterns ensure you catch missing secrets before they cause production incidents.
