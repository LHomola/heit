# HEIT — Housing Estate Issue Tracker

Final year project for BSc (Hons) Contemporary Software Development

Author: Lukas Homola (L00196709), ATU Donegal, 2026

## Quick start

Requirements:

   -> Docker Desktop (or Docker Engine + Compose plugin)

   -> Google Gemini API key (https://aistudio.google.com/apikey) - free tier will suffice for testing

Process:

1. Clone the repo and enter the directory:

   git clone https://github.com/LHomola/heit.git

   cd heit

2. Create the environment file:

   cp .env.example .env

   Open .env and set GEMINI_API_KEY to your own key.
   
3. Start the stack:

   docker compose up -d --build

   (The first run will build the backend image and seed the database)

4. Open the application at http://localhost:5173

## Seeded test accounts:

The database is seeded with these accounts for demo purposes:

Residents:

a@heit.ie

password123

b@heit.ie

password123

Manager:

m@heit.ie

password123

Contractor

c@heit.ie

password123

The database is also seeded with a few example tickets at various stages of resolution.

## Resetting the database:

To start fresh:

docker compose down -v

docker compose up -d

## Inspecting the database

The PostgreSQL instance is exposed on localhost:5432 with these credentials:

heit_user

heit_password

database name: heit

Connect with any PostgreSQL client (DBeaver, pgAdmin, or psql).

## API documentation

While the stack is running, the auto-generated Swagger UI is available at

http://localhost:8000/docs
