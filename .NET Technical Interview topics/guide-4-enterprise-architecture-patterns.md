# .NET Interview Study Guide - Part 4: Enterprise Architecture Patterns

## Introduction

Welcome to the fourth guide in your comprehensive .NET interview preparation series. While the previous guides covered fundamental C# concepts, modern framework features, and cloud-native distributed systems, this guide focuses on the architectural patterns that structure large-scale enterprise applications. These patterns represent decades of collective wisdom about how to organize complex software systems to make them maintainable, testable, and adaptable to changing requirements.

Enterprise architecture patterns aren't just theoretical constructs or academic exercises. They're practical solutions to real problems that emerge when applications grow beyond a certain complexity threshold. When you're building a small application with a few hundred lines of code, you can get away with putting everything in a few classes and it works fine. But when you're building systems with hundreds of thousands or millions of lines of code, with dozens of developers working simultaneously, with requirements that change frequently, and with a lifespan measured in years or decades, you need structured approaches to manage that complexity.

The patterns we'll explore in this guide address different aspects of this complexity. Some patterns, like CQRS and Event Sourcing, tackle the challenge of handling reads and writes differently to optimize for different access patterns and maintain a complete audit trail of changes. Other patterns, like Domain-Driven Design, provide a methodology for organizing code around business concepts to keep technical implementation closely aligned with business needs. Still others, like the Repository and Unit of Work patterns, handle the persistent nature of enterprise data while keeping business logic independent of data access concerns.

Understanding these patterns is crucial for technical interviews at senior levels because they represent the difference between someone who can write code that works and someone who can architect systems that continue working as they grow and evolve. Interviewers want to know that you can think architecturally, that you understand trade-offs between different approaches, and that you can choose appropriate patterns based on specific requirements rather than applying the same solution to every problem.

Each pattern in this guide comes with benefits and costs. CQRS can dramatically improve performance and scalability but adds complexity. Event Sourcing provides perfect audit trails and time-travel debugging but requires careful handling of evolving events. Domain-Driven Design keeps code aligned with business reality but demands close collaboration between developers and domain experts. The Repository pattern provides clean abstraction over data access but can become leaky if not designed carefully. API versioning enables evolution without breaking clients but requires maintaining multiple implementations.

As you work through these patterns, focus not just on the mechanics of how they work but on understanding why they exist, what problems they solve, and when you should or shouldn't use them. The ability to articulate these trade-offs clearly is what distinguishes architects from developers in interviews. You'll be asked not just "do you know CQRS?" but "when would you use CQRS versus a simpler CRUD approach?" Being able to answer those questions thoughtfully, with real-world context and nuanced understanding of trade-offs, is what this guide will help you achieve.

Let's begin by exploring CQRS, a pattern that challenges one of the most fundamental assumptions in traditional application architecture—that reads and writes should use the same model.

---

## 43. CQRS (Command Query Responsibility Segregation)

CQRS represents a fundamental shift in how we think about data flow in applications. Traditional architecture uses the same model for both reading and writing data—the same classes, the same database schema, the same logic paths. CQRS challenges this assumption by separating reads from writes, using different models optimized for each operation. This separation enables significant optimization opportunities but introduces complexity that must be justified by your specific requirements.

### Understanding the Traditional Problem

In conventional architecture, you create domain entities that represent both the data structure and the business rules. When you need to display data to users, you load these entities from the database, maybe project them into DTOs, and return them. When users modify data, you load the entities, apply business rules, and save them back. This works well for simple applications, but it creates problems as complexity grows.

Consider an e-commerce order. When displaying order history to a customer, you need a flat, denormalized view with order ID, date, total, and status. You don't need all the business rules about how orders can be modified or the complex relationships between orders, order lines, products, and customers. You just need to quickly retrieve and display data. But when creating an order, you need rich validation—checking inventory, validating payment information, applying business rules about discounts and shipping, and ensuring data consistency. These are fundamentally different operations with different performance characteristics and different complexity requirements.

Traditional architecture forces you to use the same model for both scenarios. Your Order entity has to handle both the complex validation logic for creation and the simple data projection for display. This creates several problems. The model becomes bloated with concerns from both reads and writes. Query performance suffers because you're loading complex object graphs when you just need simple data. Business logic becomes tangled with data access code. Testing becomes difficult because tests must account for both read and write concerns simultaneously.

```csharp
// Traditional approach - same model for reads and writes
public class TraditionalOrderService
{
    private readonly ApplicationDbContext _context;
    
    // Reading orders - uses full entity model even though we only need display data
    public async Task<List<OrderDto>> GetCustomerOrdersAsync(int customerId)
    {
        var orders = await _context.Orders
            .Include(o => o.OrderLines)
                .ThenInclude(ol => ol.Product)
            .Include(o => o.Customer)
            .Include(o => o.ShippingAddress)
            .Where(o => o.CustomerId == customerId)
            .ToListAsync();
        
        // Loading entire object graph even though we only need:
        // - Order ID
        // - Order date
        // - Total amount
        // - Status
        
        // Lots of unnecessary data loaded from database
        // Complex joins for data we don't need
        
        return orders.Select(o => new OrderDto
        {
            OrderId = o.Id,
            OrderDate = o.OrderDate,
            Total = o.Total,
            Status = o.Status
        }).ToList();
    }
    
    // Writing orders - uses same entity model with validation
    public async Task<Order> CreateOrderAsync(CreateOrderCommand command)
    {
        // Load related entities to validate business rules
        var customer = await _context.Customers
            .Include(c => c.ShippingAddresses)
            .FirstOrDefaultAsync(c => c.Id == command.CustomerId);
        
        if (customer == null)
            throw new ValidationException("Customer not found");
        
        // Check inventory for each item
        foreach (var item in command.Items)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == item.ProductId);
            
            if (product == null)
                throw new ValidationException($"Product {item.ProductId} not found");
            
            if (product.StockQuantity < item.Quantity)
                throw new ValidationException($"Insufficient stock for {product.Name}");
            
            // Update inventory
            product.StockQuantity -= item.Quantity;
        }
        
        // Create order with business rules
        var order = new Order
        {
            CustomerId = command.CustomerId,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Pending,
            ShippingAddress = customer.ShippingAddresses.FirstOrDefault(),
            OrderLines = command.Items.Select(i => new OrderLine
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitPrice = _context.Products.Find(i.ProductId).Price
            }).ToList()
        };
        
        order.CalculateTotal(); // Business logic
        
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        
        return order;
    }
}

// Problems with this approach:
// 1. Same Order entity used for both reads and writes
// 2. Reading orders loads unnecessary related data
// 3. Complex queries for simple display needs
// 4. Business logic mixed with data access
// 5. Difficult to optimize reads without affecting writes
// 6. Hard to scale reads and writes independently
```

