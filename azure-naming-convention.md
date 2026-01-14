# Azure Resource Naming Convention Guide

## Overview

A consistent naming convention for Azure resources enables better organization, identification, and management of cloud infrastructure. This guide establishes a standardized approach for naming resources across all projects and environments.

---

## Naming Pattern

```
{client}-{environment}-{resourcetype}-{region}-{instance}
```

| Component | Required | Length | Description |
|-----------|----------|--------|-------------|
| Client | Yes | 3-5 chars | Client or project identifier |
| Environment | Yes | 3-4 chars | Deployment environment |
| Resource Type | Yes | 2-6 chars | Azure resource abbreviation |
| Region | Optional | 3-4 chars | Azure region shorthand |
| Instance | Optional | 2-3 chars | Instance number for duplicates |

---

## Component Definitions

### Client/Project Identifiers

Use short, recognizable abbreviations for clients or projects:

| Client Name | Abbreviation |
|-------------|--------------|
| Acme Corporation | `acme` |
| Contoso Ltd | `cont` |
| Fabrikam Inc | `fabr` |
| Nikola Tesla Institute | `ntla` |
| Northwind Traders | `nwtr` |

### Environment Codes

| Environment | Abbreviation |
|-------------|--------------|
| Development | `dev` |
| Quality Assurance | `qa` |
| Staging | `stg` |
| User Acceptance Testing | `uat` |
| Production | `prd` |

### Region Codes

| Azure Region | Abbreviation |
|--------------|--------------|
| East US | `eus` |
| East US 2 | `eus2` |
| West US | `wus` |
| West US 2 | `wus2` |
| Central US | `cus` |
| South Central US | `scus` |
| West Europe | `weu` |
| North Europe | `neu` |
| UK South | `uks` |
| Brazil South | `brs` |
| Canada Central | `cac` |
| Australia East | `aue` |

---

## Resource Type Abbreviations

### Compute

| Resource | Abbreviation | Example |
|----------|--------------|---------|
| Virtual Machine | `vm` | `acme-prd-vm-eus-001` |
| Virtual Machine Scale Set | `vmss` | `acme-prd-vmss-eus` |
| App Service | `app` | `acme-prd-app-eus` |
| Function App | `func` | `acme-prd-func-eus` |
| Static Web App | `stapp` | `acme-prd-stapp-eus` |
| Container Instance | `ci` | `acme-dev-ci-eus` |
| Container Registry | `cr` | `acmeprdcreus` |
| Kubernetes Service (AKS) | `aks` | `acme-prd-aks-eus` |

### Networking

| Resource | Abbreviation | Example |
|----------|--------------|---------|
| Virtual Network | `vnet` | `acme-prd-vnet-eus` |
| Subnet | `snet` | `acme-prd-snet-web` |
| Network Security Group | `nsg` | `acme-prd-nsg-eus` |
| Public IP Address | `pip` | `acme-prd-pip-eus` |
| Load Balancer | `lb` | `acme-prd-lb-eus` |
| Application Gateway | `agw` | `acme-prd-agw-eus` |
| Front Door | `afd` | `acme-prd-afd` |
| CDN Profile | `cdnp` | `acme-prd-cdnp` |
| CDN Endpoint | `cdne` | `acme-prd-cdne` |
| DNS Zone | `dns` | `acme-prd-dns` |
| Private Endpoint | `pe` | `acme-prd-pe-sql` |

### Storage

| Resource | Abbreviation | Example |
|----------|--------------|---------|
| Storage Account | `st` | `acmeprdsteus001` |
| Blob Container | `blob` | `acme-prd-blob-data` |
| File Share | `share` | `acme-prd-share-docs` |
| Data Lake Storage | `dls` | `acmeprddlseus` |

### Databases

| Resource | Abbreviation | Example |
|----------|--------------|---------|
| SQL Server | `sql` | `acme-prd-sql-eus` |
| SQL Database | `sqldb` | `acme-prd-sqldb-main` |
| Cosmos DB Account | `cosmos` | `acme-prd-cosmos-eus` |
| Redis Cache | `redis` | `acme-prd-redis-eus` |
| MySQL Server | `mysql` | `acme-prd-mysql-eus` |
| PostgreSQL Server | `psql` | `acme-prd-psql-eus` |

### Security & Identity

| Resource | Abbreviation | Example |
|----------|--------------|---------|
| Key Vault | `kv` | `acme-prd-kv-eus` |
| Managed Identity | `id` | `acme-prd-id-app` |
| Application Registration | `appreg` | `acme-prd-appreg-api` |

### Integration

| Resource | Abbreviation | Example |
|----------|--------------|---------|
| Service Bus Namespace | `sbns` | `acme-prd-sbns-eus` |
| Service Bus Queue | `sbq` | `acme-prd-sbq-orders` |
| Service Bus Topic | `sbt` | `acme-prd-sbt-events` |
| Event Hub Namespace | `evhns` | `acme-prd-evhns-eus` |
| Event Grid Topic | `evgt` | `acme-prd-evgt-eus` |
| Logic App | `logic` | `acme-prd-logic-sync` |
| API Management | `apim` | `acme-prd-apim-eus` |

