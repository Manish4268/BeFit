import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  Image,
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";

const screenWidth = Dimensions.get("window").width;

const RecipeDetail = ({ route, navigation }) => {
  const { id, title } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
          params: {
            apiKey: "859cdd5d9af44e28ac186e6888663564",
          },
        });
        setRecipe(response.data);
      } catch (error) {
        console.error("Error fetching recipe details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {String(recipe?.title || title || "Recipe")}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView}>
          {recipe && (
            <View style={styles.card}>
              <Image source={{ uri: recipe.image }} style={styles.image} />

              <View style={styles.detailsRow}>
                <View style={styles.detailBadge}>
                  <Icon name="clock-outline" size={18} color="#4895ef" />
                  <Text style={styles.detailText}>
                    {String(recipe?.readyInMinutes ?? "N/A")} mins
                  </Text>
                </View>
                <View style={styles.detailBadge}>
                  <Icon name="account-group-outline" size={18} color="#4895ef" />
                  <Text style={styles.detailText}>
                    Serves {String(recipe?.servings ?? "N/A")}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Ingredients</Text>
              {Array.isArray(recipe?.extendedIngredients) &&
                recipe.extendedIngredients.map((ingredient, index) => (
                  <View key={`${ingredient?.id ?? index}`} style={styles.ingredientRow}>
                    <Icon name="circle-small" size={20} color="#4895ef" />
                    <Text style={styles.ingredientText}>
                      {String(ingredient?.original ?? "Unknown ingredient")}
                    </Text>
                  </View>
                ))}

              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text style={styles.instructions}>
                {String(
                  recipe.instructions?.replace(/(<([^>]+)>)/gi, "") || "No instructions available."
                )}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
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
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  detailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4895ef20",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#4895ef",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 10,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ingredientText: {
    fontSize: 15,
    color: "#444",
  },
  instructions: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    marginTop: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RecipeDetail;
