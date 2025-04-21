import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image
} from 'react-native';
import { auth, db } from '../firebaseConfig.js'; // Firebase auth and Firestore config
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth'; // Firebase auth methods
import { doc, setDoc } from 'firebase/firestore'; // Firestore methods
import { useNavigation } from '@react-navigation/native'; // Navigation hook
import AsyncStorage from '@react-native-async-storage/async-storage'; // Local storage
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Icon library

const SignupPage = () => {
  // Input and state hooks
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true); // Toggle password visibility
  const [loading, setLoading] = useState(false); // Show spinner when submitting
  const navigation = useNavigation();

  // Handles user registration logic
  const handleSignup = async () => {
    // Basic field validation
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Enforce password length
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true); // Start loading spinner
    try {
      // Create user using Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile display name
      await updateProfile(user, { displayName: name });

      // Create user record in Firestore
      await setDoc(doc(db, 'LoginSignup', user.uid), {
        name: name,
        email: email,
        CalorieGoal: 0,
        CurrentCalorie: 0,
        WeeklyCalories: [0, 0, 0, 0, 0, 0, 0],
        meals: [],
        scannedMeals: [],
        nutrition: {
          Protein: 0,
          Fats: 0,
          Carbs: 0,
        }
      });

      // Remove UID in case it's leftover from previous session
      await AsyncStorage.removeItem('uid');

      // Sign out user to ensure fresh login next time
      await signOut(auth);
      setLoading(false);

      // Notify user and redirect to login
      Alert.alert('Success', 'Account created successfully! Please log in.');
      navigation.replace('Login');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
    }
  };

  return (
    // Pushes form up when keyboard is active
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      {/* Allows tap outside to dismiss keyboard */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Logo and Branding */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image source={require('../assets/Logo.png')} style={styles.logo} />
            </View>
            <Text style={styles.appName}>Track. Eat. Achieve.</Text>
          </View>

          {/* Signup Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Icon name="account-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword} // Mask input when toggle is off
                  autoCapitalize="none"
                />
                {/* Toggle visibility icon */}
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
            </TouchableOpacity>

            {/* Redirect to login if user already has account */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};


// Styles for the component


  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#333",
  },
  passwordToggle: {
    padding: 12,
  },
  signupButton: {
    backgroundColor: "#4895ef",
    borderRadius: 8,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  signupButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: "#666",
  },
  loginLink: {
    fontSize: 16,
    color: "#4895ef",
    fontWeight: "600",
  },
});

export default SignupPage;

