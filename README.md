# 🏋️‍♂️ BeFit – Track. Eat. Achieve.

BeFit is a **React Native** application that helps users monitor their nutrition and achieve their fitness goals through personalized meal planning and real-time calorie tracking. Developed to work seamlessly across **Android**, **iOS**, and **Web**, BeFit brings a unified experience using **Firebase**, external **food APIs**, and native device capabilities.

---

## 📱 Key Features

- 🔐 **Firebase Authentication** – Secure login/signup with persistent local session storage.
- 📊 **Calorie Tracker** – Dynamic pie/bar charts for daily nutrition visualization.
- 🍽️ **Personalized Meal Plans** – Powered by the Spoonacular API based on dietary preferences and goals.
- 📷 **Barcode Scanner** – Uses device camera to fetch food data from OpenFoodFactory API.
- 🔁 **Swipe Gestures** – Swipe right to mark a meal as eaten, swipe left to remove.
- ⚙️ **Cross-Platform** – Runs on iOS, Android, and the Web thanks to React Native.

---

## 🔧 Technologies Used

- **React Native**
- **Firebase (Authentication + Firestore)**
- **AsyncStorage** for local session handling
- **Spoonacular API** – Meal planning
- **OpenFoodFactory API** – Barcode-based food scanning
- **React Native Camera / Barcode Scanner**
- **React Native Charts** – Nutrient breakdown visualizations

---

## 🌟 User Experience Enhancements

- 🍪 Custom launch screen animation (cookie crumbs)
- 🤸 Smooth gesture-based meal management
- 📈 Graphs update dynamically when meals are logged
- 🕛 Daily calorie reset at midnight (via Firebase functions)
- 🧠 Iterative UI design process based on mockups and TA feedback

---

## 🧪 Challenges & Solutions

### 1. Barcode Scanner Import Error  
**Issue**: Scanner module failed due to incorrect import syntax in documentation.  
**Fix**: Corrected import after consulting community forums.

### 2. Homepage Rendered Twice  
**Issue**: Firebase's `onAuthStateChanged` caused repeated navigation.  
**Fix**: Used a `hasNavigatedRef` flag to prevent double navigation.

### 3. Repeated Meals in Plan  
**Issue**: Spoonacular returned cached data causing duplicates.  
**Fix**: Appended timestamp in API calls and used a `Map` to deduplicate meals.

### 4. Midnight Reset  
Implemented auto-reset of calorie count at 12 AM using Firebase rules.

---

## 📸 UI Mockups vs Real App Screens

- Minimal differences between mockups and final implementation
- Improved login/signup by simplifying form fields and adding Forgot Password
- Separated calorie graphs into different screens for a cleaner UI
- Today's Meal page has dynamic graph interactions + gesture controls
- Scan page removes manual trigger for better UX

---

## 💡 Developer Reflection

> _"BeFit pushed me to grow as a full-stack mobile developer. From Firebase to UI design, this project taught me how to balance functionality with user-friendly interfaces. I overcame multiple technical roadblocks and polished my skills in both frontend and backend mobile development."_ – **Manish Jadhav**

---

## 🚀 How to Run the App

1. Clone the repository  
2. Run `npm install`  
3. Add your Firebase config and API keys  
4. Start development server:  
   ```bash
   npx expo start
   ```

---

## 👨‍💻 Developer

**Manish Shankar Jadhav**  
📧 mn649712@dal.ca

---

## 📚 References

1. Y. Zhang et al., "Smart Nutrition Monitoring in mHealth Apps", IEEE, 2019  
2. J. Lee et al., "Mobile Diet App Using Barcode", ICCE, 2015  
3. B. Persson, "Integrating Firebase in Mobile Apps", iJIM, 2021  
4. A. R. Mohammad, "Food Recommendation Using ML", ICCCEEE, 2020
