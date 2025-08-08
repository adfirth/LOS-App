# Tester System Implementation

## Overview

The tester system allows a small group of testers to register, login, and make picks for 2 trial game weeks while having access to live scores and vidiprinter features. Regular users will see "coming soon" messages for these features.

## Features

### For Testers:
- ✅ Can register even when registration window is closed
- ✅ Full access to scores tab with live updates
- ✅ Full access to vidiprinter with live match updates
- ✅ Can make picks for trial game weeks (1 & 2)
- ✅ All normal dashboard functionality

### For Regular Users:
- ❌ Cannot register when registration window is closed
- 🔒 Scores tab shows "Coming Soon" message
- 🔒 Vidiprinter tab shows "Coming Soon" message
- ✅ Can register when registration window is open
- ✅ Can make picks when registration is open

## Configuration

### Managing Tester Emails

Edit the `tester-config.js` file to manage tester access:

```javascript
const TESTER_CONFIG = {
    // List of tester email addresses (case-insensitive)
    testerEmails: [
        'tester1@example.com',
        'tester2@example.com',
        'tester3@example.com',
        // Add more tester emails as needed
        // You can also add specific domains for easier management
        // '@yourdomain.com' // This would allow all emails from yourdomain.com
    ],
    
    // Trial game weeks that testers can access
    trialGameWeeks: ['1', '2'],
    
    // Features that testers have access to
    testerFeatures: {
        scores: true,
        vidiprinter: true,
        liveUpdates: true
    }
};
```

### Adding New Testers

1. Open `tester-config.js`
2. Add the tester's email address to the `testerEmails` array
3. Save the file
4. The tester can now register and access all features

### Domain-Wide Access

You can also grant access to all emails from a specific domain:

```javascript
testerEmails: [
    'specific@yourdomain.com',
    '@yourdomain.com'  // All emails from yourdomain.com
]
```

## Implementation Details

### Files Modified

1. **`app.js`** - Added tester registration logic and access restrictions
2. **`tester-config.js`** - New configuration file for tester management
3. **`style.css`** - Added styles for "coming soon" messages and disabled tabs
4. **`dashboard.html`** - Added tester-config.js script reference
5. **`register.html`** - Added tester-config.js script reference
6. **`index.html`** - Added tester-config.js script reference

### Key Functions

#### Registration Logic
- `checkRegistrationWindowForTesters(email)` - Allows testers to register even when window is closed
- `isTesterEmail(email)` - Checks if an email is in the tester list

#### Access Control
- `handleTesterAccessRestrictions(userData)` - Applies restrictions based on user type
- Shows "coming soon" messages for non-testers
- Disables scores and vidiprinter tabs for non-testers

### Database Changes

Users now have an `isTester` field in their profile:
```javascript
{
    // ... other user fields
    isTester: true/false  // Set based on email during registration
}
```

## Usage Instructions

### For Administrators

1. **Set up testers:**
   - Edit `tester-config.js`
   - Add tester email addresses
   - Save the file

2. **Close registration for regular users:**
   - Use the admin panel to disable registration
   - Testers can still register

3. **Monitor tester activity:**
   - Check the admin panel for tester registrations
   - Review tester picks and feedback

### For Testers

1. **Register:**
   - Go to `/register.html`
   - Use your tester email address
   - Complete registration form

2. **Access features:**
   - Login to dashboard
   - Access scores tab for live updates
   - Access vidiprinter for live match updates
   - Make picks for trial game weeks

### For Regular Users

1. **Registration:**
   - Can only register when registration window is open
   - Will see "Registration Currently Closed" if window is closed

2. **Dashboard access:**
   - Scores tab shows "Coming Soon" message
   - Vidiprinter tab shows "Coming Soon" message
   - Other features work normally when registration is open

## Testing the System

### Test Tester Access
1. Add a test email to `tester-config.js`
2. Try registering with that email when registration is closed
3. Verify access to scores and vidiprinter

### Test Regular User Restrictions
1. Try registering with a non-tester email when registration is closed
2. Verify "Registration Currently Closed" message appears
3. If registration is open, verify "coming soon" messages on scores/vidiprinter

### Test Admin Panel
1. Login as admin
2. Check that tester registrations appear in the admin panel
3. Verify tester status is correctly displayed

## Troubleshooting

### Common Issues

1. **Tester can't register:**
   - Check email spelling in `tester-config.js`
   - Ensure email is lowercase in the config
   - Verify `tester-config.js` is loaded before `app.js`

2. **"Coming soon" messages not showing:**
   - Check that `handleTesterAccessRestrictions()` is called
   - Verify CSS styles are loaded
   - Check browser console for JavaScript errors

3. **Tabs not disabled for regular users:**
   - Verify `isTester` field is correctly set in user profile
   - Check that access restriction function is working

### Debug Mode

Add this to the browser console to debug:
```javascript
// Check if current user is a tester
console.log('Current user:', auth.currentUser);
console.log('User data:', await db.collection('users').doc(auth.currentUser.uid).get().then(doc => doc.data()));

// Check tester config
console.log('Tester config:', TESTER_CONFIG);
console.log('Is tester email:', isTesterEmail('test@example.com'));
```

## Security Considerations

1. **Email validation:** The system relies on email addresses for access control
2. **Client-side config:** Tester emails are visible in client-side code
3. **Server-side validation:** Consider adding server-side validation for production
4. **Access logging:** Monitor tester access for security

## Future Enhancements

1. **Admin panel integration:** Add tester management to admin panel
2. **Time-limited access:** Add expiration dates for tester access
3. **Feature flags:** More granular control over which features testers can access
4. **Analytics:** Track tester usage and feedback
5. **Invitation system:** Send email invitations to testers

## Support

For issues or questions about the tester system:
1. Check this README for troubleshooting steps
2. Review the browser console for error messages
3. Verify configuration in `tester-config.js`
4. Test with different email addresses to isolate issues
