# KRIDANGAN Azure Hosting Proposal

## Recommended decision

Use **Microsoft Azure**, not Netlify, for the complete KRIDANGAN system.

Netlify would be easy only for the public frontend. The registration APIs, admin dashboard, database access, authentication, CSV export, and private payment screenshots would still require separate backend, database, and storage services. That split is not selected.

## Approved Azure shape

- One **Linux Azure Web App running a Docker container**.
- The public website, registration system, APIs, and admin dashboard will use one HTTPS domain.
- The production frontend build will be served by the backend container, including direct refreshes of routes such as `/register` and `/admin/login`.
- **Azure Cosmos DB API for MongoDB** will hold registrations and admin data.
- **Azure Files** will hold private payment screenshots so they survive restarts and remain available if the app scales.
- Screenshots will continue to be accessible only through the protected admin flow; they will not become public static files.
- GitHub will be the deployment source, with Azure rebuilding and deploying updates from the repository.
- Production secrets will be held in Azure configuration/Key Vault, not included in the container or browser build.
- Azure health monitoring will cover the web app, database connection, and screenshot storage mount.

## Azure portal choice

Do not use the **Python 3.11 code runtime** option shown in the earlier Web App + Database wizard.

Create the Web App with:

- Publish: **Docker Container**
- Operating system: **Linux**
- Hosting tier: **Standard** for the live event
- Database: **Cosmos DB API for MongoDB**
- Redis: **No**
- Region: the same Indian region for the Web App, database, storage, and container registry

## Deployment behavior to preserve

- Existing visual design, official logos, registration flow, manual UPI payment flow, rulebooks, status lookup, and admin verification remain unchanged.
- Existing admin credentials and session-security behavior remain unchanged.
- Existing file-size and image-type validation remain enforced.
- The same application URL handles both the website and `/api` requests, avoiding a split-origin setup.

## Azure resources included in the target

- Azure Web App and App Service Plan
- Azure Container Registry
- Azure Cosmos DB account using the MongoDB API
- Azure Storage account with a private Azure Files share
- Azure Key Vault
- GitHub deployment connection
- Optional custom domain and managed HTTPS certificate after the first successful deployment

## Not selected

- Netlify-only hosting
- Separate Netlify frontend plus Azure backend
- Azure VM/VPS administration
- Public screenshot URLs
- Local container storage for production uploads

## Expected result

The GitHub repository can produce one deployable image for Azure. The deployed URL serves the complete KRIDANGAN experience, persists registrations and screenshots across restarts, keeps payment evidence private, and supports future updates through GitHub without manual server maintenance.