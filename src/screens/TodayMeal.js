import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable"; // Swipe gesture component
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BarChart } from "react-native-chart-kit"; // For nutrition chart
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"; // Firestore methods
import LottieView from 'lottie-react-native'; // For animations
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Icons

const screenWidth = Dimensions.get("window").width;

const NutritionTracker = ({ route, navigation }) => {
  const { uid } = route?.params || {};

  // State for nutrition and meal data
  const [nutritionData, setNutritionData] = useState({ Protein: 0, Carbs: 0, Fats: 0 });
  const [combinedMeals, setCombinedMeals] = useState([]);
  const [showAnimation, setShowAnimation] = useState(true);
  const swipeableRefs = useRef({}); // Refs for swipeable items

  // Load meals on initial mount
  useEffect(() => {
    loadMeals();
  }, []);

  // Fetch detailed nutrition info for a Spoonacular meal
  const fetchSpoonacularRecipe = async (id) => {
    try {
      const [nutritionResponse, recipeResponse] = await Promise.all([
        fetch(`https://api.spoonacular.com/recipes/${id}/nutritionWidget.json?apiKey=d2107fee2fc4449da135e42aa7c2ec9e`),
        fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=d2107fee2fc4449da135e42aa7c2ec9e`)
      ]);

      const nutritionData = await nutritionResponse.json();
      const recipeData = await recipeResponse.json();
      const name = recipeData?.title || recipeData?.name || "Unknown Recipe";

      // Construct object representing the recipe meal
      return {
        id,
        type: "meal",
        name: name,
        protein: parseFloat(nutritionData.good?.find(n => n.title === "Protein")?.amount) || 0,
        carbs: parseFloat(nutritionData.bad?.find(n => n.title === "Carbohydrates")?.amount) || 0,
        fats: parseFloat(nutritionData.bad?.find(n => n.title === "Fat")?.amount) || 0,
        calories: parseFloat(nutritionData.bad?.find(n => n.title === "Calories")?.amount) || 0,
        image: recipeData?.image || "https://via.placeholder.com/150",
      };
    } catch (error) {
      console.error("Error fetching Spoonacular recipe:", error);
      return null;
    }
  };

  // Fetch OpenFoodFacts scanned meal item
  const fetchOpenFoodFactsItem = async (barcode) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (!data.product) return null;

      return {
        id: barcode,
        type: "scannedMeal",
        name: data.product.product_name || "Unknown Item",
        protein: data.product.nutriments?.proteins_serving || 0,
        carbs: data.product.nutriments?.carbohydrates_serving || 0,
        fats: data.product.nutriments?.fat_serving || 0,
        calories: data.product.nutriments?.["energy-kcal_serving"] || 0,
        image: data.product.image_url || "https://via.placeholder.com/150",
      };
    } catch (error) {
      console.error("Error fetching OpenFoodFacts item:", error);
      return null;
    }
  };

  // Load all meals and scanned items from Firestore
  const loadMeals = async () => {
    try {
      const docRef = doc(db, "LoginSignup", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { meals = [], scannedMeals = [], nutrition = { Protein: 0, Carbs: 0, Fats: 0 } } = docSnap.data();
        setNutritionData(nutrition); // Set current nutrition

        // Fetch both types of meals from APIs
        const recipeResults = await Promise.all(meals.map(fetchSpoonacularRecipe));
        const barcodeResults = await Promise.all(scannedMeals.map(fetchOpenFoodFactsItem));

        // Combine and filter valid results
        const allMeals = [...recipeResults, ...barcodeResults].filter(item => item !== null);
        setCombinedMeals(allMeals); // Update combined meal list
      }
    } catch (error) {
      console.error("Error loading meals:", error);
    } finally {
      setShowAnimation(false); // Hide loading animation
    }
  };

  // Handles swipe actions: either 'eat' or 'remove'
  const updateFirestoreAfterSwipe = async (meal, action) => {
    try {
      const docRef = doc(db, "LoginSignup", uid);
      const fieldToUpdate = meal.type === "scannedMeal" ? "scannedMeals" : "meals";

      // Remove meal ID from Firestore array
      await updateDoc(docRef, {
        [fieldToUpdate]: arrayRemove(meal.id),
      });

      // If action is "eat", update nutrition totals and calories
      if (action === "eat") {
        const userDocSnap = await getDoc(docRef);
        const { nutrition = { Protein: 0, Carbs: 0, Fats: 0 }, CurrentCalorie = 0 } = userDocSnap.data();

        const updatedNutrition = {
          Protein: Math.max(0, nutrition.Protein + meal.protein),
          Carbs: Math.max(0, nutrition.Carbs + meal.carbs),
          Fats: Math.max(0, nutrition.Fats + meal.fats),
        };
        const updatedCalories = Math.max(0, CurrentCalorie + meal.calories);

        await updateDoc(docRef, {
          nutrition: updatedNutrition,
          CurrentCalorie: updatedCalories,
        });

        setNutritionData(updatedNutrition); // Update UI with new totals
      }

      // Remove item from UI list
      setCombinedMeals(prev => prev.filter(m => m.id !== meal.id));
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }
  };

  // If meals are loading, show animated loader
  if (showAnimation) {
    return (
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../assets/Animation - 1741656998963.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.loadingText}>Loading Today's Meals...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Nutrition</Text>
          <View style={{ width: 24 }} /> 
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Nutrition Bar Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition Breakdown (grams)</Text>
            <BarChart
              data={{
                labels: ["Protein", "Carbs", "Fats"],
                datasets: [
                  {
                    data: [nutritionData.Protein, nutritionData.Carbs, nutritionData.Fats],
                    colors: [
                      (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                      (opacity = 1) => `rgba(72, 149, 239, ${opacity})`,
                      (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
                    ],
                  },
                ],
              }}
              width={screenWidth - 48}
              height={220}
              fromZero
              showValuesOnTopOfBars
              withInnerLines={true}
              chartConfig={{
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 1,
                barPercentage: 0.55,
                color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                propsForBackgroundLines: { strokeDasharray: "" },
                propsForLabels: { fontSize: 12 },
                style: { borderRadius: 16 },
              }}
              style={{ marginTop: 8, borderRadius: 16 }}
              accessor="data"
              horizontalLabelRotation={0}
              withHorizontalLabels={false}
            />
          </View>

          <Text style={styles.sectionTitle}>Your Meals</Text>

          {/* Empty state animations */}
          {nutritionData.Protein === 0 && nutritionData.Carbs === 0 && nutritionData.Fats === 0 && combinedMeals.length === 0 ? (
            <View style={styles.animationContainer}>
              <LottieView
                source={require('../assets/Nothing_to_show.json')}
                autoPlay
                loop
                style={{ width: 250, height: 250 }}
              />
              <Text style={styles.loadingText}>No meals yet. Start adding your food!</Text>
            </View>
          ) : combinedMeals.length === 0 ? (
            <View style={styles.animationContainer}>
              <LottieView
                source={require('../assets/MealComplete.json')}
                autoPlay
                loop={false}
                style={{ width: 250, height: 250 }}
              />
              <Text style={styles.loadingText}>🎉 All meals completed for today!</Text>
            </View>
          ) : (
            // Render swipeable cards for each meal
            combinedMeals.map((item) => (
              <Swipeable
                key={item.id}
                ref={(ref) => (swipeableRefs.current[item.id] = ref)}
                onSwipeableLeftOpen={() => updateFirestoreAfterSwipe(item, 'eat')}
                onSwipeableRightOpen={() => updateFirestoreAfterSwipe(item, 'remove')}
                renderLeftActions={() => (
                  <View style={[styles.swipeAction, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.swipeText}>✓ Eat</Text>
                  </View>
                )}
                renderRightActions={() => (
                  <View style={[styles.swipeAction, { backgroundColor: '#FF3B30' }]}>
                    <Text style={styles.swipeText}>🗑 Remove</Text>
                  </View>
                )}
              >
                <View style={styles.mealCard}>
                  <Image source={{ uri: item.image }} style={styles.mealImage} />
                  <View style={styles.mealDetails}>
                    <Text style={styles.mealTitle}>{item.name}</Text>
                    <Text style={styles.mealInfo}>Calories: {item.calories} kcal</Text>
                    <Text style={styles.mealInfo}>Protein: {item.protein}g</Text>
                    <Text style={styles.mealInfo}>Carbs: {item.carbs}g</Text>
                    <Text style={styles.mealInfo}>Fats: {item.fats}g</Text>
                  </View>
                </View>
              </Swipeable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};



// Styles for the component



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
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
  scrollView: { flex: 1 },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333333",
  },
  chart: {
    marginTop: 8,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 12,
    color: "#333",
  },
  mealCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  mealImage: {
    width: 100,
    height: 100,
  },
  mealDetails: {
    flex: 1,
    padding: 12,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  mealInfo: {
    fontSize: 14,
    color: "#666",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 100,
  },
  swipeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  animationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: "#555",
    marginTop: 10,
  },
});

export default NutritionTracker;