### Monitoring & Management

| Resource | Abbreviation | Example |
|----------|--------------|---------|
| Resource Group | `rg` | `acme-prd-rg-eus` |
| Log Analytics Workspace | `log` | `acme-prd-log-eus` |
| Application Insights | `appi` | `acme-prd-appi-eus` |
| Action Group | `ag` | `acme-prd-ag-alerts` |
| Automation Account | `aa` | `acme-prd-aa-eus` |

### AI & Machine Learning

| Resource | Abbreviation | Example |
|----------|--------------|---------|
| Cognitive Services | `cog` | `acme-prd-cog-eus` |
| OpenAI Service | `oai` | `acme-prd-oai-eus` |
| Machine Learning Workspace | `mlw` | `acme-prd-mlw-eus` |
| Search Service | `srch` | `acme-prd-srch-eus` |

---

## Azure App Registration Naming Convention

App Registrations represent application identities in Microsoft Entra ID (Azure AD). Since they appear in a flat list across your tenant, a clear naming convention is essential for identification and management.

### Recommended Pattern

```
{client}-{environment}-{apptype}-{purpose}
```

| Component | Required | Description |
|-----------|----------|-------------|
| Client | Yes | Client or project identifier |
| Environment | Yes | Target environment (dev, qa, prd) |
| App Type | Yes | Type of application |
| Purpose | Yes | Descriptive name of the application |

### App Type Codes

| Application Type | Abbreviation | Description |
|------------------|--------------|-------------|
| Web Application | `web` | Traditional web apps, SPAs |
| API | `api` | Backend APIs and services |
| Native/Desktop | `native` | Desktop applications |
| Mobile | `mobile` | iOS, Android apps |
| Daemon/Service | `svc` | Background services, workers |
| Function | `func` | Azure Functions with identity |
| Logic App | `logic` | Logic Apps with identity |
| DevOps | `devops` | CI/CD pipelines, GitHub Actions |
| CLI | `cli` | Command-line tools |
| Bot | `bot` | Bot Framework applications |

### App Registration Examples

#### Single Application (Frontend + Backend)

```
contoso-prd-web-customerportal      # Customer-facing web app
contoso-prd-api-customerportal      # Backend API for the portal
contoso-dev-web-customerportal      # Development version
contoso-dev-api-customerportal      # Development API
```

#### Microservices Architecture

```
acme-prd-api-orders                 # Orders microservice
acme-prd-api-inventory              # Inventory microservice
acme-prd-api-notifications          # Notifications microservice
acme-prd-svc-orderprocessor         # Background order processor
acme-prd-func-emailsender           # Email sending function
```

#### DevOps and CI/CD

```
contoso-prd-devops-githubactions    # GitHub Actions deployment
contoso-prd-devops-azurepipelines   # Azure Pipelines
contoso-prd-devops-terraform        # Terraform automation
fabr-prd-devops-argocd              # ArgoCD for Kubernetes
```

#### Multi-Tenant or Partner Applications

```
contoso-prd-web-partnerportal       # Partner-facing application
contoso-prd-api-partnerintegration  # Partner integration API
acme-prd-api-publicapi              # Public API for third parties
```

### App Registration Best Practices

1. **Include Environment**: Always specify the environment to distinguish between dev, qa, and production identities

2. **Be Descriptive**: The purpose component should clearly identify what the application does

3. **Match Resource Names**: If the app registration is for a specific Azure resource, align the names:
   ```
   Resource:         contoso-prd-func-orderprocessor
   App Registration: contoso-prd-func-orderprocessor
   ```

4. **Separate by Responsibility**: Create distinct registrations for frontend and backend even if they're part of the same solution

5. **Use Consistent Casing**: Stick to lowercase with hyphens for consistency

6. **Document Client Secrets and Certificates**: Track expiration dates and rotation schedules

### App Registration with Managed Identity Comparison

| Scenario | Use App Registration | Use Managed Identity |
|----------|---------------------|---------------------|
| Azure resource accessing Azure services | ❌ | ✅ Preferred |
| External application (on-premises) | ✅ Required | ❌ Not available |
| CI/CD pipelines (GitHub, Azure DevOps) | ✅ Required | ⚠️ Limited support |
| Multi-tenant SaaS applications | ✅ Required | ❌ Not applicable |
| User-facing web applications | ✅ Required | ❌ Not applicable |
| Azure Functions accessing Key Vault | ❌ | ✅ Preferred |

### Naming for Related Entra ID Objects

When creating app registrations, you'll often create related objects:

```
# App Registration
contoso-prd-api-customerportal

# Enterprise Application (Service Principal) - Created automatically
contoso-prd-api-customerportal

# Associated Credentials (document separately)
contoso-prd-api-customerportal-secret-2024
contoso-prd-api-customerportal-cert-2024

# API Scopes (defined within the registration)
api://contoso-prd-api-customerportal/read
api://contoso-prd-api-customerportal/write
api://contoso-prd-api-customerportal/admin
```

