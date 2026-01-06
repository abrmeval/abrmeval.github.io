# .NET Interview Study Guide - Part 1: Core C# Fundamentals

## Introduction

This guide covers the foundational C# concepts that form the bedrock of .NET development. These are the topics you'll encounter in almost every .NET interview, from junior to senior positions. Understanding these fundamentals deeply - not just knowing the syntax, but understanding the "why" behind the language design - will help you answer questions confidently and demonstrate expertise.

Each topic is explained with practical examples and real-world context. You'll learn not just what these features do, but when to use them and what problems they solve. This knowledge will help you in interviews and in your day-to-day work as a .NET developer.

---

## 1. Method Overriding, Overloading, and Hiding

These three concepts represent different ways methods can share names in C#, but they serve completely different purposes and behave fundamentally differently. Understanding these distinctions is crucial because they come up in almost every object-oriented programming discussion.

### Method Overloading - Compile-Time Polymorphism

Method overloading represents compile-time polymorphism, also known as static polymorphism. When you create multiple methods with the same name but different parameter lists within the same class, the compiler decides which method to call based on the arguments you provide. This decision happens at compile time, before your program even runs.

Think of method overloading like having different sized screwdrivers in your toolbox. They're all screwdrivers doing fundamentally the same job, but you pick the right one based on what you're working with. The compiler does the same thing by looking at your method arguments and selecting the matching signature.

```csharp
public class MathOperations
{
    // Same method name, different parameter types
    public int Add(int a, int b)
    {
        Console.WriteLine("Adding two integers");
        return a + b;
    }
    
    public double Add(double a, double b)
    {
        Console.WriteLine("Adding two doubles");
        return a + b;
    }
    
    public int Add(int a, int b, int c)
    {
        Console.WriteLine("Adding three integers");
        return a + b + c;
    }
    
    // You can also overload by parameter order and types
    public string Add(string a, int b)
    {
        return a + b.ToString();
    }
    
    public string Add(int a, string b)
    {
        return a.ToString() + b;
    }
}

// Usage demonstrates compile-time resolution
var math = new MathOperations();

// Compiler looks at arguments and chooses the right method
int result1 = math.Add(5, 3);           // Calls Add(int, int)
double result2 = math.Add(5.5, 3.2);    // Calls Add(double, double)
int result3 = math.Add(1, 2, 3);        // Calls Add(int, int, int)
string result4 = math.Add("Score: ", 42); // Calls Add(string, int)
string result5 = math.Add(42, " points"); // Calls Add(int, string)

// The compiler decides which method to call based solely on the method signature
// This decision is made when the code is compiled, not when it runs
```

The key to overloading is that the methods must differ in their parameter list - either in the number of parameters, types of parameters, or order of parameter types. You cannot overload based on return type alone, because the compiler wouldn't know which method you want when you call it without assigning the result.

### Method Overriding - Runtime Polymorphism

Method overriding represents runtime polymorphism, which is one of the core principles of object-oriented programming. This happens when a derived class provides a new implementation for a virtual or abstract method defined in its base class. Unlike overloading, the decision about which method to call is made at runtime based on the actual type of the object, not the type of the reference variable.

This is where the real power of polymorphism shines. You can write code that works with a base class type, but the actual behavior changes dynamically based on what specific derived class object you're working with. This enables you to write flexible, extensible code without knowing all the types that might use it.

```csharp
public class PaymentProcessor
{
    // Virtual method can be overridden by derived classes
    public virtual decimal ProcessPayment(decimal amount)
    {
        Console.WriteLine("Processing standard payment");
        return amount;
    }
    
    // Virtual method for generating receipt
    public virtual string GenerateReceipt(decimal amount)
    {
        return $"Payment processed: ${amount}";
    }
}

public class CreditCardProcessor : PaymentProcessor
{
    // Override provides new implementation
    public override decimal ProcessPayment(decimal amount)
    {
        Console.WriteLine("Processing credit card payment");
        Console.WriteLine("Validating card number...");
        Console.WriteLine("Contacting payment gateway...");
        
        decimal fee = amount * 0.03m; // 3% processing fee
        return amount + fee;
    }
    
    public override string GenerateReceipt(decimal amount)
    {
        return $"Credit Card Payment: ${amount} (includes 3% processing fee)";
    }
}

public class PayPalProcessor : PaymentProcessor
{
    public override decimal ProcessPayment(decimal amount)
    {
        Console.WriteLine("Processing PayPal payment");
        Console.WriteLine("Redirecting to PayPal...");
        
        decimal fee = amount * 0.029m; // 2.9% processing fee
        return amount + fee;
    }
    
    public override string GenerateReceipt(decimal amount)
    {
        return $"PayPal Payment: ${amount} (includes 2.9% processing fee)";
    }
}

public class BitcoinProcessor : PaymentProcessor
{
    public override decimal ProcessPayment(decimal amount)
    {
        Console.WriteLine("Processing Bitcoin payment");
        Console.WriteLine("Generating wallet address...");
        Console.WriteLine("Waiting for blockchain confirmation...");
        
        decimal fee = 2.50m; // Flat fee for crypto
        return amount + fee;
    }
    
    public override string GenerateReceipt(decimal amount)
    {
        return $"Bitcoin Payment: ${amount} (includes $2.50 network fee)";
    }
}

// This demonstrates the power of runtime polymorphism
public class OrderService
{
    // This method works with any PaymentProcessor
    // It doesn't need to know which specific type it's working with
    public void ProcessOrder(PaymentProcessor processor, decimal amount)
    {
        Console.WriteLine($"\nProcessing order for ${amount}");
        
        // The correct method is called based on the actual object type at runtime
        // This is decided when the program runs, not when it's compiled
        decimal total = processor.ProcessPayment(amount);
        
        string receipt = processor.GenerateReceipt(total);
        Console.WriteLine(receipt);
        Console.WriteLine($"Total charged: ${total}\n");
    }
}

// Usage demonstrates runtime polymorphism
var orderService = new OrderService();

// Same method call, different behavior based on actual object type
PaymentProcessor processor1 = new CreditCardProcessor();
orderService.ProcessOrder(processor1, 100m);
// Output: Processing credit card payment...
//         Total charged: $103.00

PaymentProcessor processor2 = new PayPalProcessor();
orderService.ProcessOrder(processor2, 100m);
// Output: Processing PayPal payment...
//         Total charged: $102.90

PaymentProcessor processor3 = new BitcoinProcessor();
orderService.ProcessOrder(processor3, 100m);
// Output: Processing Bitcoin payment...
//         Total charged: $102.50

// Even though all three variables are declared as PaymentProcessor,
// the correct derived class method is called at runtime
// This is the essence of polymorphism
```

To use method overriding, the base class method must be marked as virtual or abstract. Virtual means the base class provides a default implementation that can be overridden, while abstract means derived classes must provide an implementation. The derived class method must use the override keyword to replace the base implementation.

### Method Hiding - The Problematic Pattern

Method hiding uses the new keyword to hide a base class method in a derived class. This is generally discouraged in modern C# development because it breaks the principles of polymorphism and can lead to confusing, bug-prone code. When you hide a method, which version gets called depends on the type of the reference variable, not the actual object type. This violates the Liskov Substitution Principle and can cause subtle bugs.

