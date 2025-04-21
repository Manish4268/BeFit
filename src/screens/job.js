// Import necessary Firebase functions for scheduling, Firestore access, and initializing Firebase Admin SDK
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

// Initialize Firebase Admin SDK to enable Firestore access
initializeApp();

const db = getFirestore(); // Get Firestore instance to interact with Firestore database

// Define a scheduled function to reset calorie and nutrition fields daily
exports.resetCalorieAndNutrition = onSchedule(
  {
    schedule: "45 3 * * *", // Runs daily at 3:45 AM UTC (11:45 PM AST)
    timeZone: "America/Halifax", // Ensures the function runs according to AST (Atlantic Time)
  },
  async (event) => {
    try {
      const loginSignupRef = db.collection("LoginSignup"); // Reference to "LoginSignup" collection

      // Fetch all documents in the "LoginSignup" collection
      const snapshot = await loginSignupRef.get();

      if (snapshot.empty) {
        console.log("No documents found!"); // Log message if collection is empty
        return; // Exit function if no documents are found
      }

      const batch = db.batch(); // Create a batch operation for efficiency

      // Iterate through each document and prepare batch update
      snapshot.forEach((doc) => {
        const docRef = loginSignupRef.doc(doc.id);
        batch.update(docRef, {
          currentCalorie: 0, // Reset calorie count to 0
          nutrition: {
            Protein: 0, // Reset protein intake to 0
            Fats: 0, // Reset fat intake to 0
            Carbs: 0, // Reset carb intake to 0
          },
        });
      });

      await batch.commit(); // Execute batch update to Firestore
      console.log("Fields reset successfully"); // Log success message
    } catch (error) {
      console.error("Error resetting fields:", error); // Log any errors that occur
    }
  }
);
