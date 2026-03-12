# Workflow

## Development
To start the local development environment (both frontend and backend):
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend Proxy: `http://localhost:3001`

## Testing
- Manual testing: Verify tile loading on the map and attribute fetching (FeatureInfo).
- Check `server/index.js` for proxy errors in the console.

## Deployment
### Frontend
Deploy to GitHub Pages:
```bash
npm run deploy
```

### Backend
Backend is deployed automatically to Vercel upon push to the main branch (or via the Vercel CLI).
```bash
vercel --prod
```
