# TeamFocus Server API Documentation

All API endpoints are prefixed with the base path defined in the server configuration (typically `/api/v1` or root `/`).

---

## 🔑 Authentication (`/auth`)

Handles user registration, login, and token verification.

### 1. Signup
* **Endpoint:** `POST /auth/signup`
* **Access:** Public (No authorization header required)
* **Request Body:**
  ```json
  {
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Description:** Registers a new user. Returns user details.

### 2. Login
* **Endpoint:** `POST /auth/login`
* **Access:** Public (No authorization header required)
* **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Description:** Authenticates user credentials and returns a JWT token.

### 3. Verify Token
* **Endpoint:** `GET /auth/verify`
* **Access:** Public (No authorization header required)
* **Query Parameters:**
  * `token` (String, required): The JWT token to verify.
* **Description:** Verifies the validity of a JWT token and returns its decoded payload.

---

## 👤 Users (`/users`)

Provides user profile management. Access to specific user profiles is protected via ownership/manager checks.

### 1. Create User
* **Endpoint:** `POST /users`
* **Access:** Protected (Roles: `ADMIN` only)
* **Request Body:**
  ```json
  {
    "fullname": "Jane Doe",
    "email": "jane@example.com",
    "password": "anotherpassword123",
    "imageUrl": "https://example.com/image.png"
  }
  ```
* **Description:** Admin-only endpoint to register a new user in the system.

### 2. Query Users
* **Endpoint:** `GET /users`
* **Access:** Protected (Roles: `ADMIN` only)
* **Query Parameters (All optional):**
  * `page` (Number, default: 1)
  * `limit` (Number, default: 10)
  * `search` (String): Search keyword matching fullname or email.
  * `fullname` (String)
  * `email` (String)
  * `role` (String: `ADMIN` | `USER` | `MANAGER`)
  * `sortBy` (String, default: `"createdAt"`)
  * `sortOrder` (String: `"asc"` | `"desc"`, default: `"desc"`)
* **Description:** Retrieve a paginated list of users.

### 3. Get User Details
* **Endpoint:** `GET /users/:id`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`, `USER`)
* **Description:** Retrieve details for a specific user. Non-admin users can only view their own profile. Managers can only view members of teams they manage.

### 4. Update User
* **Endpoint:** `PATCH /users/:id`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`, `USER`)
* **Request Body (All optional):**
  ```json
  {
    "fullname": "Updated Name",
    "email": "updated@example.com",
    "role": "MANAGER",
    "imageUrl": "https://example.com/new-image.png"
  }
  ```
* **Description:** Update user profile details. Access validation is identical to profile retrieval.

### 5. Delete User
* **Endpoint:** `DELETE /users/:id`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`, `USER`)
* **Description:** Delete a user profile. Access validation is identical to profile retrieval.

---

## 👥 Teams (`/teams`)

Manages organization teams, managers, and member associations.

### 1. Create Team
* **Endpoint:** `POST /teams`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`)
* **Request Body:**
  ```json
  {
    "name": "Team Alpha",
    "managerId": "manager-uuid"
  }
  ```
* **Description:** Create a new team. Managers can only create a team assigning themselves as the manager.

### 2. Query Teams
* **Endpoint:** `GET /teams`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`)
* **Query Parameters (All optional):**
  * `page` (Number, default: 1)
  * `limit` (Number, default: 10)
  * `search` (String): Search matching team name or manager's fullname.
  * `name` (String)
  * `managerId` (String)
  * `sortBy` (String, default: `"createdAt"`)
  * `sortOrder` (String: `"asc"` | `"desc"`, default: `"desc"`)
* **Description:** Retrieve a paginated list of teams. Managers are restricted to listing only teams they manage.

### 3. Get Team Details
* **Endpoint:** `GET /teams/:tid`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`)
* **Description:** Retrieve details of a specific team, including full manager and member lists. Managers can only view their own team.

### 4. Update Team
* **Endpoint:** `PATCH /teams/:tid`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`)
* **Request Body (All optional):**
  ```json
  {
    "name": "Updated Team Name",
    "managerId": "new-manager-uuid"
  }
  ```
* **Description:** Update team details. Only admins are permitted to reassign team managers.

