import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit'; // For displaying calorie progress
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Navigation hooks
import { doc, getDoc } from 'firebase/firestore'; // Firestore methods
import { db, auth } from '../firebaseConfig.js'; // Firebase config
import AsyncStorage from '@react-native-async-storage/async-storage'; // Local storage
import { signOut } from 'firebase/auth'; // Firebase logout
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Icons
import LottieView from 'lottie-react-native'; // Lottie animation
import { SafeAreaView } from 'react-native'; // Handles notches and safe screen area

// Get screen width for chart sizing
const screenWidth = Dimensions.get('window').width;

// Main component
const CalorieTracker = ({ route }) => {
  const { uid } = route.params; // Get user ID from navigation route
  const [name, setName] = useState(null); // User name
  const [calorieGoal, setCalorieGoal] = useState(0); // Daily calorie goal
  const [currentCalorie, setCurrentCalorie] = useState(0); // Calories consumed today
  const [loading, setLoading] = useState(true); // Loading state
  const navigation = useNavigation();
  const isFetchingRef = useRef(false); // Prevents duplicate fetch calls
  const lottieRef = useRef(null); // Ref for playing Lottie animation

  // Logic to determine if user hit or exceeded goal
  const isOver = currentCalorie >= calorieGoal;
  const overDiff = currentCalorie - calorieGoal;
  const showHurray = isOver && overDiff <= 100; // Show confetti when goal reached but not far exceeded
  const showOverConsumed = isOver && overDiff > 100; // Show warning when exceeded by a lot

  // Play celebration animation if goal was reached
  useEffect(() => {
    if (showHurray && lottieRef.current) {
      setTimeout(() => lottieRef.current?.play(), 100);
    }
  }, [showHurray]);

  // Replay animation when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (showHurray && lottieRef.current) {
        lottieRef.current.play();
      }
    }, [showHurray])
  );

  // Fetch user data from Firestore
  const fetchUserData = async () => {
    if (isFetchingRef.current) return; // Skip if already fetching
    isFetchingRef.current = true;

    try {
      const userDoc = await getDoc(doc(db, 'LoginSignup', uid)); // Get user doc
      if (userDoc.exists()) {
        setName(userDoc.data().name || 'Guest');
        setCalorieGoal(userDoc.data().CalorieGoal || 0);
        setCurrentCalorie(userDoc.data().CurrentCalorie || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [uid])
  );

  // Logs out the user and clears local storage
  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('uid');
      navigation.replace('Login'); // Navigate to login screen
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  // Prepare data for the PieChart based on user status
  const pieData =
    calorieGoal > 0 && !isOver
      ? [
          {
            name: 'Consumed',
            value: currentCalorie,
            color: '#8641F4',
            legendFontColor: '#000',
            legendFontSize: 12,
          },
          {
            name: 'Remaining',
            value: calorieGoal - currentCalorie,
            color: '#C9A7F5',
            legendFontColor: '#000',
            legendFontSize: 12,
          },
        ]
      : [
          {
            name: 'Goal',
            value: calorieGoal,
            color: '#8641F4',
            legendFontColor: '#000',
            legendFontSize: 12,
          },
          {
            name: 'Over',
            value: overDiff,
            color: '#F44336',
            legendFontColor: '#000',
            legendFontSize: 12,
          },
        ];

  // Show loading spinner while fetching user data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          
          {/* Welcome Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Welcome, {name || 'Guest'}</Text>
          </View>

          {/* Calorie Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calorie Progress</Text>

            <View style={styles.chartWrapper}>
              {/* Display chart or messages based on calorie status */}
              {calorieGoal > 0 ? (
                showHurray ? (
                  <View style={styles.animationContainer}>
                    <LottieView
                      ref={lottieRef}
                      source={require('../assets/hurray.json')}
                      autoPlay={false}
                      loop={false}
                      style={{ width: 200, height: 200 }}
                    />
                    <Text style={styles.loadingText}>🎉 Goal Completed!</Text>
                  </View>
                ) : showOverConsumed ? (
                  <View style={styles.overContainer}>
                    <PieChart
                      data={pieData}
                      width={screenWidth - 40}
                      height={190}
                      chartConfig={chartConfig}
                      accessor="value"
                      backgroundColor="transparent"
                      paddingLeft="20"
                      absolute
                    />
                    <Text style={styles.overText}>
                      🚨 Over Consumed by {overDiff} kcal
                    </Text>
                  </View>
                ) : (
                  <PieChart
                    data={pieData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="value"
                    backgroundColor="transparent"
                    paddingLeft="20"
                    absolute
                  />
                )
              ) : (
                <Text style={styles.noDataText}>
                  No data yet. Set your calorie goal using the Calorie Calculator and start tracking your intake!
                </Text>
              )}
            </View>

            {/* Calorie Stats */}
            <View style={styles.calorieInfoContainer}>
              <Text style={styles.calorieText}>
                <Text style={styles.boldText}>Goal:</Text> {calorieGoal} kcal
              </Text>
              <Text style={styles.calorieText}>
                <Text style={styles.boldText}>Remaining:</Text> {Math.max(0, calorieGoal - currentCalorie)} kcal
              </Text>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("TodayMeal", { uid })}>
              <Ionicons name="restaurant" size={22} color="#333" />
              <Text style={styles.buttonText}>Today's Meals</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("CalorieCalcultor", { uid })}>
              <MaterialCommunityIcons name="calculator" size={22} color="#333" />
              <Text style={styles.buttonText}>Calorie Calculator</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Diet Plan Selection", { uid })}>
              <Ionicons name="nutrition" size={22} color="#333" />
              <Text style={styles.buttonText}>Diet Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ScanItem", { uid })}>
              <Ionicons name="barcode" size={22} color="#333" />
              <Text style={styles.buttonText}>Scan Item</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
              <Ionicons name="exit-outline" size={22} color="#333" />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// Chart style configuration
const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#8884d8",
  },
};


// Styles for the component

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
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
    color: "#333",
    textAlign: "center",
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  calorieInfoContainer: {
    marginTop: 8,
  },
  calorieText: {
    fontSize: 16,
    color: "#444",
    marginTop: 4,
  },
  boldText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  animationContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#4CAF50",
  },
  overContainer: {
    alignItems: 'center',
  },
  overText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
  },
  noDataText: {
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    paddingBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    borderColor: '#ff4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CalorieTracker;









