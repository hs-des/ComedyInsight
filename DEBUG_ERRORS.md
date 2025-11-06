# Debug Guide for 500 Errors

## Steps to Identify the Error

### 1. Check Server Console Logs
When you access the users or subscriptions page, check your server console (where you ran `npm start` or `docker-compose up`). You should now see detailed logs like:

```
[GET /api/admin/users] Request received
[AUTH] Verifying token...
[AUTH] Token verified successfully
[GET /api/admin/users] Attempting database query...
```

### 2. Use the Debug Endpoint
Open your browser and go to:
```
http://localhost:3000/api/admin/debug/db-test
```

**Important:** You need to be logged in (have a valid JWT token). Open your browser's Developer Tools (F12), go to the Network tab, find any request to `/api/admin/*`, and copy the `Authorization` header value.

Then use it in a tool like Postman or curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/admin/debug/db-test
```

This will tell you:
- If the database connection works
- If the `users` table exists
- If the `subscriptions` table exists
- What columns exist in the `users` table

### 3. Check Browser Console
Open your browser's Developer Tools (F12) and check:
- **Console tab**: Look for any JavaScript errors
- **Network tab**: Click on the failed request (`/api/admin/users` or `/api/admin/subscriptions`) and check:
  - **Headers**: See the request headers
  - **Response**: See the actual error message returned
  - **Preview**: See the formatted error response

### 4. Common Issues and Solutions

#### Issue 1: Table doesn't exist
**Error in logs:** `relation "users" does not exist` or `relation "subscriptions" does not exist`

**Solution:** Run the database migration scripts to create the tables.

#### Issue 2: Column doesn't exist
**Error in logs:** `column "deleted_at" does not exist` or similar

**Solution:** The code should automatically handle this, but if not, you may need to add the missing column or update the query.

#### Issue 3: Database connection failed
**Error in logs:** `Connection refused` or `timeout`

**Solution:** Check your database connection settings in `.env` file and ensure the database is running.

#### Issue 4: Authentication failed
**Error in logs:** `[AUTH] Token verification failed`

**Solution:** Make sure you're logged in. Try logging out and logging back in.

### 5. What to Share

When reporting the error, please share:

1. **Server console logs** - Copy the entire error output from your server console
2. **Browser Network tab** - Screenshot or copy the error response from the Network tab
3. **Debug endpoint response** - The JSON response from `/api/admin/debug/db-test`
4. **Database status** - Are you using Docker? Is the database running?

### 6. Quick Test

Run this in your terminal (replace YOUR_TOKEN with your actual JWT token):

```bash
# Test users endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/users

# Test subscriptions endpoint  
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/subscriptions

# Test debug endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/debug/db-test
```

This will show you the exact error message.

