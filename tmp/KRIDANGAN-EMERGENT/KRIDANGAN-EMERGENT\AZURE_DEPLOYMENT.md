# KRIDANGAN — Azure App Service Deployment

This repository builds one Linux container: Vite compiles the React frontend, then FastAPI serves the SPA and every `/api` route from the same HTTPS domain.

## 1. Azure resources

Create all resources in the same Indian region:

1. Resource Group
2. Azure Container Registry (private)
3. Cosmos DB account using **API for MongoDB**
4. Storage Account → private Azure Files share named `private-uploads`
5. Key Vault
6. Linux App Service Plan (**Standard** for the live event)
7. Web App with **Publish: Docker Container** and **Operating System: Linux**

Do not choose the Python code runtime. The Docker image contains both Python and the production frontend.

## 2. Container settings

Configure the Web App container port and health monitoring:

| Setting | Value |
|---|---|
| `PORT` | `8000` |
| `WEBSITES_PORT` | `8000` |
| Health check path | `/api/health` |
| HTTPS Only | On |
| Minimum TLS | 1.2 or newer |

Leave Startup Command empty; the image `CMD` starts Uvicorn on `0.0.0.0:$PORT`.

## 3. Azure Files private screenshot mount

In **Web App → Configuration → Path mappings → Azure Storage Mount**, add:

| Field | Value |
|---|---|
| Name | `private-uploads` |
| Storage type | Azure Files |
| Share | `private-uploads` |
| Mount path | `/mnt/private-uploads` |
| Access | Read/Write |

Set `UPLOAD_DIR=/mnt/private-uploads`. Never mount this share under `/app/frontend/dist`; screenshots remain private and are returned only by the authenticated admin screenshot endpoint.

## 4. Key Vault and application settings

Enable the Web App system-assigned managed identity. Grant it **Key Vault Secrets User**, then use Key Vault references for secrets.

```text
MONGO_URL=@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/mongo-url)
DB_NAME=kridangan
ADMIN_USERNAME=@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/admin-username)
ADMIN_PASSWORD=@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/admin-password)
ADMIN_JWT_SECRET=@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/admin-jwt-secret)
CORS_ORIGINS=https://<app-name>.azurewebsites.net
UPLOAD_DIR=/mnt/private-uploads
APP_TZ=Asia/Kolkata
PORT=8000
WEBSITES_PORT=8000
WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
WEBSITES_CONTAINER_START_TIME_LIMIT=1800
```

Use the MongoDB connection string exactly as Cosmos DB provides it, including TLS and driver options. When a custom domain is added, append its exact HTTPS origin to `CORS_ORIGINS` with a comma.

## 5. GitHub OIDC deployment

The workflow `.github/workflows/azure-container-deploy.yml` builds a commit-SHA image, pushes it to ACR, and deploys that exact image.

Create GitHub environment `production` and add:

### Secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### Variables

- `AZURE_ACR_NAME` — registry resource name
- `AZURE_ACR_LOGIN_SERVER` — e.g. `kridangan.azurecr.io`
- `AZURE_WEBAPP_NAME`

The federated Azure identity needs `AcrPush` on ACR and permission to update the Web App. The Web App managed identity needs `AcrPull` on ACR. No database/admin secrets belong in GitHub.

Use the chat **Save to GitHub** action after review; direct Git writes are intentionally not performed here.

## 6. First deployment verification

1. Open **Log stream** and confirm Uvicorn binds to `0.0.0.0:8000`.
2. Open `https://<app-name>.azurewebsites.net/api/health`; expect database and storage `ok`.
3. Refresh `/register`, `/registration-status`, `/admin/login`, and `/admin`; each route must load the SPA.
4. Submit a test registration with a screenshot, restart the Web App, and confirm the screenshot still appears in the protected admin detail view.
5. Confirm an unauthenticated screenshot request returns 401.
6. Add the custom domain only after the default Azure hostname passes all checks.

## 7. Local container verification

Copy `azure.env.example` to an ignored file named `azure.env`, set strong local-only admin secrets, then run:

```bash
set -a
. ./azure.env
set +a
docker compose -f compose.azure-local.yml up --build
```

Open `http://localhost:8000` and check `http://localhost:8000/api/health`.