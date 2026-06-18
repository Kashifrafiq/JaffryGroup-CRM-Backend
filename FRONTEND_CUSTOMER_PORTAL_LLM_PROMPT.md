# LLM Prompt: Frontend — Customer Portal (Documents, Auth, Upload)

Copy this entire document into an LLM chat when building or updating the **customer-facing frontend** (e.g. `localhost:5174`). Backend: NestJS CRM at `VITE_API_URL` / `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

**Scope:** Customer role only. Admin/associate CRM UI uses different routes — do not mix them.

---

## Your task

Implement the **customer portal** so logged-in customers can:

1. Log in as `customer`
2. See **only** document checklist items they are allowed to see
3. **Upload** files for pending requirements
4. **Preview** only documents **they** uploaded (not team uploads)
5. Never access admin/associate APIs or leak team-uploaded files

The backend enforces rules; the frontend must call the correct **`/customers/me/...`** endpoints and respect response flags.

---

## Critical business rules

| Rule | Detail |
|------|--------|
| Visibility | Customer sees **all** requirement rows. `files[]` lists **only** files they uploaded — team files are never listed. |
| Preview | Customer can preview **only** when `canPreview === true` (own upload with file in storage). |
| Upload | Customer can upload **multiple files** per requirement (presign once per file). Blocked only when team uploaded via **legacy** single-file row on the parent document (403). |
| Routes | Customer app uses **`/customers/me/...`** only — not `/customers/:customerId/...`. |
| Storage | File bytes go **directly to DigitalOcean Spaces** via presigned URL — not through the API body. |

---

## Authentication

```http
POST /auth/customer-login
Content-Type: application/json

{ "email": "customer@example.com", "password": "min 8 chars" }
```

**Response:**

```json
{
  "accessToken": "jwt...",
  "user": {
    "id": "user-uuid",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "customer"
  }
}
```

- Store `accessToken` and `user.role`
- Route guard: only `role === "customer"` enters customer portal
- Header on all API calls: `Authorization: Bearer <accessToken>`

**Customer account setup:** Customer must accept invite (`POST /auth/customer-invites/accept`) so `customers.userId` links to `user.id`. Without that, `me` endpoints return "Customer profile not found".

---

## TypeScript types (`types/customer-portal.ts`)

```typescript
export type CustomerDocumentFile = {
  id: string;
  originalFilename: string | null;
  uploadedAt: string | null;
  uploadedByMe: boolean;
  canPreview: boolean;
};

export type CustomerDocumentRow = {
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
  fileCount: number;
  files: CustomerDocumentFile[];
};

export type CustomerDocumentsResponse = {
  customerId: string;
  applications: Array<{
    applicationId: string;
    applicationType: { id: string; name: string } | null;
    summary: {
      uploaded: number;
      remaining: number;
      total: number;
    };
    documents: CustomerDocumentRow[];
  }>;
};

export type PresignUploadResponse = {
  uploadUrl: string;
  bucket: string;
  key: string;
  expiresIn: number;
  fileId: string;
};

export type PresignUploadBody = {
  filename: string;
  contentType: string;
};

export type CompleteUploadBody = {
  fileId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: string;
};

