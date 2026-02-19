

# Fix "Body is unusable" Error on Buscar da API

## Problem
The edge function reads `req.json()` on line 60 to extract `action`, which **consumes** the request body. Then inside the `fetch_groups` block (line 106), it tries `req.clone().then(r => r.json())` to read `limit` -- but the body is already consumed, so Deno throws `"Body is unusable"`.

## Solution
Parse the body **once** into a variable and reuse it. No need to call `req.json()` a second time.

## Changes

### File: `supabase/functions/send-whatsapp-message/index.ts`

- **Line 60**: Change destructuring to capture the full parsed body:
  ```
  const body = await req.json();
  const { action, group_id, text } = body;
  ```

- **Line 106**: Replace `await req.clone().then(r => r.json()).catch(() => ({}))` with simply reading from the already-parsed `body`:
  ```
  const { limit = 50 } = body;
  ```

That is the only change needed -- two lines modified in the edge function. No frontend changes required.
