import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Dev Guide',
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
      title: 'Dev Guide',
      logo: {
        alt: 'Dev Guide Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/docs/aspnet-core/aspnetcore-testing-guide',
          label: 'ASP.NET Core',
          position: 'left',
        },
        {
          to: '/docs/azure-functions/azure-functions-workers-guide',
          label: 'Azure Functions',
          position: 'left',
        },
        {
          to: '/docs/azure-platform/azure-naming-convention',
          label: 'Azure Platform',
          position: 'left',
        },
        {
          to: '/docs/dotnet-interview/',
          label: '.NET Interview',
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
            { label: 'Global Validation', to: '/docs/aspnet-core/global-validation-handler-guide' },
          ],
        },
        {
          title: 'Azure',
          items: [
            { label: 'Azure Functions Workers', to: '/docs/azure-functions/azure-functions-workers-guide' },
            { label: 'Azure Naming Convention', to: '/docs/azure-platform/azure-naming-convention' },
            { label: 'OIDC Federation', to: '/docs/azure-platform/azure-oidc-federation' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: '.NET Interview Prep', to: '/docs/dotnet-interview/' },
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
