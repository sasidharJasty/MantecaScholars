# Manteca Scholars

React/Vite frontend with a Django REST Framework backend.

## Local testing mode

1. Install frontend dependencies:

   ```sh
   npm install
   ```

2. Apply Django migrations:

   ```sh
   npm run backend:migrate
   ```

3. Start the backend in Terminal 1:

   ```sh
   npm run backend:dev
   ```

4. Start the React frontend in Terminal 2:

   ```sh
   npm run dev
   ```

Open [http://localhost:8080](http://localhost:8080). In local mode, Vite proxies `/api` requests to Django at `http://localhost:8000`, so no frontend API URL is required.

Run the automated checks with:

```sh
npm run check:integration
```

## Django admin and password reset

Open `http://localhost:8000/admin/` locally and sign in with the Admin III account. Password-reset requests are available from the React Auth page. In local mode, the reset email is printed in the Django terminal; in production, configure the SMTP variables in `.env.production.example`.

To replace all users with a new highest-tier administrator, use the guarded command:

```sh
backend/venv/bin/python backend/manage.py reset_users_and_create_admin --email admin@example.com --confirm
```

It prompts for the password securely. This deletes all users and user-owned records, so take a database backup first.

## Production mode

Copy `.env.production.example` to the deployment environment’s frontend settings and replace the example values:

```sh
VITE_API_URL=https://your-django-api.example.com/api
```

Then build the frontend:

```sh
npm run build
```

The deployed React app sends requests directly to `VITE_API_URL`. Configure the Django environment with `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, and a strong `DJANGO_SECRET_KEY`.

The production Django process should run migrations before startup:

```sh
python manage.py migrate
```

For deployment, run Django behind a production WSGI server/reverse proxy and serve the generated `dist/` frontend from your frontend host.

## Supabase data migration

If the local `.env` contains the read-only migration credentials, import the legacy data with:

```sh
backend/venv/bin/python backend/manage.py import_supabase
```

The command is guarded against overwriting a non-empty Django database. Use `--replace` only after taking a backup.
