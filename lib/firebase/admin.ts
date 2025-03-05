import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if it hasn't been initialized already
if (!admin.apps.length) {
  try {
    // Check if we have a service account key
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      // Parse the service account key JSON
      const serviceAccountObj = JSON.parse(serviceAccount);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountObj),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Initialize without service account for local development
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
    
    console.log('Firebase Admin SDK initialized');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Export the Firestore database
export const db = admin.firestore();

// Export the Storage bucket
export const storage = admin.storage().bucket();

// Export the Auth service
export const auth = admin.auth();

export default admin; 