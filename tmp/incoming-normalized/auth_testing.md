# KRIDANGAN Admin Auth Testing Playbook

## 1. MongoDB verification

Confirm only the configured admin is active and its password is stored as a bcrypt hash:

```javascript
use test_database
db.admins.find({}, {_id: 0, username: 1, active: 1, password_hash: 1}).pretty()
```

Expected:
- `nxtgen` is active.
- Superseded admin accounts are inactive.
- `password_hash` begins with `$2b$`.
- No plaintext password is stored in MongoDB.

## 2. API verification

Use the external URL from `frontend/.env`.

```bash
curl -c /tmp/admin-cookies.txt -X POST "$REACT_APP_BACKEND_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"nxtgen","password":"Millionmack@2611"}'

curl -b /tmp/admin-cookies.txt "$REACT_APP_BACKEND_URL/api/admin/me"
```

Expected:
- Login returns `{ "username": "nxtgen" }` and sets the `kridangan_admin` httpOnly cookie.
- `/api/admin/me` returns the same username with the cookie.
- Previous credentials return HTTP 401.
- A cookie issued before the JWT secret rotation returns HTTP 401.

## 3. Browser verification

- Open `/admin/login`.
- Sign in with the credentials in `/app/memory/test_credentials.md`.
- Confirm the dashboard loads and displays `nxtgen`.
- Log out and confirm the dashboard redirects back to `/admin/login`.