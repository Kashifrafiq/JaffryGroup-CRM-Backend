# LLM Prompt: Frontend — Pipeline Step Associate Assignment

Copy this entire document into an LLM chat (Cursor, ChatGPT, Claude, etc.) when building or updating the CRM **frontend**. The backend is NestJS; base URL defaults to `http://localhost:3000` unless env says otherwise.

---

## Your task

Integrate **pipeline-step-level associate assignment** in the CRM frontend. Associates are assigned to **individual pipeline steps** on a **customer application**, not to the whole customer.

**Hierarchy:**

```
Customer
  └── Application (e.g. Mortgage)
        ├── Pipeline step 0  →  assignedTo: [{ id, name }, ...]
        ├── Pipeline step 1  →  assignedTo: [...]
        └── Pipeline step 2  →  assignedTo: []
```

**Rules:**

- Use **associate profile `id`** from `GET /associates` for all assign APIs — **never** the auth `user.id`.
- Use **`stepIndex`** (0, 1, 2, …) in URLs — not step title, not a UUID.
- Assignment mutations are **admin-only**. Associates can view workflow and complete **only steps they are assigned to**.

---

## API configuration

| Setting | Value |
|--------|--------|
| Base URL | `process.env.VITE_API_URL` or `NEXT_PUBLIC_API_URL` or `http://localhost:3000` |
| Auth header | `Authorization: Bearer <accessToken>` |
| JSON header | `Content-Type: application/json` |
| Global prefix | None by default (`/customers`, not `/api/customers`) |

---

## Authentication

### Admin

```
POST /auth/admin-login
Body: { "email": string, "password": string }  // password min 8 chars
```

### Associate

```
POST /auth/associate-login
Body: { "email": string, "password": string }
```

### Login response

```json
{
  "accessToken": "jwt-string",
  "user": {
    "id": "user-uuid",
    "email": "string",
    "role": "admin" | "associate" | "customer"
  }
}
```

Store `accessToken` and `user.role`. Route guards: admin screens vs associate screens.

---

## TypeScript types

Create `types/crm.ts` (or equivalent):

```typescript
export type UserRole = 'admin' | 'associate' | 'customer';

export type PipelineStepAssignee = {
  id: string;
  name: string;
};

export type PipelineStep = {
  stepIndex: number;
  title: string;
  completedAt: string | null;
  assignedTo: PipelineStepAssignee[];
};

export type CustomerApplicationSummary = {
  applicationId: string;
  applicationType: { id: string; name: string } | null;
  progress: { completedSteps: number; totalSteps: number };
  pipelineSteps: PipelineStep[];
  assignedTo: PipelineStepAssignee[];
};

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string | null;
  applications: CustomerApplicationSummary[];
  assignedTo: PipelineStepAssignee[];
};

export type WorkflowResponse = {
  applicationId: string;
  applicationType: { id: string; code: string; name: string };
  pipelineSteps: PipelineStep[];
  documents: WorkflowDocument[];
};

export type WorkflowDocument = {
  id: string;
  status: string;
  requirementKey: string;
  sectionTitle: string;
  itemLabel: string;
  sortOrder: number;
  storageKey: string | null;
  bucket: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
  uploadedByUserId: string | null;
  notes: string | null;
};

export type AssociateProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  userId?: string;
};

export type AssignStepResponse = {
  pipelineProgressId: string;
  assignedAssociateIds: string[];
  totalAssigned: number;
};

export type UnassignStepResponse = {
  pipelineProgressId: string;
  associateId: string;
  removed: boolean;
};
```

---

## Read APIs

### List associates (admin — dropdown source)

```
GET /associates
Roles: admin
```

Returns `AssociateProfile[]`. Dropdown: `value = id`, `label = firstName + lastName`.

### List customers

```
GET /customers
Roles: admin, associate
```

- Admin: all customers.
- Associate: only customers with ≥1 assigned pipeline step.