export type ReadUrlResponse = {
  readUrl: string;
  bucket: string;
  key: string;
  expiresIn: number;
};
```

---

## API client (`lib/customer-api.ts`)

Base URL from env. Attach JWT on every request.

### List documents (main screen)

```http
GET /customers/me/documents
Authorization: Bearer <customer-token>
```

Returns `CustomerDocumentsResponse`.

**UI mapping per document row:**

| Field | UI |
|-------|-----|
| `itemLabel` / `sectionTitle` | Title / group |
| `uploaded === false` | Show **Upload** button |
| `uploaded === true` && `uploadedByMe === false` | Requirement fulfilled by team; **no** preview; customer may still **add more files** unless legacy team upload blocks presign (403) |
| `files[]` | List of **customer-owned** attachments; render each with preview when `canPreview` |
| `fileCount` | Count of customer-visible files (includes legacy single-file row when `uploadedByMe`) |
| `canPreview === true` | Show **Preview** / **Download** on row or per file in `files[]` |
| `originalFilename` | Legacy convenience field — prefer `files[].originalFilename` for multi-file rows |

All requirement rows are returned. Team uploads use `uploaded: true`, `uploadedByMe: false`, `canPreview: false`.

---

### Preview (customer-owned files only)

```http
GET /customers/me/applications/:applicationId/documents/:documentId/read-url?fileId=<uuid>
Authorization: Bearer <customer-token>
```

`fileId` is **required** for multi-file attachments (from presign response or `files[].id`). Omit `fileId` only for **legacy** single-file rows still stored on the parent document.

Returns `ReadUrlResponse`. Open `readUrl` in new tab, iframe, or fetch for viewer.

**Only call when `canPreview === true`.** Otherwise expect **403** `You can only preview documents you uploaded`.

**WRONG (do not use for customer):**

```http
GET /customers/:customerId/applications/:applicationId/documents/:documentId/read-url
```

That route is **admin/associate only**.

---

### Upload flow (3 steps per file)

Each file upload is a separate presign → PUT → complete cycle. A requirement like "Financial Statements" can hold **many** files.

#### Step 1 — Presign

```http
POST /customers/me/applications/:applicationId/documents/:documentId/presign
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "filename": "bank-statement.pdf",
  "contentType": "application/pdf"
}
```

Response: `PresignUploadResponse` — save **`fileId`** and **`key`** (`storageKey`) for step 3.

**Errors:**

- **403** — Legacy team upload on parent row blocks customer upload: show "Uploaded by your team"
- **400** — Document waived

#### Step 2 — PUT file to Spaces (browser → storage, not API)

```javascript
await fetch(presign.uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': contentType }, // must match presign body
  body: file,
});
```

**CORS:** DigitalOcean Space must allow your frontend origin (`http://localhost:5174`, production URL) with methods `PUT`, `GET`, `HEAD` and headers `*`. Backend CORS does **not** apply to this request.

Presigned URL host looks like: `https://<bucket>.<region>.digitaloceanspaces.com/...`

#### Step 3 — Complete

```http
POST /customers/me/applications/:applicationId/documents/:documentId/complete
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "fileId": "<fileId from presign>",
  "storageKey": "<key from presign>",
  "originalFilename": "bank-statement.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": "123456"
}
```

`sizeBytes` must be a **string** in JSON (backend accepts number coerced to string).

After success, refetch `GET /customers/me/documents`. Row should include the new entry in `files[]` with `uploadedByMe: true`, `canPreview: true`. Use **Add another file** to presign again for the same `documentId`.

---

## Other customer endpoints (optional)

```http
GET /customers/me
→ { id, name, email, applications: [{ applicationId, applicationType: { id, name } }] }

GET /customers/me/pipeline
→ pipeline steps progress (read-only, no document preview here)
```

Customers **cannot** use:

- `GET /customers/:customerId` (admin/associate)
- `GET /customers/:customerId/applications/.../workflow`
- `PATCH` pipeline steps
- Assign associates

---

## Screens to build

### Screen A — Login

- Form → `POST /auth/customer-login`
- Redirect to documents dashboard on success

### Screen B — Documents dashboard

- On mount: `GET /customers/me/documents`
- Tabs or sections per `applications[]`
- Per `documents[]` row:
  - Label: `itemLabel`
  - Status: pending vs uploaded (by anyone) vs uploaded by me
  - List `files[]` with filename + per-file preview
  - Actions: **Upload** / **Add another file** | **Preview** per file (gated by `canPreview`)
- Summary chips: `summary.uploaded`, `summary.remaining`, `summary.total`

### Screen C — Upload modal / drawer

1. User picks file → derive `filename`, `contentType`
2. Presign → save `fileId` + `key` → PUT to `uploadUrl` → Complete with `fileId`
3. Loading states on each step; show error toast on failure
4. On success, refresh list; offer "Add another file" on same requirement

