
# Fix "Buscar da API" and Add Filters

## Problem
The WAHA API returns groups as an **object** (keyed by group ID), not an array. The current code does `for (const g of result.groups)` which silently fails on objects since objects are not iterable with `for...of`. Additionally, no filters (limit, search) are passed to the WAHA API.

## Changes

### 1. Edge Function (`supabase/functions/send-whatsapp-message/index.ts`)

- **Convert object response to array**: After parsing the WAHA response, detect if it's an object (not array) and convert using `Object.values(data)`.
- **Pass filters to WAHA**: Accept `limit` and `exclude` parameters from the frontend and forward them as query params to the WAHA API endpoint (`GET /api/{session}/groups?limit=X&exclude=participants`).
- **Exclude participants by default** to reduce response size (not needed for group listing).

### 2. Frontend (`src/lib/evolution-api.ts`)

- Update `fetchEvolutionGroups()` to accept optional filter parameters: `limit`.
- Pass these filters in the request body to the edge function.

### 3. Frontend (`src/pages/WhatsAppSettings.tsx`)

- **Add filter UI** above the "Buscar da API" button:
  - **Limite de grupos**: number input (default 50) controlling max groups returned from WAHA.
- **Fix group iteration**: Add a safety check — if `result.groups` is an object, convert to array with `Object.values()` before iterating.
- After fetching, show a toast with how many groups were found vs. imported.

## Technical Details

### WAHA Response Format (object, not array)
```text
{
  "120363420014791829@g.us": { "id": "...", "subject": "OPORTUNIDADE..." },
  "120363291010318513@g.us": { "id": "...", "subject": "MEDEIROS VAPE" }
}
```

### Conversion logic (edge function)
```text
let groups = data;
if (data && !Array.isArray(data) && typeof data === 'object') {
  groups = Object.values(data);
}
return { success: true, groups };
```

### Files to modify
- `supabase/functions/send-whatsapp-message/index.ts` — convert object to array, pass filters
- `src/lib/evolution-api.ts` — accept and pass filter params
- `src/pages/WhatsAppSettings.tsx` — add limit input, safety conversion

### No database changes needed
