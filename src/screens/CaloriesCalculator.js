// Import necessary modules and components from React, React Native, Firebase, and icons
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { db } from '../firebaseConfig'; // Firebase Firestore config
import { doc, setDoc } from 'firebase/firestore'; // Firestore methods
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Icons

// Main functional component
const CalorieCalculator = ({ route, navigation }) => {
  const { uid } = route.params; // Get user ID passed via route

  // State hooks for input and calculated values
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [calories, setCalories] = useState(null);
  const [calorieGoal, setCalorieGoal] = useState('');

  // Calculates BMR and total daily calorie needs based on input
  const calculateBMR = () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age, 10);

    // Input validation
    if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    // BMR formula based on gender
    let bmr =
      gender === 'male'
        ? 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5
        : 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;

    // Activity level multipliers
    const activityMultiplier = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    // Calculate total calories using BMR and activity level
    const totalCalories = bmr * (activityMultiplier[activityLevel] || 1.2);
    setCalories(totalCalories); // Store result in state
  };

  // Saves the user's selected calorie goal to Firestore
  const handleSetGoal = async () => {
    if (!calorieGoal || calorieGoal <= 0) {
      Alert.alert('Error', 'Please enter a valid calorie goal');
      return;
    }

    try {
      if (!uid) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      // Save calorie goal to Firestore under user's document
      await setDoc(
        doc(db, 'LoginSignup', uid),
        { CalorieGoal: parseInt(calorieGoal) },
        { merge: true } // merge to avoid overwriting other fields
      );

      Alert.alert('Success', 'Calorie goal set successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header section with back button and title */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calorie Calculator</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Wraps keyboard interactions for proper view shifting */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.card}>
            {/* Input fields for weight, height, and age */}
            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
            <TextInput
              style={styles.input}
              placeholder="Height (cm)"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            {/* Gender selection */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionContainer}>
              {['male', 'female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.option, gender === g && styles.selectedOption]}
                >
                  <Text style={[styles.optionText, gender === g && styles.selectedText]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Activity level selection */}
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.optionContainer}>
              {['Sedentary', 'Light', 'Moderate', 'Active', 'VeryActive'].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setActivityLevel(level)}
                  style={[styles.option, activityLevel === level && styles.selectedOption]}
                >
                  <Text style={[styles.optionText, activityLevel === level && styles.selectedText]}>
                    {level.replace(/([A-Z])/g, ' $1')} {/* Add space before capital letters */}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Button to calculate BMR */}
            <TouchableOpacity style={styles.calculateButton} onPress={calculateBMR}>
              <Text style={styles.calculateButtonText}>Calculate</Text>
            </TouchableOpacity>
          </View>

          {/* Results display if calculation has been done */}
          {calories && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Your Results</Text>
              <Text style={styles.resultText}>Maintenance: {Math.round(calories)} kcal</Text>
              <Text style={styles.resultText}>To Lose Weight: {Math.round(calories - 500)} kcal</Text>
              <Text style={styles.resultText}>To Gain Weight: {Math.round(calories + 500)} kcal</Text>

              {/* Input field to set personal calorie goal */}
              <TextInput
                style={styles.input}
                placeholder="Set your Calorie Goal"
                keyboardType="numeric"
                value={calorieGoal}
                onChangeText={setCalorieGoal}
              />

              {/* Button to save goal */}
              <TouchableOpacity style={styles.goalButton} onPress={handleSetGoal}>
                <Text style={styles.calculateButtonText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollView: { paddingBottom: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  placeholder: { width: 24 },
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
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 8,
    color: "#333",
  },
  optionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  option: {
    width: "48%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: "#4895ef10",
    borderColor: "#4895ef",
  },
  optionText: {
    fontSize: 14,
    color: "#666",
  },
  selectedText: {
    color: "#4895ef",
    fontWeight: "600",
  },
  calculateButton: {
    backgroundColor: "#4895ef",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  calculateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultCard: {
    marginHorizontal: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    textAlign: "center",
  },
  resultText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 6,
    textAlign: "center",
  },
  goalButton: {
    backgroundColor: "#4895ef",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
});

export default CalorieCalculator;


