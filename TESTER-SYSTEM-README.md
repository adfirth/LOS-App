# Tester System Implementation

## Overview

The tester system allows administrators to promote registered users to testers, giving them access to live scores and vidiprinter features for trial game weeks. Regular users will see "coming soon" messages for these features.

## Features

### For Testers:
- ✅ Can register normally through standard registration
- ✅ Full access to scores tab with live updates
- ✅ Full access to vidiprinter with live match updates
- ✅ Can make picks for trial game weeks (1 & 2)
- ✅ All normal dashboard functionality

### For Regular Users:
- ✅ Can register normally when registration window is open
- 🔒 Scores tab shows "Coming Soon" message
- 🔒 Vidiprinter tab shows "Coming Soon" message
- ✅ Can make picks when registration is open

### For Administrators:
- ✅ Can promote any registered user to tester status
- ✅ Can remove tester status from users
- ✅ Admin panel shows tester status for all users
- ✅ Easy toggle buttons in user management

## Configuration

### Managing Tester Access

The system now uses admin promotion instead of email-based access:

1. **Users register normally** through the standard registration process
2. **Admin promotes users** to tester status via the admin panel
3. **Testers get immediate access** to scores and vidiprinter features

### Admin Panel Management

In the admin panel under "Registration Management":

1. **View all registered users** in the registration list
2. **Click "Make Tester"** to promote a user to tester status
3. **Click "Remove Tester"** to remove tester status
4. **Tester status is clearly displayed** for each user

## Implementation Details

### Files Modified

1. **`app.js`** - Updated to use admin-promoted tester system
2. **`tester-config.js`** - Simplified configuration for admin management
3. **`style.css`** - Added styles for "coming soon" messages and disabled tabs
4. **`dashboard.html`** - Added tester-config.js script reference
5. **`register.html`** - Added tester-config.js script reference
6. **`index.html`** - Added tester-config.js script reference

### Key Functions

#### Registration Logic
- `checkRegistrationWindow()` - Standard registration window check
- `isUserTester(userId)` - Checks if user is promoted to tester

#### Access Control
- `handleTesterAccessRestrictions(userData, userId)` - Applies restrictions based on user type
- Shows "coming soon" messages for non-testers
- Disables scores and vidiprinter tabs for non-testers

#### Admin Management
- `toggleTesterStatus(userId, currentStatus)` - Promotes/removes tester status
- Admin panel integration for easy management

### Database Changes

Users now have an `isTester` field in their profile:
```javascript
{
    // ... other user fields
    isTester: true/false  // Set via admin panel
}
```

## Usage Instructions

### For Administrators

1. **Set up testers:**
   - Go to Admin Panel → Registration Management
   - Find the user you want to promote
   - Click "Make Tester" button
   - User immediately gets tester access

2. **Close registration for regular users:**
   - Use the admin panel to disable registration
   - Testers can still access their features

3. **Monitor tester activity:**
   - Check the admin panel for tester registrations
   - Review tester picks and feedback
   - Remove tester status if needed

### For Testers

1. **Register:**
   - Go to `/register.html`
   - Register normally with any email
   - Wait for admin promotion

2. **Access features (after promotion):**
   - Login to dashboard
   - Access scores tab for live updates
   - Access vidiprinter for live match updates
   - Make picks for trial game weeks

### For Regular Users

1. **Registration:**
   - Can register when registration window is open
   - Will see "Registration Currently Closed" if window is closed

2. **Dashboard access:**
   - Scores tab shows "Coming Soon" message
   - Vidiprinter tab shows "Coming Soon" message
   - Other features work normally when registration is open

## Testing the System

### Test Admin Promotion
1. Register a test user normally
2. Login as admin and go to Registration Management
3. Click "Make Tester" for the test user
4. Login as test user and verify access to scores/vidiprinter

### Test Regular User Restrictions
1. Register with a regular user account
2. Verify "coming soon" messages on scores/vidiprinter
3. Promote to tester and verify access is granted

### Test Admin Panel
1. Login as admin
2. Check that tester status is displayed correctly
3. Test promoting and removing tester status

## Troubleshooting

### Common Issues

1. **Tester can't access features:**
   - Check if user has `isTester: true` in database
   - Verify admin promotion was successful
   - Check browser console for errors

2. **"Coming soon" messages not showing:**
   - Check that `handleTesterAccessRestrictions()` is called
   - Verify CSS styles are loaded
   - Check browser console for JavaScript errors

3. **Admin toggle not working:**
   - Verify admin permissions
   - Check database connection
   - Look for error messages in console

### Debug Mode

Add this to the browser console to debug:
```javascript
// Check if current user is a tester
console.log('Current user:', auth.currentUser);
console.log('User data:', await db.collection('users').doc(auth.currentUser.uid).get().then(doc => doc.data()));

// Check tester config
console.log('Tester config:', TESTER_CONFIG);
```

## Security Considerations

1. **Admin-only promotion:** Only admins can promote users to testers
2. **Database validation:** Tester status is stored securely in database
3. **Access logging:** Monitor tester access for security
4. **Admin permissions:** Ensure only authorized admins can promote users

## Future Enhancements

1. **Bulk operations:** Promote multiple users at once
2. **Time-limited access:** Add expiration dates for tester access
3. **Feature flags:** More granular control over which features testers can access
4. **Analytics:** Track tester usage and feedback
5. **Invitation system:** Send email invitations to testers

## Support

For issues or questions about the tester system:
1. Check this README for troubleshooting steps
2. Review the browser console for error messages
3. Verify admin permissions and database access
4. Test with different user accounts to isolate issues
