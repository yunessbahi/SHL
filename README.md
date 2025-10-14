# Smart Link Hub - Frontend (Next.js)

## Env
Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=https://<your-hf-space>.hf.space
```

## Dev

```
pnpm i # or npm/yarn
pnpm dev
```

## Deploy (Vercel)
- Import this repo in Vercel
- Set the three env vars above for all environments
- Deploy
