# Assignment 3 – Developer Documentation

## 1. Overview

This API provides authenticated access to mail messages for a demo mail system.
It includes:
- JWT-based authentication
- Role-based access control (RBAC)
- Request logging with unique request IDs
- In-memory rate limiting
- Centralized error handling with consistent JSON responses

All protected routes require a valid Bearer token obtained via `/auth/login`.

---

## 2. Authentication

### 2.1 Auth Method

- Scheme: Bearer token (JWT)
- Algorithm: HS256
- Token expiry: 1 hour from login time
- Secret: configured via `JWT_SECRET` environment variable

### 2.2 How to Obtain a Token

**Endpoint:** `POST /auth/login`

**Request Body:**

    ```json
    {
      "username": "user1",
      "password": "user123"
    }
    ```
  - **Success Response (200):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
    **Failure Response (401) — Invalid credentials:**
    ```json
    {
      "error": "AuthenticationError",
      "message": "Invalid username or password",
      "statusCode": 401,
      "requestId": "a1b2c3d4-...",
      "timestamp": "2026-04-25T02:00:00.000Z"
    }
    ```

### 2.3 Using the Token

Include this header in every authenticated request:

    Authorization: Bearer <token>

Tokens expire after 1 hour. If your token expires, log in again to get a new one.
Mention any expiry behavior (e.g., tokens are valid for 1 hour).

---

## 3. Roles & Access Rules

There are two roles in this system:

- `admin` — Can view any mail message regardless of ownership.
- `user` — Can only view mail messages that belong to them (where mail.userId === user.userId).

### Access Control Matrix

| Endpoint       | Method | admin        | user             |
|----------------|--------|--------------|------------------|
| `/auth/login`  | POST   | Public       | Public           |
| `/status`      | GET    | Public       | Public           |
| `/mail/:id`    | GET    | All mail     | Own mail only    |

---

## 4. Endpoints

### 4.1 `POST /auth/login`

**Description:**  
Authenticate with username/password and returns a signed JWT on success

**Authenctication Required:** No

**Request Body:**

```json
{
  "username": "admin1",
  "password": "admin123"
}
```

**Success Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Common Failures:**
- Missing username or password → 400 BadRequestError
- Wrong credentials → 401 AuthenticationError

---

### 4.2 `GET /mail/:id`

**Description:**
Retrieve a single mail message by ID.

**Authentication**

* Requires `Authorization: Bearer <token>` header.

**Access Rules:**

* `admin`: may view any mail ID.
* `user`: may view only mail where `mail.userId` matches their own `userId`.

**URL Parameter:**
- id — integer ID of the mail message (e.g. /mail/2)

**Example Request:**

```bash
curl http://localhost:3000/mail/2 \
  -H "Authorization: Bearer <token>"
```

**Example Success Response (200):**

```json
{
  "id": 2,
  "userId": 2,
  "subject": "Hello User1",
  "body": "Your report is ready."
}
```
**Not Found Response (404):**
  ```json
    {
      "error": "NotFoundError",
      "message": "Mail not found",
      "statusCode": 404,
      "requestId": "f7ba68de-...",
      "timestamp": "2026-04-25T02:25:57.922Z"
    }
  ```

**Example Forbidden Response (when user tries to access someone else’s mail):**

```json
{
  "error": "Forbidden",
  "message": "User does not have permission to access this resource.",
  "statusCode": 403,
  "requestId": "req-12345",
  "timestamp": "2026-04-25T02:25:57.922Z"
}
```

---

### 4.3 `GET /status`

**Description:**
Simple health check to confirm the API is running.

**Authentication:**

* None required.

**Example Request:** 

```bash 
curl http://localhost:3000/status
```

**Example Response (200):**

```json
{
  "status": "ok"
}
```

---

## 5. Rate Limiting

Rate limiting is applied globally to all endpoints.

- Keyed by: userId if the request is authenticated, otherwise by IP address.
- Limit: RATE_LIMIT_MAX requests (default: 5) per RATE_LIMIT_WINDOW_SECONDS seconds (default: 60).
- Algorithm: Fixed window — the counter resets after each window expires.

When the limit is exceeded:
- HTTP status 429 is returned.
- A Retry-After HTTP header is included indicating seconds until the window resets.
- The JSON response includes a retryAfter field.

**Rate Limit Exceeded Response (429):**
  ```json
    {
      "error": "RateLimitError",
      "message": "Rate limit exceeded. Please slow down.",
      "statusCode": 429,
      "requestId": "317f1fe7-...",
      "timestamp": "2026-04-25T02:36:44.845Z",
      "retryAfter": 51
    }
  ```

---

## 6. Error Response Format

All errors are handled by the centralized error handler and return a consistent JSON structure:
  ```json
    {
      "error": "ErrorCategory",
      "message": "A safe explanation of what went wrong.",
      "statusCode": 400,
      "requestId": "uuid-here",
      "timestamp": "2026-04-25T02:00:00.000Z"
    }
  ```

**Common Error Categories:**

| Category              | Status Code | Cause                                   |
|-----------------------|-------------|-----------------------------------------|
| AuthenticationError   | 401         | Missing, invalid, or expired JWT        |
| ForbiddenError        | 403         | Valid token but insufficient permissions|
| NotFoundError         | 404         | Requested resource does not exist       |
| RateLimitError        | 429         | Too many requests in the current window |
| InternalServerError   | 500         | Unexpected server-side error            |

Stack traces and internal details are never exposed to the client.
Each error response includes the requestId so developers can trace the error back to a specific log entry in the server logs.

---

## 7. Example Flows

### 7.1 Happy Path: Login + Access Own Mail

Step 1 — Login as user1:
  ```bash
    curl -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"user1","password":"user123"}'
  ```
Response:
  ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  ```

Step 2 — Access own mail (mail ID 2 belongs to user1):
  ```bash
    curl http://localhost:3000/mail/2 \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  ```
Response:
  ```json
    {
      "id": 2,
      "userId": 2,
      "subject": "Hello User1",
      "body": "Your report is ready."
    }
  ```

---

### 7.2 Error Path: User Accessing Someone Else's Mail

Step 1 — Login as user1:
  ```bash
    curl -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"user1","password":"user123"}'
  ```
Step 2 — Try to access mail ID 3 (belongs to user2):
  ```bash
    curl http://localhost:3000/mail/3 \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  ```

Response (403 Forbidden):
  ```bash
    {
      "error": "ForbiddenError",
      "message": "You do not have permission to access this resource",
      "statusCode": 403,
      "requestId": "f7ba68de-1007-4efd-b416-4e6324243e33",
      "timestamp": "2026-04-25T02:25:57.922Z"
    }
  ```

---

### 7.3 Error Path: Rate Limit Exceeded

Send more than 5 requests within 60 seconds:
  ```bash 
    curl http://localhost:3000/status
    (repeat 6 or more times quickly)
  ```

Response on 6th request (429):
  ```json
    {
      "error": "RateLimitError",
      "message": "Rate limit exceeded. Please slow down.",
      "statusCode": 429,
      "requestId": "317f1fe7-5987-4203-8759-54085acd14a1",
      "timestamp": "2026-04-25T02:36:44.845Z",
      "retryAfter": 51
    }
  ```

Wait retryAfter seconds before sending another request.