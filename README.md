# Easy Auth

![Project Diagram](ProjectImage.png)


A production-ready authentication and task management API built with NestJS, featuring JWT-based authentication with refresh tokens, email verification via Resend, role-based access control, and a full CRUD task system.

## Key Highlights

- **Dual JWT Strategy** — Short-lived access tokens (10 min) paired with long-lived refresh tokens (7 days) stored as httpOnly cookies
- **Email Verification & Password Reset** — Powered by Resend, with dev-mode console logging for local development
- **Role-Based Access Control** — `user` and `admin` roles with decorator-driven guard enforcement
- **Rate Limiting** — Endpoint-specific throttling (login: 5/min, forgot-password: 3/min)
- **Auto-generated API Docs** — Swagger/OpenAPI available at `/api/docs`
- **Serverless PostgreSQL** — Neon database with Drizzle ORM for type-safe queries

---

## Tech Stack

| Category         | Technology                          |
| ---------------- | ----------------------------------- |
| Language         | TypeScript (ES2023)                 |
| Framework        | NestJS 11                           |
| Database         | PostgreSQL (Neon Serverless)        |
| ORM              | Drizzle ORM 0.45                    |
| Authentication   | JWT (`@nestjs/jwt`), bcryptjs       |
| Email            | Resend                              |
| Validation       | class-validator, class-transformer  |
| API Documentation| Swagger / OpenAPI (`@nestjs/swagger`)|
| Rate Limiting    | `@nestjs/throttler`                 |
| Package Manager  | pnpm                                |
| Testing          | Jest, Supertest                     |
| Linting          | ESLint, Prettier                    |

---

## Architecture & Flow

### System Architecture

```mermaid
graph TB
    Client[Client Application] -->|HTTP/HTTPS| API[NestJS API Server]
    API -->|JWT Validation| JWTGuard[JWT Auth Guard]
    API -->|Rate Limiting| Throttler[Throttler Guard]
    API -->|Email Sending| Resend[Resend API]
    API -->|SQL Queries| Drizzle[Drizzle ORM]
    Drizzle -->|Neon HTTP Driver| NeonDB[(Neon PostgreSQL)]

    subgraph NestJS Modules
        AuthModule[Auth Module]
        TasksModule[Tasks Module]
        AdminModule[Admin Module]
        UsersModule[Users Module]
    end

    API --> AuthModule
    API --> TasksModule
    API --> AdminModule
    AuthModule --> UsersModule
    TasksModule --> UsersModule
    AdminModule --> UsersModule
    UsersModule --> Drizzle
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Email as Resend

    rect rgb(240, 248, 255)
    Note over C,Email: Registration Flow
    C->>API: POST /api/auth/register {name, email, password}
    API->>API: Hash password (bcrypt, cost 12)
    API->>API: Generate verification token
    API->>DB: INSERT user (isVerified: false)
    API-->>Email: Send verification email
    API-->>C: 200 {message: "Check your email"}
    end

    rect rgb(240, 255, 240)
    Note over C,Email: Email Verification Flow
    C->>API: GET /api/auth/verify-email?token=...
    API->>DB: Find user by verification token
    API->>API: Validate token expiry
    API->>DB: UPDATE user (isVerified: true, clear token)
    API->>API: Generate JWT access + refresh tokens
    API->>DB: Store refresh token hash
    API-->>C: 200 {accessToken, user} + refresh_token cookie
    end

    rect rgb(255, 248, 240)
    Note over C,Email: Login Flow
    C->>API: POST /api/auth/login {email, password}
    API->>DB: Find user by email
    API->>API: Compare password hash
    API->>API: Check isVerified
    API->>API: Generate JWT access + refresh tokens
    API->>DB: Store refresh token hash
    API-->>C: 200 {accessToken, user} + refresh_token cookie
    end

    rect rgb(255, 240, 255)
    Note over C,Email: Token Refresh Flow
    C->>API: POST /api/auth/refresh (cookie: refresh_token)
    API->>API: Verify refresh token JWT
    API->>DB: Find user, compare refresh token hash
    API->>API: Generate new token pair
    API->>DB: Update refresh token hash
    API-->>C: 200 {accessToken} + new refresh_token cookie
    end
```

---

## Project Structure

