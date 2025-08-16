# LOS App - Netlify Deployment Guide

## 🚀 Quick Deploy

### Option 1: Drag & Drop (Easiest)
1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up/Login** with GitHub, GitLab, or email
3. **Drag your entire project folder** to the deploy area
4. **Wait for deployment** (usually 1-2 minutes)
5. **Get your live URL** (e.g., `https://amazing-app-123456.netlify.app`)

### Option 2: Connect GitHub Repository (Recommended)
1. **Push your code to GitHub** (if not already done)
2. **Go to Netlify Dashboard**
3. **Click "New site from Git"**
4. **Choose GitHub** and select your repository
5. **Configure build settings:**
   - **Build command:** Leave empty (static site)
   - **Publish directory:** `.` (root directory)
6. **Click "Deploy site"**

## 📁 Project Structure

Your project is now configured for Netlify with:

```
LOS App/
├── netlify/
│   ├── functions/
│   │   ├── scrape-fixtures.js    # Scrapes fixture data
│   │   ├── scrape-table.js       # Scrapes league table
│   │   └── package.json          # Function dependencies
├── netlify.toml                  # Netlify configuration
├── index.html                    # Main app entry point
├── dashboard.html                # Dashboard page
├── admin.html                    # Admin panel
├── app.js                        # Main app logic
├── style.css                     # Styling
└── ... (other files)
```

## 🔧 Netlify Functions

Your scraper is now converted to Netlify Functions:

- **`/.netlify/functions/scrape-fixtures`** - Scrapes fixture data
- **`/.netlify/functions/scrape-table`** - Scrapes league table

### Function URLs (after deployment):
- `https://your-site.netlify.app/.netlify/functions/scrape-fixtures`
- `https://your-site.netlify.app/.netlify/functions/scrape-table`

## ⚙️ Configuration

### netlify.toml
```toml
[build]
  publish = "."
  command = ""

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

## 🔥 Firebase Configuration

Make sure your Firebase config is set up for production:

1. **Go to Firebase Console**
2. **Add your Netlify domain** to authorized domains
3. **Update security rules** if needed

## 🚀 Deployment Steps

### 1. Deploy to Netlify
- Use drag & drop or connect GitHub repository
- Wait for build to complete

### 2. Configure Environment Variables (if needed)
- Go to Site Settings → Environment Variables
- Add any API keys or configuration

### 3. Test Functions
- Visit your site URL
- Go to Admin panel
- Test the scraper functions

### 4. Custom Domain (Optional)
- Go to Site Settings → Domain management
- Add custom domain

## 🐛 Troubleshooting

### Functions Not Working
1. **Check Netlify Functions tab** in your site dashboard
2. **Verify function URLs** are correct
3. **Check browser console** for errors

### CORS Issues
- Functions include CORS headers automatically
- Should work from any domain

### Build Errors
1. **Check build logs** in Netlify dashboard
2. **Verify file structure** matches expected layout
3. **Ensure all files** are committed to repository

## 📊 Monitoring

### Netlify Dashboard
- **Function logs** - View execution logs
- **Analytics** - Track usage and performance
- **Deploy logs** - Monitor build process

### Function Limits
- **Free tier:** 125,000 function invocations/month
- **Timeout:** 10 seconds per function
- **Memory:** 1024MB per function

## 🔄 Updates

To update your deployed site:
1. **Make changes** to your code
2. **Commit and push** to GitHub (if using Git deployment)
3. **Or drag and drop** updated folder to Netlify
4. **Automatic deployment** will trigger

## 🎉 Success!

Once deployed, your app will be available at:
`https://your-site-name.netlify.app`

The scraper functions will work automatically, and you can share the link with anyone! 