import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { auth } from '../firebaseConfig'; // Firebase auth instance
import { sendPasswordResetEmail } from 'firebase/auth'; // Firebase function to send password reset
import { useNavigation } from '@react-navigation/native'; // Navigation hook
import AsyncStorage from '@react-native-async-storage/async-storage'; // For storing/removing UID
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Icon library

const ForgotPasswordPage = () => {
  // State hooks for email input, error handling, and loading state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation(); // Hook for navigation

  // // Validates email format using regex
  // const validateEmail = (text) => {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   setEmail(text);

  //   // If input is empty, clear the error
  //   if (text.length === 0) {
  //     setEmailError('');
  //   } 
  //   // If invalid email format, show error
  //   else if (!emailRegex.test(text)) {
  //     setEmailError('Please enter a valid email address');
  //   } 
  //   // Otherwise, clear error
  //   else {
  //     setEmailError('');
  //   }
  // };

  // // Handles password reset submission
  // const handlePasswordReset = async () => {
  //   // If email is empty, show error
  //   if (!email) {
  //     setEmailError('Email is required');
  //     return;
  //   }

  //   // If an error already exists, block submission
  //   if (emailError) return;

  //   setIsSubmitting(true); // Show loading state
  //   try {
  //     // Send password reset email through Firebase
  //     await sendPasswordResetEmail(auth, email);
      
  //     // Remove UID from async storage (optional cleanup)
  //     await AsyncStorage.removeItem('uid');

  //     // Show success alert and redirect to Login page
  //     Alert.alert('Reset Email Sent', 'Check your inbox for password reset instructions.', [
  //       { text: 'OK', onPress: () => navigation.navigate('Login') },
  //     ]);
  //   } catch (error) {
  //     // Show error if Firebase call fails
  //     Alert.alert('Error', error.message);
  //   } finally {
  //     setIsSubmitting(false); // Stop loading state
  //   }
  // };

  const handlePasswordReset = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!email) {
      setEmailError('Email is required');
      return;
    }
  
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
  
    setEmailError('');
    setIsSubmitting(true);
  
    try {
      await sendPasswordResetEmail(auth, email);
      await AsyncStorage.removeItem('uid');
  
      Alert.alert('Reset Email Sent', 'Check your inbox for password reset instructions.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    // Handles keyboard behavior for different platforms
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Logo and App Name */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image source={require('../assets/Logo.png')} style={styles.logo} />
            </View>
            <Text style={styles.appName}>NutriTrack</Text>
          </View>

          {/* Password Reset Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive password reset instructions.
            </Text>

            {/* Email Input Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name='email-outline' size={20} color='#666' style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder='Enter your email'
                  value={email}
                  onChangeText={setEmail} // Validate on change
                  keyboardType='email-address'
                  autoCapitalize='none'
                  editable={!isSubmitting} // Disable input while submitting
                />
              </View>
              {/* Email Error Display */}
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.resetButton, isSubmitting && styles.resetButtonDisabled]}
              onPress={handlePasswordReset}
              disabled={isSubmitting}
            >
              <Text style={styles.resetButtonText}>
                {isSubmitting ? 'Sending...' : 'Send Reset Email'}
              </Text>
            </TouchableOpacity>

            {/* Back to Login Link */}
            <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.navigate('Login')}>
              <Icon name='arrow-left' size={16} color='#4895ef' />
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};


// Styles for the component

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
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
  logo: { width: 80, height: 80, resizeMode: 'contain' },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 16 },
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24, lineHeight: 22 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: { padding: 12 },
  input: { flex: 1, height: 48, fontSize: 16, color: '#333' },
  errorText: { color: '#e53935', fontSize: 14, marginTop: 4 },
  resetButton: {
    backgroundColor: '#4895ef',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  resetButtonDisabled: { backgroundColor: '#4895ef80' },
  resetButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  backToLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  backToLoginText: { color: '#4895ef', fontSize: 16, fontWeight: '600', marginLeft: 4 },
});

export default ForgotPasswordPage;