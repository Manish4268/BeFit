import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For storing UID locally
import { auth, db } from '../firebaseConfig.js'; // Firebase config
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'; // Firebase auth methods
import { doc, getDoc } from 'firebase/firestore'; // Firestore access
import { useNavigation } from '@react-navigation/native'; // Navigation hook
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Icon library

const LoginPage = () => {
  // State variables for email/password inputs, loading indicator, password visibility toggle
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true); // Used to prevent showing login screen while checking
  const navigation = useNavigation();
  const hasNavigatedRef = useRef(false); // Prevents navigation duplication

  // Check if user is already logged in via AsyncStorage or Firebase
  useEffect(() => {
    let unsubscribeAuth = null;

    const checkLoginStatus = async () => {
      try {
        const storedUID = await AsyncStorage.getItem('uid');
        
        // If UID exists in storage, skip login and go to HomePage
        if (storedUID) {
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigation.replace('HomePage', { uid: storedUID });
          }
          return;
        }

        // Listen for Firebase auth state changes
        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          if (user && !hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            const userDoc = await getDoc(doc(db, 'LoginSignup', user.uid));
            if (userDoc.exists()) {
              await AsyncStorage.setItem('uid', user.uid);
              navigation.replace('HomePage', { uid: user.uid });
            }
          }
        });
      } catch (error) {
        console.error('Login check error:', error);
      } finally {
        setIsCheckingLogin(false); // Hide loading screen
      }
    };

    checkLoginStatus();

    // Cleanup Firebase listener when component unmounts
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [navigation]);

  // Handles the login process when user presses "Login"
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Firebase login with email/password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store UID locally for session persistence
      await AsyncStorage.setItem('uid', user.uid);
      setLoading(false);

      // Navigate to HomePage
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigation.replace('HomePage', { uid: user.uid });
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
    }
  };

  // Show loader while checking login state
  if (isCheckingLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  return (
    // Adjusts layout based on keyboard visibility
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Dismiss keyboard on tap outside inputs */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Logo section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image source={require('../assets/Logo.png')} style={styles.logo} />
            </View>
            <Text style={styles.appName}>Track. Eat. Achieve.</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Login to Your Account</Text>

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
                  placeholderTextColor="#999"
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
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                {/* Toggle visibility of password */}
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Sign up</Text>
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
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
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
  passwordToggle: {
    padding: 12,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#4895ef',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#4895ef',
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    color: '#4895ef',
    fontWeight: '600',
  },
});

export default LoginPage;

