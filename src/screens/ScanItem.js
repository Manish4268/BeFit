import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Firestore methods
import { db } from '../firebaseConfig.js'; // Firebase config
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Icon library

const ScanItem = ({ route, navigation }) => {
  // Camera permissions from Expo
  const [permission, requestPermission] = useCameraPermissions();

  // Get user ID from navigation route
  const { uid } = route.params;

  // State variables
  const [barcode, setBarcode] = useState(null); // Detected barcode
  const [nutritionData, setNutritionData] = useState(null); // Nutrition info from API
  const [isHighlighted, setIsHighlighted] = useState(true); // Whether to show camera overlay
  const [scannedMeals, setScannedMeals] = useState([]); // Local list of scanned meals
  const [loading, setLoading] = useState(false); // Loading state during fetch
  const [hasScanned, setHasScanned] = useState(false); // To prevent duplicate scans

  // If permission is not yet loaded, return empty view
  if (!permission) {
    return <View />;
  }

  // Show permission request UI if not granted
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>We need camera access to scan barcodes</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Triggered when barcode is scanned
  const handleBarcodeScanned = ({ data }) => {
    if (hasScanned) return; // Avoid double scans
    setBarcode(data);
    setHasScanned(true); // Lock scanning
    fetchNutritionData(data); // Fetch food info
  };

  // Fetch nutrition data from OpenFoodFacts API using the scanned barcode
  const fetchNutritionData = async (barcode) => {
    try {
      setLoading(true);
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const result = await response.json();
      setNutritionData(result.product); // Store API result in state
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Adds scanned item to user's Firestore document
  const addToDiet = async () => {
    if (!barcode) {
      alert("No barcode detected");
      return;
    }

    // Update local state list
    const updatedMeals = [...scannedMeals, barcode];
    setScannedMeals(updatedMeals);

    try {
      const userDocRef = doc(db, 'LoginSignup', uid); // Firestore doc ref
      const userDoc = await getDoc(userDocRef);

      // Get existing scanned meals or fallback to empty array
      const existingMeals = userDoc.exists() ? userDoc.data().scannedMeals || [] : [];
      const mergedMeals = [...existingMeals, ...updatedMeals];

      // Merge and save back to Firestore
      await setDoc(userDocRef, { scannedMeals: mergedMeals }, { merge: true });

      alert("Item added to your diet!");
      resetScanner(); // Reset state to allow next scan
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }
  };

  // Reset scanner state to allow new scan
  const resetScanner = () => {
    setBarcode(null);
    setNutritionData(null);
    setHasScanned(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Item</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Camera view with barcode scanning enabled */}
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "upc", "ean8"] }}
          isHighlightingEnabled={isHighlighted}
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Align barcode within the frame</Text>
          </View>
        </CameraView>

        {/* Display scanned barcode */}
        {barcode && <Text style={styles.scannedText}>Scanned Barcode: {barcode}</Text>}

        {/* Show loading indicator when fetching data */}
        {loading && <ActivityIndicator size="large" color="#1E88E5" />}

        {/* Show nutrition data if available */}
        {nutritionData && (
          <View style={styles.nutritionContainer}>
            <Text style={styles.nutritionTitle}>Nutrition Information</Text>
            <Text style={styles.nutritionDetail}>🍏 Name: {nutritionData.product_name || "N/A"}</Text>
            <Text style={styles.nutritionDetail}>💪 Protein: {nutritionData.nutriments?.["proteins"] || "N/A"}g</Text>
            <Text style={styles.nutritionDetail}>🥖 Carbs: {nutritionData.nutriments?.["carbohydrates"] || "N/A"}g</Text>
            <Text style={styles.nutritionDetail}>🔥 Calories: {nutritionData.nutriments?.["energy-kcal"] || "N/A"} kcal</Text>

            {/* Add item to diet */}
            <TouchableOpacity style={styles.button} onPress={addToDiet}>
              <Text style={styles.buttonText}>Add to Diet</Text>
            </TouchableOpacity>

            {/* Reset to scan another item */}
            <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetScanner}>
              <Text style={styles.buttonText}>Scan Another Item</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// Styles for the component


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  overlayText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 10,
  },
  scannedText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
    marginVertical: 10,
  },
  nutritionContainer: {
    backgroundColor: "#F5F5F5",
    padding: 20,
    margin: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  nutritionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  nutritionDetail: {
    fontSize: 16,
    marginBottom: 5,
  },
  button: {
    backgroundColor: "#1E88E5",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  resetButton: {
    backgroundColor: "#FF6F61",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
});

export default ScanItem;