This traditional approach becomes increasingly problematic as your application grows. The Order entity accumulates more and more responsibilities. Query performance degrades as you load complex object graphs for simple displays. Making changes becomes risky because modifications to support one use case might break another. You can't optimize reads and writes independently because they share the same code paths.

### CQRS: Separating Reads and Writes

CQRS solves these problems by using completely different models for reads and writes. Commands represent write operations—they contain the data needed to perform an action and return success or failure. Queries represent read operations—they contain search criteria and return data optimized for display. Each side is optimized for its specific purpose without compromising the other.

On the write side, you have rich domain models with business logic, validation, and invariants. These models are optimized for enforcing business rules and maintaining data consistency. They typically map closely to your normalized database schema. On the read side, you have simple DTOs or view models that are optimized for query performance. These can be denormalized, cached aggressively, or even stored in a separate read-optimized database.

```csharp
// CQRS approach - separate models for reads and writes

// WRITE SIDE - Commands and Handlers

// Command represents an intent to change state
public record CreateOrderCommand(
    int CustomerId,
    List<OrderItemDto> Items,
    int ShippingAddressId,
    PaymentInfo Payment);

// Command handler contains business logic
public class CreateOrderCommandHandler
{
    private readonly IOrderRepository _orderRepository;
    private readonly IInventoryService _inventoryService;
    private readonly IPaymentService _paymentService;
    private readonly IEventPublisher _eventPublisher;
    
    public async Task<CommandResult<int>> HandleAsync(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        // Validate business rules
        var validationResult = await ValidateOrderAsync(command);
        if (!validationResult.IsValid)
            return CommandResult<int>.Failure(validationResult.Errors);
        
        // Reserve inventory
        var reservation = await _inventoryService.ReserveAsync(
            command.Items.Select(i => new InventoryReservation
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity
            }).ToList());
        
        if (!reservation.Success)
            return CommandResult<int>.Failure("Insufficient inventory");
        
        // Process payment
        var payment = await _paymentService.ProcessAsync(command.Payment);
        if (!payment.Success)
        {
            await _inventoryService.ReleaseAsync(reservation.ReservationId);
            return CommandResult<int>.Failure("Payment failed");
        }
        
        // Create order with rich domain model
        var order = Order.Create(
            customerId: command.CustomerId,
            items: command.Items,
            shippingAddressId: command.ShippingAddressId,
            paymentTransactionId: payment.TransactionId);
        
        // Save to write database
        await _orderRepository.SaveAsync(order);
        
        // Publish event for read side to update
        await _eventPublisher.PublishAsync(new OrderCreatedEvent
        {
            OrderId = order.Id,
            CustomerId = order.CustomerId,
            Total = order.Total,
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        });
        
        return CommandResult<int>.Success(order.Id);
    }
    
    private async Task<ValidationResult> ValidateOrderAsync(CreateOrderCommand command)
    {
        // Business validation logic
        var errors = new List<string>();
        
        if (command.Items == null || !command.Items.Any())
            errors.Add("Order must contain at least one item");
        
        if (command.Items.Sum(i => i.Quantity) > 100)
            errors.Add("Cannot order more than 100 items total");
        
        // More validation...
        
        return new ValidationResult(errors);
    }
}

// Rich domain model for write side
public class Order
{
    private readonly List<OrderItem> _items = new();
    
    public int Id { get; private set; }
    public int CustomerId { get; private set; }
    public decimal Total { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    
    // Factory method with business rules
    public static Order Create(
        int customerId,
        List<OrderItemDto> items,
        int shippingAddressId,
        string paymentTransactionId)
    {
        var order = new Order
        {
            CustomerId = customerId,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        
        foreach (var item in items)
        {
            order.AddItem(item.ProductId, item.ProductName, item.Quantity, item.UnitPrice);
        }
        
        order.CalculateTotal();
        
        return order;
    }
    
    private void AddItem(int productId, string productName, int quantity, decimal unitPrice)
    {
        if (quantity <= 0)
            throw new InvalidOperationException("Quantity must be positive");
        
        if (unitPrice < 0)
            throw new InvalidOperationException("Price cannot be negative");
        
        _items.Add(new OrderItem
        {
            ProductId = productId,
            ProductName = productName,
            Quantity = quantity,
            UnitPrice = unitPrice
        });
    }
    
    private void CalculateTotal()
    {
        Total = _items.Sum(i => i.Quantity * i.UnitPrice);
    }
    
    // Business methods
    public void Cancel()
    {
        if (Status == OrderStatus.Shipped)
            throw new InvalidOperationException("Cannot cancel shipped orders");
        
        Status = OrderStatus.Cancelled;
    }
    
    public void Ship()
    {
        if (Status != OrderStatus.Confirmed)
            throw new InvalidOperationException("Can only ship confirmed orders");
        
        Status = OrderStatus.Shipped;
    }
}

// READ SIDE - Queries and Read Models

// Query represents a request for data
public record GetCustomerOrdersQuery(int CustomerId, int Page, int PageSize);

// Simple read model optimized for display
public class OrderSummaryReadModel
{
    public int OrderId { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; }
    public int ItemCount { get; set; }
}

// Query handler optimized for fast reads
public class GetCustomerOrdersQueryHandler
{
    private readonly IOrderReadRepository _readRepository;
    
    public async Task<PagedResult<OrderSummaryReadModel>> HandleAsync(
        GetCustomerOrdersQuery query,
        CancellationToken cancellationToken)
    {
        // Query optimized read model - denormalized, indexed
        var orders = await _readRepository.GetOrderSummariesAsync(
            query.CustomerId,
            query.Page,
            query.PageSize);
        
        return orders;
        
        // Benefits:
        // - No complex joins
        // - No unnecessary data loaded
        // - Can use denormalized tables
        // - Can cache aggressively
        // - Can use different database (e.g., read from NoSQL)
    }
}

// Read repository uses denormalized view
public class OrderReadRepository : IOrderReadRepository
{
    private readonly ReadDbContext _readContext;
    
    public async Task<PagedResult<OrderSummaryReadModel>> GetOrderSummariesAsync(
        int customerId,
        int page,
        int pageSize)
    {
        // Query denormalized read model table
        var query = _readContext.OrderSummaries
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.OrderDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        
        var total = await query.CountAsync();
        var items = await query.ToListAsync();
        
        return new PagedResult<OrderSummaryReadModel>(items, total, page, pageSize);
    }
}

// Event handler updates read model when write occurs
public class OrderCreatedEventHandler
{
    private readonly ReadDbContext _readContext;
    
    public async Task HandleAsync(OrderCreatedEvent @event)
    {
        // Update denormalized read model
        var summary = new OrderSummaryReadModel
        {
            OrderId = @event.OrderId,
            CustomerId = @event.CustomerId,
            OrderDate = @event.CreatedAt,
            Total = @event.Total,
            Status = "Pending",
            ItemCount = @event.Items.Count
        };
        
        _readContext.OrderSummaries.Add(summary);
        await _readContext.SaveChangesAsync();
    }
}
```

