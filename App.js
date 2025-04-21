import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import IntermediatePage from "./src/screens/DietPlan"
import RecipeDetail from "./src/screens/RecipeDetail"
import HomePage from "./src/screens/HomePage"
import ScanItem from "./src/screens/ScanItem"
import CalorieCalcultor from "./src/screens/CaloriesCalculator"
import SignUp from "./src/screens/SignUp"
import Login from "./src/screens/LoginPage"
import TodayMeal from "./src/screens/TodayMeal"
import ForgotPassword from "./src/screens/ForgotPasswordPage"

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/>
        <Stack.Screen name="TodayMeal" component={TodayMeal} options={{ headerShown: false }}/>
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }}/>
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }}/>
        <Stack.Screen name="HomePage" component={HomePage}  options={{ gestureEnabled: false, headerShown: false }}/>
        <Stack.Screen name="CalorieCalcultor" component={CalorieCalcultor} options={{ headerShown: false }}/>
        <Stack.Screen name="ScanItem" component={ScanItem} options={{ headerShown: false }}/>
        <Stack.Screen name="Diet Plan Selection" component={IntermediatePage} options={{ headerShown: false }}/>
        <Stack.Screen name="RecipeDetail" component={RecipeDetail}  options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
