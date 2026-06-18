# LLM Prompt: Frontend — Multiple Application Types per Customer

Copy this entire document into an LLM chat (Cursor, ChatGPT, Claude, etc.) when updating the **CRM admin/associate frontend** and/or the **customer portal** to support **more than one application type per customer**.

Backend: NestJS CRM. Base URL from `VITE_API_URL` / `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3001` prod, `http://localhost:3000` local).

---

## Your task

Update the frontend so **one customer can have multiple applications** (each application = one application type instance with its own pipeline steps, document checklist, and associate assignments).

**Before (old UI assumption):** One customer ↔ one application type (single dropdown on create, single workflow on detail).

**After (required):** One customer ↔ **N applications** in `applications[]`. Every workflow/document API needs **`applicationId`** in the path.

Duplicate types are **allowed** (e.g. two separate "Business credit" applications). Do not dedupe in the UI unless product asks for it.

---

## Mental model

```
Customer (customerId)
  ├── Application A (applicationId) → type: Business credit
  │     ├── Pipeline steps 0..n
  │     └── Document requirements
  ├── Application B (applicationId) → type: LOC
  │     ├── Pipeline steps
  │     └── Documents
  └── Application C (applicationId) → type: Business credit  (same type again — OK)
```

**Breaking change:** `GET /customers/me` no longer returns a single `applicationType: string`. It returns `applications[]`.

---

## API configuration

| Setting | Value |
|--------|--------|
| Base URL | `VITE_API_URL` or `NEXT_PUBLIC_API_URL` |
| Auth | `Authorization: Bearer <accessToken>` |
| JSON | `Content-Type: application/json` |

---

## TypeScript types

Add to `types/crm.ts` (admin/associate) and `types/customer-portal.ts` (customer):

```typescript
export type ApplicationTypeOption = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
};

export type ApplicationTypeRef = {
  id: string;
  name: string;
};

export type CustomerApplicationRef = {
  applicationId: string;
  applicationType: ApplicationTypeRef | null;
};

/** Customer portal — GET /customers/me */
export type CustomerMeResponse = {
  id: string;
  name: string;
  email: string;
  applications: CustomerApplicationRef[];
};

/** CRM — customer detail / list item */
export type CustomerApplicationSummary = {
  applicationId: string;
  applicationType: ApplicationTypeRef | null;
  progress: { completedSteps: number; totalSteps: number };
  pipelineSteps: Array<{
    stepIndex: number;
    title: string;
    completedAt: string | null;
    assignedTo: Array<{ id: string; name: string }>;
  }>;
  assignedTo: Array<{ id: string; name: string }>;
};

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  property?: string;
  address?: string;
  profilePhoto?: string | null;
  applications: CustomerApplicationSummary[];
  assignedTo: Array<{ id: string; name: string }>;
};

/** Customer portal — documents grouped per application */
export type CustomerDocumentsResponse = {
  customerId: string;
  applications: Array<{
    applicationId: string;
    applicationType: ApplicationTypeRef | null;
    summary: { uploaded: number; remaining: number; total: number };
    documents: Array<{
      id: string;
      requirementKey: string;
      sectionTitle: string;
      itemLabel: string;
      status: string;
      uploaded: boolean;
      uploadedByMe: boolean;
      uploadedAt: string | null;
      canPreview: boolean;
      originalFilename: string | null;
    }>;
  }>;
};

/** Customer portal — pipeline grouped per application */
export type CustomerPipelineResponse = {
  customerId: string;
  applications: Array<{
    applicationId: string;
    applicationType: ApplicationTypeRef | null;
    pipelineSteps: Array<{
      stepIndex: number;
      title: string;
      completed: boolean;
      completedAt: string | null;
    }>;
  }>;
};
```

---

## Catalog: application types (admin/associate only)

Load once for create forms and "Add application" dialogs:

```http
GET /application-types
Authorization: Bearer <admin-or-associate-token>
```

**Response:**

```json
[
  { "id": "uuid", "code": "business_credit", "name": "Business credit", "sortOrder": 1 }
]
```

Use `id` as `applicationTypeId` or `code` as `applicationTypeCode` in create/add bodies.

Optional preview of steps/docs before create:

```http
GET /application-types/:applicationTypeId/workflow-template
```

---

## CRM (admin / associate) — Create customer with multiple types

