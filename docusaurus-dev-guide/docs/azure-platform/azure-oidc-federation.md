---
title: "Azure OIDC Federation (Federated Credentials)"
sidebar_label: "OIDC Federation"
sidebar_position: 2
tags: [azure, security, oidc]
---

# Azure OIDC Federation (Federated Credentials)

## What Is It?

Azure OIDC Federation, also known as **Federated Identity Credentials**, is a feature of Azure Managed Identities that allows external identity providers (IdPs) to authenticate and obtain tokens for accessing Azure resources—without storing or managing secrets.

Think of it this way: instead of creating a password or certificate that an external service uses to prove its identity to Azure, you establish a **trust relationship**. Azure says, "I trust tokens issued by this specific external provider, and when I receive one with the right claims, I'll grant access as if it were this managed identity."

This eliminates the need for secret rotation, reduces security risks, and simplifies CI/CD pipelines and multi-cloud scenarios.

---

## The Core Concept: How It Works

The federation process follows the OpenID Connect (OIDC) standard and works in three main steps:

### Step 1: Trust Configuration

You configure a **Federated Identity Credential** on an Azure User-Assigned Managed Identity. This configuration specifies:

- **Issuer URL**: The OIDC provider's issuer endpoint (e.g., `https://token.actions.githubusercontent.com` for GitHub Actions)
- **Subject Identifier**: A unique identifier that must match the `sub` claim in the incoming token
- **Audience**: The expected audience claim (typically `api://AzureADTokenExchange`)

### Step 2: Token Exchange

When the external service (like a GitHub Actions workflow) runs:

1. The external IdP issues an OIDC token to the workload
2. The workload sends this token to Azure AD's token endpoint
3. Azure AD validates the token against the federated credential configuration
4. If valid, Azure AD returns an access token for the managed identity

### Step 3: Resource Access

The workload uses the Azure AD access token to access Azure resources (Storage, Key Vault, Container Registry, etc.) with the permissions assigned to the managed identity.

```
┌─────────────────┐     1. Request Token      ┌─────────────────┐
│  External IdP   │◄─────────────────────────│    Workload     │
│ (GitHub, GitLab)│                           │  (CI/CD Job)    │
└────────┬────────┘                           └────────┬────────┘
         │                                             │
         │ 2. OIDC Token                              │
         └────────────────────────┬────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │       Azure AD          │
                    │  (Validates Token &     │
                    │   Issues Access Token)  │
                    └────────────┬────────────┘
                                 │
                                 │ 3. Azure AD Access Token
                                 ▼
                    ┌─────────────────────────┐
                    │    Azure Resources      │
                    │  (Storage, Key Vault,   │
                    │   Container Registry)   │
                    └─────────────────────────┘
```

---

## Setting Up Federated Credentials

### Prerequisites

1. An Azure subscription with appropriate permissions
2. A User-Assigned Managed Identity
3. An external OIDC provider (GitHub Actions, GitLab CI, Kubernetes, etc.)

### Azure CLI Setup

```bash
# Step 1: Create a User-Assigned Managed Identity (if not exists)
az identity create \
  --name "my-federated-identity" \
  --resource-group "my-resource-group" \
  --location "eastus"

# Step 2: Create the Federated Credential
# Example for GitHub Actions
az identity federated-credential create \
  --name "github-actions-federation" \
  --identity-name "my-federated-identity" \
  --resource-group "my-resource-group" \
  --issuer "https://token.actions.githubusercontent.com" \
  --subject "repo:my-org/my-repo:ref:refs/heads/main" \
  --audiences "api://AzureADTokenExchange"
```

### Azure Portal Setup

1. Navigate to **Managed Identities** in the Azure Portal
2. Select your User-Assigned Managed Identity
3. Click on **Federated credentials** in the left menu
4. Click **+ Add Credential**
5. Choose your scenario (GitHub Actions, Kubernetes, Other)
6. Fill in the required fields:
   - **Federated credential scenario**: Select your provider
   - **Organization/Repository**: Your GitHub org and repo
   - **Entity type**: Branch, Pull Request, Environment, or Tag
   - **Name**: A descriptive name for this credential

### Bicep/ARM Template