The separation is dramatic. The write side focuses entirely on business logic and data consistency, using rich domain models with proper encapsulation and business rules. It doesn't care about query performance because it's not handling queries. The read side focuses entirely on query performance and display optimization, using simple DTOs and denormalized data. It doesn't care about business rules because it's not changing data.

This separation enables powerful optimizations. You can use different databases for reads and writes—perhaps PostgreSQL for writes where you need ACID transactions, but Elasticsearch for reads where you need full-text search. You can cache read models aggressively because they're simple and don't contain complex business logic. You can scale reads and writes independently based on actual load patterns. You can have hundreds of different read models optimized for different views without affecting write performance.

### When to Use CQRS

CQRS isn't appropriate for every application. It adds significant complexity by separating reads and writes, requiring synchronization between them, and duplicating data. For simple CRUD applications where reads and writes have similar complexity and performance requirements, traditional architecture is simpler and perfectly adequate.

CQRS becomes valuable when you have specific characteristics that justify its complexity. If your application has dramatically different read and write patterns—many more reads than writes, or reads that require denormalized data while writes require normalized data—CQRS can optimize each independently. If you need to scale reads and writes differently, CQRS enables that separation. If you have complex business logic on writes but simple display requirements on reads, CQRS keeps them from interfering with each other.

```csharp
// Good candidates for CQRS:

// 1. High read-to-write ratio
// - Social media feeds: millions of reads, occasional writes
// - E-commerce catalogs: many searches, infrequent updates
// - Analytics dashboards: constant querying, periodic data loads

// 2. Complex business rules on writes, simple displays
public class ComplexOrderProcessing
{
    // Write: Complex validation, inventory checks, payment processing,
    // discount calculations, shipping coordination
    // Read: Just display order history - simple list
}

// 3. Different scalability requirements
// - Writes go to primary database with ACID guarantees
// - Reads served from replicas, cache, or search index
// - Can scale read replicas without affecting write database

// 4. Need for multiple read models
public class ProductService
{
    // Write model: Normalized product data with inventory tracking
    // Read model 1: Search-optimized for product catalog
    // Read model 2: Recommendations optimized for ML algorithms
    // Read model 3: Analytics optimized for business intelligence
    
    // Each read model optimized for its purpose
    // Single write model maintains consistency
}

// Poor candidates for CQRS:

// Simple CRUD applications
public class SimpleBlogPost
{
    // Reads and writes have similar complexity
    // No special performance requirements
    // Traditional CRUD is simpler and adequate
}

// Real-time consistency requirements
public class BankingTransfer
{
    // Need immediate consistency between reads and writes
    // Users expect to see updated balance instantly
    // Eventual consistency of CQRS is problematic
}
```

### Interview Talking Points

When discussing CQRS in interviews, explain that it separates read and write responsibilities to optimize each independently. Emphasize that the write side uses rich domain models with business logic while the read side uses simple DTOs optimized for queries. Discuss when CQRS is appropriate—different read/write patterns, different scaling needs, complex writes with simple reads—and when it's not—simple CRUD, real-time consistency requirements. Mention that CQRS often combines with Event Sourcing but they're independent patterns. Understanding CQRS demonstrates architectural thinking and the ability to choose patterns based on specific requirements rather than applying them universally.

---

## 44. Event Sourcing

Event Sourcing represents a fundamental rethinking of how we persist application state. Instead of storing the current state of entities, Event Sourcing stores the sequence of events that led to that state. The current state is derived by replaying these events. This approach provides powerful capabilities like complete audit trails, temporal queries, and debugging through time travel, but it requires careful design to handle evolving event schemas and query performance.

### The Traditional State Storage Problem

Traditional applications store current state. When a user updates their shipping address, the database record is updated to show the new address, and the old address is lost unless you've specifically built audit logging. When an order's status changes from "pending" to "shipped," the status field is updated and you lose information about when it was pending. If a bug causes incorrect data, you can't replay history to understand how it happened because you only have the final corrupted state.

This state-based approach has several limitations. You lose historical information unless you explicitly build audit tables. You can't answer temporal questions like "what was this customer's address last month?" without complex version tracking. Debugging becomes difficult because you can't see the sequence of changes that led to the current state. Compliance requirements for audit trails require additional infrastructure. Reproducing bugs that depend on specific sequences of state changes is nearly impossible.

```csharp
// Traditional state-based persistence
public class TraditionalOrderService
{
    private readonly ApplicationDbContext _context;
    
    public async Task UpdateOrderStatusAsync(int orderId, OrderStatus newStatus)
    {
        var order = await _context.Orders.FindAsync(orderId);
        
        // Update current state
        order.Status = newStatus;
        order.LastModified = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        // Problems:
        // - Lost information about previous status
        // - Lost information about when status changed
        // - Lost information about who changed it
        // - Can't replay history to debug issues
        // - Can't answer "when was this order pending?"
    }
    
    public async Task UpdateShippingAddressAsync(int orderId, Address newAddress)
    {
        var order = await _context.Orders
            .Include(o => o.ShippingAddress)
            .FirstOrDefaultAsync(o => o.Id == orderId);
        
        // Overwrite existing address
        order.ShippingAddress = newAddress;
        
        await _context.SaveChangesAsync();
        
        // Problems:
        // - Old address is completely lost
        // - Can't track address change history
        // - Compliance issues if address changes need audit trail
    }
}
```

### Event Sourcing: Storing the History

