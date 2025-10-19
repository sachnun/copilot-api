# Railway Deployment Guide

## Environment Variables

Set these in Railway dashboard under your service settings:

### Required
- `GH_TOKEN` - Your GitHub token (generate using `bun run auth` locally first)

### Optional
- `PORT` - Railway will set this automatically (default: 4141)
- `ACCOUNT_TYPE` - "individual", "business", or "enterprise" (default: individual)

## Deployment Steps

1. **Generate GitHub Token locally** (one-time setup):
   ```bash
   bun run auth
   # This will save your token to ~/.local/share/copilot-api/github-token
   # Copy the token content for Railway
   ```

2. **Deploy to Railway**:
   - Connect your GitHub repository to Railway
   - Railway will automatically detect the Dockerfile
   - Set environment variable `GH_TOKEN` in Railway dashboard

3. **Access your deployed API**:
   - Railway will provide a public URL like `https://your-app.railway.app`
   - Test with: `curl https://your-app.railway.app/v1/models`

## Additional Options

You can pass additional flags via Railway's service settings if needed:
- Set `RAILWAY_RUN_COMMAND` to override the default command
- Example: `bun run dist/main.js start -g $GH_TOKEN -a business`
