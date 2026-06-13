# TeamFocus Server API Documentation

All API endpoints are prefixed with the base path defined in the server configuration (typically `/api/v1` or root `/`).

---

## 🔑 Authentication (`/auth`)

Handles user registration, login, and token verification.

### 1. Signup
* **Endpoint:** `POST /auth/signup`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Description:** Registers a new user and returns an access token with user details.

### 2. Login
* **Endpoint:** `POST /auth/login`
* **Access:** Public
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
* **Access:** Public
* **Query Parameters:**
  * `token` (String, required): JWT token to verify.
* **Description:** Verifies the validity of a JWT token and returns the decoded user payload.

---

## 👤 Users (`/users`)

Provides user profile management. Access is protected using role and ownership rules.

### 1. Create User
* **Endpoint:** `POST /users`
* **Access:** Protected (Role: `ADMIN`)
* **Request Body:**
  ```json
  {
    "fullname": "Jane Doe",
    "email": "jane@example.com",
    "password": "anotherpassword123",
    "imageUrl": "https://example.com/image.png"
  }
  ```
* **Description:** Admin-only endpoint to create a new user.

### 2. Query Users
* **Endpoint:** `GET /users`
* **Access:** Protected (Role: `ADMIN`)
* **Query Parameters (optional):**
  * `page` (Number, default: 1)
  * `limit` (Number, default: 10)
  * `search` (String)
  * `fullname` (String)
  * `email` (String)
  * `role` (String: `ADMIN` | `MANAGER` | `USER`)
  * `sortBy` (String)
  * `sortOrder` (String: `asc` | `desc`)
* **Description:** Retrieve a paginated list of users.

### 3. Get User Details
* **Endpoint:** `GET /users/:id`
* **Access:** Protected (`ADMIN`, `MANAGER`, `USER`)
* **Description:** Retrieve a specific user. Non-admins may only access their own profile. Managers may access users in teams they manage.

### 4. Update User
* **Endpoint:** `PATCH /users/:id`
* **Access:** Protected (`ADMIN`, `MANAGER`, `USER`)
* **Request Body (optional):**
  ```json
  {
    "fullname": "Updated Name",
    "email": "updated@example.com",
    "role": "MANAGER",
    "imageUrl": "https://example.com/new-image.png"
  }
  ```
* **Description:** Update allowed user fields.

### 5. Delete User
* **Endpoint:** `DELETE /users/:id`
* **Access:** Protected (`ADMIN`, `MANAGER`, `USER`)
* **Description:** Delete a user profile.

---

## 👥 Teams (`/teams`)

Manages teams, managers, and team membership.

### 1. Create Team
* **Endpoint:** `POST /teams`
* **Access:** Protected (`ADMIN`, `MANAGER`)
* **Request Body:**
  ```json
  {
    "name": "Team Alpha",
    "managerId": "m-1234-5678"
  }
  ```
* **Response:** Newly created team object with manager details
  ```json
  {
    "id": "team-uuid-1234",
    "name": "Team Alpha",
    "managerId": "manager-uuid-5678",
    "createdAt": "2026-06-11T10:00:00Z",
    "updatedAt": "2026-06-11T10:00:00Z",
    "manager": {
      "id": "manager-uuid-5678",
      "fullname": "John Manager",
      "email": "john.manager@example.com",
      "role": "MANAGER",
      "imageUrl": "https://example.com/image.png"
    }
  }
  ```
* **Description:** Create a new team.

### 2. Query Teams
* **Endpoint:** `GET /teams`
* **Access:** Protected (`ADMIN`, `MANAGER`)
* **Query Parameters (optional):**
  * `page` (Number, default: 1)
  * `limit` (Number, default: 10)
  * `search` (String)
  * `name` (String)
  * `managerId` (String)
  * `sortBy` (String)
  * `sortOrder` (String: `asc` | `desc`)
* **Response:** Paginated team list with metadata
  ```json
  {
    "data": [
      {
        "id": "team-uuid-1234",
        "name": "Team Alpha",
        "managerId": "manager-uuid-5678",
        "createdAt": "2026-06-02T10:00:00Z",
        "updatedAt": "2026-06-11T15:30:00Z",
        "manager": {
          "id": "manager-uuid-5678",
          "fullname": "John Manager",
          "email": "john.manager@example.com",
          "role": "MANAGER",
          "imageUrl": "https://example.com/image.png"
        },
        "_count": {
          "members": 5
        }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```
* **Description:** Retrieve a paginated list of teams.

