# Pulse

> A lightweight full-stack social media platform inspired by X (formerly Twitter), built with PHP, MySQL, React, and Vite.

Pulse is a university project created to demonstrate practical full-stack web development. It combines a PHP REST API with a React frontend and includes authentication, social interactions, database design, role-based permissions, and automated API testing.

## Project Context

Pulse was developed as a university portfolio project with a focus on:

- Designing and consuming a RESTful API
- Building a relational MySQL data model
- Implementing session-based authentication
- Integrating a React frontend with a PHP backend
- Applying authorization rules for regular users and administrators
- Validating application behavior with automated smoke tests

## Features

- User registration and login
- HTTP-only session-cookie authentication
- Username validation using lowercase letters, numbers, and underscores
- Tweet creation and feed display
- Like and unlike actions
- User profiles with editable profile information
- Follow and unfollow functionality
- User search
- Role-based permissions for regular users and administrators
- Admin tweet deletion and tweet clearing
- Responsive React and Vite frontend
- PHP API smoke tests and PHP syntax validation

## Tech Stack

| Area        | Technologies                                 |
| ----------- | -------------------------------------------- |
| Frontend    | React, React Router, Vite, Tailwind CSS      |
| Backend     | PHP, PDO, REST-style API, PHP sessions       |
| Database    | MySQL, InnoDB, foreign keys, indexed queries |
| Development | XAMPP, Node.js, npm, cURL                    |

## Application Structure

```text
Pulse/
├── backend/
│   ├── config/           Database configuration
│   ├── controllers/      Request and business logic
│   ├── middleware/       Authentication middleware
│   ├── models/           Database access models
│   ├── public/uploads/   User-uploaded profile assets
│   ├── routes/           API route definitions
│   └── utils/            Responses and validation helpers
├── database/
│   ├── migrations/
│   └── schema.sql        Database schema and seed accounts
├── frontend/
│   ├── pages/            Application pages
│   └── src/              React entry point, router, and styles
├── tests/                API smoke tests
├── package.json          Root verification scripts
└── README.md
```

## Getting Started

### Prerequisites

- XAMPP with Apache and MySQL
- PHP with PDO MySQL and cURL enabled
- Node.js and npm

### 1. Clone the repository

Place the project inside the XAMPP `htdocs` directory:

```text
xampp/
└── htdocs/
    └── Pulse/
```

### 2. Configure the database

Create a MySQL database, then import:

```text
database/schema.sql
```

The schema creates all required tables, adds role-based access control, and seeds development accounts.

### 3. Configure the backend

Copy the example environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Update the database settings in `backend/.env`:

```dotenv
DB_HOST=localhost
DB_NAME=your_database
DB_USER=your_username
DB_PASS=your_password
```

### 4. Install frontend dependencies

```powershell
npm --prefix frontend install
```

### 5. Start the application

Start Apache and MySQL in XAMPP, then run the frontend development server:

```powershell
npm --prefix frontend run dev
```

Open the local Vite URL displayed in the terminal. The Vite development server proxies `/Pulse/backend` requests to Apache.

## Development Accounts

The schema includes development-only accounts for local testing:

| Email               | Password   | Role  |
| ------------------- | ---------- | ----- |
| `test@example.com`  | `password` | User  |
| `admin@example.com` | `password` | Admin |

Change or remove these accounts before deploying the application publicly.

## Testing and Verification

Run frontend linting and the production build from the repository root:

```powershell
npm run check
```

Validate PHP syntax with the XAMPP PHP executable:

```powershell
Get-ChildItem backend,tests -Recurse -Filter *.php |
ForEach-Object { & C:\xampp\php\php.exe -l $_.FullName }
```

With Apache, MySQL, and the configured database running, execute the API smoke test:

```powershell
& C:\xampp\php\php.exe tests\api_test.php
```

The smoke test covers authentication, registration, tweet creation, feed retrieval, following, likes, ownership checks, and admin deletion permissions. It creates temporary test data.

## API

The API base path is:

```text
/Pulse/backend/index.php/api
```

Authentication is handled with PHP session cookies. Main endpoint groups include:

- `/register`, `/login`, `/logout`, and `/me`
- `/tweets` and `/tweets/{id}`
- `/tweets/{id}/like`
- `/users/{id}` and `/users/username/{username}`
- `/users/{id}/follow`
- `/users/{id}/followers` and `/users/{id}/following`
- `/search`

## Security Notes

Do not commit any of the following:

- `backend/.env`
- Database credentials
- Session cookies or cookie jars
- Private uploaded files

For deployment, use HTTPS, enable secure session cookies, use a dedicated non-root database account, and replace the seeded development credentials.

## Future Improvements

- Automated CI/CD pipeline
- Docker-based development setup
- Pagination and infinite scrolling in the frontend
- Improved API error presentation in the UI
- Image upload validation and storage hardening
- Production deployment configuration

## License

This project was created for educational and portfolio purposes.