Event Sourcing solves these problems by storing events instead of state. Every change to an entity is captured as an event—OrderPlaced, OrderStatusChanged, ShippingAddressUpdated. These events are immutable and append-only. The current state is calculated by replaying all events from the beginning. This provides a complete audit trail automatically, enables temporal queries, and allows replaying history for debugging.

```csharp
// Event Sourcing approach

// Events represent facts that happened - immutable
public abstract record OrderEvent
{
    public Guid OrderId { get; init; }
    public DateTime Timestamp { get; init; }
    public int Version { get; init; }
}

public record OrderPlacedEvent : OrderEvent
{
    public int CustomerId { get; init; }
    public List<OrderItem> Items { get; init; }
    public decimal Total { get; init; }
    public Address ShippingAddress { get; init; }
}

public record OrderStatusChangedEvent : OrderEvent
{
    public OrderStatus OldStatus { get; init; }
    public OrderStatus NewStatus { get; init; }
    public string Reason { get; init; }
}

public record ShippingAddressUpdatedEvent : OrderEvent
{
    public Address OldAddress { get; init; }
    public Address NewAddress { get; init; }
}

public record OrderCancelledEvent : OrderEvent
{
    public string Reason { get; init; }
    public decimal RefundAmount { get; init; }
}

// Aggregate builds state from events
public class OrderAggregate
{
    private readonly List<OrderEvent> _uncommittedEvents = new();
    
    public Guid Id { get; private set; }
    public int CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public decimal Total { get; private set; }
    public Address ShippingAddress { get; private set; }
    public List<OrderItem> Items { get; private set; } = new();
    public int Version { get; private set; }
    
    // Create new order - generates event
    public static OrderAggregate PlaceOrder(
        Guid orderId,
        int customerId,
        List<OrderItem> items,
        Address shippingAddress)
    {
        var aggregate = new OrderAggregate();
        
        // Apply event to generate state
        aggregate.ApplyEvent(new OrderPlacedEvent
        {
            OrderId = orderId,
            CustomerId = customerId,
            Items = items,
            Total = items.Sum(i => i.Quantity * i.UnitPrice),
            ShippingAddress = shippingAddress,
            Timestamp = DateTime.UtcNow,
            Version = 1
        });
        
        return aggregate;
    }
    
    // Change order status - generates event
    public void ChangeStatus(OrderStatus newStatus, string reason)
    {
        if (Status == newStatus)
            return;
        
        // Validate state transition
        if (Status == OrderStatus.Cancelled)
            throw new InvalidOperationException("Cannot change status of cancelled order");
        
        // Apply event
        ApplyEvent(new OrderStatusChangedEvent
        {
            OrderId = Id,
            OldStatus = Status,
            NewStatus = newStatus,
            Reason = reason,
            Timestamp = DateTime.UtcNow,
            Version = Version + 1
        });
    }
    
    // Update shipping address - generates event
    public void UpdateShippingAddress(Address newAddress)
    {
        if (Status == OrderStatus.Shipped)
            throw new InvalidOperationException("Cannot change address after shipping");
        
        ApplyEvent(new ShippingAddressUpdatedEvent
        {
            OrderId = Id,
            OldAddress = ShippingAddress,
            NewAddress = newAddress,
            Timestamp = DateTime.UtcNow,
            Version = Version + 1
        });
    }
    
    // Cancel order - generates event
    public void Cancel(string reason)
    {
        if (Status == OrderStatus.Delivered)
            throw new InvalidOperationException("Cannot cancel delivered orders");
        
        ApplyEvent(new OrderCancelledEvent
        {
            OrderId = Id,
            Reason = reason,
            RefundAmount = Total,
            Timestamp = DateTime.UtcNow,
            Version = Version + 1
        });
    }
    
    // Apply event to update state
    private void ApplyEvent(OrderEvent @event)
    {
        // Update state based on event type
        switch (@event)
        {
            case OrderPlacedEvent placed:
                Id = placed.OrderId;
                CustomerId = placed.CustomerId;
                Items = placed.Items;
                Total = placed.Total;
                ShippingAddress = placed.ShippingAddress;
                Status = OrderStatus.Pending;
                break;
                
            case OrderStatusChangedEvent statusChanged:
                Status = statusChanged.NewStatus;
                break;
                
            case ShippingAddressUpdatedEvent addressUpdated:
                ShippingAddress = addressUpdated.NewAddress;
                break;
                
            case OrderCancelledEvent cancelled:
                Status = OrderStatus.Cancelled;
                break;
        }
        
        Version = @event.Version;
        _uncommittedEvents.Add(@event);
    }
    
    // Rebuild state from event history
    public static OrderAggregate LoadFromHistory(List<OrderEvent> events)
    {
        var aggregate = new OrderAggregate();
        
        foreach (var @event in events.OrderBy(e => e.Version))
        {
            aggregate.ApplyEvent(@event);
        }
        
        aggregate._uncommittedEvents.Clear(); // These are already saved
        
        return aggregate;
    }
    
    // Get events that need to be saved
    public IReadOnlyList<OrderEvent> GetUncommittedEvents()
    {
        return _uncommittedEvents.AsReadOnly();
    }
    
    public void MarkEventsAsCommitted()
    {
        _uncommittedEvents.Clear();
    }
}

// Event store persists events
public class EventStore
{
    private readonly EventStoreDbContext _context;
    
    public async Task SaveEventsAsync(
        Guid aggregateId,
        IEnumerable<OrderEvent> events,
        int expectedVersion)
    {
        var eventRecords = events.Select(e => new EventRecord
        {
            AggregateId = aggregateId,
            EventType = e.GetType().Name,
            EventData = JsonSerializer.Serialize(e),
            Version = e.Version,
            Timestamp = e.Timestamp
        }).ToList();
        
        // Optimistic concurrency check
        var currentVersion = await _context.Events
            .Where(e => e.AggregateId == aggregateId)
            .MaxAsync(e => (int?)e.Version) ?? 0;
        
        if (currentVersion != expectedVersion)
        {
            throw new ConcurrencyException(
                $"Expected version {expectedVersion} but found {currentVersion}");
        }
        
        // Append events (immutable, append-only)
        await _context.Events.AddRangeAsync(eventRecords);
        await _context.SaveChangesAsync();
    }
    
    public async Task<List<OrderEvent>> LoadEventsAsync(Guid aggregateId)
    {
        var eventRecords = await _context.Events
            .Where(e => e.AggregateId == aggregateId)
            .OrderBy(e => e.Version)
            .ToListAsync();
        
        // Deserialize events
        var events = eventRecords.Select(r =>
        {
            var eventType = Type.GetType($"OrderService.Events.{r.EventType}");
            return (OrderEvent)JsonSerializer.Deserialize(r.EventData, eventType);
        }).ToList();
        
        return events;
    }
    
    // Temporal query - get state at specific point in time
    public async Task<OrderAggregate> LoadAggregateAsOfAsync(
        Guid aggregateId,
        DateTime pointInTime)
    {
        var events = await _context.Events
            .Where(e => e.AggregateId == aggregateId)
            .Where(e => e.Timestamp <= pointInTime)
            .OrderBy(e => e.Version)
            .ToListAsync();
        
        var orderEvents = events.Select(r =>
        {
            var eventType = Type.GetType($"OrderService.Events.{r.EventType}");
            return (OrderEvent)JsonSerializer.Deserialize(r.EventData, eventType);
        }).ToList();
        
        return OrderAggregate.LoadFromHistory(orderEvents);
    }
}

// Using the event-sourced aggregate
public class OrderCommandHandler
{
    private readonly EventStore _eventStore;
    
    public async Task<Guid> HandlePlaceOrderAsync(PlaceOrderCommand command)
    {
        var orderId = Guid.NewGuid();
        
        // Create aggregate - generates events
        var order = OrderAggregate.PlaceOrder(
            orderId,
            command.CustomerId,
            command.Items,
            command.ShippingAddress);
        
        // Save events
        await _eventStore.SaveEventsAsync(
            orderId,
            order.GetUncommittedEvents(),
            expectedVersion: 0);
        
        return orderId;
    }
    
    public async Task HandleChangeStatusAsync(ChangeOrderStatusCommand command)
    {
        // Load aggregate from event history
        var events = await _eventStore.LoadEventsAsync(command.OrderId);
        var order = OrderAggregate.LoadFromHistory(events);
        
        // Execute command - generates new events
        order.ChangeStatus(command.NewStatus, command.Reason);
        
        // Save new events
        await _eventStore.SaveEventsAsync(
            command.OrderId,
            order.GetUncommittedEvents(),
            expectedVersion: order.Version - 1);
    }
    
    // Debugging - see what order looked like at specific time
    public async Task<OrderAggregate> GetOrderAsOfAsync(
        Guid orderId,
        DateTime pointInTime)
    {
        return await _eventStore.LoadAggregateAsOfAsync(orderId, pointInTime);
        
        // Use cases:
        // - "What was this order's status on January 15th?"
        // - "Show me the shipping address before the customer changed it"
        // - "Replay the bug that occurred last week"
    }
}
```