### 3. Get Team Details
* **Endpoint:** `GET /teams/:tid`
* **Access:** Protected (`ADMIN`, `MANAGER`)
* **Response:** Team object with manager and all members
  ```json
  {
    "id": "team-uuid-1234",
    "name": "Team Alpha",
    "managerId": "manager-uuid-5678",
    "createdAt": "2026-06-02T10:00:00Z",
    "updatedAt": "2026-06-11T15:30:00Z",
    "manager": {
      "id": "manager-uuid-5678",
      "fullname": "John Manager",
      "email": "john.manager@example.com",
      "role": "MANAGER",
      "imageUrl": "https://example.com/image.png"
    },
    "members": [
      {
        "id": "user-uuid-1001",
        "fullname": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "USER",
        "imageUrl": "https://example.com/jane.png"
      },
      {
        "id": "user-uuid-1002",
        "fullname": "Bob Smith",
        "email": "bob.smith@example.com",
        "role": "USER",
        "imageUrl": "https://example.com/bob.png"
      }
    ]
  }
  ```
* **Description:** Retrieve details for a specific team.

### 4. Update Team
* **Endpoint:** `PATCH /teams/:tid`
* **Access:** Protected (`ADMIN`, `MANAGER`)
* **Request Body (optional):**
  ```json
  {
    "name": "Updated Team Name",
    "managerId": "new-manager-uuid"
  }
  ```
* **Response:** Updated team object with manager details
  ```json
  {
    "id": "team-uuid-1234",
    "name": "Updated Team Name",
    "managerId": "manager-uuid-5678",
    "createdAt": "2026-06-02T10:00:00Z",
    "updatedAt": "2026-06-11T15:30:00Z",
    "manager": {
      "id": "manager-uuid-5678",
      "fullname": "John Manager",
      "email": "john.manager@example.com",
      "role": "MANAGER",
      "imageUrl": "https://example.com/image.png"
    }
  }
  ```
* **Description:** Update team metadata.

### 5. Delete Team
* **Endpoint:** `DELETE /teams/:tid`
* **Access:** Protected (`ADMIN`, `MANAGER`)
* **Response:** Deleted team object
  ```json
  {
    "id": "team-uuid-1234",
    "name": "Team Alpha",
    "managerId": "manager-uuid-5678",
    "createdAt": "2026-06-02T10:00:00Z",
    "updatedAt": "2026-06-11T15:30:00Z"
  }
  ```
* **Description:** Delete a team.

### 6. Join Team
* **Endpoint:** `GET /teams/join/:tid`
* **Access:** Protected (all authenticated users)
* **Query Parameters (optional):**
  * `userId` (String): optional override for the target user.
* **Response:** Success message with team ID
  ```json
  {
    "message": "Successfully joined the team",
    "teamId": "team-uuid-1234"
  }
  ```
* **Description:** Join the specified team.

### 7. Exit Team
* **Endpoint:** `GET /teams/exit/:tid`
* **Access:** Protected (all authenticated users)
* **Query Parameters (optional):**
  * `userId` (String): optional override for the target user.
* **Response:** Success message
  ```json
  {
    "message": "Successfully exited the team"
  }
  ```
* **Description:** Leave the specified team.

---

## ⏱️ Sessions (`/sessions`)

Tracks daily user sessions.

### 1. Create Session
* **Endpoint:** `POST /sessions`
* **Access:** Protected (`ADMIN`, `USER`)
* **Request Body:**
  ```json
  {
    "dateStamp": "2026-06-02"
  }
  ```
* **Description:** Create a session entry for a date.

### 2. Query Sessions
* **Endpoint:** `GET /sessions`
* **Access:** Protected (all authenticated users)
* **Query Parameters (optional):**
  * `page` (Number, default: 1)
  * `limit` (Number, default: 10)
  * `search` (String)
  * `userId` (String)
  * `sortBy` (String)
  * `sortOrder` (String: `asc` | `desc`)
* **Description:** Retrieve paginated session records.

### 3. Get Session Details
* **Endpoint:** `GET /sessions/:id`
* **Access:** Protected (all authenticated users)
* **Description:** Retrieve a specific session by ID.

### 4. Delete Session
* **Endpoint:** `DELETE /sessions/:id`
* **Access:** Protected (`ADMIN`, `MANAGER`)
* **Description:** Delete a session.

---

## 📤 Uploads (`/uploads`)

Handles session-related file attachments.