```
easy-auth/
├── src/
│   ├── main.ts                          # Application entry point, Swagger setup, global pipes/filters
│   ├── app.module.ts                    # Root module importing all feature modules
│   ├── app.controller.ts                # Root health check endpoint (GET /)
│   ├── app.service.ts                   # Root service
│   ├── app.controller.spec.ts           # Unit test for root controller
│   ├── auth/                            # Authentication module (register, login, verify, reset)
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       ├── forgot-password.dto.ts
│   │       └── reset-password.dto.ts
│   ├── tasks/                           # Task CRUD module
│   │   ├── tasks.module.ts
│   │   ├── tasks.controller.ts
│   │   ├── tasks.service.ts
│   │   └── dto/
│   │       └── create-task.dto.ts
│   ├── admin/                           # Admin-only user management
│   │   ├── admin.module.ts
│   │   └── admin.controller.ts
│   ├── users/                           # User data access layer (shared service)
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── db/                              # Database connection and schema
│   │   ├── index.ts                     # Drizzle + Neon client initialization
│   │   └── schema.ts                    # Table definitions (users, tasks)
│   └── common/                          # Shared decorators, guards, filters
│       ├── decorators/
│       │   ├── current-user.decorator.ts
│       │   ├── public.decorator.ts
│       │   └── roles.decorator.ts
│       ├── guards/
│       │   ├── jwt-auth.guard.ts
│       │   └── roles.guard.ts
│       └── filters/
│           └── http-exception.filter.ts
├── test/                                # E2E test files
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── drizzle.config.ts                    # Drizzle Kit configuration
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── eslint.config.mjs
├── .prettierrc
├── .env                                 # Environment variables (not committed)
└── .gitignore
```

---

## Core Functions & API Endpoints

### API Endpoints

All endpoints are prefixed with `/api` (set via `app.setGlobalPrefix('api')`).

#### Auth — `POST /api/auth/register`

Register a new user account. Sends a verification email.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Registration Successful. Please check your email to verify your account"
}
```

---

#### Auth — `GET /api/auth/verify-email`

Verify email address using the token from the verification email. Auto-logs the user in.

**Query Parameters:** `token` (string)

**Response (200):**
```json
{
  "message": "Email verified successfully. you are now logged in",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

#### Auth — `POST /api/auth/login`

Login with email and password. Returns an access token and sets an httpOnly refresh_token cookie.

**Rate Limit:** 5 requests per 60 seconds.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

#### Auth — `POST /api/auth/refresh`

Refresh the access token using the `refresh_token` httpOnly cookie.

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### Auth — `POST /api/auth/logout`

Invalidate the refresh token and clear the cookie. Requires Bearer token.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### Auth — `GET /api/auth/me`

Get the currently authenticated user's profile. Requires Bearer token.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "user",
  "isVerified": true
}
```

---

#### Auth — `POST /api/auth/forgot-password`

Request a password reset email. Always returns the same message regardless of whether the email exists.

**Rate Limit:** 3 requests per 60 seconds.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account with that email exists, a reset link has been sent"
}
```

---

#### Auth — `POST /api/auth/reset-password`

Reset password using the token from the reset email.

**Request:**
```json
{
  "token": "hex-token-from-email",
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful. You can now log in."
}
```

---

#### Tasks — `GET /api/tasks`

Get all tasks for the authenticated user. Requires Bearer token.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Build auth system",
    "description": "Implement JWT with refresh tokens",
    "status": "todo",
    "userId": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

#### Tasks — `POST /api/tasks`

Create a new task. Requires Bearer token.