Event Sourcing provides capabilities that are difficult or impossible with traditional state storage. You have a complete audit trail of every change automatically—no separate audit logging infrastructure needed. You can answer temporal queries like "what was the shipping address two weeks ago?" by replaying events up to that point. You can debug issues by replaying the exact sequence of events that led to the problem. You can implement new features by replaying all historical events through new projections.

### Projections and Read Models

While Event Sourcing is powerful for writes and audit trails, reading current state by replaying thousands of events would be too slow for many use cases. Projections solve this by maintaining denormalized read models that are updated as events occur. This is the read side of CQRS, which pairs naturally with Event Sourcing.

```csharp
// Projection builds read model from events
public class OrderSummaryProjection
{
    private readonly ReadDbContext _readContext;
    
    // Handle OrderPlaced event
    public async Task HandleAsync(OrderPlacedEvent @event)
    {
        var summary = new OrderSummaryReadModel
        {
            OrderId = @event.OrderId,
            CustomerId = @event.CustomerId,
            OrderDate = @event.Timestamp,
            Total = @event.Total,
            Status = "Pending",
            ItemCount = @event.Items.Count,
            ShippingCity = @event.ShippingAddress.City,
            ShippingState = @event.ShippingAddress.State
        };
        
        await _readContext.OrderSummaries.AddAsync(summary);
        await _readContext.SaveChangesAsync();
    }
    
    // Handle OrderStatusChanged event
    public async Task HandleAsync(OrderStatusChangedEvent @event)
    {
        var summary = await _readContext.OrderSummaries
            .FirstOrDefaultAsync(s => s.OrderId == @event.OrderId);
        
        if (summary != null)
        {
            summary.Status = @event.NewStatus.ToString();
            await _readContext.SaveChangesAsync();
        }
    }
    
    // Handle ShippingAddressUpdated event
    public async Task HandleAsync(ShippingAddressUpdatedEvent @event)
    {
        var summary = await _readContext.OrderSummaries
            .FirstOrDefaultAsync(s => s.OrderId == @event.OrderId);
        
        if (summary != null)
        {
            summary.ShippingCity = @event.NewAddress.City;
            summary.ShippingState = @event.NewAddress.State;
            await _readContext.SaveChangesAsync();
        }
    }
}
```

Projections can be rebuilt at any time by replaying all events, which is useful when adding new features or fixing bugs in projection logic. This gives you confidence that your read models accurately reflect the event history.

### Interview Talking Points

When discussing Event Sourcing in interviews, explain that it stores the history of changes as events rather than just current state. Emphasize benefits like complete audit trails, temporal queries, and replay for debugging. Discuss challenges like event schema evolution and query performance. Mention that Event Sourcing often combines with CQRS, using events for writes and projections for reads. Explain when Event Sourcing is appropriate—compliance requirements, complex audit needs, debugging requirements—and when it adds unnecessary complexity. Understanding Event Sourcing demonstrates architectural sophistication and the ability to evaluate complex patterns against specific requirements.

---

*[Continuing with remaining topics 45-48...]*
## 45. Domain-Driven Design (DDD)

Domain-Driven Design is a methodology for building software that keeps the implementation closely aligned with business domain concepts and terminology. Rather than organizing code around technical concerns like controllers and repositories, DDD organizes code around the business domain, using the same language and concepts that domain experts use. This alignment makes software more maintainable as business requirements evolve because changes in business logic map directly to changes in code structure.

### The Core Concepts of DDD

DDD introduces several tactical patterns that help organize domain logic effectively. Entities are objects with distinct identity that persists over time—an Order is an entity because you care about a specific order, not just any order with the same data. Value Objects are immutable objects defined by their values—an Address is a value object because two addresses with the same street, city, and zip code are interchangeable. Aggregates are clusters of related entities and value objects that should be treated as a unit for data changes, with one entity acting as the aggregate root that external code interacts with.

