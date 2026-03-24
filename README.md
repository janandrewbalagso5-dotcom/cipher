# Cipher Login

A small Node.js and Express login app that uses a Caesar cipher on the client side and stores user credentials in MySQL with bcrypt hashes.

## Project layout

- `cipher/` - application source
- `cipher/public/` - frontend files
- `cipher/routes/` - auth routes
- `cipher/database.sql` - MySQL schema and seed data

## Requirements

- Node.js
- MySQL

## Setup

1. Open the app folder:

```powershell
cd cipher
```

2. Install dependencies:

```powershell
npm install
```

3. Create a `.env` file in `cipher/` with values like:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cipher_login
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
MAX_ATTEMPTS=5
LOCKOUT_MINUTES=15
```

4. Create the database by running `cipher/database.sql` in MySQL.

## Run

Start the app:

```powershell
cd cipher
npm start
```

For development with auto-reload:

```powershell
cd cipher
npm run dev
```

Then open `http://localhost:3000`.

## Features

- User registration and login
- Caesar cipher password transform
- bcrypt password hashing
- MySQL-backed users and login audit log
- Login attempt tracking and temporary lockout

## Notes

- `cipher/node_modules/` is currently present in the workspace, but it is now ignored by Git.
- The database seed file includes demo users and example hashes; regenerate credentials before using this in production.