### Complete Example: E-Commerce Platform

```
# Frontend Applications
contoso-prd-web-storefront          # Customer shopping site
contoso-prd-web-adminpanel          # Admin management UI
contoso-prd-mobile-storeapp         # Mobile shopping app

# Backend APIs
contoso-prd-api-products            # Product catalog API
contoso-prd-api-orders              # Order management API
contoso-prd-api-customers           # Customer data API
contoso-prd-api-payments            # Payment processing API

# Background Services
contoso-prd-svc-orderprocessor      # Order processing worker
contoso-prd-svc-inventorysync       # Inventory synchronization
contoso-prd-func-emailnotifier      # Email notification function

# DevOps
contoso-prd-devops-githubactions    # Production deployments
contoso-dev-devops-githubactions    # Development deployments

# Third-Party Integrations
contoso-prd-svc-shipperintegration  # Shipping provider integration
contoso-prd-svc-paymentgateway      # Payment provider integration
```

---

## Naming Constraints by Resource

Some Azure resources have specific naming restrictions:

| Resource | Max Length | Allowed Characters | Notes |
|----------|------------|-------------------|-------|
| Storage Account | 24 | lowercase, numbers only | No hyphens allowed |
| Key Vault | 24 | alphanumeric, hyphens | Must start with letter |
| Container Registry | 50 | alphanumeric only | No hyphens allowed |
| Function App | 60 | alphanumeric, hyphens | Must be globally unique |
| Resource Group | 90 | alphanumeric, hyphens, underscores | Cannot end with period |
| Virtual Machine | 64 (Linux), 15 (Windows) | alphanumeric, hyphens | Windows has shorter limit |

---

## Complete Project Examples

### Example 1: E-Commerce Platform for Contoso (Production - East US)

```
contoso-prd-rg-eus              # Resource Group
contoso-prd-stapp-eus           # Static Web App (Frontend)
contoso-prd-func-eus            # Function App (API)
contoso-prd-cosmos-eus          # Cosmos DB
contoso-prd-kv-eus              # Key Vault
contoso-prd-appi-eus            # Application Insights
contoso-prd-afd                 # Front Door (Global)
contosoprdsteus001              # Storage Account
```

### Example 2: Internal Portal for Acme (Development - West Europe)

```
acme-dev-rg-weu                 # Resource Group
acme-dev-app-weu                # App Service
acme-dev-sql-weu                # SQL Server
acme-dev-sqldb-portal           # SQL Database
acme-dev-kv-weu                 # Key Vault
acme-dev-log-weu                # Log Analytics
acme-dev-appi-weu               # Application Insights
acmedevstvweu001                # Storage Account
```

### Example 3: Multi-Region Microservices for Fabrikam (Production)

```
# Primary Region (East US)
fabr-prd-rg-eus                 # Resource Group
fabr-prd-aks-eus                # AKS Cluster
fabr-prd-cr-eus                 # Container Registry
fabr-prd-cosmos-eus             # Cosmos DB
fabr-prd-redis-eus              # Redis Cache
fabr-prd-sbns-eus               # Service Bus

# Secondary Region (West Europe)
fabr-prd-rg-weu                 # Resource Group
fabr-prd-aks-weu                # AKS Cluster
fabr-prd-redis-weu              # Redis Cache

# Global Resources
fabr-prd-afd                    # Front Door
fabr-prd-dns                    # DNS Zone
```

---

## Best Practices

1. **Be Consistent**: Apply the same convention across all resources and projects

2. **Keep It Short**: Many resources have character limits; shorter names are more manageable

3. **Avoid Special Characters**: Stick to lowercase letters, numbers, and hyphens where allowed

4. **Use Lowercase**: Maintain consistency and avoid case-sensitivity issues

5. **Document Exceptions**: When constraints force deviations, document the reason

6. **Automate Validation**: Use Azure Policy to enforce naming conventions

7. **Plan for Global Uniqueness**: Resources like storage accounts and function apps require globally unique names

8. **Include Purpose When Helpful**: For resources like databases or queues, consider adding a descriptor (e.g., `acme-prd-sbq-orders`)

---

## Enforcement with Azure Policy

Consider implementing Azure Policy to enforce naming conventions automatically:

```json
{
  "if": {
    "allOf": [
      {
        "field": "type",
        "equals": "Microsoft.Web/sites"
      },
      {
        "not": {
          "field": "name",
          "match": "???-???-func-???*"
        }
      }
    ]
  },
  "then": {
    "effect": "deny"
  }
}
```

---

## Quick Reference Card

```
Pattern:  {client}-{env}-{type}-{region}-{instance}
Example:  acme-prd-func-eus-001

Environments:  dev | qa | stg | uat | prd
Regions:       eus | eus2 | wus | weu | neu | uks
```

---

*Last Updated: December 2024*