Returns `CustomerSummary[]` with `applications[].pipelineSteps[].assignedTo`.

### Customer detail

```
GET /customers/:customerId
Roles: admin, associate (associate must have step access)
```

Returns `CustomerSummary` (detail may include documents on applications).

### Application workflow

```
GET /customers/:customerId/applications/:applicationId/workflow
Roles: admin, associate
```

Returns `WorkflowResponse`. Primary source for pipeline UI and `assignedTo` per step.

### Associate — my customers

```
GET /users/my-customers
Roles: associate
```

Returns customer list for logged-in associate.

---

## Assignment APIs (admin only)

### 1. Add associate(s) to a step (append; does not remove existing)

```
PATCH /customers/:customerId/applications/:applicationId/pipeline-steps/:stepIndex/assign-associates
Roles: admin

Body:
{
  "associateIds": ["associate-profile-uuid"]
}

Validation: associateIds required, array min length 1.

Response:
{
  "pipelineProgressId": "uuid",
  "assignedAssociateIds": ["uuid"],
  "totalAssigned": 1
}
```

### 2. Replace all assignees on a step

```
PATCH /customers/:customerId/applications/:applicationId/pipeline-steps/:stepIndex/associates
Roles: admin

Body:
{
  "associateIds": ["uuid-a", "uuid-b"]
}

Use associateIds: [] to clear everyone from that step.

Response: same shape as assign-associates.
```

### 3. Remove one associate from one step

```
PATCH /customers/:customerId/applications/:applicationId/pipeline-steps/:stepIndex/unassign/:associateId
Roles: admin

Body: none

Response:
{
  "pipelineProgressId": "uuid",
  "associateId": "uuid",
  "removed": true
}
```

### 4. Mark step complete / incomplete

```
PATCH /customers/:customerId/applications/:applicationId/pipeline-steps/:stepIndex
Roles: admin, associate

Body:
{ "completed": true }
or
{ "completed": false }

Associate: 403 if not assigned to this stepIndex.
Returns: WorkflowResponse (full workflow after update).
```

### 5. Bulk — assign associate to ALL steps on ALL applications for one customer

```
PATCH /users/:customerId/assign/:associateId
Roles: admin

Response:
{
  "customerId": "uuid",
  "associateId": "uuid",
  "stepsAssigned": 5
}
```

### 6. Bulk — multiple associates to all steps for one customer

```
PATCH /users/:customerId/assign-associates
Roles: admin

Body: { "associateIds": ["uuid-1", "uuid-2"] }
```

### 7. Bulk — one associate to all steps on multiple customers

```
PATCH /users/:associateId/assign-customers
Roles: admin

Body: { "customerIds": ["uuid-1", "uuid-2"] }
```

Prefer per-step APIs (1–3) for normal UI. Use bulk (5–7) only for “assign entire customer” shortcuts.

---

## Optional: assign on customer create

```
POST /customers
Roles: admin, associate

Body includes optional:
"associateId": "associate-profile-uuid"  // admin can set any; associate only self

Effect: assigns that associate to ALL pipeline steps on ALL applications created with the customer.
```

---

## Multiple application types per customer

A customer can have **one or more applications** (each with its own pipeline, documents, and step assignments). Duplicate application types are allowed (e.g. two "Business credit" applications).

### Create customer with one or more types

```
POST /customers
Roles: admin, associate

Body (pick at least one type field; arrays and single fields can be combined):

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "5145550100",
  "property": "123 Main St",
  "applicationTypeIds": ["uuid-type-1", "uuid-type-2"],
  "applicationTypeCodes": ["business_credit", "loc"],
  "associateId": "optional-associate-profile-uuid"
}
```

Backward compatible — single type still works:

```json
{ "applicationTypeId": "uuid" }
// or
{ "applicationTypeCode": "business_credit" }
```

Catalog: `GET /application-types` → use `id` or `code` from the list.

