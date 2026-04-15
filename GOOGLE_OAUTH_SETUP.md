# Google OAuth Setup Guide

Complete guide to enable Google "Sign in with Google" for your Calorie Tracker application.

---

## 📋 Overview

Google OAuth allows users to sign in with their Google account, eliminating the need to remember another password. This significantly improves conversion rates (40-50% increase) and user experience.

---

## 🚀 Quick Setup (10-15 minutes)

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project**
   - Click "Select a project" dropdown at the top
   - Click "New Project"
   - Name: `Calorie Tracker` (or your app name)
   - Click "Create"

3. **Enable Google+ API**
   - In the left sidebar, go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click on it and click "Enable"

### Step 2: Configure OAuth Consent Screen

1. **Go to OAuth consent screen**
   - Left sidebar → "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**
   - Select "External" (for public apps)
   - Click "Create"

3. **Fill App Information**
   ```
   App name: Calorie Tracker
   User support email: your-email@example.com
   App logo: (optional, upload your logo)
   Application home page: http://localhost:3000 (dev) or https://your-domain.com (prod)
   Application privacy policy: https://your-domain.com/privacy
   Application terms of service: https://your-domain.com/terms
   Authorized domains:
     - localhost (for development)
     - your-domain.com (for production)
   Developer contact: your-email@example.com
   ```

4. **Scopes**
   - Click "Add or Remove Scopes"
   - Select these scopes:
     - `openid`
     - `email`
     - `profile`
   - Click "Update" → "Save and Continue"

5. **Test Users** (if app is not published)
   - Add your email as a test user
   - Click "Save and Continue"

6. **Summary**
   - Review and click "Back to Dashboard"

### Step 3: Create OAuth Credentials

1. **Go to Credentials**
   - Left sidebar → "APIs & Services" → "Credentials"

2. **Create OAuth Client ID**
   - Click "Create Credentials" → "OAuth client ID"

3. **Configure OAuth Client**
   ```
   Application type: Web application
   Name: Calorie Tracker Web Client

   Authorized JavaScript origins:
     - http://localhost:3000 (development)
     - http://localhost:5173 (Vite dev server)
     - https://your-domain.com (production)

   Authorized redirect URIs:
     - http://localhost:3000/auth/google/callback (development)
     - https://your-domain.com/auth/google/callback (production)
   ```

4. **Save Credentials**
   - Click "Create"
   - You'll see a popup with:
     - **Client ID**: `123456789-abc123.apps.googleusercontent.com`
     - **Client Secret**: `GOCSPX-abc123xyz...`
   - **⚠️ Save these! You'll need them.**

### Step 4: Configure Backend

1. **Update Backend .env**
   ```bash
   cd backend
   nano .env  # or use your editor
   ```

2. **Add Google OAuth Credentials**
   ```env
   # Google OAuth
   GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz...
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   ```

3. **Install Dependencies**
   ```bash
   poetry install
   ```

4. **Run Database Migration**
   ```bash
   poetry run alembic upgrade head
   ```

5. **Restart Backend**
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

### Step 5: Configure Frontend

1. **Update Frontend .env**
   ```bash
   cd ../frontend-web
   nano .env  # or use your editor
   ```

2. **Add Google Client ID**
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:8000/api/v1

   # Google OAuth
   VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Restart Frontend**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

### Test Flow

1. **Open the app**: http://localhost:3000/login

2. **Click "Continue with Google"**

3. **Google Auth Flow**:
   - Redirected to Google login
   - Select your Google account
   - Grant permissions (email, profile)
   - Redirected back to app

4. **First Time Users**:
   - Automatically creates account
   - Redirected to `/onboarding`
   - Complete profile setup

5. **Returning Users**:
   - Automatically logged in
   - Redirected to `/dashboard`

### What to Check

✅ Google button appears on login/register pages
✅ Clicking button opens Google popup
✅ After auth, user is logged in
✅ New users redirected to onboarding
✅ Existing users redirected to dashboard
✅ User email and name pre-filled (from Google)

---

## 🐛 Troubleshooting

### Issue: "Error 400: redirect_uri_mismatch"

**Cause**: Redirect URI not authorized in Google Console

**Fix**:
1. Go to Google Cloud Console → Credentials
2. Click your OAuth 2.0 Client ID
3. Add the exact redirect URI:
   - `http://localhost:3000/auth/google/callback`
4. Save and try again

### Issue: "Access blocked: This app's request is invalid"

**Cause**: Missing or incorrect OAuth consent screen configuration