```csharp
public class BaseReport
{
    public void Generate()
    {
        Console.WriteLine("Generating base report");
        Console.WriteLine("Loading data...");
        Console.WriteLine("Formatting output...");
    }
    
    public void Print()
    {
        Console.WriteLine("Printing base report format");
    }
}

public class CustomReport : BaseReport
{
    // Using 'new' to hide the base method (not override it)
    public new void Generate()
    {
        Console.WriteLine("Generating custom report");
        Console.WriteLine("Loading custom data source...");
        Console.WriteLine("Applying custom formatting...");
    }
    
    public new void Print()
    {
        Console.WriteLine("Printing custom report format");
    }
}

// This demonstrates the confusing behavior of method hiding
public void DemonstrateMethodHiding()
{
    // Create a CustomReport instance
    CustomReport customReport = new CustomReport();
    
    // When using CustomReport reference, hidden methods are called
    customReport.Generate();
    // Output: "Generating custom report"
    customReport.Print();
    // Output: "Printing custom report format"
    
    // Now reference the same object through a base class reference
    BaseReport baseReference = customReport; // Same object, different reference type
    
    // Now the base class methods are called - confusing!
    baseReference.Generate();
    // Output: "Generating base report" - unexpected!
    baseReference.Print();
    // Output: "Printing base report format" - unexpected!
    
    // The method called depends on the reference type, not the object type
    // This violates the principle of polymorphism
    
    Console.WriteLine($"\nAre they the same object? {ReferenceEquals(customReport, baseReference)}");
    // Output: True - yes, they're the same object!
    // But they behave differently based on how we reference them
}

// A real-world example showing why this is problematic
public class ReportProcessor
{
    public void ProcessReports(List<BaseReport> reports)
    {
        foreach (BaseReport report in reports)
        {
            // We expect this to call the appropriate Generate method
            // But with method hiding, it always calls BaseReport.Generate
            // even if the actual object is a CustomReport
            report.Generate();
        }
    }
}

// Usage shows the problem
var processor = new ReportProcessor();
var reports = new List<BaseReport>
{
    new BaseReport(),
    new CustomReport(), // This is a CustomReport, but...
    new CustomReport()
};

processor.ProcessReports(reports);
// All three call BaseReport.Generate() because the reference type is BaseReport
// The CustomReport.Generate() methods are never called
// This is almost never what you want
```

Method hiding should be avoided in new code. If you find yourself wanting to use the new keyword, consider these alternatives. First, if you want polymorphic behavior, the base method should be virtual and you should override it. Second, if the methods are truly unrelated, give them different names. Third, if you're extending third-party code you can't modify, consider using the Adapter pattern instead of inheritance.

### When to Use Each Pattern

Understanding when to use each pattern is crucial for interviews and real-world development. Method overloading is appropriate when you want to provide multiple ways to call the same logical operation with different parameter types or counts. Common examples include constructor overloading, mathematical operations with different numeric types, and string manipulation methods that accept different input types.

```csharp
// Good use of overloading - same logical operation, different inputs
public class Logger
{
    // Log a simple message
    public void Log(string message)
    {
        WriteToFile(DateTime.Now, "INFO", message);
    }
    
    // Log with severity level
    public void Log(string message, LogLevel level)
    {
        WriteToFile(DateTime.Now, level.ToString(), message);
    }
    
    // Log an exception
    public void Log(Exception ex)
    {
        WriteToFile(DateTime.Now, "ERROR", ex.ToString());
    }
    
    // Log exception with custom message
    public void Log(string message, Exception ex)
    {
        WriteToFile(DateTime.Now, "ERROR", $"{message}\n{ex}");
    }
    
    private void WriteToFile(DateTime time, string level, string message)
    {
        // Actual logging implementation
    }
}
```

Method overriding is appropriate when you have an inheritance hierarchy where derived classes need to provide specialized behavior while maintaining the same interface. This is the cornerstone of polymorphic design in object-oriented programming.

```csharp
// Good use of overriding - polymorphic behavior in inheritance hierarchy
public abstract class Shape
{
    public abstract double CalculateArea();
    public abstract double CalculatePerimeter();
    
    public virtual string GetDescription()
    {
        return $"A shape with area {CalculateArea():F2} and perimeter {CalculatePerimeter():F2}";
    }
}

public class Circle : Shape
{
    public double Radius { get; set; }
    
    public Circle(double radius)
    {
        Radius = radius;
    }
    
    public override double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }
    
    public override double CalculatePerimeter()
    {
        return 2 * Math.PI * Radius;
    }
    
    public override string GetDescription()
    {
        return $"Circle with radius {Radius}: {base.GetDescription()}";
    }
}

public class Rectangle : Shape
{
    public double Width { get; set; }
    public double Height { get; set; }
    
    public Rectangle(double width, double height)
    {
        Width = width;
        Height = height;
    }
    
    public override double CalculateArea()
    {
        return Width * Height;
    }
    
    public override double CalculatePerimeter()
    {
        return 2 * (Width + Height);
    }
    
    public override string GetDescription()
    {
        return $"Rectangle {Width}x{Height}: {base.GetDescription()}";
    }
}

// Polymorphic usage
public void DisplayShapeInfo(Shape shape)
{
    // Works with any shape - polymorphism in action
    Console.WriteLine(shape.GetDescription());
}
```

Method hiding should be avoided except in very rare circumstances where you're extending sealed third-party classes and truly need different behavior that won't be used polymorphically. Even then, composition is usually a better choice than inheritance with hiding.

### Interview Talking Points

When discussing these concepts in an interview, emphasize that overloading provides convenience for callers by allowing them to use the most natural parameter set for their situation, while the compiler ensures type safety. Explain that overriding enables the Open/Closed Principle - classes are open for extension but closed for modification. You can add new derived classes with new behavior without changing existing code that works with the base class.

Discuss the Liskov Substitution Principle - derived classes should be substitutable for their base classes without breaking the program. Method hiding violates this principle because behavior changes based on reference type rather than object type. This is why hiding is discouraged in favor of proper polymorphic design.

---

## 2. Task Parallel Library (TPL)

The Task Parallel Library revolutionized concurrent programming in .NET when it was introduced in .NET Framework 4.0. Before TPL, developers had to work directly with threads, which was complex, error-prone, and difficult to get right. TPL provides a high-level abstraction that makes parallel and asynchronous programming much more accessible while delivering better performance than manual thread management.

### Understanding the Core Concepts

At the heart of TPL is the Task type, which represents an asynchronous operation. Unlike working with threads directly, Tasks don't necessarily map one-to-one with operating system threads. Instead, TPL uses the ThreadPool to efficiently manage a smaller number of threads that execute many tasks. This means you can create thousands of tasks without creating thousands of threads, which would quickly exhaust system resources.

The ThreadPool in .NET maintains a collection of worker threads that are reused across multiple tasks. When you create a task, it's queued for execution, and the ThreadPool assigns it to an available thread. When the task completes, that thread doesn't die - it returns to the pool and can immediately start executing another task. This reuse is far more efficient than creating and destroying threads repeatedly.

TPL handles several complex aspects of parallel programming automatically. It manages work distribution across CPU cores, implements work stealing algorithms to keep all cores busy, provides automatic exception propagation and aggregation, supports cancellation through CancellationTokens, and enables progress reporting through IProgress interfaces.

```csharp
// Basic Task creation and execution
public async Task DemonstrateBasicTasks()
{
    // Create and start a task that runs on a thread pool thread
    Task task1 = Task.Run(() =>
    {
        Console.WriteLine($"Task running on thread {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(1000); // Simulate work
        Console.WriteLine("Task 1 completed");
    });
    
    // Create a task that returns a value
    Task<int> task2 = Task.Run(() =>
    {
        Console.WriteLine($"Computing on thread {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(500);
        return 42;
    });
    
    // Wait for first task to complete
    await task1;
    
    // Get the result from second task
    int result = await task2;
    Console.WriteLine($"Task 2 returned: {result}");
}

// Coordinating multiple independent operations
public async Task<DashboardData> LoadDashboardDataAsync()
{
    // Start all data loading operations simultaneously
    var salesTask = LoadSalesDataAsync();
    var customersTask = LoadCustomerDataAsync();
    var inventoryTask = LoadInventoryDataAsync();
    var analyticsTask = LoadAnalyticsDataAsync();
    
    // Wait for all tasks to complete
    // They all run in parallel, so total time is roughly equal to the slowest operation
    await Task.WhenAll(salesTask, customersTask, inventoryTask, analyticsTask);
    
    // Combine the results
    return new DashboardData
    {
        Sales = salesTask.Result,
        Customers = customersTask.Result,
        Inventory = inventoryTask.Result,
        Analytics = analyticsTask.Result,
        LoadedAt = DateTime.UtcNow
    };
    
    // If we loaded these sequentially, total time would be the sum of all operations
    // With parallel loading, total time is just the longest single operation
}

// Data parallelism with Parallel.ForEach
public void ProcessLargeDatasetInParallel(List<Order> orders)
{
    // Configure parallel options
    var options = new ParallelOptions
    {
        MaxDegreeOfParallelism = Environment.ProcessorCount, // Use all CPU cores
        CancellationToken = CancellationToken.None
    };
    
    // TPL automatically partitions the work across available cores
    Parallel.ForEach(orders, options, order =>
    {
        // Each order is processed on a different thread
        // TPL handles load balancing automatically
        ValidateOrder(order);
        CalculateTotals(order);
        ApplyDiscounts(order);
        CalculateTax(order);
        
        Console.WriteLine($"Processed order {order.Id} on thread {Thread.CurrentThread.ManagedThreadId}");
    });
    
    // When this returns, all orders have been processed
    Console.WriteLine("All orders processed");
}

// Parallel.For for numeric ranges
public void PerformParallelCalculations()
{
    double[] results = new double[1000000];
    
    // Parallel.For automatically partitions the range across cores
    Parallel.For(0, results.Length, i =>
    {
        // Each iteration can run on a different thread
        results[i] = Math.Sqrt(i) * Math.PI;
    });
    
    // Much faster than sequential for loop on multi-core systems
}
```