### Add another application later

```
POST /customers/:customerId/applications
Roles: admin, associate

Body:
{
  "applicationTypeId": "uuid",
  "applicationTypeCode": "optional-instead-of-id"
}
```

Response: full customer detail (`GET /customers/:customerId` shape) with updated `applications[]`.

### UI guidance

- Customer detail: show **tabs or cards per `applications[].applicationId`** (not one type per customer).
- Pipeline assignment, documents, and workflow APIs all require **`applicationId`** in the path.
- Customer list filter `?applicationTypeId=` / `?applicationTypeCode=` returns customers who have **any** matching application.

---

## ID reference (do not mix up)

| Parameter | Source |
|-----------|--------|
| `customerId` | `CustomerSummary.id` |
| `applicationId` | `applications[].applicationId` |
| `stepIndex` | `pipelineSteps[].stepIndex` (integer, 0-based) |
| `associateId` | `AssociateProfile.id` from `GET /associates` |
| Auth `user.id` | Login only — **not** for assignment APIs |

---

## UI screens to implement

### Screen 1: Admin — Customer detail → Application → Pipeline

**Data:** `GET /customers/:customerId` or `GET .../workflow`

If the customer has multiple applications, let the user **select an application** (`applications[].applicationId`) before showing pipeline steps for that application.

**Per pipeline step row:**

- Display: step number (`stepIndex + 1`), `title`, completed badge (`completedAt != null`)
- Display: chips for each `assignedTo` entry
- Control: multi-select of associates (`GET /associates`)
- Actions:
  - **Add assignees** → `assign-associates` with selected IDs
  - **Set assignees** (replace) → `associates` with full selection
  - **Remove chip** → `unassign/:associateId`
  - Optional: **Assign to all steps** → `PATCH /users/:customerId/assign/:associateId`

**After mutation:** refetch workflow or customer detail.

### Screen 2: Admin — Customer list

Show `assignedTo` summary per customer (aggregated unique associates).

### Screen 3: Associate — Dashboard / My customers

- List: `GET /users/my-customers`
- Pipeline steps: `GET /customers/:customerId/pipeline-steps?associateId=<own-associate-profile-id>`
- Documents: `GET /customers/:customerId/documents?associateId=<own-associate-profile-id>`
- Optional `applicationId` query on both when scoped to one application

**Pipeline step actions for associate:**

- Show **only** steps returned from the pipeline-steps API (assigned to them)
- Enable “Mark complete” only on steps in that list
- Hide all assign/unassign controls

### List customer documents (admin / associate)

Dedicated documents API — use this instead of loading full customer detail or workflow when you only need documents.

```http
GET /customers/:customerId/documents?associateId=<associate-profile-uuid>
GET /customers/:customerId/documents?associateId=<uuid>&applicationId=<application-uuid>
Authorization: Bearer <admin-or-associate-token>
```

**Required query:** `associateId` — associate **profile** id from `GET /associates` (not user id). Returns **only** documents assigned to that associate.

**Access:**
- **Admin** — pass any associate's profile id to see their assigned documents for this customer
- **Associate** — must pass their **own** associate profile id; other ids return **403**

**Response:**

```json
{
  "customerId": "uuid",
  "customerName": "John Smith",
  "associateId": "associate-profile-uuid",
  "associateName": "Jane Doe",
  "applications": [
    {
      "applicationId": "uuid",
      "applicationType": { "id": "uuid", "code": "business_credit", "name": "Business Credit" },
      "summary": { "uploaded": 2, "remaining": 5, "total": 7 },
      "documents": [
        {
          "id": "document-uuid",
          "requirementKey": "financial_statements",
          "sectionTitle": "Financial",
          "itemLabel": "Financial Statements",
          "sortOrder": 1,
          "status": "uploaded",
          "uploaded": true,
          "fileCount": 2,
          "storageKey": null,
          "assignedTo": [{ "id": "associate-uuid", "name": "Jane Doe" }],
          "files": [
            {
              "id": "file-uuid",
              "originalFilename": "statement.pdf",
              "uploadedAt": "2026-06-17T10:00:00.000Z",
              "uploadedByUserId": "user-uuid"
            }
          ]
        }
      ]
    }
  ]
}
```