### Screen D — Preview

1. Only if `canPreview` on row or file
2. `GET .../read-url?fileId=<files[].id>` → open `readUrl`
3. Handle image/pdf in viewer or download link

---

## Example: upload helper

```typescript
export async function uploadCustomerDocument(params: {
  token: string;
  apiUrl: string;
  applicationId: string;
  documentId: string;
  file: File;
}) {
  const { token, apiUrl, applicationId, documentId, file } = params;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const presignRes = await fetch(
    `${apiUrl}/customers/me/applications/${applicationId}/documents/${documentId}/presign`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
      }),
    },
  );
  if (!presignRes.ok) throw new Error(await presignRes.text());
  const presign = await presignRes.json();

  const putRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!putRes.ok) throw new Error('Upload to storage failed');

  const completeRes = await fetch(
    `${apiUrl}/customers/me/applications/${applicationId}/documents/${documentId}/complete`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileId: presign.fileId,
        storageKey: presign.key,
        originalFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: String(file.size),
      }),
    },
  );
  if (!completeRes.ok) throw new Error(await completeRes.text());
  return completeRes.json();
}
```

---

## Error handling

| HTTP | Meaning | UI |
|------|---------|-----|
| 401 | Expired/invalid JWT | Redirect to login |
| 403 | Team doc / preview denied | Toast: not your file |
| 404 | Wrong ids or no profile | Toast + refetch |
| CORS on PUT | Space CORS not configured | Show "Contact support" + link to fix Spaces CORS |
| Network ETIMEDOUT on PUT | Rare from browser; check CORS first | |

Parse Nest errors: `{ "message": string | string[], "statusCode": number }`.

---

## Admin vs customer apps

Admin/associate users upload documents **for customers** in the CRM app (`/customers/:customerId/...`). This customer portal prompt remains customer-only and must call only `/customers/me/...`.

| Feature | Customer app | Admin/associate app |
|---------|--------------|---------------------|
| List all docs | `GET /customers/me/documents` | `GET /customers/:id` |
| See team uploads | No | Yes |
| Preview team files | No | `GET .../read-url` with customerId |
| Upload | `POST /customers/me/.../presign` | `POST /customers/:customerId/.../presign` |
| Assign pipeline steps | No | Admin only |

Use **separate** API modules or route prefixes in frontend monorepo to avoid mixing.

---

## DigitalOcean Spaces CORS (devops note for frontend dev)

If browser shows:

> blocked by CORS policy ... digitaloceanspaces.com

Fix in DO Control Panel → Space → CORS:

- Origins: `http://localhost:5174`, production frontend URL
- Methods: `PUT`, `GET`, `HEAD`
- Headers: `*`

---

## Acceptance criteria

1. Customer login works; token stored.
2. Documents list loads via `GET /customers/me/documents` only.
3. Team-uploaded documents can mark requirement status as fulfilled, but team files **never** appear in `files[]` for customer app.
4. Preview button only when `canPreview === true`; uses `GET /customers/me/.../read-url`.
5. Upload uses presign → PUT → complete on `me` routes.
6. After upload, list shows `uploadedByMe: true` and preview works.
7. 403 on upload when team filled slot shows friendly message.
8. No calls to `/customers/:customerId/...` from customer app.
9. Spaces CORS configured for PUT from frontend origin.

---

## Out of scope (unless asked)

- Pipeline step assignment UI (admin) — see `FRONTEND_PIPELINE_ASSIGNMENT_LLM_PROMPT.md` in backend repo
- Brevo / invite email setup
- Admin CRM customer detail page

---

## Backend reference files

- `src/modules/customers/customers.controller.ts` — `me`, `me/documents`
- `src/modules/customers/customer-application-workflow.controller.ts` — `me/.../presign`, `complete`, `read-url`
- `src/modules/customers/customers.service.ts` — `findMyDocuments` filtering
- `src/modules/customers/customer-application-workflow.service.ts` — upload/preview guards
