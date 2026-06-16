# API Documentation

PulseWatch exposes a RESTful API. Below are the grouped endpoints.
All API endpoints are prefixed with `/api`.
Authenticated requests require a Bearer token: `Authorization: Bearer <accessToken>`.

---

## Auth 
Rate limit: 10 req/min/IP

### `POST /auth/register`
- **Auth:** No
- **Body:** `{ name, email, password }`
- **Response:** `{ success: true, token, user }`

### `POST /auth/login`
- **Auth:** No
- **Body:** `{ email, password }`
- **Response:** `{ success: true, token, user }`

### `POST /auth/logout`
- **Auth:** No
- **Response:** `{ success: true, message: 'Logged out' }`

### `GET /auth/me`
- **Auth:** Yes
- **Response:** `{ success: true, user }`

### `POST /auth/refresh`
- **Auth:** No (uses httpOnly `refreshToken` cookie)
- **Response:** `{ success: true, token }`

---

## Dashboard
Rate limit: 100 req/min/IP

### `GET /dashboard/stats`
- **Auth:** Yes
- **Response:** Returns overview statistics (down monitors, open incidents, activity log, uptime trend)

---

## Monitors
Rate limit: 100 req/min/IP

### `GET /monitors`
- **Auth:** Yes
- **Response:** `{ success: true, data: Monitor[] }`

### `GET /monitors/:id`
- **Auth:** Yes
- **Response:** `{ success: true, data: Monitor }`

### `POST /monitors`
- **Auth:** Yes
- **Rate Limit:** 30 req/hr/User
- **Body:** `{ name, url, type, interval, expectedStatus, isActive? }`
- **Response:** `{ success: true, data: Monitor }`

### `PUT /monitors/:id`
- **Auth:** Yes
- **Body:** `{ name, url, type, interval, expectedStatus, isActive? }`
- **Response:** `{ success: true, data: Monitor }`

### `DELETE /monitors/:id`
- **Auth:** Yes
- **Response:** `{ success: true, message: 'Monitor deleted' }`

### `POST /monitors/bulk`
- **Auth:** Yes
- **Body:** `{ ids: string[], action: 'pause' | 'resume' | 'delete' }`
- **Response:** `{ success: true, message: 'Bulk action completed' }`

### `POST /monitors/test`
- **Auth:** Yes
- **Body:** `{ url, type, expectedStatus }`
- **Response:** `{ success: true, message: 'Test result', data: { status, responseTime } }`

---

## Incidents
Rate limit: 100 req/min/IP

### `GET /incidents`
- **Auth:** Yes
- **Query:** `?status=INVESTIGATING|IDENTIFIED|MONITORING|RESOLVED`
- **Response:** `{ success: true, data: Incident[] }`

### `GET /incidents/:id`
- **Auth:** Yes
- **Response:** `{ success: true, data: Incident }`

### `POST /incidents`
- **Auth:** Yes
- **Body:** `{ monitorId?, title, status }`
- **Response:** `{ success: true, data: Incident }`

### `PUT /incidents/:id`
- **Auth:** Yes
- **Body:** `{ title, status }`
- **Response:** `{ success: true, data: Incident }`

### `POST /incidents/:id/updates`
- **Auth:** Yes
- **Body:** `{ message, status? }`
- **Response:** `{ success: true, data: IncidentUpdate }`

---

## Alerts
Rate limit: 100 req/min/IP

### `GET /alerts`
- **Auth:** Yes
- **Response:** `{ success: true, data: Alert[] }`

### `POST /alerts/test`
- **Auth:** Yes
- **Rate Limit:** 5 req/hr/User
- **Body:** `{ alertId }`
- **Response:** `{ success: true, message: 'Test alert sent' }`

---

## Analytics
Rate limit: 100 req/min/IP

### `GET /analytics`
- **Auth:** Yes
- **Response:** `{ success: true, data: { uptimeHistory, responseTimeHistory, incidentHistory } }`

### `GET /analytics/export/pdf`
- **Auth:** Yes
- **Rate Limit:** 10 req/hr/User
- **Response:** Downloads a PDF document containing analytics reports.

---

## Team
Rate limit: 100 req/min/IP

### `POST /team/invite`
- **Auth:** Yes
- **Rate Limit:** 10 req/hr/User
- **Body:** `{ email, role }`
- **Response:** `{ success: true, message: 'Invite sent' }`

### `PUT /team/:id/role`
- **Auth:** Yes
- **Body:** `{ role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' }`
- **Response:** `{ success: true, message: 'Role updated' }`

### `POST /team/accept-invite`
- **Auth:** Yes
- **Body:** `{ token }`
- **Response:** `{ success: true, message: 'Invite accepted' }`

---

## Admin (Superadmin Only)
Rate limit: 100 req/min/IP

### `GET /admin/users`
- **Auth:** Yes
- **Response:** `{ success: true, data: User[] }`

### `GET /admin/workspaces`
- **Auth:** Yes
- **Response:** `{ success: true, data: Workspace[] }`

---

## Public (Status Page)
Public endpoints.

### `GET /public/status/:slug`
- **Auth:** No
- **Response:** `{ success: true, data: { statusPage, monitors, history } }`

### `GET /public/sse/status/:slug`
- **Auth:** No
- **Response:** SSE text/event-stream broadcast stream for live public page updates.

---

## Server-Sent Events (SSE)

### `GET /sse/dashboard`
- **Auth:** Yes (via query `?token=<jwt>`)
- **Response:** SSE text/event-stream connection broadcasting real-time workspace updates (`monitor_status_changed`, `new_incident`, `incident_resolved`, `new_alert`).