Upload/preview still use workflow document routes (`presign`, `complete`, `read-url`).

---

### List customer pipeline steps (admin / associate)

Dedicated pipeline API — use this instead of workflow or customer detail when you only need steps for one associate.

```http
GET /customers/:customerId/pipeline-steps?associateId=<associate-profile-uuid>
GET /customers/:customerId/pipeline-steps?associateId=<uuid>&applicationId=<application-uuid>
Authorization: Bearer <admin-or-associate-token>
```

**Required query:** `associateId` — associate **profile** id from `GET /associates`. Returns **only** pipeline steps assigned to that associate.

**Access:**
- **Admin** — pass any associate profile id
- **Associate** — must pass their **own** associate profile id; other ids return **403**

**Response:**

```json
{
  "customerId": "uuid",
  "customerName": "John Smith",
  "associateId": "associate-profile-uuid",
  "associateName": "Jane Doe",
  "applications": [
    {
      "applicationId": "uuid",
      "applicationType": { "id": "uuid", "code": "business_credit", "name": "Business Credit" },
      "summary": { "completedSteps": 1, "totalSteps": 3 },
      "pipelineSteps": [
        {
          "stepIndex": 2,
          "title": "Credit review",
          "completedAt": null,
          "assignedTo": [{ "id": "associate-profile-uuid", "name": "Jane Doe" }]
        }
      ]
    }
  ]
}
```

Mark complete still uses `PATCH /customers/:customerId/applications/:applicationId/pipeline-steps/:stepIndex` (associate must be assigned to that step).

---

### Screen 4: Document workflow (same application context)

**Document access is separate from pipeline step access.** Associates only see and act on documents explicitly assigned to them.

Assign associates to documents when creating or editing a customer:

```http
POST /customers
{
  "name": "John Smith",
  "email": "john@example.com",
  ...
  "documentAssignments": [
    {
      "applicationTypeCode": "business_credit",
      "requirementKey": "financial_statements",
      "associateIds": ["associate-uuid-1", "associate-uuid-2"]
    }
  ]
}
```

```http
PATCH /customers/:customerId
{
  "documentAssignments": [
    {
      "documentId": "customer-application-document-uuid",
      "associateIds": ["associate-uuid-1"]
    }
  ]
}
```

- **Create** — match by `requirementKey` (+ optional `applicationTypeId` / `applicationTypeCode`)
- **Update** — match by `documentId` from `GET /customers/:id` (`applications[].documents[].id`)
- Each entry **replaces** assignees for that document
- Admin customer detail + workflow documents include `assignedTo[]` per document

Associates assigned to a document can use document endpoints for **that document only**:

```
POST /customers/:customerId/applications/:applicationId/documents/:documentId/presign
POST /customers/:customerId/applications/:applicationId/documents/:documentId/complete
PATCH /customers/:customerId/applications/:applicationId/documents/:documentId
GET  /customers/:customerId/applications/:applicationId/documents/:documentId/read-url?fileId=
```

Associates without a document assignment get **403** `You are not assigned to this document`.

---

## API client examples

### Shared fetch helper

```typescript
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function api<T>(
  path: string,
  options: RequestInit & { token: string },
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}
```

### Assign associate to step

```typescript
export function assignAssociatesToStep(input: {
  token: string;
  customerId: string;
  applicationId: string;
  stepIndex: number;
  associateIds: string[];
}) {
  const { token, customerId, applicationId, stepIndex, associateIds } = input;
  return api<AssignStepResponse>(
    `/customers/${customerId}/applications/${applicationId}/pipeline-steps/${stepIndex}/assign-associates`,
    {
      method: 'PATCH',
      token,
      body: JSON.stringify({ associateIds }),
    },
  );
}
```