### 5. Delete Team
* **Endpoint:** `DELETE /teams/:tid`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`)
* **Description:** Deletes a team. Automatically dissociates team members by clearing their `teamId`.

### 6. Join Team
* **Endpoint:** `GET /teams/join/:tid`
* **Access:** Protected (All Roles)
* **Description:** Allows the authenticated user to join the team specified by `:tid`.

### 7. Exit Team
* **Endpoint:** `GET /teams/exit/:tid`
* **Access:** Protected (All Roles)
* **Description:** Allows the authenticated user to exit the team specified by `:tid` (sets their `teamId` to null).

---

## ⏱️ Sessions (`/sessions`)

Manages daily sessions for tracking productivity logs and uploads.

### 1. Create Session
* **Endpoint:** `POST /sessions`
* **Access:** Protected (Roles: `ADMIN`, `USER`)
* **Request Body:**
  ```json
  {
    "dateStamp": "2026-06-02"
  }
  ```
* **Description:** Create or start a tracking session for a specific day (`YYYY-MM-DD`). A user can have at most one session per day.

### 2. Query Sessions
* **Endpoint:** `GET /sessions`
* **Access:** Protected (All Roles)
* **Query Parameters (All optional):**
  * `page` (Number, default: 1)
  * `limit` (Number, default: 10)
  * `search` (String)
  * `userId` (String)
  * `sortBy` (String, default: `"createdAt"`)
  * `sortOrder` (String: `"asc"` | `"desc"`, default: `"desc"`)
* **Description:** Retrieve paginated sessions. Access restrictions apply matching the target user.

### 3. Get Session Details
* **Endpoint:** `GET /sessions/:id`
* **Access:** Protected (All Roles)
* **Description:** Retrieve details of a specific session.

### 4. Delete Session
* **Endpoint:** `DELETE /sessions/:id`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`)
* **Description:** Delete a tracking session.

---

## 📈 Activities (`/activites`)

Tracks time-series logs of software app usage metrics.

### 1. Sync Batch Sessions
* **Endpoint:** `POST /activites/sync-batch`
* **Access:** Protected (Roles: `ADMIN`, `USER`)
* **Request Body:**
  ```json
  {
    "sessions": [
      {
        "appName": "Visual Studio Code",
        "start": "2026-06-02T10:00:00.000Z",
        "end": "2026-06-02T10:30:00.000Z",
        "durationMs": 1800000,
        "localDate": "2026-06-02"
      }
    ]
  }
  ```
* **Description:** Syncs a batch of app session usage events for the current user.

### 2. Get Daily Dashboard
* **Endpoint:** `GET /activites/dashboard/today:userId`
* **Access:** Protected (All Roles)
* **Query Parameters:**
  * `date` (String, optional): Target ISO-8601 date string. Defaults to today's date.
* **Description:** Retrieves daily activity stats for the specified user ID. Managers can view their members, and users can view their own dashboard.

### 3. Get Weekly Dashboard
* **Endpoint:** `GET /activites/week/:userId`
* **Access:** Protected (All Roles)
* **Query Parameters:**
  * `date` (String, optional): Target ISO-8601 date string. Defaults to today's date.
* **Description:** Retrieves weekly aggregated activity metrics for the specified user.

---

## 📝 Logs (`/logs`)

Deeply nested application tracking logs linked to daily sessions.

### 1. Create Log Entry
* **Endpoint:** `POST /logs`
* **Access:** Protected (Roles: `ADMIN`, `USER`)
* **Request Body:**
  ```json
  {
    "action": "Opened browser",
    "sessionId": "session-uuid",
    "duration": 60
  }
  ```
* **Description:** Creates an action log entry linked to an active tracking session.

### 2. Find All Logs for Session
* **Endpoint:** `GET /logs`
* **Access:** Protected (All Roles)
* **Query Parameters:**
  * `sessionID` (String, required): Target session UUID.
* **Description:** Retrieve all log entries belonging to a given session.

### 3. Delete Log Entry
* **Endpoint:** `DELETE /logs/:id`
* **Access:** Protected (Roles: `ADMIN`, `MANAGER`)
* **Description:** Delete a specific log entry.

---

## 📁 Uploads (`/uploads`)

Manages file attachments, screenshots, or logs linked to tracking sessions.

### 1. Upload File
* **Endpoint:** `POST /uploads`
* **Access:** Protected (Roles: `ADMIN`, `USER`)
* **Query Parameters:**
  * `sessionId` (String, required): The target session ID.
* **Request Body:** Multipart Form Data with a `file` field (max file size 5MB).
* **Description:** Uploads a file linked to the target session.

### 2. Query Uploads
* **Endpoint:** `GET /uploads`
* **Access:** Protected (All Roles)
* **Query Parameters (All optional):**
  * `page` (Number, default: 1)
  * `limit` (Number, default: 10)
  * `search` (String): Search keyword matching filenames.
  * `sessionId` (String)
  * `sortBy` (String, default: `"createdAt"`)
  * `sortOrder` (String: `"asc"` | `"desc"`, default: `"desc"`)
* **Description:** Retrieves paginated uploads. Access limits apply based on owner of the session.

### 3. Find Upload Metadata
* **Endpoint:** `GET /uploads/:id`
* **Access:** Protected (All Roles)
* **Description:** Get metadata details of a specific uploaded file.

### 4. Delete Uploaded File
* **Endpoint:** `DELETE /uploads/:id`
* **Access:** Protected (All Roles)
* **Description:** Deletes the upload and its metadata from the system.
