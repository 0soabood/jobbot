# jobbot UI

Frontend package for the `jobbot` app.

This UI is a Vite + React application that talks to the local workspace API exposed by the root `jobbot` package.

## Run locally

1. Install dependencies:
   `npm install`
2. Start the workspace API from the repo root:
   `npm run api:dev`
3. Start the dev server:
   `npm run dev`
4. Build for production:
   `npm run build`

## Notes

- The API client currently lives in `src/lib/api/mock-client.ts`.
- The client talks to `http://localhost:8787/api` by default, or a custom `VITE_JOBBOT_API_URL` if provided.