### Handling Cancellation

One of TPL's most powerful features is its built-in support for cancellation through CancellationTokens. This provides a cooperative cancellation model where tasks periodically check if cancellation has been requested and can gracefully shut down.

```csharp
// Implementing cancellation support
public async Task<List<SearchResult>> SearchWithCancellationAsync(
    string searchTerm,
    CancellationToken cancellationToken)
{
    var results = new List<SearchResult>();
    
    await Task.Run(() =>
    {
        for (int i = 0; i < 1000000; i++)
        {
            // Periodically check if cancellation was requested
            cancellationToken.ThrowIfCancellationRequested();
            
            // Perform search operation
            if (MatchesSearchCriteria(i, searchTerm))
            {
                results.Add(new SearchResult { Id = i });
            }
            
            // For long-running operations, check cancellation frequently
            if (i % 1000 == 0)
            {
                cancellationToken.ThrowIfCancellationRequested();
            }
        }
    }, cancellationToken);
    
    return results;
}

// Using cancellation from the caller
public async Task DemonstrateCancellation()
{
    using var cts = new CancellationTokenSource();
    
    // Start the search operation
    var searchTask = SearchWithCancellationAsync("important", cts.Token);
    
    // Cancel after 5 seconds if not completed
    cts.CancelAfter(TimeSpan.FromSeconds(5));
    
    try
    {
        var results = await searchTask;
        Console.WriteLine($"Search completed with {results.Count} results");
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("Search was cancelled");
    }
}

// Cancellation with multiple tasks
public async Task ProcessWithTimeoutAsync(List<string> items, TimeSpan timeout)
{
    using var cts = new CancellationTokenSource(timeout);
    
    var tasks = items.Select(item => ProcessItemAsync(item, cts.Token)).ToArray();
    
    try
    {
        await Task.WhenAll(tasks);
        Console.WriteLine("All items processed successfully");
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine($"Processing timed out after {timeout.TotalSeconds} seconds");
        
        // Check which tasks completed and which didn't
        int completed = tasks.Count(t => t.IsCompletedSuccessfully);
        int cancelled = tasks.Count(t => t.IsCanceled);
        
        Console.WriteLine($"Completed: {completed}, Cancelled: {cancelled}");
    }
}
```

### Exception Handling in Parallel Operations

TPL provides sophisticated exception handling that aggregates exceptions from multiple parallel operations into a single AggregateException. This allows you to handle errors from parallel work in a consistent way.

```csharp
// Handling exceptions in parallel operations
public async Task ProcessMultipleOrdersWithErrorHandlingAsync(List<int> orderIds)
{
    var tasks = orderIds.Select(id => ProcessOrderWithPossibleErrorAsync(id)).ToArray();
    
    try
    {
        await Task.WhenAll(tasks);
        Console.WriteLine("All orders processed successfully");
    }
    catch (Exception ex)
    {
        // Task.WhenAll throws the first exception it encounters
        // But other tasks may have also failed
        
        Console.WriteLine($"Processing failed: {ex.Message}");
        
        // To see all exceptions, examine each task
        foreach (var task in tasks.Where(t => t.IsFaulted))
        {
            var aggregateException = task.Exception;
            
            // AggregateException can contain multiple inner exceptions
            foreach (var innerException in aggregateException.InnerExceptions)
            {
                _logger.LogError(innerException, 
                    $"Failed to process order: {innerException.Message}");
                
                // Handle specific exception types
                if (innerException is InvalidOperationException)
                {
                    // Handle invalid operation
                }
                else if (innerException is TimeoutException)
                {
                    // Handle timeout
                }
            }
        }
        
        // Check which tasks succeeded
        var successful = tasks.Count(t => t.IsCompletedSuccessfully);
        var failed = tasks.Count(t => t.IsFaulted);
        
        Console.WriteLine($"Summary: {successful} succeeded, {failed} failed");
    }
}

// Parallel.ForEach exception handling
public void ProcessWithExceptionHandling(List<Order> orders)
{
    var exceptions = new ConcurrentBag<Exception>();
    
    Parallel.ForEach(orders, order =>
    {
        try
        {
            ProcessOrder(order);
        }
        catch (Exception ex)
        {
            // Collect exceptions for later handling
            exceptions.Add(ex);
        }
    });
    
    if (exceptions.Any())
    {
        Console.WriteLine($"Processing completed with {exceptions.Count} errors");
        
        foreach (var ex in exceptions)
        {
            _logger.LogError(ex, "Order processing error");
        }
    }
}
```

### Limiting Concurrency

Sometimes you need to limit how many operations run concurrently to avoid overwhelming resources like databases, file systems, or external APIs.

```csharp
// Using SemaphoreSlim to limit concurrent operations
public async Task ProcessFilesWithLimitedConcurrencyAsync(List<string> filePaths)
{
    // Limit to 5 concurrent file operations
    var semaphore = new SemaphoreSlim(5);
    var tasks = new List<Task>();
    
    foreach (var filePath in filePaths)
    {
        tasks.Add(ProcessFileWithSemaphoreAsync(filePath, semaphore));
    }
    
    await Task.WhenAll(tasks);
}

private async Task ProcessFileWithSemaphoreAsync(string filePath, SemaphoreSlim semaphore)
{
    // Wait for permission to proceed
    await semaphore.WaitAsync();
    
    try
    {
        Console.WriteLine($"Processing {filePath} on thread {Thread.CurrentThread.ManagedThreadId}");
        
        // Only 5 files are processed at once
        await ProcessFileAsync(filePath);
        
        Console.WriteLine($"Completed {filePath}");
    }
    finally
    {
        // Always release the semaphore
        semaphore.Release();
    }
}

// Throttling API calls
public async Task<List<ApiResponse>> CallApiWithThrottlingAsync(List<string> endpoints)
{
    var semaphore = new SemaphoreSlim(10); // Max 10 concurrent API calls
    var results = new ConcurrentBag<ApiResponse>();
    
    var tasks = endpoints.Select(async endpoint =>
    {
        await semaphore.WaitAsync();
        try
        {
            var response = await _httpClient.GetAsync(endpoint);
            var data = await response.Content.ReadAsAsync<ApiResponse>();
            results.Add(data);
        }
        finally
        {
            semaphore.Release();
        }
    });
    
    await Task.WhenAll(tasks);
    
    return results.ToList();
}
```

### Advanced TPL Patterns

TPL supports several advanced patterns for complex scenarios involving task continuation, parent-child relationships, and task scheduling.