### 1. Upload File
* **Endpoint:** `POST /uploads`
* **Access:** Protected (`ADMIN`, `USER`)
* **Request:** `multipart/form-data`
  * `file`: file to upload
  * `sessionId`: string query parameter
* **Notes:** Max file size is 5 MB.
* **Description:** Upload a file and associate it with a session.

### 2. Query Uploads
* **Endpoint:** `GET /uploads`
* **Access:** Protected (all authenticated users)
* **Query Parameters (optional):**
  * `page` (Number, default: 1)
  * `limit` (Number, default: 10)
  * `search` (String)
  * `sessionId` (String)
  * `sortBy` (String)
  * `sortOrder` (String: `asc` | `desc`)
* **Description:** Retrieve uploaded files.

### 3. Get Upload Details
* **Endpoint:** `GET /uploads/:id`
* **Access:** Protected (all authenticated users)
* **Description:** Retrieve a specific upload by its ID.

### 4. Delete Upload
* **Endpoint:** `DELETE /uploads/:id`
* **Access:** Protected (all authenticated users)
* **Description:** Delete an upload.

---

## 📝 Logs (`/logs`)

Tracks session activity logs.

### 1. Create Log
* **Endpoint:** `POST /logs`
* **Access:** Protected (`ADMIN`, `USER`)
* **Request Body:**
  ```json
  {
    "action": "Opened browser",
    "sessionId": "s-1234-5678",
    "duration": 60
  }
  ```
* **Description:** Create a new session log entry.

### 2. Query Logs
* **Endpoint:** `GET /logs`
* **Access:** Protected (all authenticated users)
* **Query Parameters:**
  * `sessionID` (String)
* **Description:** Retrieve logs for a given session.

### 3. Delete Log
* **Endpoint:** `DELETE /logs/:id`
* **Access:** Protected (`ADMIN`, `MANAGER`)
* **Description:** Delete a log entry.

---

## 📈 Activities (`/activites`)

Tracks time-series app usage and analytics.

### 1. Sync Batch Sessions
* **Endpoint:** `POST /activites/sync-batch`
* **Access:** Protected (`ADMIN`, `USER`)
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
* **Description:** Syncs a batch of app usage sessions for the current user.

### 2. Get Daily Dashboard
* **Endpoint:** `GET /activites/dashboard/today/:userId`
* **Access:** Protected (all authenticated users)
* **Query Parameters (optional):**
  * `date` (String): ISO date to target, defaults to today.
* **Response:**
  ```json
  [
    {
      "dayName": "T",
      "fullName": "Tuesday",
      "dateStamp": "2026-06-02",
      "totalMinutes": 30,
      "totalSeconds": 1800,
      "hasActivity": true
    }
  ]
  ```
* **Description:** Retrieve daily dashboard metrics for a user.

### 3. Get Weekly Dashboard
* **Endpoint:** `GET /activites/week/:userId`
* **Access:** Protected (all authenticated users)
* **Query Parameters (optional):**
  * `date` (String): ISO date to target, defaults to today.
* **Response:**
  ```json
  [
    {
      "dayName": "T",
      "fullName": "Tuesday",
      "totalMinutes": 30,
      "apps": [
        {
          "id": "app-visual-studio-code",
          "name": "Visual Studio Code",
          "category": "Productivity",
          "minutes": 30,
          "color": "bg-indigo-500"
        }
      ],
      "hourly": [
        {
          "hour": 0,
          "Productivity": 0,
          "Entertainment": 0,
          "Utilities": 0
        },
        {
          "hour": 10,
          "Productivity": 30,
          "Entertainment": 0,
          "Utilities": 0
        }
      ]
    }
  ]
  ```
* **Description:** Retrieve weekly activity metrics for a user.

### 4. Get Team Analytics
* **Endpoint:** `GET /activites/analytics/7days/:tid`
* **Access:** Protected (`ADMIN`, `MANAGER`)
* **Query Parameters:**
  * `date` (String, required): ISO date used as the reference date for the 7-day window.
* **Response:**
  ```json
  {
    "teamTotal": [
      {
        "day": "MON",
        "duration": 5400
      },
      {
        "day": "TUE",
        "duration": 4200
      }
    ],
    "membersBreakdown": [
      {
        "userId": "u-1234-5678",
        "userName": "Jane Doe",
        "data": [
          {
            "day": "MON",
            "duration": 1800
          },
          {
            "day": "TUE",
            "duration": 2400
          }
        ]
      }
    ]
  }
  ```
* **Description:** Retrieve team analytics for the past 7 days.