```bicep
// Bicep template for federated credential
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'my-federated-identity'
  location: resourceGroup().location
}

resource federatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: managedIdentity
  name: 'github-federation'
  properties: {
    // GitHub Actions issuer
    issuer: 'https://token.actions.githubusercontent.com'
    // Subject format: repo:<org>/<repo>:ref:refs/heads/<branch>
    subject: 'repo:contoso/my-app:ref:refs/heads/main'
    audiences: [
      'api://AzureADTokenExchange'
    ]
  }
}
```

### Terraform Configuration

```hcl
# Terraform configuration for federated credentials
resource "azurerm_user_assigned_identity" "example" {
  name                = "my-federated-identity"
  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
}

resource "azurerm_federated_identity_credential" "github" {
  name                = "github-actions-federation"
  resource_group_name = azurerm_resource_group.example.name
  parent_id           = azurerm_user_assigned_identity.example.id
  
  issuer    = "https://token.actions.githubusercontent.com"
  subject   = "repo:my-org/my-repo:ref:refs/heads/main"
  audiences = ["api://AzureADTokenExchange"]
}
```

---

## Supported Identity Providers

Azure supports federated credentials from any OIDC-compliant identity provider. Here are the most common ones:

### GitHub Actions

**Issuer**: `https://token.actions.githubusercontent.com`

**Subject Formats**:
- Branch: `repo:<org>/<repo>:ref:refs/heads/<branch>`
- Pull Request: `repo:<org>/<repo>:pull_request`
- Environment: `repo:<org>/<repo>:environment:<env-name>`
- Tag: `repo:<org>/<repo>:ref:refs/tags/<tag>`

**Workflow Example**:
```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]

permissions:
  id-token: write  # Required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Deploy to Azure
        run: |
          az webapp deploy --name my-app --resource-group my-rg
```

### GitLab CI/CD

**Issuer**: `https://gitlab.com` (or your self-hosted GitLab URL)

**Subject Format**: `project_path:<group>/<project>:ref_type:branch:ref:<branch>`

**Pipeline Example**:
```yaml
deploy:
  image: mcr.microsoft.com/azure-cli
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: api://AzureADTokenExchange
  script:
    - az login --federated-token $GITLAB_OIDC_TOKEN 
               --service-principal 
               --tenant $AZURE_TENANT_ID 
               --client-id $AZURE_CLIENT_ID
    - az storage blob upload --account-name myaccount --container mycontainer
```

### Kubernetes (AKS Workload Identity)

**Issuer**: Your AKS cluster's OIDC issuer URL

**Subject Format**: `system:serviceaccount:<namespace>:<service-account-name>`

**Configuration**:
```yaml
# Service Account with workload identity
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-sa
  namespace: default
  annotations:
    azure.workload.identity/client-id: "<managed-identity-client-id>"
  labels:
    azure.workload.identity/use: "true"

---
# Pod using workload identity
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  namespace: default
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: my-app-sa
  containers:
    - name: app
      image: my-app:latest
      env:
        - name: AZURE_CLIENT_ID
          value: "<managed-identity-client-id>"
```

### AWS (Cross-Cloud)

**Issuer**: `https://sts.amazonaws.com`

**Subject**: The ARN of the AWS IAM role

### Google Cloud (Cross-Cloud)

**Issuer**: `https://accounts.google.com`

**Subject**: The unique identifier for the Google service account

---

## Common Use Cases

### Use Case 1: Secretless CI/CD Pipelines

**Problem**: Traditional CI/CD pipelines store service principal secrets in pipeline variables, creating security risks and maintenance overhead for secret rotation.

**Solution**: Configure federated credentials to allow GitHub Actions, GitLab CI, or Azure Pipelines to authenticate without secrets.

**Benefits**:
- No secrets to rotate or manage
- No risk of secret exposure in logs
- Fine-grained access control per branch/environment
- Audit trail of which workflow accessed resources

### Use Case 2: Kubernetes Workload Identity

**Problem**: Applications running in Kubernetes need to access Azure resources, but mounting service principal credentials in pods is insecure.

**Solution**: Use AKS Workload Identity with federated credentials. Pods authenticate using Kubernetes service account tokens that Azure trusts.