```csharp
// Task continuations - chaining operations
public async Task DemonstrateContinuationsAsync()
{
    var task = Task.Run(() =>
    {
        Console.WriteLine("First task running");
        return 42;
    })
    .ContinueWith(previousTask =>
    {
        Console.WriteLine($"Continuation received: {previousTask.Result}");
        return previousTask.Result * 2;
    })
    .ContinueWith(previousTask =>
    {
        Console.WriteLine($"Final result: {previousTask.Result}");
        return previousTask.Result;
    });
    
    var finalResult = await task;
    Console.WriteLine($"All continuations completed: {finalResult}");
}

// Task.WhenAny - respond to first completion
public async Task<string> GetFastestResponseAsync(List<string> urls)
{
    var tasks = urls.Select(url => FetchDataAsync(url)).ToList();
    
    // Returns when the first task completes
    var completedTask = await Task.WhenAny(tasks);
    
    // Cancel remaining tasks to save resources
    // (assuming FetchDataAsync accepts a CancellationToken)
    
    return await completedTask;
}

// Progress reporting
public async Task ProcessWithProgressAsync(List<string> items, IProgress<int> progress)
{
    int completed = 0;
    
    await Task.Run(() =>
    {
        Parallel.ForEach(items, item =>
        {
            ProcessItem(item);
            
            int currentCompleted = Interlocked.Increment(ref completed);
            
            // Report progress percentage
            int percentComplete = (currentCompleted * 100) / items.Count;
            progress?.Report(percentComplete);
        });
    });
}

// Using progress reporting
public async Task DemonstrateProgressReporting()
{
    var progress = new Progress<int>(percentComplete =>
    {
        Console.WriteLine($"Progress: {percentComplete}%");
    });
    
    var items = Enumerable.Range(1, 100).Select(i => $"Item{i}").ToList();
    
    await ProcessWithProgressAsync(items, progress);
}
```

### TPL vs Manual Thread Management

The advantages of TPL over manual thread management are substantial. TPL automatically scales to use available CPU cores efficiently, provides sophisticated work-stealing algorithms that keep all cores busy, includes built-in support for cancellation and progress reporting, handles exception aggregation and propagation consistently, integrates seamlessly with async/await, and prevents common threading problems like thread starvation.

```csharp
// Manual thread management - complex and error-prone
public void ManualThreadApproach()
{
    var threads = new List<Thread>();
    var results = new ConcurrentBag<int>();
    
    for (int i = 0; i < 10; i++)
    {
        int index = i; // Capture loop variable
        
        var thread = new Thread(() =>
        {
            var result = PerformCalculation(index);
            results.Add(result);
        });
        
        thread.Start();
        threads.Add(thread);
    }
    
    // Wait for all threads
    foreach (var thread in threads)
    {
        thread.Join();
    }
    
    // Process results
}

// TPL approach - simple and efficient
public async Task TplApproach()
{
    var tasks = Enumerable.Range(0, 10)
        .Select(i => Task.Run(() => PerformCalculation(i)))
        .ToArray();
    
    var results = await Task.WhenAll(tasks);
    
    // Process results
}
```

### Interview Talking Points

When discussing TPL in interviews, emphasize that it provides a higher-level abstraction than threads, making parallel programming more accessible and maintainable. Explain that TPL uses the ThreadPool to efficiently reuse threads rather than creating and destroying them, which dramatically reduces overhead. Discuss how TPL handles the complexity of work distribution, load balancing, and exception handling automatically.

Mention that TPL is the foundation for async/await in modern C#, and understanding TPL helps you understand how asynchronous programming works under the hood. Talk about practical scenarios where you've used parallel processing to improve application performance, such as processing large datasets, making multiple API calls concurrently, or performing parallel file I/O operations.

Be prepared to discuss when parallel processing might not be appropriate, such as when operations are I/O-bound rather than CPU-bound, when the overhead of parallelization exceeds the benefit, or when operations must execute in a specific order. Understanding these trade-offs demonstrates mature thinking about performance optimization.

---

## 3. Thread vs Task

Understanding the fundamental difference between Thread and Task is one of the most important concepts in modern .NET development. While both enable concurrent execution, they operate at completely different levels of abstraction and are suited for different scenarios. This distinction affects application performance, resource utilization, and scalability in significant ways.

### Threads - The Low-Level Construct

A Thread is a low-level operating system construct that represents an actual thread of execution. When you create a Thread object in C# and call its Start method, you're asking the operating system to allocate resources for a new thread. This includes approximately one megabyte of stack space, thread-local storage, and various execution context structures. The operating system then schedules this thread to run on a CPU core along with all the other threads in the system.

Creating threads is expensive both in terms of memory and CPU overhead. Each thread requires that megabyte of stack space, which quickly adds up if you create many threads. Additionally, the operating system must perform context switching to share CPU cores among all threads, and each context switch has overhead - saving the current thread's state, loading the next thread's state, and invalidating CPU caches.

Threads give you very direct control over execution. You can set thread priority, configure apartment state for COM interop, manage thread-local storage explicitly, and control exactly when the thread starts and how it's waited upon. This control comes at the cost of complexity and responsibility - you must manage the thread's lifecycle, handle synchronization carefully, and deal with potential issues like race conditions and deadlocks.

```csharp
// Creating and using a Thread directly
public void DemonstrateThreadCreation()
{
    // Create a new thread
    var thread = new Thread(() =>
    {
        Console.WriteLine($"Thread ID: {Thread.CurrentThread.ManagedThreadId}");
        Console.WriteLine($"Is Thread Pool: {Thread.CurrentThread.IsThreadPoolThread}"); // False
        Console.WriteLine($"Thread Priority: {Thread.CurrentThread.Priority}");
        
        // This code runs on a dedicated OS thread
        for (int i = 0; i < 5; i++)
        {
            Console.WriteLine($"Working on thread {Thread.CurrentThread.ManagedThreadId}: Step {i}");
            Thread.Sleep(500);
        }
        
        Console.WriteLine("Thread work completed");
    });
    
    // Configure thread properties before starting
    thread.Name = "My Worker Thread";
    thread.Priority = ThreadPriority.AboveNormal;
    thread.IsBackground = true; // Thread won't prevent app from exiting
    
    // Start the thread
    thread.Start();
    
    Console.WriteLine($"Main thread: Started worker thread {thread.ManagedThreadId}");
    
    // Wait for the thread to complete
    thread.Join();
    
    Console.WriteLine("Thread has finished and been destroyed");
    
    // At this point, the thread and all its resources are gone
    // The ~1MB of stack space is freed
    // If you need to do more work, you must create a new thread
}

// Demonstrating the resource cost of threads
public void DemonstrateThreadResourceUsage()
{
    var threads = new List<Thread>();
    
    try
    {
        // Try to create 1000 threads
        for (int i = 0; i < 1000; i++)
        {
            var thread = new Thread(() =>
            {
                // Each thread just sleeps
                Thread.Sleep(10000);
            });
            
            thread.Start();
            threads.Add(thread);
            
            if (i % 100 == 0)
            {
                Console.WriteLine($"Created {i} threads...");
                
                // Calculate approximate memory usage
                long memoryUsed = i * 1024 * 1024; // ~1MB per thread
                Console.WriteLine($"Approximate memory for stacks: {memoryUsed / (1024 * 1024)}MB");
            }
        }
        
        Console.WriteLine($"Successfully created {threads.Count} threads");
    }
    catch (OutOfMemoryException ex)
    {
        Console.WriteLine($"Ran out of memory after creating {threads.Count} threads");
        Console.WriteLine($"Each thread consumed ~1MB of stack space");
    }
    finally
    {
        // Clean up threads
        foreach (var thread in threads)
        {
            thread.Join(TimeSpan.FromSeconds(1));
        }
    }
}

// Demonstrating thread-specific features
public void DemonstrateThreadSpecificFeatures()
{
    // Setting apartment state for COM interop
    var thread = new Thread(() =>
    {
        // This thread can now safely interact with COM objects
        // that require STA threading
        Console.WriteLine($"Apartment State: {Thread.CurrentThread.GetApartmentState()}");
    });
    
    // Must set apartment state before starting the thread
    thread.SetApartmentState(ApartmentState.STA);
    thread.Start();
    thread.Join();
    
    // Thread-local storage
    var threadLocalValue = new ThreadLocal<int>(() =>
    {
        // This initialization runs once per thread
        return Thread.CurrentThread.ManagedThreadId * 100;
    });
    
    var threads = new List<Thread>();
    
    for (int i = 0; i < 5; i++)
    {
        var t = new Thread(() =>
        {
            // Each thread gets its own value
            Console.WriteLine($"Thread {Thread.CurrentThread.ManagedThreadId} local value: {threadLocalValue.Value}");
            
            // Modifications are thread-local
            threadLocalValue.Value += 1;
            
            Console.WriteLine($"Thread {Thread.CurrentThread.ManagedThreadId} modified value: {threadLocalValue.Value}");
        });
        
        t.Start();
        threads.Add(t);
    }
    
    foreach (var t in threads)
    {
        t.Join();
    }
}
```

