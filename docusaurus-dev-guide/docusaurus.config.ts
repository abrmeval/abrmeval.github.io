import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Dev Reference Guide',
  tagline: 'Personal reference for .NET, ASP.NET Core, Azure, and more',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://your-site.netlify.app', // Update with actual deployment URL
  baseUrl: '/',

  organizationName: 'abrmeval',
  projectName: 'abrmeval.github.io',

  onBrokenLinks: 'throw',

  markdown: {
    format: 'detect', // parse .md as CommonMark, .mdx as MDX
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        indexBlog: false,
        docsRouteBasePath: '/docs',
      },
    ],
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Dev Reference Guide',
      logo: {
        alt: 'Dev Reference Guide Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'dropdown',
          label: '.NET',
          position: 'left',
          items: [
            { to: '/docs/aspnet-core/aspnetcore-testing-guide', label: 'ASP.NET Core' },
            { to: '/docs/csharp-fundamentals/floating-point-precision-guide', label: 'C# Fundamentals' },
            { to: '/docs/dotnet-interview/', label: '.NET Interview Prep' },
          ],
        },
        {
          type: 'dropdown',
          label: 'Azure',
          position: 'left',
          items: [
            { to: '/docs/azure-functions/azure-functions-workers-guide', label: 'Azure Functions' },
            { to: '/docs/azure-platform/azure-naming-convention', label: 'Azure Platform' },
          ],
        },
        {
          to: '/docs/sql-server/sql-server-numeric-types-guide',
          label: 'SQL Server',
          position: 'left',
        },
        {
          to: '/docs/javascript/javascript-prototypes-guide',
          label: 'JavaScript',
          position: 'left',
        },
        {
          to: '/docs/cheatsheets/linux-dev-cheatsheet',
          label: 'Cheatsheets',
          position: 'left',
        },
        {
          href: 'https://github.com/abrmeval/abrmeval.github.io',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'ASP.NET Core',
          items: [
            { label: 'Testing Guide', to: '/docs/aspnet-core/aspnetcore-testing-guide' },
            { label: 'Custom Middleware', to: '/docs/aspnet-core/custom-middleware-guide' },
            { label: 'HTTP Request Pipeline', to: '/docs/aspnet-core/aspnet-http-request-pipeline' },
            { label: 'Authentication Guide P1', to: '/docs/aspnet-core/aspnetcore-authentication-guide-p1' },
            { label: 'Model Binding Guide', to: '/docs/aspnet-core/aspnetcore-model-binding-guide' },
          ],
        },
        {
          title: 'Azure',
          items: [
            { label: 'Azure Functions Workers', to: '/docs/azure-functions/azure-functions-workers-guide' },
            { label: 'Azure Naming Convention', to: '/docs/azure-platform/azure-naming-convention' },
            { label: 'OIDC Federation', to: '/docs/azure-platform/azure-oidc-federation' },
            { label: 'JWT + Key Vault Auth', to: '/docs/azure-platform/jwt-keyvault-auth' },
            { label: 'OAuth 2.0 vs OpenID Connect', to: '/docs/azure-platform/oauth-openid-connect-guide' },
          ],
        },
        {
          title: 'C# & .NET',
          items: [
            { label: 'Floating-Point Precision', to: '/docs/csharp-fundamentals/floating-point-precision-guide' },
            { label: 'SOLID Principles', to: '/docs/csharp-fundamentals/solid-principles-csharp' },
            { label: 'Architectural Styles & Patterns', to: '/docs/csharp-fundamentals/architectural-styles-design-patterns' },
            { label: '.NET Interview Prep', to: '/docs/dotnet-interview/' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'SQL Server Numeric Types', to: '/docs/sql-server/sql-server-numeric-types-guide' },
            { label: 'T-SQL Joins', to: '/docs/sql-server/tsql-joins-guide' },
            { label: 'JavaScript Prototypes', to: '/docs/javascript/javascript-prototypes-guide' },
            { label: 'Linux Cheatsheet', to: '/docs/cheatsheets/linux-dev-cheatsheet' },
            { label: 'GitHub', href: 'https://github.com/abrmeval/abrmeval.github.io' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} abrmeval. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['csharp', 'powershell', 'bash', 'sql', 'json', 'yaml', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