**Benefits**:
- No credentials stored in Kubernetes secrets
- Per-pod identity with least-privilege access
- Works with standard Azure SDK authentication

### Use Case 3: Multi-Cloud Authentication

**Problem**: Workloads running in AWS or GCP need to access Azure resources securely.

**Solution**: Configure federated credentials trusting AWS STS or Google accounts as identity providers.

**Benefits**:
- Single identity model across clouds
- No cross-cloud secret synchronization
- Centralized access control in Azure

### Use Case 4: External Developer Access

**Problem**: External contractors or partners need temporary access to specific Azure resources without creating Azure AD accounts.

**Solution**: Trust their organization's OIDC provider and map specific identities to managed identities with limited scope.

**Benefits**:
- No guest account management
- Access automatically revoked when external identity is removed
- Scoped to specific resources

### Use Case 5: Ephemeral Environments

**Problem**: Dynamic or ephemeral environments (preview environments, feature branches) need Azure access but managing secrets per environment is complex.

**Solution**: Configure federated credentials with wildcard or pattern-based subjects to cover dynamic environment names.

**Benefits**:
- Automatic access for new environments
- No secret provisioning per environment
- Clean revocation when environments are deleted

---

## Security Considerations

### Subject Claim Validation

The subject claim (`sub`) is critical for security. Be as specific as possible:

```bash
# Too permissive - any branch can authenticate
--subject "repo:my-org/my-repo:*"

# Better - only main branch
--subject "repo:my-org/my-repo:ref:refs/heads/main"

# Best - only production environment
--subject "repo:my-org/my-repo:environment:production"
```

### Audience Validation

Always use the standard Azure audience for token exchange:
```
api://AzureADTokenExchange
```

Custom audiences can be configured but require additional validation setup.

### Least Privilege

Assign only the minimum required Azure RBAC roles to the managed identity:

```bash
# Assign specific role on specific resource
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>"
```

### Monitoring and Auditing

Enable diagnostic logging to track federation authentication:

```bash
# Enable diagnostic settings for the managed identity
az monitor diagnostic-settings create \
  --name "federation-logs" \
  --resource <managed-identity-resource-id> \
  --logs '[{"category": "FederatedIdentityCredentialOperation", "enabled": true}]' \
  --workspace <log-analytics-workspace-id>
```

---

## Troubleshooting

### Common Issues

**Issue**: "AADSTS70021: No matching federated identity record found"

**Cause**: The subject or issuer in the token doesn't match the federated credential configuration.

**Solution**: Verify the exact subject format by decoding the OIDC token and comparing claims.

---

**Issue**: "AADSTS700024: Client assertion audience claim does not match"

**Cause**: The audience in the OIDC token doesn't match the configured audience.

**Solution**: Ensure the external IdP is configured to use `api://AzureADTokenExchange` as the audience.

---

**Issue**: Token exchange succeeds but resource access fails

**Cause**: The managed identity lacks RBAC permissions on the target resource.

**Solution**: Verify role assignments on the managed identity.

---

### Debugging Token Claims

Decode and inspect the OIDC token to verify claims:

```bash
# For GitHub Actions, add this step to see the token claims
- name: Debug OIDC Token
  run: |
    TOKEN=$(curl -s -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
      "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=api://AzureADTokenExchange")
    echo $TOKEN | jq -r '.value' | cut -d. -f2 | base64 -d | jq .
```

---

## Limits and Quotas

| Limit | Value |
|-------|-------|
| Federated credentials per managed identity | 20 |
| Subject claim maximum length | 600 characters |
| Issuer URL maximum length | 600 characters |
| Audience maximum length | 600 characters |

---

## Summary

Azure OIDC Federation transforms how external workloads authenticate to Azure by replacing secrets with trust relationships. The key takeaways are:

1. **Security**: Eliminates secret storage and rotation, reducing attack surface
2. **Simplicity**: Streamlines CI/CD pipeline configuration
3. **Flexibility**: Supports any OIDC-compliant identity provider
4. **Scalability**: Works seamlessly with dynamic and ephemeral environments

When implementing federated credentials, always follow the principle of least privilege for both the subject claim specificity and the Azure RBAC role assignments.