### Tasks - The High-Level Abstraction

A Task is a higher-level abstraction that represents work to be done, not necessarily a thread. Tasks use the ThreadPool, which maintains a pool of worker threads that are shared and reused across all tasks in your application. When you create a task, it's queued for execution, and when a thread from the pool becomes available, it picks up the task and executes it. When the task completes, that thread doesn't die - it returns to the pool and can immediately start executing another task.

This fundamental difference makes tasks much more efficient than threads. You can create thousands of tasks without creating thousands of threads. The ThreadPool typically maintains a number of threads roughly equal to the number of CPU cores, plus some additional threads for I/O operations. These threads are efficiently reused, eliminating the overhead of constantly creating and destroying threads.

Tasks also integrate seamlessly with the async/await pattern, which is crucial for modern .NET development. When you await a task that performs I/O operations, the thread executing your code returns to the pool and can do other work while waiting for the I/O to complete. When the I/O finishes, a thread from the pool (possibly a different one) resumes execution. This means you can have thousands of concurrent I/O operations without blocking thousands of threads.

```csharp
// Creating and using Tasks
public async Task DemonstrateTaskCreation()
{
    // Create a task using Task.Run
    Task task = Task.Run(() =>
    {
        Console.WriteLine($"Task running on thread {Thread.CurrentThread.ManagedThreadId}");
        Console.WriteLine($"Is Thread Pool: {Thread.CurrentThread.IsThreadPoolThread}"); // True
        
        // This code runs on a ThreadPool thread
        for (int i = 0; i < 5; i++)
        {
            Console.WriteLine($"Working on thread {Thread.CurrentThread.ManagedThreadId}: Step {i}");
            Thread.Sleep(500);
        }
        
        Console.WriteLine("Task work completed");
    });
    
    Console.WriteLine($"Main thread: Started task");
    
    // Await the task (non-blocking wait)
    await task;
    
    Console.WriteLine("Task has finished, thread returned to pool");
    
    // The thread that executed this task is back in the pool
    // It can be reused immediately for another task
}

// Creating a task that returns a value
public async Task<int> CalculateSumAsync(int[] numbers)
{
    // Task<TResult> represents an operation that will return a value
    return await Task.Run(() =>
    {
        Console.WriteLine($"Calculating sum on thread {Thread.CurrentThread.ManagedThreadId}");
        
        int sum = 0;
        foreach (var number in numbers)
        {
            sum += number;
        }
        
        return sum;
    });
}

// Demonstrating task efficiency
public async Task DemonstrateTaskEfficiency()
{
    var tasks = new List<Task>();
    
    // Create 1000 tasks - no problem
    for (int i = 0; i < 1000; i++)
    {
        int taskNumber = i;
        
        tasks.Add(Task.Run(async () =>
        {
            Console.WriteLine($"Task {taskNumber} on thread {Thread.CurrentThread.ManagedThreadId}");
            await Task.Delay(1000);
            Console.WriteLine($"Task {taskNumber} completed");
        }));
        
        if (i % 100 == 0)
        {
            Console.WriteLine($"Created {i} tasks...");
        }
    }
    
    Console.WriteLine($"Created {tasks.Count} tasks");
    Console.WriteLine("These tasks share a small pool of threads (typically 8-16)");
    Console.WriteLine("Much more efficient than creating 1000 actual threads");
    
    await Task.WhenAll(tasks);
    
    Console.WriteLine("All tasks completed");
}
```

### The Critical Difference - I/O Operations

The most dramatic difference between threads and tasks becomes apparent with I/O operations. When a thread makes a blocking I/O call (like reading from a file or waiting for a network response), that thread is blocked and can't do any other work until the I/O completes. With tasks and async/await, the thread is released back to the pool during I/O operations and can handle other work.

```csharp
// Blocking I/O with threads - inefficient
public void DownloadWithThreads(List<string> urls)
{
    var threads = new List<Thread>();
    var results = new ConcurrentBag<string>();
    
    foreach (var url in urls)
    {
        var thread = new Thread(() =>
        {
            // This thread is blocked during the entire HTTP request
            using var client = new WebClient();
            var data = client.DownloadString(url);
            results.Add(data);
            
            // The thread is blocked, unable to do any other work
            // If you have 100 URLs, you need 100 threads all blocking
        });
        
        thread.Start();
        threads.Add(thread);
    }
    
    // Wait for all downloads
    foreach (var thread in threads)
    {
        thread.Join();
    }
    
    Console.WriteLine($"Downloaded {results.Count} URLs using {threads.Count} threads");
}

// Async I/O with tasks - efficient
public async Task<List<string>> DownloadWithTasksAsync(List<string> urls)
{
    var tasks = urls.Select(async url =>
    {
        // During the HTTP request, NO THREAD IS BLOCKED
        var response = await _httpClient.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();
        
        // The thread that started this operation returned to the pool
        // When the HTTP response arrives, a thread picks up the continuation
        // It might be a different thread than the one that started the request
        
        return content;
    });
    
    // Wait for all downloads
    // All these operations run concurrently with minimal threads
    var results = await Task.WhenAll(tasks);
    
    Console.WriteLine($"Downloaded {results.Length} URLs using just a few pool threads");
    
    return results.ToList();
}

// Comparing resource usage
public async Task CompareResourceUsage()
{
    var stopwatch = Stopwatch.StartNew();
    var urls = Enumerable.Range(1, 100)
        .Select(i => $"https://api.example.com/data/{i}")
        .ToList();
    
    // With threads: 100 threads all blocked during I/O
    // High memory usage, poor scalability
    
    stopwatch.Restart();
    
    // With tasks: Only a few threads needed
    // During I/O, threads return to pool and handle other work
    var results = await DownloadWithTasksAsync(urls);
    
    Console.WriteLine($"Async approach: {stopwatch.ElapsedMilliseconds}ms");
    Console.WriteLine($"Downloaded {results.Count} items");
    Console.WriteLine("Used only a few pool threads - much more scalable");
}
```

### Task Composition and Continuation

Tasks provide rich composition capabilities that threads lack. You can easily chain tasks, combine results from multiple tasks, handle errors across multiple operations, and create complex asynchronous workflows.

```csharp
// Task composition example
public async Task<ProcessedData> ProcessDataPipelineAsync(string inputFile)
{
    // Each step awaits the previous one
    // During I/O, threads are released back to the pool
    
    // Step 1: Read data
    var rawData = await File.ReadAllTextAsync(inputFile);
    Console.WriteLine("Data read completed");
    
    // Step 2: Parse data
    var parsedData = await ParseDataAsync(rawData);
    Console.WriteLine("Parsing completed");
    
    // Step 3: Validate data
    var validatedData = await ValidateDataAsync(parsedData);
    Console.WriteLine("Validation completed");
    
    // Step 4: Enrich data
    var enrichedData = await EnrichDataAsync(validatedData);
    Console.WriteLine("Enrichment completed");
    
    // Step 5: Transform data
    var transformedData = await TransformDataAsync(enrichedData);
    Console.WriteLine("Transformation completed");
    
    // Step 6: Save results
    await SaveResultsAsync(transformedData);
    Console.WriteLine("Results saved");
    
    return transformedData;
    
    // Throughout this pipeline, threads are used efficiently
    // During each I/O operation, the thread returns to the pool
    // The total number of threads used is minimal
}

// Parallel task execution
public async Task<Report> GenerateComprehensiveReportAsync()
{
    // Start multiple independent operations simultaneously
    var task1 = GenerateSalesReportAsync();
    var task2 = GenerateInventoryReportAsync();
    var task3 = GenerateCustomerReportAsync();
    var task4 = GenerateFinancialReportAsync();
    
    // All four operations run concurrently
    // But they might not all be running on threads at the same time
    // During I/O operations, threads are released
    
    await Task.WhenAll(task1, task2, task3, task4);
    
    // Combine results
    return new Report
    {
        Sales = task1.Result,
        Inventory = task2.Result,
        Customers = task3.Result,
        Financial = task4.Result
    };
}
```

### When to Use Threads vs Tasks

The decision between threads and tasks is usually straightforward in modern .NET development. Use tasks for almost everything - they're more efficient, easier to work with, and integrate with async/await. The only times you might need actual threads are very specific scenarios that require thread-level control.