```csharp
// Entity - has identity that persists over time
public class Order
{
    // Identity
    public Guid Id { get; private set; }
    
    // Value objects
    public Address ShippingAddress { get; private set; }
    public Money Total { get; private set; }
    
    // Collection of entities
    private readonly List<OrderLine> _orderLines = new();
    public IReadOnlyList<OrderLine> OrderLines => _orderLines.AsReadOnly();
    
    // Domain logic
    public void AddLine(Product product, int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be positive");
        
        if (product.StockQuantity < quantity)
            throw new DomainException("Insufficient stock");
        
        var existingLine = _orderLines
            .FirstOrDefault(l => l.ProductId == product.Id);
        
        if (existingLine != null)
        {
            existingLine.IncreaseQuantity(quantity);
        }
        else
        {
            _orderLines.Add(new OrderLine(product.Id, product.Name, quantity, product.Price));
        }
        
        RecalculateTotal();
    }
    
    public void RemoveLine(Guid lineId)
    {
        var line = _orderLines.FirstOrDefault(l => l.Id == lineId);
        if (line == null)
            throw new DomainException("Order line not found");
        
        _orderLines.Remove(line);
        RecalculateTotal();
    }
    
    private void RecalculateTotal()
    {
        var total = _orderLines.Sum(l => l.LineTotal.Amount);
        Total = new Money(total, "USD");
    }
}

// Value Object - defined by its values, immutable
public record Address(
    string Street,
    string City,
    string State,
    string ZipCode,
    string Country)
{
    // Validation in constructor
    public Address(string Street, string City, string State, string ZipCode, string Country)
        : this(Street, City, State, ZipCode, Country)
    {
        if (string.IsNullOrWhiteSpace(Street))
            throw new ArgumentException("Street is required");
        if (string.IsNullOrWhiteSpace(City))
            throw new ArgumentException("City is required");
        if (string.IsNullOrWhiteSpace(ZipCode))
            throw new ArgumentException("Zip code is required");
    }
    
    // Value objects can have behavior
    public bool IsInternational(string homeCountry)
    {
        return !Country.Equals(homeCountry, StringComparison.OrdinalIgnoreCase);
    }
}

public record Money(decimal Amount, string Currency)
{
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Cannot add money in different currencies");
        
        return new Money(Amount + other.Amount, Currency);
    }
    
    public Money Multiply(decimal multiplier)
    {
        return new Money(Amount * multiplier, Currency);
    }
}

// Aggregate - cluster of entities and value objects
public class ShoppingCart
{
    // Aggregate root - only entry point for changes
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    
    private readonly List<CartItem> _items = new();
    public IReadOnlyList<CartItem> Items => _items.AsReadOnly();
    
    public Money Total { get; private set; }
    
    // Factory method
    public static ShoppingCart Create(Guid customerId)
    {
        return new ShoppingCart
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            Total = new Money(0, "USD"),
            _items = new List<CartItem>()
        };
    }
    
    // All modifications go through aggregate root
    public void AddItem(Guid productId, string productName, Money price, int quantity)
    {
        var existingItem = _items.FirstOrDefault(i => i.ProductId == productId);
        
        if (existingItem != null)
        {
            existingItem.IncreaseQuantity(quantity);
        }
        else
        {
            _items.Add(new CartItem(productId, productName, price, quantity));
        }
        
        RecalculateTotal();
    }
    
    public void RemoveItem(Guid productId)
    {
        var item = _items.FirstOrDefault(i => i.ProductId == productId);
        if (item != null)
        {
            _items.Remove(item);
            RecalculateTotal();
        }
    }
    
    public void Clear()
    {
        _items.Clear();
        RecalculateTotal();
    }
    
    // Aggregate ensures invariants are always maintained
    private void RecalculateTotal()
    {
        Total = _items
            .Select(i => i.Price.Multiply(i.Quantity))
            .Aggregate(new Money(0, "USD"), (current, itemTotal) => current.Add(itemTotal));
    }
    
    // Aggregate can enforce business rules
    public Order Checkout(Address shippingAddress)
    {
        if (!_items.Any())
            throw new DomainException("Cannot checkout empty cart");
        
        if (Total.Amount < 10)
            throw new DomainException("Minimum order amount is $10");
        
        // Create order from cart contents
        var order = Order.CreateFromCart(this, shippingAddress);
        
        // Clear cart after successful checkout
        Clear();
        
        return order;
    }
}

// Domain Services - operations that don't naturally belong to an entity
public class PricingService
{
    public Money CalculateOrderTotal(Order order, Customer customer)
    {
        var subtotal = order.OrderLines
            .Select(l => l.LineTotal)
            .Aggregate(new Money(0, "USD"), (current, lineTotal) => current.Add(lineTotal));
        
        // Apply customer discount
        var discount = CalculateDiscount(subtotal, customer);
        var discountedTotal = subtotal.Add(discount);
        
        // Add shipping
        var shipping = CalculateShipping(order);
        
        return discountedTotal.Add(shipping);
    }
    
    private Money CalculateDiscount(Money subtotal, Customer customer)
    {
        // Domain logic for calculating discounts
        var discountRate = customer.LoyaltyLevel switch
        {
            LoyaltyLevel.Bronze => 0.05m,
            LoyaltyLevel.Silver => 0.10m,
            LoyaltyLevel.Gold => 0.15m,
            _ => 0m
        };
        
        return new Money(-subtotal.Amount * discountRate, subtotal.Currency);
    }
    
    private Money CalculateShipping(Order order)
    {
        // Domain logic for calculating shipping
        if (order.Total.Amount >= 50)
            return new Money(0, "USD"); // Free shipping over $50
        
        return order.ShippingAddress.IsInternational("USA")
            ? new Money(15, "USD")
            : new Money(5, "USD");
    }
}

// Repository interface - defined in domain layer
public interface IOrderRepository
{
    Task<Order> GetByIdAsync(Guid orderId);
    Task<List<Order>> GetByCustomerIdAsync(Guid customerId);
    Task SaveAsync(Order order);
    Task DeleteAsync(Guid orderId);
}

// Application Service - orchestrates domain objects
public class OrderApplicationService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IShoppingCartRepository _cartRepository;
    private readonly PricingService _pricingService;
    private readonly IEventPublisher _eventPublisher;
    
    public async Task<Guid> CheckoutAsync(Guid cartId, Address shippingAddress)
    {
        // Load cart aggregate
        var cart = await _cartRepository.GetByIdAsync(cartId);
        
        // Domain logic - cart creates order
        var order = cart.Checkout(shippingAddress);
        
        // Save order aggregate
        await _orderRepository.SaveAsync(order);
        
        // Publish domain event
        await _eventPublisher.PublishAsync(new OrderPlacedEvent
        {
            OrderId = order.Id,
            CustomerId = cart.CustomerId,
            Total = order.Total.Amount
        });
        
        return order.Id;
    }
}
```

