// Standalone Picks Migration Script
// This script can be run directly in Firebase console or as a separate utility
// to migrate picks data from the users collection to a new picks collection

// Firebase configuration - update with your project details
const firebaseConfig = {
    // Add your Firebase config here
    // This will be provided when you run the script
};

// Initialize Firebase (if running standalone)
let db;
if (typeof firebase !== 'undefined') {
    // Running in Firebase console
    db = firebase.firestore();
} else {
    // Running standalone - would need Firebase SDK
    console.log('Firebase SDK not available - run this in Firebase console');
}

// Migration function
async function migratePicksToCollection() {
    console.log('🚀 Starting picks migration...');
    
    try {
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        console.log('🔍 Found users:', usersSnapshot.size);
        
        let totalPicksMigrated = 0;
        let usersProcessed = 0;
        let errors = [];
        
        // Process each user
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            usersProcessed++;
            
            if (!userData.picks || Object.keys(userData.picks).length === 0) {
                console.log(`⏭️ Skipping user ${userData.firstName} ${userData.surname} - no picks`);
                continue;
            }
            
            console.log(`🔍 Processing user ${usersProcessed}/${usersSnapshot.size}: ${userData.firstName} ${userData.surname}`);
            
            // Process each pick
            for (const [pickKey, teamPicked] of Object.entries(userData.picks)) {
                if (!teamPicked || teamPicked === 'No Pick Made') {
                    console.log(`⏭️ Skipping invalid pick: ${pickKey} = ${teamPicked}`);
                    continue;
                }
                
                try {
                    // Parse pick key to extract edition and gameweek
                    let edition, gameweek, gameweekKey;
                    
                    if (pickKey.startsWith('editiontest_')) {
                        edition = 'test';
                        gameweekKey = pickKey.replace('editiontest_', '');
                    } else if (pickKey.startsWith('edition') && pickKey.includes('_')) {
                        const parts = pickKey.split('_');
                        edition = parts[0].replace('edition', '');
                        gameweekKey = parts[1];
                    } else if (pickKey.startsWith('gw')) {
                        edition = 'test'; // Default to test for simple gw keys
                        gameweekKey = pickKey;
                    } else {
                        console.log(`⚠️ Unknown pick key format: ${pickKey}`);
                        continue;
                    }
                    
                    // Extract gameweek number
                    if (gameweekKey === 'gwtiebreak') {
                        gameweek = 'tiebreak';
                    } else if (gameweekKey.startsWith('gw')) {
                        gameweek = gameweekKey.replace('gw', '');
                    } else {
                        console.log(`⚠️ Unknown gameweek format: ${gameweekKey}`);
                        continue;
                    }
                    
                    // Create pick document
                    const pickData = {
                        userId: userDoc.id,
                        userFirstName: userData.firstName || '',
                        userSurname: userData.surname || '',
                        displayName: userData.displayName || '',
                        edition: edition,
                        gameweek: gameweek,
                        gameweekKey: gameweekKey,
                        teamPicked: teamPicked,
                        timestamp: new Date(),
                        isActive: true,
                        originalPickKey: pickKey, // Keep reference to original format
                        migratedAt: new Date(),
                        migrationSource: 'users_collection'
                    };
                    
                    // Add to picks collection
                    await db.collection('picks').add(pickData);
                    totalPicksMigrated++;
                    
                    console.log(`✅ Migrated pick: ${userData.firstName} ${userData.surname} - ${edition} ${gameweek} -> ${teamPicked}`);
                    
                } catch (pickError) {
                    console.error(`❌ Error migrating pick ${pickKey} for user ${userData.firstName} ${userData.surname}:`, pickError);
                    errors.push({
                        userId: userDoc.id,
                        userName: `${userData.firstName} ${userData.surname}`,
                        pickKey: pickKey,
                        error: pickError.message
                    });
                }
            }
        }
        
        console.log('🎉 Migration completed!');
        console.log(`📊 Total picks migrated: ${totalPicksMigrated}`);
        console.log(`👥 Users processed: ${usersProcessed}`);
        
        if (errors.length > 0) {
            console.log(`⚠️ Errors encountered: ${errors.length}`);
            console.log('Error details:', errors);
        }
        
        return {
            success: true,
            totalPicksMigrated,
            usersProcessed,
            errors
        };
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to verify migration results
async function verifyMigration() {
    console.log('🔍 Verifying migration results...');
    
    try {
        const picksSnapshot = await db.collection('picks').get();
        console.log(`📊 Total picks in collection: ${picksSnapshot.size}`);
        
        if (picksSnapshot.empty) {
            console.log('❌ No picks found in collection');
            return;
        }
        
        // Group by edition and gameweek
        const picksByEdition = {};
        picksSnapshot.forEach(doc => {
            const pick = doc.data();
            const key = `${pick.edition}_${pick.gameweek}`;
            
            if (!picksByEdition[key]) {
                picksByEdition[key] = [];
            }
            picksByEdition[key].push(pick);
        });
        
        console.log('📋 Picks by edition and gameweek:');
        for (const [key, picks] of Object.entries(picksByEdition)) {
            console.log(`  ${key}: ${picks.length} picks`);
        }
        
        // Show sample picks
        console.log('📝 Sample picks:');
        picksSnapshot.docs.slice(0, 3).forEach(doc => {
            const pick = doc.data();
            console.log(`  ${pick.userFirstName} ${pick.userSurname}: ${pick.edition} ${pick.gameweek} -> ${pick.teamPicked}`);
        });
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

// Function to clean up migration (if needed)
async function cleanupMigration() {
    console.log('🧹 Cleaning up migration artifacts...');
    
    try {
        // Remove migration metadata from picks
        const picksSnapshot = await db.collection('picks').get();
        let cleaned = 0;
        
        for (const doc of picksSnapshot.docs) {
            await doc.ref.update({
                migratedAt: firebase.firestore.FieldValue.delete(),
                migrationSource: firebase.firestore.FieldValue.delete()
            });
            cleaned++;
        }
        
        console.log(`✅ Cleaned ${cleaned} pick documents`);
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        migratePicksToCollection,
        verifyMigration,
        cleanupMigration
    };
} else {
    // Browser/Firebase console environment
    window.migratePicksToCollection = migratePicksToCollection;
    window.verifyMigration = verifyMigration;
    window.cleanupMigration = cleanupMigration;
    
    console.log('🚀 Migration functions available:');
    console.log('  - migratePicksToCollection() - Run the migration');
    console.log('  - verifyMigration() - Check migration results');
    console.log('  - cleanupMigration() - Clean up migration metadata');
}

console.log('📋 Migration script loaded successfully!');
console.log('💡 Run migratePicksToCollection() to start the migration');
