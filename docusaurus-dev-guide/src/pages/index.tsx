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
      { title: 'Floating-Point Precision', description: 'How floating-point numbers work and common precision pitfalls. (Coming soon)', to: '/docs/cheatsheets/linux-dev-cheatsheet' },
      { title: 'SQL Server Numeric Types', description: 'Choosing the right numeric types in SQL Server — decimal, float, money. (Coming soon)', to: '/docs/cheatsheets/linux-dev-cheatsheet' },
      { title: 'Pro Git Cheatsheet', description: 'Git commands, workflows, and tips for professional use. (Coming soon)', to: '/docs/cheatsheets/linux-dev-cheatsheet' },
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
      title="Dev Guide"
      description="Personal reference for .NET, ASP.NET Core, Azure Functions, and more"
    >
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Dev Guide</h1>
          <p className={styles.heroSubtitle}>
            Personal reference for .NET, ASP.NET Core, Azure, and interview prep
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
