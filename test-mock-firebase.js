// Mock Firebase for Testing
// This provides basic Firebase-like objects for testing when the real Firebase isn't available

console.log('🔥 Setting up mock Firebase for testing...');

// Mock database object
window.db = {
    collection: (collectionName) => ({
        doc: (docId) => ({
            get: () => Promise.resolve({ exists: false, data: () => null }),
            set: (data) => Promise.resolve(),
            update: (data) => Promise.resolve(),
            delete: () => Promise.resolve(),
            onSnapshot: (callback) => {
                // Mock snapshot listener
                setTimeout(() => callback({ exists: false, data: () => null }), 100);
                return () => {}; // Return unsubscribe function
            }
        }),
        add: (data) => Promise.resolve({ id: 'mock-doc-id' }),
        where: (field, operator, value) => ({
            get: () => Promise.resolve({ docs: [] }),
            onSnapshot: (callback) => {
                setTimeout(() => callback({ docs: [] }), 100);
                return () => {};
            }
        }),
        orderBy: (field, direction) => ({
            get: () => Promise.resolve({ docs: [] }),
            onSnapshot: (callback) => {
                setTimeout(() => callback({ docs: [] }), 100);
                return () => {};
            }
        }),
        limit: (count) => ({
            get: () => Promise.resolve({ docs: [] }),
            onSnapshot: (callback) => {
                setTimeout(() => callback({ docs: [] }), 100);
                return () => {};
            }
        })
    }),
    batch: () => ({
        set: (docRef, data) => {},
        update: (docRef, data) => {},
        delete: (docRef) => {},
        commit: () => Promise.resolve()
    }),
    runTransaction: (updateFunction) => Promise.resolve(updateFunction({}))
};

// Mock auth object
window.auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
        // Mock auth state change
        setTimeout(() => callback(null), 100);
        return () => {}; // Return unsubscribe function
    },
    signInWithEmailAndPassword: (email, password) => Promise.resolve({ user: { uid: 'mock-user-id' } }),
    createUserWithEmailAndPassword: (email, password) => Promise.resolve({ user: { uid: 'mock-user-id' } }),
    signOut: () => Promise.resolve(),
    sendPasswordResetEmail: (email) => Promise.resolve()
};

// Mock Firebase app
window.firebase = {
    auth: () => window.auth,
    firestore: () => window.db,
    initializeApp: (config) => window.firebase
};

console.log('✅ Mock Firebase setup complete');
console.log('💡 This is for testing only - not for production use');
console.log('🔧 You can now test your app without real Firebase');