```csharp
// Scenarios where you might need Thread
public class ThreadRequiredScenarios
{
    // COM interop requiring specific apartment state
    public void ComInteropScenario()
    {
        var thread = new Thread(() =>
        {
            // Initialize COM
            // Work with COM objects
        });
        
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();
        
        // Tasks don't give you control over apartment state
    }
    
    // Long-running work that should not use thread pool
    public void LongRunningDedicatedWork()
    {
        var thread = new Thread(() =>
        {
            // This work will run for hours or days
            // We don't want to tie up a thread pool thread for this long
            WhileRunning = true;
            while (WhileRunning)
            {
                PerformBackgroundWork();
                Thread.Sleep(1000);
            }
        });
        
        thread.IsBackground = true;
        thread.Start();
        
        // For long-running tasks, you can use Task with TaskCreationOptions.LongRunning
        // which tells the scheduler not to use a pool thread
    }
    
    // Most scenarios should use Task
    public async Task PreferredApproach()
    {
        // CPU-bound work
        await Task.Run(() =>
        {
            PerformCalculations();
        });
        
        // I/O-bound work
        var data = await DownloadDataAsync();
        
        // Long-running work
        await Task.Factory.StartNew(
            () => LongRunningOperation(),
            TaskCreationOptions.LongRunning);
    }
    
    private bool WhileRunning;
    private void PerformBackgroundWork() { }
    private void PerformCalculations() { }
    private Task<string> DownloadDataAsync() => Task.FromResult("");
    private void LongRunningOperation() { }
}
```

### Performance Comparison

Let's look at a practical comparison showing the performance and resource differences between threads and tasks.

```csharp
public class PerformanceComparison
{
    public void CompareCpuBoundWork()
    {
        var stopwatch = Stopwatch.StartNew();
        int iterations = 100;
        
        // Using threads
        var threads = new List<Thread>();
        for (int i = 0; i < iterations; i++)
        {
            var thread = new Thread(() =>
            {
                PerformCpuWork();
            });
            thread.Start();
            threads.Add(thread);
        }
        
        foreach (var thread in threads)
        {
            thread.Join();
        }
        
        Console.WriteLine($"Threads: {stopwatch.ElapsedMilliseconds}ms");
        Console.WriteLine($"Created {iterations} threads");
        
        // Using tasks
        stopwatch.Restart();
        
        var tasks = new List<Task>();
        for (int i = 0; i < iterations; i++)
        {
            tasks.Add(Task.Run(() => PerformCpuWork()));
        }
        
        Task.WaitAll(tasks.ToArray());
        
        Console.WriteLine($"Tasks: {stopwatch.ElapsedMilliseconds}ms");
        Console.WriteLine($"Used thread pool with ~{Environment.ProcessorCount} threads");
        
        // Tasks are typically faster due to better thread management
        // and avoiding constant thread creation/destruction overhead
    }
    
    public async Task CompareIoBoundWork()
    {
        var stopwatch = Stopwatch.StartNew();
        int operations = 100;
        
        // Simulate I/O with actual async operations
        var urls = Enumerable.Range(1, operations)
            .Select(i => $"https://httpbin.org/delay/1")
            .ToList();
        
        // With tasks (efficient - no blocking)
        var tasks = urls.Select(url => DownloadAsync(url));
        await Task.WhenAll(tasks);
        
        Console.WriteLine($"Tasks: {stopwatch.ElapsedMilliseconds}ms");
        Console.WriteLine("Minimal threads used, all released during I/O");
        
        // With threads would require 100 blocked threads
        // Much higher resource usage and lower scalability
    }
    
    private void PerformCpuWork()
    {
        double result = 0;
        for (int i = 0; i < 1000000; i++)
        {
            result += Math.Sqrt(i);
        }
    }
    
    private async Task<string> DownloadAsync(string url)
    {
        using var client = new HttpClient();
        return await client.GetStringAsync(url);
    }
}
```

### Interview Talking Points

When discussing threads versus tasks in an interview, emphasize that this choice fundamentally affects application scalability and performance. Explain that threads are low-level OS constructs with significant resource overhead, while tasks are high-level abstractions that use the ThreadPool for efficient thread reuse.

Discuss how tasks enable the async/await pattern, which is essential for scalable I/O operations. When a task awaits an I/O operation, the thread returns to the pool rather than blocking, allowing it to handle other work. This means you can have thousands of concurrent I/O operations without thousands of threads.

Mention that in modern .NET development, you should almost always use tasks over threads. The only exceptions are very specific scenarios requiring thread-level control like COM interop with apartment state requirements, or working with legacy code that absolutely requires explicit thread management.

Be prepared to discuss the ThreadPool - how it maintains a pool of worker threads (typically around the number of CPU cores), how it uses work-stealing algorithms to keep all cores busy, and how it automatically manages thread creation and destruction based on workload.

Understanding these concepts demonstrates that you think about performance and scalability at an architectural level, not just at a syntax level.

---

*[Document continues with topics 4-11...]*

*Due to the extensive nature of these topics, I'll continue creating the remaining topics. Would you like me to continue with the next topics (4-11) in this guide, or would you prefer I move on to creating Guide 2 (Modern C# & .NET Features) to give you a complete set of all guides?*
---

## 6. Script Placement: Header vs Body


## 6. Script Placement: Header vs Body

The placement of JavaScript in HTML documents has significant implications for page load performance, rendering behavior, and user experience. Understanding when and why to place scripts in different locations demonstrates your awareness of web performance fundamentals, which is important even when working primarily with backend technologies like ASP.NET.

### How Script Loading Affects Page Rendering

When a browser encounters a script tag in the HTML head section, it stops parsing the HTML, downloads the script, executes it, and only then continues parsing the rest of the page. This is called blocking behavior, and it's why placing scripts in the head can make your page appear to load slowly. The user sees a blank screen while scripts download and execute, even though the actual content is ready to be displayed.

Think of it like a construction project where you're building a house. If you stop building the walls every time you need to install a light fixture, the house takes much longer to reach a livable state. But if you build all the walls first and then go back to install the fixtures, people can move in much sooner. Script placement works the same way with web pages.

```html
<!-- Poor Practice: Scripts in head block rendering -->
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    
    <!-- These scripts block HTML parsing and page rendering -->
    <script src="jquery-3.6.0.min.js"></script>
    <script src="bootstrap.bundle.min.js"></script>
    <script src="my-application.js"></script>
    
    <!-- User sees nothing until all scripts download and execute -->
</head>
<body>
    <h1>Welcome to My Site</h1>
    <p>This content is invisible until scripts finish loading</p>
    <!-- Content appears all at once after scripts complete -->
</body>
</html>

<!-- Better Practice: Scripts at end of body -->
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <!-- CSS should stay in head for progressive rendering -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Welcome to My Site</h1>
    <p>This content appears immediately</p>
    
    <!-- Scripts load after content is visible -->
    <script src="jquery-3.6.0.min.js"></script>
    <script src="bootstrap.bundle.min.js"></script>
    <script src="my-application.js"></script>
    
    <!-- User sees content while scripts load in background -->
</body>
</html>

<!-- Modern Best Practice: defer attribute -->
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    
    <!-- Scripts download in parallel but execute after parsing -->
    <script src="jquery-3.6.0.min.js" defer></script>
    <script src="bootstrap.bundle.min.js" defer></script>
    <script src="my-application.js" defer></script>
    
    <!-- Scripts maintain execution order and wait for DOM -->
</head>
<body>
    <h1>Welcome to My Site</h1>
    <p>Content appears immediately, scripts load efficiently</p>
</body>
</html>

<!-- For independent scripts: async attribute -->
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    
    <!-- async downloads and executes as soon as available -->
    <!-- Good for analytics, ads, social widgets -->
    <script src="google-analytics.js" async></script>
    <script src="social-share-buttons.js" async></script>
    
    <!-- These don't guarantee execution order -->
</head>
<body>
    <h1>Welcome to My Site</h1>
    <p>Content loads, independent scripts load separately</p>
</body>
</html>
```

In ASP.NET applications, you control script placement through layout pages and sections. The modern approach uses the defer attribute for most scripts, placing them in the head for better caching while still allowing content to appear first.