The key insight of DDD is that business logic lives in the domain model, not in services or controllers. The Order entity knows how to add lines and validate business rules. The ShoppingCart aggregate ensures that its total is always correct. The PricingService encapsulates pricing logic that spans multiple entities. This organization makes the code match how domain experts think about the business.

### Ubiquitous Language

One of DDD's most important concepts is ubiquitous language—using the same terminology in code that domain experts use when discussing the business. If business people talk about "orders" and "shipments," your code should have Order and Shipment classes, not GenericTransaction and DeliveryProcess. If they talk about "applying a discount," your code should have an ApplyDiscount method, not ModifyPrice.

This linguistic alignment makes code easier to understand and maintain. When business requirements change, domain experts can describe the changes in their language, and developers can find the relevant code because it uses the same terms. Code reviews can involve domain experts because the code reads like a description of business processes.

### Interview Talking Points

When discussing DDD in interviews, explain that it organizes code around business domain concepts using the same language domain experts use. Distinguish between entities (identity-based), value objects (value-based), and aggregates (consistency boundaries). Emphasize that business logic lives in the domain model, not in services. Mention ubiquitous language as key to keeping code aligned with business understanding. Discuss bounded contexts for defining boundaries in large domains. Understanding DDD demonstrates the ability to structure complex business logic in maintainable ways.

---

## 46. Repository and Unit of Work Patterns

The Repository and Unit of Work patterns provide abstractions over data access, allowing domain logic to work with collections of objects without knowing how those objects are persisted. The Repository pattern makes collections of domain objects appear as in-memory collections, while the Unit of Work pattern manages transactions and tracks changes to ensure data consistency.

### Repository Pattern

The Repository pattern provides a collection-like interface for accessing domain objects. Instead of writing SQL queries or EF Core query expressions throughout your application, you define repository interfaces in the domain layer and implement them in the infrastructure layer. This separation allows business logic to focus on the domain without coupling to specific data access technologies.

```csharp
// Repository interface defined in domain layer
public interface ICustomerRepository
{
    Task<Customer> GetByIdAsync(Guid customerId);
    Task<Customer> GetByEmailAsync(string email);
    Task<List<Customer>> GetAllAsync();
    Task<List<Customer>> GetActiveCustomersAsync();
    Task AddAsync(Customer customer);
    Task UpdateAsync(Customer customer);
    Task DeleteAsync(Guid customerId);
}

// Implementation in infrastructure layer
public class CustomerRepository : ICustomerRepository
{
    private readonly ApplicationDbContext _context;
    
    public CustomerRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<Customer> GetByIdAsync(Guid customerId)
    {
        return await _context.Customers
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(c => c.Id == customerId);
    }
    
    public async Task<Customer> GetByEmailAsync(string email)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == email);
    }
    
    public async Task<List<Customer>> GetActiveCustomersAsync()
    {
        return await _context.Customers
            .Where(c => c.IsActive)
            .OrderBy(c => c.LastName)
            .ToListAsync();
    }
    
    public async Task AddAsync(Customer customer)
    {
        await _context.Customers.AddAsync(customer);
    }
    
    public async Task UpdateAsync(Customer customer)
    {
        _context.Customers.Update(customer);
    }
    
    public async Task DeleteAsync(Guid customerId)
    {
        var customer = await GetByIdAsync(customerId);
        if (customer != null)
        {
            _context.Customers.Remove(customer);
        }
    }
}
```

### Unit of Work Pattern

The Unit of Work pattern maintains a list of objects affected by a business transaction and coordinates writing changes to the database. It ensures that all changes succeed or fail together as an atomic unit, maintaining data consistency.

```csharp
// Unit of Work interface
public interface IUnitOfWork : IDisposable
{
    ICustomerRepository Customers { get; }
    IOrderRepository Orders { get; }
    IProductRepository Products { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}

// Unit of Work implementation
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction _transaction;
    
    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Customers = new CustomerRepository(context);
        Orders = new OrderRepository(context);
        Products = new ProductRepository(context);
    }
    
    public ICustomerRepository Customers { get; }
    public IOrderRepository Orders { get; }
    public IProductRepository Products { get; }
    
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
    
    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }
    
    public async Task CommitTransactionAsync()
    {
        try
        {
            await SaveChangesAsync();
            await _transaction?.CommitAsync();
        }
        catch
        {
            await RollbackTransactionAsync();
            throw;
        }
        finally
        {
            _transaction?.Dispose();
            _transaction = null;
        }
    }
    
    public async Task RollbackTransactionAsync()
    {
        await _transaction?.RollbackAsync();
        _transaction?.Dispose();
        _transaction = null;
    }
    
    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}

// Using Unit of Work in application service
public class OrderService
{
    private readonly IUnitOfWork _unitOfWork;
    
    public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
    {
        await _unitOfWork.BeginTransactionAsync();
        
        try
        {
            // Get customer
            var customer = await _unitOfWork.Customers.GetByIdAsync(request.CustomerId);
            if (customer == null)
                throw new NotFoundException("Customer not found");
            
            // Check and reserve inventory
            foreach (var item in request.Items)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId);
                if (product == null)
                    throw new NotFoundException($"Product {item.ProductId} not found");
                
                if (product.StockQuantity < item.Quantity)
                    throw new InsufficientStockException(product.Name);
                
                product.ReserveStock(item.Quantity);
                await _unitOfWork.Products.UpdateAsync(product);
            }
            
            // Create order
            var order = Order.Create(customer.Id, request.Items);
            await _unitOfWork.Orders.AddAsync(order);
            
            // Commit all changes atomically
            await _unitOfWork.CommitTransactionAsync();
            
            return order;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }
}
```

### Interview Talking Points

