# 🚀 AMS Deployment Guide

## 📋 Prerequisites
- GitHub repository with AMS project
- Render account (free)
- Vercel account (free)
- MongoDB Atlas account (free)

## 🔧 Step 1: Backend Deployment (Render)

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `ams-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 3. Add Environment Variables
In Render dashboard → Service → Environment:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## 🌐 Step 2: Frontend Deployment (Vercel)

### 1. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build:prod`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2. Add Environment Variable
In Vercel dashboard → Project → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## 🔄 Step 3: Update URLs

### Update vercel.json
Replace `https://ams-backend.onrender.com` with your actual Render URL:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR_ACTUAL_RENDER_URL.onrender.com/api/$1"
    }
  ]
}
```

## ✅ Step 4: Test Deployment

1. **Backend**: Visit `https://your-backend-url.onrender.com/api/health`
2. **Frontend**: Visit your Vercel URL
3. **Test login** and all features

## 🔧 Troubleshooting

### CORS Issues
- Make sure your Render URL is added to CORS allowed origins
- Check environment variables are set correctly

### Build Issues
- Run `npm run build:prod` locally first
- Check for any build errors

### Database Issues
- Verify MongoDB connection string
- Check if IP is whitelisted in MongoDB Atlas

## 🎯 Success!

Your AMS will be live at:
- **Backend**: `https://your-backend.onrender.com`
- **Frontend**: `https://your-frontend.vercel.app`