```csharp
// _Layout.cshtml in ASP.NET Core MVC
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>@ViewData["Title"] - My Application</title>
    
    <!-- CSS in head for progressive rendering -->
    <link rel="stylesheet" href="~/css/site.css" />
    
    <!-- Core scripts with defer -->
    <script src="~/lib/jquery/jquery.min.js" defer></script>
    <script src="~/lib/bootstrap/bootstrap.bundle.min.js" defer></script>
    
    <!-- Page-specific head scripts (use sparingly) -->
    @RenderSection("HeadScripts", required: false)
</head>
<body>
    <header>
        <nav>Navigation content</nav>
    </header>
    
    <main>
        @RenderBody()
    </main>
    
    <footer>Footer content</footer>
    
    <!-- Page-specific scripts that need DOM -->
    @RenderSection("Scripts", required: false)
</body>
</html>

// In your view
@section Scripts {
    <script>
        // This runs after jQuery and Bootstrap are loaded
        $(document).ready(function() {
            // DOM is fully loaded and ready
            initializePageFeatures();
        });
    </script>
}
```

The key principle is to let content appear as quickly as possible. Scripts in the head block rendering unless they use defer or async. Scripts at the end of the body allow content to display first but don't take advantage of parallel downloading. Scripts with defer in the head provide the best balance for most scenarios, downloading in parallel while the page renders but executing only after the DOM is ready.

### Interview Talking Points

When discussing script placement in interviews, explain that scripts in the head block HTML parsing and delay content display, which hurts perceived performance. Scripts at the end of the body allow content to appear first but miss opportunities for parallel downloading. The defer attribute provides the best of both worlds for most scripts, downloading in parallel but executing after the DOM is ready. The async attribute is appropriate for independent scripts like analytics that don't depend on DOM or other scripts. Understanding these trade-offs shows you think about user experience and performance optimization.

---

## 7. Private Virtual Methods

Private virtual methods represent an unusual and rarely-used feature in C# that combines two seemingly contradictory concepts. A method marked as private is accessible only within its declaring class, while a method marked as virtual is designed to be overridden in derived classes. How can a method be both? The answer reveals an interesting implementation of the Template Method design pattern.

### Understanding the Paradox

A private virtual method can be overridden in derived classes, but it can only be called from within the base class. This creates a pattern where the base class controls when the method is called through its public or protected methods, but derived classes can customize what the method does. Think of it as the base class providing a recipe with specific steps, and derived classes can customize individual steps while the base class controls the overall flow.

```csharp
// Base class defines the template and customization points
public class DataProcessor
{
    // Public method defines the algorithm structure
    public void ProcessData(string data)
    {
        Console.WriteLine("Starting data processing");
        
        // Base class controls when validation happens
        if (ValidateData(data))
        {
            // Base class controls when transformation happens
            var processed = TransformData(data);
            
            // Base class controls when saving happens
            SaveData(processed);
            
            Console.WriteLine("Data processing completed");
        }
        else
        {
            Console.WriteLine("Validation failed");
        }
    }
    
    // Private virtual methods are customization points
    // Derived classes can override them, but only base class can call them
    private virtual bool ValidateData(string data)
    {
        // Default validation
        return !string.IsNullOrEmpty(data);
    }
    
    private virtual string TransformData(string data)
    {
        // Default transformation
        return data.ToUpper();
    }
    
    private virtual void SaveData(string data)
    {
        // Default save behavior
        Console.WriteLine($"Saving: {data}");
    }
}

// Derived class customizes specific steps
public class XmlDataProcessor : DataProcessor
{
    // Can override private virtual methods from base class
    private override bool ValidateData(string data)
    {
        // Custom XML validation
        return data.StartsWith("<") && data.EndsWith(">");
    }
    
    private override string TransformData(string data)
    {
        // Custom XML transformation
        return $"<root>{data}</root>";
    }
    
    private override void SaveData(string data)
    {
        // Custom save to XML file
        Console.WriteLine($"Saving to XML file: {data}");
        File.WriteAllText("data.xml", data);
    }
}

// Usage demonstrates the pattern
public void UsePrivateVirtual()
{
    DataProcessor processor = new XmlDataProcessor();
    
    // Can only call the public method
    processor.ProcessData("<data>content</data>");
    
    // Cannot call ValidateData, TransformData, or SaveData directly
    // processor.ValidateData(); // Compiler error - method is private
    
    // But the overridden implementations are used internally
}
```

While private virtual methods are syntactically valid, they're rarely the best solution in modern C#. Protected virtual methods are usually more appropriate because they make the inheritance contract more explicit and easier to understand. Private virtual methods can make code harder to maintain because the visibility and overridability seem contradictory.

```csharp
// More conventional approach using protected virtual
public class BetterDataProcessor
{
    public void ProcessData(string data)
    {
        if (ValidateData(data))
        {
            var processed = TransformData(data);
            SaveData(processed);
        }
    }
    
    // Protected virtual is clearer about inheritance intentions
    protected virtual bool ValidateData(string data)
    {
        return !string.IsNullOrEmpty(data);
    }
    
    protected virtual string TransformData(string data)
    {
        return data.ToUpper();
    }
    
    protected virtual void SaveData(string data)
    {
        Console.WriteLine($"Saving: {data}");
    }
}
```

The key insight is that private virtual methods exist primarily for the Template Method pattern where the base class wants to control the algorithm structure while allowing derived classes to customize specific steps. However, protected virtual methods usually serve this purpose better with clearer intent.

### Interview Talking Points

When discussing private virtual methods in interviews, explain that they combine private accessibility with virtual overridability, allowing the base class to control when methods are called while letting derived classes customize behavior. Mention that while this implements the Template Method pattern, protected virtual methods are usually clearer and more conventional. Understanding this feature shows you know the language deeply, but also knowing when not to use it demonstrates good judgment.

---

## 8. Array vs ArrayList and List<T> vs ArrayList

Understanding the differences between Array, ArrayList, and List<T> is fundamental to choosing the right collection type for your needs. These types evolved as .NET matured, with each generation solving problems from the previous one while introducing new capabilities.

### The Evolution of Collections

Array is the most basic collection type in .NET, dating back to the very beginning of the framework. An array provides fixed-size, strongly-typed storage with excellent performance. Once you create an array with a specific size, you cannot change that size. If you need more space, you must create a new larger array and copy elements over.

ArrayList was introduced in .NET Framework 1.0 as a dynamic alternative to arrays. It can grow and shrink as needed, solving the fixed-size problem of arrays. However, ArrayList was designed before generics existed in .NET, so it stores everything as objects. This means you lose type safety and pay a performance cost for boxing and unboxing value types.

List<T> arrived with generics in .NET Framework 2.0 and represents the best of both worlds. It provides dynamic sizing like ArrayList but with full type safety and no boxing overhead. For almost all modern .NET code, List<T> is the preferred choice for dynamic collections.

```csharp
// Array - fixed size, type-safe, best performance
public void DemonstrateArray()
{
    // Create array with fixed size
    int[] numbers = new int[5];
    numbers[0] = 10;
    numbers[1] = 20;
    
    // Cannot add more elements
    // numbers[5] = 30; // Runtime error - IndexOutOfRangeException
    
    // To add more elements, must create new array
    int[] expandedNumbers = new int[numbers.Length + 1];
    Array.Copy(numbers, expandedNumbers, numbers.Length);
    expandedNumbers[5] = 30;
    
    // Arrays have excellent indexing performance - O(1) access
}

// ArrayList - dynamic size, not type-safe, boxing overhead
public void DemonstrateArrayList()
{
    // ArrayList can store any type (everything is object)
    ArrayList list = new ArrayList();
    
    // Can add different types - seems flexible but causes problems
    list.Add(10);           // int boxed to object
    list.Add("Hello");      // string to object
    list.Add(3.14);         // double boxed to object
    
    // Retrieving requires casting and unboxing
    int number = (int)list[0];      // Unboxing
    string text = (string)list[1];  // Casting
    
    // No compile-time type safety - errors caught at runtime
    try
    {
        int wrong = (int)list[1]; // Runtime error - InvalidCastException
    }
    catch (InvalidCastException)
    {
        Console.WriteLine("Type error caught at runtime, not compile time");
    }
    
    // When to use ArrayList: Never in new code!
    // Only when maintaining legacy code
}

// List<T> - dynamic size, type-safe, good performance
public void DemonstrateList()
{
    // List<T> is type-safe and flexible
    List<int> numbers = new List<int>();
    
    // Compiler enforces type safety
    numbers.Add(10);
    numbers.Add(20);
    // numbers.Add("Hello"); // Compiler error - won't compile
    
    // No boxing for value types
    numbers.Add(30); // Direct storage
    int value = numbers[0]; // Direct access
    
    // Rich API for manipulation
    numbers.AddRange(new[] { 40, 50, 60 });
    numbers.Insert(0, 5);
    numbers.Remove(20);
    numbers.RemoveAt(0);
    
    // LINQ integration
    var evenNumbers = numbers.Where(n => n % 2 == 0).ToList();
    var sum = numbers.Sum();
    
    // Searching and sorting
    numbers.Sort();
    bool contains = numbers.Contains(100);
    int index = numbers.BinarySearch(50);
    
    // When to use List<T>: Almost always for dynamic collections
}
```