When discussing Repository and Unit of Work patterns in interviews, explain that Repository abstracts data access to make collections of domain objects appear as in-memory collections. Emphasize that Unit of Work manages transactions and ensures all changes succeed or fail together. Mention that these patterns keep domain logic independent of data access technology. Discuss potential drawbacks like leaky abstractions if repositories expose too much query complexity. Understanding these patterns demonstrates the ability to structure data access in layered architectures.

---

## 47. API Versioning Strategies

API versioning enables evolving APIs without breaking existing clients. As your API matures, you'll need to add features, change data structures, or fix design mistakes. Without proper versioning, these changes break existing clients, forcing all consumers to update simultaneously. Good versioning strategies allow old and new versions to coexist.

```csharp
// URL-based versioning - version in route
[ApiController]
[Route("api/v1/[controller]")]
public class CustomersV1Controller : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<CustomerV1Dto> GetCustomer(int id)
    {
        // Old format - includes deprecated fields
        return new CustomerV1Dto
        {
            Id = id,
            Name = "John Doe",
            Phone = "555-1234" // Deprecated in v2
        };
    }
}

[ApiController]
[Route("api/v2/[controller]")]
public class CustomersV2Controller : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<CustomerV2Dto> GetCustomer(int id)
    {
        // New format - restructured phone data
        return new CustomerV2Dto
        {
            Id = id,
            Name = "John Doe",
            ContactInfo = new ContactInfo
            {
                PrimaryPhone = "555-1234",
                AlternatePhone = null
            }
        };
    }
}

// Header-based versioning
[ApiController]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    [HttpGet("{id}")]
    [MapToApiVersion("1.0")]
    public async Task<CustomerV1Dto> GetCustomerV1(int id)
    {
        // Triggered by header: api-version: 1.0
        return new CustomerV1Dto();
    }
    
    [HttpGet("{id}")]
    [MapToApiVersion("2.0")]
    public async Task<CustomerV2Dto> GetCustomerV2(int id)
    {
        // Triggered by header: api-version: 2.0
        return new CustomerV2Dto();
    }
}

// Query string versioning
[HttpGet]
public async Task<IActionResult> GetCustomer(
    [FromQuery] int id,
    [FromQuery] string version = "1.0")
{
    return version switch
    {
        "1.0" => Ok(new CustomerV1Dto()),
        "2.0" => Ok(new CustomerV2Dto()),
        _ => BadRequest("Unsupported version")
    };
}
```

### Interview Talking Points

Discuss URL versioning (simple but creates endpoint proliferation), header versioning (cleaner URLs but harder to test), and query string versioning (easy to test but less RESTful). Mention strategies for deprecating old versions with sunset headers and migration paths. Understanding API versioning demonstrates experience with API evolution and backward compatibility.

---

## 48. API Gateway Pattern

The API Gateway pattern provides a single entry point for clients to access multiple microservices. Instead of clients calling services directly, they call the gateway which routes requests, aggregates responses, handles authentication, and provides protocol translation.

```csharp
// API Gateway using YARP (Yet Another Reverse Proxy)
{
  "ReverseProxy": {
    "Routes": {
      "orders-route": {
        "ClusterId": "orders-cluster",
        "Match": {
          "Path": "/orders/{**catch-all}"
        },
        "Transforms": [
          { "PathPattern": "/api/orders/{**catch-all}" }
        ]
      },
      "products-route": {
        "ClusterId": "products-cluster",
        "Match": {
          "Path": "/products/{**catch-all}"
        }
      },
      "customers-route": {
        "ClusterId": "customers-cluster",
        "Match": {
          "Path": "/customers/{**catch-all}"
        }
      }
    },
    "Clusters": {
      "orders-cluster": {
        "Destinations": {
          "orders-service": {
            "Address": "http://orders-service:8080"
          }
        }
      },
      "products-cluster": {
        "Destinations": {
          "products-service": {
            "Address": "http://products-service:8080"
          }
        }
      },
      "customers-cluster": {
        "Destinations": {
          "customers-service": {
            "Address": "http://customers-service:8080"
          }
        }
      }
    }
  }
}

// Custom gateway with aggregation
public class AggregationGateway
{
    private readonly IHttpClientFactory _httpClientFactory;
    
    [HttpGet("api/order-details/{orderId}")]
    public async Task<OrderDetailsDto> GetOrderDetails(int orderId)
    {
        var client = _httpClientFactory.CreateClient();
        
        // Call multiple services in parallel
        var orderTask = client.GetFromJsonAsync<OrderDto>(
            $"http://orders-service/api/orders/{orderId}");
        
        var order = await orderTask;
        
        var customerTask = client.GetFromJsonAsync<CustomerDto>(
            $"http://customers-service/api/customers/{order.CustomerId}");
        
        var productsTask = Task.WhenAll(
            order.Items.Select(i => 
                client.GetFromJsonAsync<ProductDto>(
                    $"http://products-service/api/products/{i.ProductId}")));
        
        await Task.WhenAll(customerTask, productsTask);
        
        // Aggregate responses
        return new OrderDetailsDto
        {
            Order = order,
            Customer = await customerTask,
            Products = await productsTask
        };
    }
}
```

### Interview Talking Points

Explain that API Gateway provides a single entry point that routes to multiple services, handles cross-cutting concerns like authentication and rate limiting, and can aggregate responses from multiple services. Discuss benefits like simplified client code and centralized security, and drawbacks like potential bottleneck and single point of failure. Understanding API Gateway demonstrates knowledge of microservices communication patterns.

---

## Summary and Key Takeaways

You've completed Guide 4, covering enterprise architecture patterns that structure large-scale applications.

### Core Concepts Mastered

**CQRS and Event Sourcing**: You understand separating reads and writes for independent optimization, storing event history instead of just current state, and building projections for efficient queries. You know when these patterns add value versus unnecessary complexity.

**Domain-Driven Design**: You can organize code around business concepts using entities, value objects, and aggregates. You understand ubiquitous language for aligning code with business terminology. You know how to keep business logic in the domain model.

**Data Access Patterns**: You understand Repository for abstracting data access and Unit of Work for managing transactions. You can structure layered architectures that keep domain logic independent of persistence concerns.

**API Design**: You know strategies for versioning APIs to evolve without breaking clients. You understand API Gateway pattern for providing unified entry points to microservices.

### Preparing for Part 5

You're now ready for **Guide 5: Performance and Security**, the final guide covering performance optimization, security best practices, database selection, testing strategies, CI/CD pipelines, and monitoring.

---

*End of Guide 4: Enterprise Architecture Patterns*