```http
POST /customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "5145550100",
  "property": "123 Main St",
  "address": "optional",
  "applicationTypeIds": [
    "40e26003-a375-4b33-a96f-a609afd4ba6e",
    "another-type-uuid"
  ],
  "associateId": "optional-associate-profile-uuid"
}
```

**Rules:**

- Send **at least one** type via any of: `applicationTypeId`, `applicationTypeCode`, `applicationTypeIds[]`, `applicationTypeCodes[]`.
- Arrays and single fields can be combined; backend creates **one application per entry** (order preserved).
- **Backward compatible:** old clients sending only `"applicationTypeId": "uuid"` still create one application.

**Alternative body examples:**

```json
{ "applicationTypeCodes": ["business_credit", "loc"] }
```

```json
{ "applicationTypeId": "uuid", "applicationTypeIds": ["uuid-2"] }
```

**Response:** Full `CustomerSummary` with `applications[]` (same shape as `GET /customers/:customerId`).

**Associate on create:** If `associateId` is sent, that associate is assigned to **all pipeline steps on all applications** created in this request.

---

## CRM — Add another application to existing customer

```http
POST /customers/:customerId/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicationTypeId": "uuid"
}
```

Or:

```json
{ "applicationTypeCode": "mortgage_purchase" }
```

**Response:** Updated customer detail (`CustomerSummary`) with new row in `applications[]`.

**UI:** On customer detail page, add button **"Add application"** → modal with multi/single select from `GET /application-types` → POST above → refetch customer.

---

## CRM — Read customers

### List

```http
GET /customers
GET /customers?applicationTypeId=uuid
GET /customers?applicationTypeCode=business_credit
```

Filter returns customers who have **any** application matching that type (not only their first app).

### Detail

```http
GET /customers/:customerId
```

Returns `applications[]`. **Do not** read a top-level single `applicationType` field — it does not exist on the normalized API.

### Display in list table

- Show **badges** for each `applications[].applicationType.name`, or
- Show primary type + `+N more`, or
- Expand row to list all applications.

---

## CRM — Customer detail UX (required refactor)

### Application switcher

When `applications.length > 1`, show **tabs**, **segmented control**, or **sidebar list** keyed by `applicationId`.

Each tab label: `applicationType.name` (append short id suffix if duplicate names: `Business credit (2)`).

Store selected `applicationId` in URL query or route state, e.g.:

```
/customers/:customerId?applicationId=761b9998-...
```

### Per-application screens

All of these require **both** `customerId` and `applicationId`:

| Feature | Endpoint |
|---------|----------|
| Workflow | `GET /customers/:customerId/applications/:applicationId/workflow` |
| Complete step | `PATCH .../pipeline-steps/:stepIndex/complete` |
| Assign associates | `PATCH .../pipeline-steps/:stepIndex/assign-associates` |
| Documents presign | `POST .../documents/:documentId/presign` |
| Documents complete | `POST .../documents/:documentId/complete` |
| Document preview | `GET .../documents/:documentId/read-url` |

When user switches application tab → refetch workflow/documents for **that** `applicationId`.

### Create customer form

Replace single **Application type** dropdown with **multi-select** (`applicationTypeIds`).

Minimum one type required before submit.

---

## Customer portal — Multiple applications

Customers see **all** their applications. Documents and pipeline are already grouped by `applications[]` in API responses.

### Profile

```http
GET /customers/me
```

```json
{
  "id": "customer-profile-uuid",
  "name": "John Smith",
  "email": "john@example.com",
  "applications": [
    {
      "applicationId": "761b9998-9339-40fc-9390-bb982e83ad00",
      "applicationType": { "id": "...", "name": "Business credit" }
    },
    {
      "applicationId": "another-uuid",
      "applicationType": { "id": "...", "name": "LOC" }
    }
  ]
}
```

**Migration from old UI:** Remove any code reading `response.applicationType` (string). Use `response.applications`.

### Documents dashboard

```http
GET /customers/me/documents
```

Response already has `applications[]` each with `documents[]` and `summary`.

**UI:**

- **Tabs** at top: one tab per `applications[].applicationType.name` (use `applicationId` as key).
- Inside each tab: document checklist for that application only.
- Upload/preview URLs **must** include the tab's `applicationId`:

```http
POST /customers/me/applications/:applicationId/documents/:documentId/presign
POST /customers/me/applications/:applicationId/documents/:documentId/complete
GET  /customers/me/applications/:applicationId/documents/:documentId/read-url
```

### Pipeline (optional screen)

```http
GET /customers/me/pipeline
```

Same tab pattern per `applications[]`.

### Document row flags (unchanged per application)

| `uploaded` | `uploadedByMe` | `canPreview` | UI |
|------------|----------------|--------------|-----|
| `false` | `false` | `false` | Show Upload |
| `true` | `true` | `true` | Show Preview; show filename |
| `true` | `false` | `false` | Show "Provided by your team"; no preview |

---

## State management pattern (recommended)

```typescript
type SelectedApplicationState = {
  customerId: string;
  applicationId: string | null;
};

// On customer detail load:
const customer = await api.getCustomer(customerId);
const defaultAppId = customer.applications[0]?.applicationId ?? null;
setSelectedApplicationId(defaultAppId);

// On tab change:
setSelectedApplicationId(appId);
const workflow = await api.getWorkflow(customerId, appId);
```

Persist `applicationId` in the URL so refresh and deep links work.

---

## API client helpers (suggested)

```typescript
export async function createCustomer(body: {
  name: string;
  email: string;
  phone: string;
  property: string;
  applicationTypeIds: string[];
  associateId?: string;
  address?: string;
}) {
  return post<CustomerSummary>('/customers', body);
}

export async function addCustomerApplication(
  customerId: string,
  applicationTypeId: string,
) {
  return post<CustomerSummary>(`/customers/${customerId}/applications`, {
    applicationTypeId,
  });
}

export async function listApplicationTypes() {
  return get<ApplicationTypeOption[]>('/application-types');
}
```

---

## Screens checklist

### CRM — Admin / Associate

- [ ] **Create customer:** multi-select application types → `applicationTypeIds[]`
- [ ] **Customer list:** show multiple type badges per row
- [ ] **Customer detail:** application tabs; selected `applicationId` drives workflow + documents
- [ ] **Add application:** button + modal on customer detail
- [ ] **Pipeline assignment:** per step, per **selected application** (not customer-global)
- [ ] **Filter customers** by type still works (`?applicationTypeCode=`)

### Customer portal

- [ ] **Dashboard:** tabs per application on documents screen
- [ ] **Upload/preview:** pass correct `applicationId` from active tab
- [ ] **Header/profile:** list all application type names from `GET /customers/me`
- [ ] Remove deprecated `applicationType` string handling

---

## IDs — do not mix up

| ID | Where to get it |
|----|-----------------|
| `customerId` | `CustomerSummary.id` / `GET /customers/me` → `id` |
| `applicationId` | `applications[].applicationId` |
| `applicationTypeId` | `GET /application-types` → `id` |
| `documentId` | `documents[].id` inside the **same** application |
| `associateId` | `GET /associates` → profile `id` (not auth user id) |
| Auth `user.id` | Login only — not for customer or assignment URLs |

---

## Error handling

| Status | Meaning |
|--------|---------|
| `400` | No application type on create; invalid type id/code |
| `403` | Associate cannot access customer/application |
| `404` | Wrong `customerId` / `applicationId` / `documentId` combo |
| `409` | Email already in use (create customer) |

---

## Test plan

1. Create customer with **2 types** → detail shows 2 applications, each with pipeline steps and document slots.
2. **Add application** via POST → third application appears without recreating customer.
3. Switch application tab → workflow and documents change; URLs use correct `applicationId`.
4. Customer login → documents page shows **2 tabs**; upload in tab A does not affect tab B.
5. Old create payload with single `applicationTypeId` still creates **1** application.
6. Create two applications with **same** type name → UI distinguishes them (suffix or created date).

---

## Out of scope for this task

- Customer portal cannot add application types (admin/associate only).
- `property` is still on the customer profile, not per application (backend may change later).
- Do not use deprecated `customers.applicationType` column or `customer_applications.pipeline` jsonb — removed from API.

---

## Related backend docs in this repo

- `FRONTEND_PIPELINE_ASSIGNMENT_LLM_PROMPT.md` — pipeline step associate assignment
- `FRONTEND_CUSTOMER_PORTAL_LLM_PROMPT.md` — customer document upload/preview rules

When both multi-application and pipeline assignment apply, **combine**: pick `applicationId` first, then assign associates per step on that application.