### Interview Talking Points

When discussing these collection types, explain that Array is fixed-size and fastest but inflexible. ArrayList is legacy from pre-generics .NET and should never be used in new code due to lack of type safety and boxing overhead. List<T> combines dynamic sizing with type safety and good performance, making it the default choice for most dynamic collection needs. Mention that you'd use arrays when size is fixed and known upfront or when interfacing with APIs that require arrays.

---

## 9. Dynamic Variable Initialization Error

When you attempt to use the var keyword to declare multiple variables in a single statement, you'll encounter a compiler error. This limitation stems from how the compiler performs type inference and highlights an important aspect of C#'s strongly-typed nature.

### Understanding the Limitation

The var keyword tells the compiler to infer the type from the initialization expression on the right side of the assignment. This works perfectly for a single variable because the compiler can look at the value you're assigning and determine what type the variable should be. However, when you try to declare multiple variables in one statement, the syntax becomes ambiguous from the compiler's perspective.

```csharp
// This causes compile error CS0819
public void ErrorExample()
{
    // Error: Implicitly-typed variables cannot have multiple declarators
    var x = 10, y = 20;
}

// Correct approaches
public void CorrectApproaches()
{
    // Approach 1: Separate var declarations
    var x = 10;
    var y = 20;
    var z = 30;
    
    // Approach 2: Explicit type allows multiple declarators
    int a = 10, b = 20, c = 30;
    
    // Approach 3: Use tuples for related values
    var (first, second, third) = (10, 20, 30);
}
```

The reason this restriction exists is to avoid ambiguity in the language design. With explicit types, all variables in a multiple declaration statement must be the same type. But if var could be used for multiple variables, would each variable be independently typed based on its initializer? Or would they all be constrained to the same type? To avoid this confusion, C# requires separate statements when using var.

### Interview Talking Points

When discussing this error in interviews, explain that var requires a complete initialization expression to infer the type. The restriction on multiple declarators exists to maintain clarity and avoid ambiguity about whether variables should have the same or different types. Mention that you can either declare variables separately with var or use an explicit type with multiple declarators.

---

## 10. Session Management in ASP.NET

Session state is a critical feature in web applications that allows you to maintain user-specific data across multiple HTTP requests. Understanding session management is important both for maintaining legacy ASP.NET applications and for appreciating why modern approaches evolved.

### Session State Modes

ASP.NET Framework provides several session state modes, each with different trade-offs between performance, scalability, and reliability. InProc mode stores session data in the web server's memory, providing the fastest access but losing data if the application pool recycles. StateServer mode stores session in a separate Windows service, surviving application restarts but requiring network round trips. SQL Server mode stores session in a database, providing the highest reliability and supporting web farms but with the slowest performance.

```csharp
// Using session in ASP.NET Framework
public class SessionExample : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        // Check if this is a new session
        if (Session["UserId"] == null)
        {
            // Initialize session for new user
            Session["UserId"] = Guid.NewGuid().ToString();
            Session["LoginTime"] = DateTime.Now;
        }
        
        // Read and update session values
        string userId = Session["UserId"]?.ToString();
        Session["LastActivity"] = DateTime.Now;
        
        // Store complex objects
        var cart = new ShoppingCart();
        Session["Cart"] = cart;
    }
}

// Modern ASP.NET Core session
public class ModernSessionController : Controller
{
    public IActionResult Index()
    {
        // Set simple values
        HttpContext.Session.SetString("UserName", "John");
        HttpContext.Session.SetInt32("UserId", 12345);
        
        return View();
    }
    
    public IActionResult GetSession()
    {
        // Retrieve values
        string userName = HttpContext.Session.GetString("UserName");
        int? userId = HttpContext.Session.GetInt32("UserId");
        
        return Ok(new { userName, userId });
    }
}
```

### Interview Talking Points

When discussing session management, explain the three main session modes in ASP.NET Framework and their trade-offs. Mention that InProc is fastest but data is lost on restart, while SQL Server mode supports web farms but is slowest. Discuss how ASP.NET Core modernized session with distributed session providers. Emphasize that session is cookie-based and doesn't work well for stateless APIs, where token-based authentication is preferred.

---

## 11. AutoPostBack in ASP.NET Web Forms

AutoPostBack is a distinctive feature of ASP.NET Web Forms that automatically posts the page back to the server when certain user interactions occur with form controls. While this feature isn't used in modern ASP.NET Core applications, understanding it is valuable for maintaining legacy systems.

### How AutoPostBack Works

When you enable AutoPostBack on a control like a dropdown list, ASP.NET generates JavaScript that automatically submits the form when the control's value changes. This allows server-side code to execute in response to client-side events without requiring manual JavaScript. However, each autopostback causes a full page reload.

```csharp
// Code-behind with AutoPostBack
public partial class ProductCatalog : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            LoadCategories();
        }
    }
    
    // This fires automatically when dropdown changes
    protected void ddlCategories_SelectedIndexChanged(object sender, EventArgs e)
    {
        int categoryId = int.Parse(ddlCategories.SelectedValue);
        LoadProducts(categoryId);
    }
}
```

Modern web development uses client-side JavaScript with AJAX instead of AutoPostBack, providing better performance and user experience without full page reloads.

### Interview Talking Points

When discussing AutoPostBack, explain that it was a Web Forms feature that automatically posted the page back to the server when form controls changed, allowing server-side event handlers to execute. Mention that while convenient, it caused full page reloads which impacted performance. Modern development uses client-side JavaScript with AJAX for similar functionality with better user experience.

---

## Summary and Key Takeaways

This completes Part 1 of your .NET interview study guide, covering the core C# fundamentals that form the foundation of .NET development.

### Essential Concepts Mastered

You've learned that method overloading provides compile-time polymorphism through different parameter signatures, method overriding enables runtime polymorphism through inheritance, and method hiding should generally be avoided. You understand that the Task Parallel Library provides high-level abstractions for concurrent programming, and Tasks should almost always be preferred over Threads due to better resource utilization.

You've explored how Global.asax.cs provided centralized application lifecycle event handling and how ASP.NET Core replaced this with middleware. You understand equality comparison depends on reference versus value types and can be customized through overriding Equals and GetHashCode. You've learned about script placement performance implications and the evolution toward defer and async attributes.

You now understand private virtual methods and when protected virtual is more appropriate, the evolution from Array to ArrayList to List<T>, why var cannot be used for multiple variable declarations, how session state works across different storage modes, and how AutoPostBack worked compared to modern JavaScript approaches.

### Connecting to Real-World Development

These fundamental concepts aren't just interview trivia. Understanding method overriding enables proper inheritance hierarchies. Knowing Tasks versus Threads helps you write scalable concurrent code. Understanding equality affects how objects behave in collections. Session management knowledge is crucial for web applications maintaining user state. Even deprecated features like AutoPostBack teach lessons about evolution toward better user experiences.

### Next Steps

You're now ready to move on to **Part 2: Modern C# & .NET Features**, where you'll explore the latest language innovations like records, pattern matching, and modern .NET performance optimizations.

---

*End of Guide 1: Core C# Fundamentals*
