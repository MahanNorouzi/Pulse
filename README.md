# Pulse

Pulse is a small X/Twitter-style social app with a PHP/MySQL API and a React/Vite frontend.

## Requirements

- XAMPP with Apache, MySQL, PHP, PDO MySQL, and cURL enabled
- Node.js and npm

## Setup

1. Clone the repository into the XAMPP `htdocs` directory.
2. Create a MySQL database and import `database/schema.sql`. The schema creates the `role` column and seeds both the test user and admin user.
3. Copy `backend/.env.example` to `backend/.env` and set `DB_NAME`, `DB_USER`, and `DB_PASS`.
4. Install frontend dependencies:

   ```powershell
   npm --prefix frontend install
   ```

5. Start Apache and MySQL in XAMPP.
6. Start the frontend:

   ```powershell
   npm --prefix frontend run dev
   ```

Open the Vite URL shown in the terminal. The frontend proxies `/Pulse/backend` to Apache.

## Verification

Run the frontend checks from the repository root:

```powershell
npm run check
```

Validate PHP syntax with XAMPP PHP:

```powershell
Get-ChildItem backend,tests -Recurse -Filter *.php | ForEach-Object { & C:\xampp\php\php.exe -l $_.FullName }
```

With Apache, MySQL, and the configured database running, execute the API smoke test:

```powershell
& C:\xampp\php\php.exe tests\api_test.php
```

The smoke test creates temporary users and tweets. It uses the seeded accounts `test@example.com` and `admin@example.com`; the password for both is `password`.

## API

The API is available at `/Pulse/backend/index.php/api`. Authentication uses HTTP-only PHP session cookies. Do not commit `backend/.env`, credentials, cookie jars, or uploaded private data.