**Request:**
```json
{
  "title": "Build auth system",
  "description": "Implement JWT with refresh tokens"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Build auth system",
  "description": "Implement JWT with refresh tokens",
  "status": "todo",
  "userId": "uuid",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

#### Tasks — `PATCH /api/tasks/:id`

Update a task. Only the owner can update their tasks. Requires Bearer token.

**Request:**
```json
{
  "title": "Updated title",
  "status": "in_progress"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Updated title",
  "description": "Implement JWT with refresh tokens",
  "status": "in_progress",
  "userId": "uuid",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

---

#### Tasks — `DELETE /api/tasks/:id`

Delete a task. Only the owner can delete their tasks. Requires Bearer token.

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

---

#### Admin — `GET /api/admin/users`

List all users. Requires admin role.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "isVerified": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

#### Admin — `DELETE /api/admin/users/:id`

Delete a user by ID. Requires admin role.

**Response (200):** Empty body (200 OK)

---

### Internal Functions / Services

#### `AuthService` (`src/auth/auth.service.ts`)

| Method | Description |
|---|---|
| `register(dto)` | Hashes password (bcrypt, cost 12), generates verification token, stores user, fires verification email |
| `verifyEmail(token, res)` | Validates token and expiry, marks user verified, generates JWT pair, sets refresh cookie |
| `login(dto, res)` | Validates credentials and email verification status, generates JWT pair, sets refresh cookie |
| `refresh(refreshToken, res)` | Verifies refresh token JWT, compares hash against DB, rotates tokens |
| `logout(userId, res)` | Clears refresh token hash from DB and clears the cookie |
| `forgotPassword(email)` | Generates reset token (1hr expiry), fires reset email |
| `resetPassword(token, newPassword)` | Validates reset token and expiry, hashes new password, clears token |
| `generateTokens(user)` | Internal: signs access and refresh JWTs with separate secrets and expirations |
| `saveRefreshToken(userId, token)` | Internal: hashes refresh token (bcrypt, cost 10) and stores in DB |
| `setRefreshTokenCookie(res, token)` | Internal: sets httpOnly, secure, lax SameSite cookie with 7-day expiry |

#### `UsersService` (`src/users/users.service.ts`)

| Method | Description |
|---|---|
| `findByEmail(email)` | Looks up user by email address |
| `findById(id)` | Looks up user by UUID |
| `findByVerificationToken(token)` | Looks up user by email verification token |
| `findByResetToken(token)` | Looks up user by password reset token |
| `create(data)` | Inserts a new user row |
| `update(id, data)` | Partial update on a user row |
| `findAll()` | Returns all users (admin use) |
| `delete(id)` | Deletes a user by ID (admin use) |

#### `TasksService` (`src/tasks/tasks.service.ts`)

| Method | Description |
|---|---|
| `findAllForUser(userId)` | Returns all tasks belonging to a specific user |
| `create(userId, dto)` | Inserts a new task with the user's ID |
| `update(id, userId, data)` | Updates a task after verifying ownership |
| `delete(id, userId)` | Deletes a task after verifying ownership |

#### `EmailService` (`src/auth/email.service.ts`)

| Method | Description |
|---|---|
| `sendVerificationEmail(email, token)` | Sends verification email via Resend (logs to console in dev mode) |
| `sendResetPasswordEmail(email, token)` | Sends password reset email via Resend (logs to console in dev mode) |

---

## Getting Started (Local Development)

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 9.x
- A **Neon** PostgreSQL database (free tier available at [neon.tech](https://neon.tech))

### Installation

```bash
git clone https://github.com/your-username/easy-auth.git
cd easy-auth
pnpm install
```

### Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env  # if available, otherwise create manually
```

Then fill in the required values. See the [Environment Variables](#environment-variables) section below.

### Database Setup

Push the schema to your Neon database:

```bash
pnpm db:push
```

Other database commands:

```bash
pnpm db:studio      # Open Drizzle Studio (browser-based DB viewer)
pnpm db:generate    # Generate migration files
pnpm db:migrate     # Run pending migrations
```

### Running the App

```bash
# Development (watch mode)
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

The server starts at `http://localhost:3000`. Swagger docs are available at `http://localhost:3000/api/docs`.

---

## Environment Variables

| Variable                | Description                                      | Required | Example Value                              |
| ----------------------- | ------------------------------------------------ | -------- | ------------------------------------------ |
| `DATABASE_URL`          | PostgreSQL connection string (Neon)               | Yes      | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_ACCESS_SECRET`     | Secret key for signing access tokens             | Yes      | `your-64-char-hex-secret`                  |
| `JWT_REFRESH_SECRET`    | Secret key for signing refresh tokens            | Yes      | `your-64-char-hex-secret`                  |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiration duration                 | Yes      | `10m`                                      |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token expiration duration                | Yes      | `7d`                                       |
| `RESEND_API_KEY`        | API key for Resend email service                 | Yes      | `re_xxxxxxxxxxxxxxxx`                      |
| `APP_URL`               | Base URL of the application (used in email links)| Yes      | `http://localhost:3000`                    |
| `PORT`                  | Server port                                      | No       | `3000` (default)                           |
| `NODE_ENV`              | Environment mode (`production` enables secure cookies, emails) | No | `development`                              |

---

## Testing

### Unit Tests

```bash
pnpm run test
```

### E2E Tests

```bash
pnpm run test:e2e
```

### Test Coverage

```bash
pnpm run test:cov
```

### Linting & Formatting

```bash
pnpm run lint       # Lint and auto-fix
pnpm run format     # Format with Prettier
```

> **Note:** Currently only the root `AppController` has a unit test (`src/app.controller.spec.ts`) and the root `GET /` endpoint has an e2e test (`test/app.e2e-spec.ts`). Auth, Tasks, and Admin modules do not yet have dedicated tests.

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing code style
3. Run `pnpm run lint` and `pnpm run format` before committing
4. Run `pnpm run test` to verify nothing is broken
5. Open a pull request with a clear description of the changes

### Commit Convention

Follow conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

---