**Fix**:
1. Go to OAuth consent screen
2. Ensure "App name" and "Support email" are set
3. Add authorized domain: `localhost`
4. Save and try again

### Issue: "Error 403: access_denied"

**Cause**: App is in testing mode and user is not a test user

**Fix**:
1. Go to OAuth consent screen
2. Scroll to "Test users"
3. Add your Google account email
4. Or publish the app (if ready)

### Issue: "idpiframe_initialization_failed"

**Cause**: Third-party cookies blocked in browser

**Fix**:
1. In Chrome: Settings → Privacy → Cookies
2. Allow "Continue with Google"
3. Or test in Incognito mode

### Issue: Backend returns "Invalid Google token"

**Cause**: Google Client ID mismatch between frontend and backend

**Fix**:
1. Ensure `VITE_GOOGLE_CLIENT_ID` (frontend) matches `GOOGLE_CLIENT_ID` (backend)
2. Restart both frontend and backend
3. Clear browser cache

---

## 🔒 Security Best Practices

### Development

✅ Use different OAuth clients for dev/staging/prod
✅ Never commit credentials to git (.env in .gitignore)
✅ Use `localhost` for development only
✅ Keep test user list minimal

### Production

✅ Use HTTPS only (required by Google)
✅ Verify ID tokens on backend (already implemented)
✅ Set proper authorized domains
✅ Publish OAuth consent screen
✅ Enable 2FA on Google account managing OAuth
✅ Rotate client secrets periodically
✅ Monitor OAuth usage in Google Console

---

## 📱 Adding Apple Sign In (Optional)

For mobile apps (required by Apple for App Store):

1. **Apple Developer Account** ($99/year)
2. **Configure Sign in with Apple**
   - Enable in Xcode
   - Add Apple Sign In capability
3. **Backend endpoint** (similar to Google)
4. **Frontend button** (similar implementation)

**Time estimate**: 2-3 hours

---

## 🌍 Production Deployment

### Update for Production

1. **Google Cloud Console**:
   - Add production domain to authorized JavaScript origins:
     - `https://your-domain.com`
   - Add production redirect URI:
     - `https://your-domain.com/auth/google/callback`

2. **Backend .env (production)**:
   ```env
   GOOGLE_CLIENT_ID=your-prod-client-id
   GOOGLE_CLIENT_SECRET=your-prod-client-secret
   GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
   ```

3. **Frontend .env (production)**:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-prod-client-id
   ```

4. **Publish OAuth Consent Screen**:
   - Go to OAuth consent screen
   - Click "Publish App"
   - (Requires verification if requesting sensitive scopes)

---

## 📊 Analytics & Monitoring

### Track Google Sign-Ins

In your analytics (Google Analytics, Mixpanel, etc.):

```typescript
// After successful Google login
analytics.track('User Login', {
  method: 'google',
  is_new_user: response.is_new_user,
});
```

### Key Metrics to Monitor

- **Google vs Email signups**: Track conversion rates
- **Time to complete signup**: Google should be faster
- **Error rates**: Monitor OAuth failures
- **Drop-off points**: Where users abandon flow

---

## ✅ Checklist

Before going live:

- [ ] OAuth consent screen configured and published
- [ ] Production domain added to authorized origins
- [ ] Production redirect URI added
- [ ] Backend .env has production credentials
- [ ] Frontend .env has production Client ID
- [ ] HTTPS enabled on production domain
- [ ] Tested end-to-end on production
- [ ] Privacy policy and Terms of Service published
- [ ] Error tracking set up (Sentry)
- [ ] Analytics tracking implemented

---

## 🎉 Success!

You now have Google OAuth fully integrated! Users can sign in with one click.

**Expected Impact**:
- 📈 40-50% increase in registration conversions
- ⏱️ 2-minute signup → 30-second signup
- 😊 Better user experience
- 🔒 More secure (no passwords to manage)

---

## 📞 Need Help?

### Resources

- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Google Console**: https://console.cloud.google.com/
- **React OAuth Library**: https://www.npmjs.com/package/@react-oauth/google

### Common Questions

**Q: Is Google OAuth free?**
A: Yes, completely free. No API limits for authentication.

**Q: Do I need a verified domain?**
A: Only for production. Development works with `localhost`.

**Q: Can users still use email/password?**
A: Yes! Google OAuth is an additional option, not a replacement.

**Q: What if a user's Google account email changes?**
A: We link by `oauth_id` (Google's user ID), not email. Account stays linked.

**Q: Can I add Facebook/Twitter login too?**
A: Yes! Similar implementation. Takes 2-3 hours per provider.

---

**Last Updated**: March 11, 2026
