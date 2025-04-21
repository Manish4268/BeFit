import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import axios from "axios"; // For making API requests
import { db } from "../firebaseConfig.js"; // Firebase Firestore instance
import { getDoc, doc, setDoc } from "firebase/firestore"; // Firestore methods
import LottieView from "lottie-react-native"; // For loading animations
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // For icons

// Predefined meal categories
const categories = ["CBUM", "Ketogenic", "Vegetarian", "Vegan"];

// Main screen component
const IntermediatePage = ({ navigation, route }) => {
  const [selectedCategory, setSelectedCategory] = useState("Vegetarian"); // Default diet category
  const { uid } = route.params; // Get user ID from route params
  const [meals, setMeals] = useState([]); // Holds fetched meal plans
  const [calories, setCalories] = useState(2000); // Default calorie goal
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch user data from Firestore, especially their calorie goal
  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "LoginSignup", uid)); // Get user document
      if (userDoc.exists()) {
        setCalories(userDoc.data().CalorieGoal || 2000); // Update calorie goal
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  // Fetch meal plan from Spoonacular API based on calorie goal and selected diet
  const fetchDietPlan = useCallback(async () => {
    setError(null);
    try {
      const response = await axios.get(
        `https://api.spoonacular.com/mealplanner/generate`,
        {
          params: {
            apiKey: "d2107fee2fc4449da135e42aa7c2ec9e", // API key
            targetCalories: calories,
            diet: selectedCategory === "CBUM" ? "Whole30" : selectedCategory.toLowerCase(), // Handle "CBUM" case
            time: Date.now(), // Prevent caching by appending current timestamp
          },
        }
      );

      // Convert response to iterable format
      const rawData = Object.entries(response.data.week);

      // Store unique plans using a Map (to avoid duplicate plans)
      const uniquePlans = new Map();

      rawData.forEach(([_, data], index) => {
        const mealKey = data.meals.map(meal => meal.id).join('-'); // Unique key from meal IDs

        if (!uniquePlans.has(mealKey)) {
          uniquePlans.set(mealKey, {
            day: `Meal Plan ${uniquePlans.size + 1}`,
            meals: data.meals,
            nutrients: data.nutrients,
          });
        }
      });

      setMeals(Array.from(uniquePlans.values())); // Save to state
    } catch (error) {
      setError("Failed to fetch meal plan. Please try again later.");
    }
  }, [selectedCategory, calories]);

  // Adds selected meal plan to Firestore under user's document
  const addMealtoDay = async (item) => {
    if (!item || !item.meals || !Array.isArray(item.meals)) return;

    const mealIds = item.meals.map((meal) => meal.id); // Extract meal IDs

    try {
      const userDocRef = doc(db, "LoginSignup", uid);
      const userDoc = await getDoc(userDocRef);

      // Prevent duplicate meal plan addition
      if (userDoc.exists() && userDoc.data().meals?.length > 0) {
        alert("Your meals have already been set.");
        return;
      }

      // Save meals to Firestore (merge to keep existing data)
      await setDoc(userDocRef, { meals: mealIds }, { merge: true });
      alert("Meal plan successfully added!");
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }
  };

  // Fetches user data and diet plans on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchUserData(); // First, get calorie goal
        await fetchDietPlan(); // Then fetch diet plan
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      loadData(); // Load data only if user ID is valid
    } else {
      console.error("User ID is undefined.");
    }
  }, [uid, fetchDietPlan]);

  // Show loading animation while fetching data
  if (loading) {
    return (
      <View style={styles.animationContainer}>
        <View style={styles.animationInner}>
          <LottieView
            source={require("../assets/Animation - 1741656998963.json")}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.loadingText}>Loading your diet plan...</Text>
        </View>
      </View>
    );
  }

  // Main screen layout
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diet Plan Selection</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Category Selector */}
      <FlatList
        ListHeaderComponent={
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category && styles.selectedCategory,
                  ]}
                  onPress={() => setSelectedCategory(category)} // Update selected diet
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.selectedCategoryText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }

        // Meal plans list
        data={meals}
        keyExtractor={(item, index) => `day-${index}`}
        renderItem={({ item }) => (
          <View style={styles.mealPlanCard}>
            <View style={styles.mealPlanHeader}>
              <View>
                <Text style={styles.mealPlanTitle}>{item.day}</Text>
                <Text style={styles.mealPlanCalories}>
                  {item.nutrients.calories.toFixed(0)} kcal
                </Text>
              </View>

              {/* Add meal plan button */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addMealtoDay(item)}
              >
                <Text style={styles.addButtonText}>Add Plan</Text>
              </TouchableOpacity>
            </View>

            {/* Macronutrients summary */}
            <Text style={styles.nutrients}>
              Carbs: {item.nutrients.carbohydrates.toFixed(1)}g | Protein:{" "}
              {item.nutrients.protein.toFixed(1)}g | Fat:{" "}
              {item.nutrients.fat.toFixed(1)}g
            </Text>

            {/* Nested meal list */}
            <FlatList
              data={item.meals}
              keyExtractor={(meal, index) => `${item.day}-${meal.id}-${index}`}
              renderItem={({ item: meal }) => (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("RecipeDetail", {
                      id: meal.id,
                      title: meal.title,
                    })
                  }
                  style={styles.mealCard}
                >
                  <Image
                    source={{
                      uri: `https://spoonacular.com/recipeImages/${meal.id}-312x231.jpg`,
                    }}
                    style={styles.mealImage}
                  />
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
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
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  backButton: { padding: 4 },
  placeholder: { width: 24 },
  scrollContent: { paddingBottom: 20, paddingHorizontal: 16 },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  categoryContainer: {
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCategory: {
    backgroundColor: "#4895ef",
    borderColor: "#4895ef",
  },
  categoryText: {
    fontSize: 16,
    color: "#666",
  },
  selectedCategoryText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  mealPlanContainer: { gap: 16, paddingBottom: 32 },
  mealPlanCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  mealPlanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 12,
  },
  mealPlanTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  mealPlanCalories: { fontSize: 14, color: "#666", marginTop: 4 },
  nutrients: { fontSize: 14, color: "#444", marginBottom: 12 },
  addButton: {
    backgroundColor: "#4895ef",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    overflow: "hidden",
  },
  mealImage: {
    width: 80,
    height: 60,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
    color: "#333",
    flex: 1,
    flexWrap: "wrap",
  },
  errorText: { color: "red", fontSize: 16, textAlign: "center", marginVertical: 12 },
  animationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  animationInner: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    color: "#555",
    textAlign: "center",
  },
});

export default IntermediatePage;
