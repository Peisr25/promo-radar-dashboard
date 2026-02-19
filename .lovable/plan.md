

# Fix WAHA Connection Test

## Problem
The "Testar Conexao" always returns "Nenhuma sessao encontrada" even though a WAHA session is active. Two likely causes:

1. **Double slash in URL**: The stored `api_url` ends with `/`, and the code appends `/api/sessions`, resulting in `//api/sessions`
2. **Response format mismatch**: The code expects `Array.isArray(data) && data.length > 0`, but WAHA might return the data in a different structure

## Changes

### 1. Edge Function `supabase/functions/send-whatsapp-message/index.ts`

**Fix URL construction** - Strip trailing slashes from `api_url` before building endpoints:
```text
const baseUrl = config.api_url.replace(/\/+$/, '');
```
Apply this to all three actions (test, fetch_groups, send).

**Add debug logging** to the test action so we can see the actual WAHA response:
```text
console.log("Test URL:", url);
console.log("Test response status:", res.status);
console.log("Test response body:", resText.substring(0, 500));
```

**Broaden session detection** - Accept both array and object responses:
```text
const isConnected = res.ok && data != null &&
  (Array.isArray(data) ? data.length > 0 : typeof data === 'object');
```

### 2. No database or frontend changes needed

The frontend and database are working correctly. Only the edge function proxy logic needs adjustment.

## Technical Details

### Files to modify
- `supabase/functions/send-whatsapp-message/index.ts`

### Verification
After deploying, clicking "Testar Conexao" should show "Conexao OK" if the WAHA session is active. The edge function logs will also show the raw WAHA response for further debugging if needed.

