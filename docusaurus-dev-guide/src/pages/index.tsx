import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

interface CardItem {
  title: string;
  description: string;
  to: string;
  external?: boolean;
}

interface Section {
  icon: string;
  heading: string;
  cards: CardItem[];
}

const sections: Section[] = [
  {
    icon: '🔷',
    heading: 'ASP.NET Core',
    cards: [
      { title: 'Testing Guide', description: 'Unit, integration, and end-to-end testing patterns in ASP.NET Core.', to: '/docs/aspnet-core/aspnetcore-testing-guide' },
      { title: 'Custom Middleware', description: 'Building and composing middleware in the ASP.NET Core request pipeline.', to: '/docs/aspnet-core/custom-middleware-guide' },
      { title: 'Global Validation Handler', description: 'Centralizing model validation and error responses across your API.', to: '/docs/aspnet-core/global-validation-handler-guide' },
      { title: 'Environments & Launch Profiles', description: 'Managing appsettings, launchSettings.json and startup validation.', to: '/docs/aspnet-core/environments-launchsettings-validation-guide' },
      { title: 'Request URLs & Headers', description: 'Inspecting URL components, origin, referer and forwarded headers.', to: '/docs/aspnet-core/request-url-origin-headers-guide' },
      { title: 'HTTP Request Pipeline', description: 'Visual guide to the ASP.NET Core HTTP request/response pipeline and middleware order.', to: '/docs/aspnet-core/aspnet-http-request-pipeline' },
      { title: 'Authentication Guide (Part 1)', description: 'Cookies, tokens, claims identity, and authentication middleware fundamentals.', to: '/docs/aspnet-core/aspnetcore-authentication-guide-p1' },
      { title: 'Authentication Guide (Part 2)', description: 'JWT bearer tokens, OAuth integration, role-based and policy-based authorization.', to: '/docs/aspnet-core/aspnetcore-authentication-guide-p2' },
      { title: 'Model Binding Guide', description: 'How ASP.NET Core binds HTTP request data — route, query, body, and custom binders.', to: '/docs/aspnet-core/aspnetcore-model-binding-guide' },
      { title: 'Static Files Guide', description: 'Configuring and serving static files — wwwroot, custom providers, caching, and security.', to: '/docs/aspnet-core/aspnetcore-static-files-guide' },
      { title: 'In-Process vs Out-of-Process (ASP.NET)', description: 'In-process and out-of-process hosting models for ASP.NET applications on IIS.', to: '/docs/aspnet-core/aspnetcore-inprocess-outofprocess' },
    ],
  },
  {
    icon: '⚡',
    heading: 'Azure Functions',
    cards: [
      { title: 'Workers: In-Process vs Isolated', description: 'Understanding the two execution models and when to use each.', to: '/docs/azure-functions/azure-functions-workers-guide' },
      { title: 'Hosting Plans', description: 'Consumption, Elastic Premium, and Dedicated plan trade-offs.', to: '/docs/azure-functions/azure-functions-hosting-plans-guide' },
      { title: 'ASP.NET Core vs Built-in HTTP Model', description: 'Comparing the ASP.NET Core integration model with the built-in HTTP model.', to: '/docs/azure-functions/azure-functions-aspnetcore-vs-builtin-guide' },
    ],
  },
  {
    icon: '☁️',
    heading: 'Azure Platform',
    cards: [
      { title: 'Resource Naming Convention', description: 'Consistent naming patterns for Azure resources across environments.', to: '/docs/azure-platform/azure-naming-convention' },
      { title: 'OIDC Federation', description: 'Federated Identity Credentials for keyless GitHub Actions deployments.', to: '/docs/azure-platform/azure-oidc-federation' },
      { title: 'JWT Authentication with Azure Key Vault', description: 'Implementing JWT auth with Azure Key Vault for secure key management.', to: '/docs/azure-platform/jwt-keyvault-auth' },
      { title: 'Azure Cosmos DB CRUD (.NET)', description: 'Best practices for CRUD operations in Azure Cosmos DB using .NET.', to: '/docs/azure-platform/azure-cosmosdb-crud-guide' },
      { title: 'Azure Authentication Methods', description: 'Managed Identity, Service Principal, DefaultAzureCredential, and more for .NET apps.', to: '/docs/azure-platform/azure-authentication-methods' },
      { title: 'OAuth 2.0 vs OpenID Connect', description: 'Key differences, token flows, scopes, and practical implementation in .NET.', to: '/docs/azure-platform/oauth-openid-connect-guide' },
      { title: 'App & Service Principal Objects', description: 'How applications integrate with Microsoft Entra ID through app objects and service principals.', to: '/docs/azure-platform/azure-app-service-principal' },
    ],
  },
  {
    icon: '🔵',
    heading: 'C# Fundamentals',
    cards: [
      { title: 'Floating-Point Precision', description: 'How float, double, and decimal are stored in memory — precision vs range in C#.', to: '/docs/csharp-fundamentals/floating-point-precision-guide' },
      { title: 'SOLID Principles in C#', description: 'Understanding and applying SOLID design principles in C# development.', to: '/docs/csharp-fundamentals/solid-principles-csharp' },
      { title: 'Architectural Styles & Design Patterns', description: 'MVC, Clean Architecture, Event-Driven, and GoF design patterns with C# examples.', to: '/docs/csharp-fundamentals/architectural-styles-design-patterns' },
      { title: 'In-Process vs Out-of-Process Models', description: 'Isolation, performance, and communication trade-offs between execution models in .NET.', to: '/docs/csharp-fundamentals/inprocess-outofprocess-models' },
    ],
  },
  {
    icon: '🗄️',
    heading: 'SQL Server',
    cards: [
      { title: 'SQL Server Numeric Data Types', description: 'Choosing the right numeric types — DECIMAL, NUMERIC, FLOAT, MONEY, and more.', to: '/docs/sql-server/sql-server-numeric-types-guide' },
      { title: 'T-SQL Joins', description: 'INNER, OUTER, CROSS, and SELF joins with visual diagrams and practical examples.', to: '/docs/sql-server/tsql-joins-guide' },
    ],
  },
  {
    icon: '🟨',
    heading: 'JavaScript',
    cards: [
      { title: 'Understanding JavaScript Prototypes', description: 'Prototype chains, inheritance, Object.create, and class syntax in JavaScript.', to: '/docs/javascript/javascript-prototypes-guide' },
    ],
  },
  {
    icon: '📚',
    heading: '.NET Interview Prep',
    cards: [
      { title: 'Overview & Study Guide', description: 'Consolidated 2025 study guide covering all key .NET interview topics.', to: '/docs/dotnet-interview/' },
      { title: 'Part 1: Core C# Fundamentals', description: 'OOP, generics, overloading, delegates, LINQ, async/await.', to: '/docs/dotnet-interview/deep-dives/guide-1-core-csharp-fundamentals' },
      { title: 'Part 2: Modern C# & .NET Features', description: 'Records, Span<T>, IQueryable, DI, middleware internals.', to: '/docs/dotnet-interview/deep-dives/guide-2-modern-csharp-dotnet-features' },
      { title: 'Part 3: Cloud-Native & Microservices', description: 'Containers, service mesh, distributed patterns, observability.', to: '/docs/dotnet-interview/deep-dives/guide-3-cloud-native-microservices' },
      { title: 'Part 4: Enterprise Architecture', description: 'CQRS, Event Sourcing, DDD, Repository pattern, MediatR.', to: '/docs/dotnet-interview/deep-dives/guide-4-enterprise-architecture-patterns' },
      { title: 'Part 5: Performance & Security', description: 'Perf optimization, security hardening, CI/CD, and testing strategies.', to: '/docs/dotnet-interview/deep-dives/guide-5-performance-security' },
    ],
  },
  {
    icon: '📄',
    heading: 'Cheatsheets',
    cards: [
      { title: 'Linux Commands', description: 'Essential Linux commands for day-to-day software development.', to: '/docs/cheatsheets/linux-dev-cheatsheet' },
      { title: 'Pro Git Cheatsheet', description: 'Searchable reference for Git commands — config, branching, merging, rebasing, and more.', to: '/docs/cheatsheets/pro-git-cheatsheet' },
      { title: '.NET CLI Cheatsheet', description: 'Common dotnet CLI commands for building, testing, and managing .NET projects.', to: 'https://github.com/abrmeval/dotnet-commands/blob/main/dotnet-cheatsheet.md', external: true },
      { title: 'Git Conventional Commits', description: 'Conventional commit message format for structured, readable Git history.', to: 'https://github.com/abrmeval/Git_Commands-Cheat-Sheet/blob/main/git-conventional-commits.md', external: true },
    ],
  },
  {
    icon: '🛠️',
    heading: 'Tools & Frameworks (External)',
    cards: [
      { title: 'JavaScript (MDN)', description: 'Official MDN Web Docs reference for JavaScript.', to: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', external: true },
      { title: 'TypeScript', description: 'Official TypeScript documentation and handbook.', to: 'https://www.typescriptlang.org/docs/', external: true },
      { title: 'React', description: 'Official React documentation and guides.', to: 'https://react.dev', external: true },
      { title: 'Node.js', description: 'Official Node.js API reference and guides.', to: 'https://nodejs.org/en/docs', external: true },
      { title: 'Python', description: 'Official Python 3 documentation.', to: 'https://docs.python.org/3/', external: true },
      { title: 'Git', description: 'Official Git reference manual and Pro Git book.', to: 'https://git-scm.com/doc', external: true },
    ],
  },
  {
    icon: '📖',
    heading: 'Azure Resources (External)',
    cards: [
      { title: 'Azure Documentation', description: 'Official Microsoft Azure documentation hub.', to: 'https://learn.microsoft.com/en-us/azure/', external: true },
      { title: 'Azure Architecture Center', description: 'Reference architectures and best practices for Azure.', to: 'https://learn.microsoft.com/en-us/azure/architecture/', external: true },
      { title: 'Azure Functions Docs', description: 'Complete Azure Functions developer reference.', to: 'https://learn.microsoft.com/en-us/azure/azure-functions/', external: true },
      { title: 'ASP.NET Core Docs', description: 'Official ASP.NET Core documentation on Microsoft Learn.', to: 'https://learn.microsoft.com/en-us/aspnet/core/', external: true },
      { title: 'Azure Status', description: 'Real-time status of all Azure services and regions.', to: 'https://azure.status.microsoft/en-us/status', external: true },
      { title: 'Azure Pricing Calculator', description: 'Estimate costs for Azure services before you deploy.', to: 'https://azure.microsoft.com/en-us/pricing/calculator/', external: true },
      { title: 'Azure TCO Calculator', description: 'Calculate the total cost of ownership for migrating workloads to Azure.', to: 'https://azure.microsoft.com/en-us/pricing/tco/calculator/', external: true },
      { title: 'Microsoft Entra Admin Center', description: 'Identity and access management portal for Microsoft Entra ID.', to: 'https://entra.microsoft.com/', external: true },
      { title: 'Azure Icons', description: 'Download official Azure architecture icons for diagrams.', to: 'https://az-icons.com/', external: true },
      { title: 'Azure Icons Guidelines', description: 'Best practices and guidelines for using Azure architecture icons.', to: 'https://learn.microsoft.com/en-us/azure/architecture/icons/', external: true },
    ],
  },
  {
    icon: '📒',
    heading: 'Others',
    cards: [
      { title: 'Clasificación de los Números Matemáticos', description: 'Breve descripción de los números matemáticos y sus categorías.', to: '/docs/others/clasificacion-numeros-matematicos' },
    ],
  },
];

function Card({ title, description, to, external }: CardItem) {
  return (
    <Link
      className={styles.card}
      to={to}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <h3 className={styles.cardTitle}>{title}{external && <span className={styles.externalBadge}> ↗</span>}</h3>
      <p className={styles.cardDescription}>{description}</p>
    </Link>
  );
}

export default function Home() {
  return (
    <Layout
      title="Dev Reference Guide"
      description="Comprehensive reference guide for software development topics."
    >
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Dev Reference Guide</h1>
          <p className={styles.heroSubtitle}>
            Comprehensive reference guide for software development topics.
          </p>
        </div>

        <div className={styles.container}>
          {sections.map((section) => (
            <section key={section.heading} className={styles.section}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionIcon}>{section.icon}</span>
                {section.heading}
              </h2>
              <div className={styles.grid}>
                {section.cards.map((card) => (
                  <Card key={card.title} {...card} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
