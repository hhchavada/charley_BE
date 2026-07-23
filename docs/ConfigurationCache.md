# Enterprise Configuration Cache Layer

The Configuration Cache Layer is a foundational, Redis-ready architectural layer inside Grant Engine V2. It sits firmly between the Engine Orchestrator and MongoDB, ensuring that matching logic is completely decoupled from database latency.

## Architectural Goal

The core `GrantEngine` must **never** execute database queries during an evaluation cycle. All grants, rules, nested boolean logic, required questions, and prompts are fetched once, compiled into a monolithic `CacheBundle`, validated, and held in memory.

## Module Responsibilities

- **`ConfigurationCacheLoader`**: Implements `IConfigurationLoader`. It intercepts requests from the `GrantEngine`. If the configuration version exists in the cache, it is returned instantly (0ms latency). If it does not exist, it commands the Builder to assemble it.
- **`ConfigurationCacheBuilder`**: The only module allowed to talk to MongoDB repositories. It aggregates all active grants, resolves their reference pointers, and builds the deep `ConfigurationBundle`.
- **`ConfigurationCacheValidator`**: Scans the constructed bundle. If it detects missing rule IDs, corrupted payloads, or potentially infinite circular references, it intentionally throws an error, refusing to poison the cache.
- **`MemoryCacheProvider`**: The default implementation storing the bundle in the Node.js V8 Heap.
- **`RedisCacheProvider`**: A pluggable stub ready for distributed horizontal scaling.
- **`ConfigurationInvalidator`**: A targeted webhook interface for the Admin Publish Service to blow away old cache versions upon deployment without restarting the server.

## Concurrency Protections

### The Thundering Herd Problem
If a server restarts and 5,000 users attempt to evaluate a grant simultaneously, they would typically trigger 5,000 massive MongoDB aggregation pipelines concurrently, causing the database to collapse (The Thundering Herd).

`ConfigurationCacheLoader` solves this by maintaining a `pendingBuilds` lock. If 5,000 requests hit an empty cache simultaneously, exactly **one** database aggregation is fired. The remaining 4,999 requests await the resolution of that single promise in memory.

## Future Distributed Scaling (Redis)

Currently, the `MemoryCacheProvider` operates locally. If the platform scales to 10 instances behind a load balancer, each instance will build its own cache once. By switching the dependency injection to `RedisCacheProvider`, the massive `CacheBundle` can be centralized. When the Admin Publish Service calls `ConfigurationInvalidator.invalidate(version)`, all 10 instances immediately sync to the new logic.
