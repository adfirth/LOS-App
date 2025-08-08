# Quick Setup Guide - Tester System

## 🚀 Get Started in 5 Minutes

### Step 1: Add Tester Emails
Edit `tester-config.js` and replace the example emails with real tester emails:

```javascript
testerEmails: [
    'your-tester-1@example.com',
    'your-tester-2@example.com',
    'your-tester-3@example.com'
]
```

### Step 2: Close Registration for Regular Users
1. Go to your admin panel (`/admin.html`)
2. Navigate to "Registration Management" tab
3. Uncheck "Enable Registration" for the current edition
4. Save settings

### Step 3: Test the System
1. **Test Tester Access:**
   - Try registering with a tester email
   - Should work even when registration is closed
   - Should have access to scores and vidiprinter

2. **Test Regular User Restrictions:**
   - Try registering with a non-tester email
   - Should see "Registration Currently Closed"
   - If registration is open, should see "Coming Soon" on scores/vidiprinter

## ✅ What's Working Now

### For Testers:
- ✅ Can register anytime (even when registration closed)
- ✅ Full access to live scores
- ✅ Full access to vidiprinter
- ✅ Can make picks for game weeks 1 & 2

### For Regular Users:
- ❌ Cannot register when registration is closed
- 🔒 Scores tab shows "Coming Soon"
- 🔒 Vidiprinter tab shows "Coming Soon"

## 🔧 Quick Configuration

### Add More Testers
Just add emails to the array in `tester-config.js`:
```javascript
testerEmails: [
    'existing@example.com',
    'new-tester@example.com',  // Add this line
    'another@example.com'      // And this line
]
```

### Change Trial Game Weeks
Edit the `trialGameWeeks` array in `tester-config.js`:
```javascript
trialGameWeeks: ['1', '2', '3']  // Now includes week 3
```

### Domain-Wide Access
Give all emails from your domain access:
```javascript
testerEmails: [
    '@yourdomain.com'  // All emails from yourdomain.com
]
```

## 🐛 Quick Troubleshooting

### Tester Can't Register?
1. Check email spelling in `tester-config.js`
2. Make sure email is lowercase
3. Clear browser cache and try again

### "Coming Soon" Not Showing?
1. Check browser console for errors
2. Verify `tester-config.js` is loaded
3. Make sure user is not marked as tester in database

### Tabs Not Disabled?
1. Check if user has `isTester: true` in their profile
2. Verify the access restriction function is running
3. Check CSS is loaded properly

## 📞 Need Help?

1. Check the full documentation in `TESTER-SYSTEM-README.md`
2. Look at browser console for error messages
3. Test with different email addresses
4. Verify all files are properly loaded

## 🎯 Next Steps

1. **Add your real tester emails** to `tester-config.js`
2. **Close registration** in admin panel
3. **Test with testers** to ensure everything works
4. **Open registration tomorrow** for regular users
5. **Monitor** that regular users see "Coming Soon" messages

---

**You're all set!** The tester system is now active and ready for your trial period. 🎉