### Replace assignees on step

```typescript
export function replaceAssociatesOnStep(input: {
  token: string;
  customerId: string;
  applicationId: string;
  stepIndex: number;
  associateIds: string[];
}) {
  const { token, customerId, applicationId, stepIndex, associateIds } = input;
  return api<AssignStepResponse>(
    `/customers/${customerId}/applications/${applicationId}/pipeline-steps/${stepIndex}/associates`,
    {
      method: 'PATCH',
      token,
      body: JSON.stringify({ associateIds }),
    },
  );
}
```

### Unassign one associate from step

```typescript
export function unassignAssociateFromStep(input: {
  token: string;
  customerId: string;
  applicationId: string;
  stepIndex: number;
  associateId: string;
}) {
  const { token, customerId, applicationId, stepIndex, associateId } = input;
  return api<UnassignStepResponse>(
    `/customers/${customerId}/applications/${applicationId}/pipeline-steps/${stepIndex}/unassign/${associateId}`,
    { method: 'PATCH', token },
  );
}
```

### Get workflow

```typescript
export function getWorkflow(input: {
  token: string;
  customerId: string;
  applicationId: string;
}) {
  const { token, customerId, applicationId } = input;
  return api<WorkflowResponse>(
    `/customers/${customerId}/applications/${applicationId}/workflow`,
    { method: 'GET', token },
  );
}
```

---

## React Query (recommended)

**Query keys:**

- `['associates']`
- `['customers', queryParams]`
- `['customer', customerId]`
- `['workflow', customerId, applicationId]`
- `['my-customers']` (associate)

**Invalidate after assign/unassign:**

- `['customer', customerId]`
- `['workflow', customerId, applicationId]`
- `['customers']`

---

## Error handling

| HTTP | Cause | UI behavior |
|------|--------|-------------|
| 401 | Missing/invalid JWT | Redirect to login |
| 403 | Associate not assigned to customer/step | Toast: “You don’t have access” |
| 404 | Bad customerId, applicationId, step, or associateId | Toast + refetch |
| 400 | Empty `associateIds` on assign-associates | Inline validation message |
| 409 | Business conflict (e.g. email) | Show server message |

Parse NestJS error body when present: `{ "message": string | string[], "statusCode": number }`.

---

## Access control summary

| Action | Admin | Associate |
|--------|-------|-----------|
| Assign / unassign steps | Yes | No |
| View customer with assignments | Yes | Only if ≥1 step assigned |
| View application workflow | Yes | Only if ≥1 step on that app |
| Mark step complete | Yes | Only on assigned steps |
| Upload / patch documents (app) | Yes | If ≥1 step on that app |

---

## Acceptance criteria

1. Admin opens customer → selects application → sees pipeline steps with `assignedTo` chips.
2. Admin can add, replace, and remove assignees per step; list refreshes correctly.
3. Associate `GET /users/my-customers` only shows customers with step assignments.
4. Associate can toggle complete only on assigned steps; 403 is handled.
5. All assignment calls use `AssociateProfile.id`, never `user.id`.
6. URLs use numeric `stepIndex` (0, 1, 2…).
7. Loading and error states on all mutations.

---

## Out of scope (unless asked)

- Customer portal login flows beyond `POST /auth/customer-login`
- Task assignment (`/tasks` uses different assignee model)
- Editing application type templates

---

## Backend repo reference

Implementation lives in:

- `src/modules/customers/customer-application-workflow.controller.ts` — assign + workflow routes
- `src/modules/customers/pipeline-step-assignment.service.ts` — assignment logic
- `src/modules/users/users.controller.ts` — bulk assign shortcuts

When unsure, read those files in the backend repo for the source of truth.
