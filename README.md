# 🏋️‍♂️ FitForge - Modern Fitness Tracking Web App

**FitForge** is a comprehensive, modern fitness tracking web application built with React and Firebase. Track your workouts, monitor progress, and achieve your fitness goals with an intuitive, mobile-first design.

[![Built with React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Powered by Firebase](https://img.shields.io/badge/Firebase-11.1.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Material-UI](https://img.shields.io/badge/Material--UI-6.3.1-0081CB?logo=mui&logoColor=white)](https://mui.com/)

## ✨ Features

### 🔐 **User Management**

- Secure authentication with Firebase Auth
- User registration and login
- Profile management with personal stats

### 🏃‍♂️ **Workout Tracking**

- **Start Workout**: Real-time workout tracking with background timer
- **Background Timer**: Timer continues running even when app is closed or phone is locked
- **Exercise Library**: Access to 800+ exercises via wger API
- **Quick Add**: Rapidly log exercises and sets
- **Workout Templates**: Save and reuse favorite workout routines

### 📊 **Progress & Analytics**

- **History**: Complete workout history with detailed logs
- **Progress Tracking**: Visual charts and statistics
- **Performance Metrics**: Track personal records and improvements
- **Weekly/Monthly Summaries**: Analyze your fitness journey

### 🎯 **Exercise Management**

- **Custom Exercises**: Create and manage personal exercises
- **Exercise Details**: Comprehensive exercise information
- **Muscle Group Filtering**: Find exercises by target muscles
- **Equipment-Based Search**: Filter by available equipment

### 📱 **Modern UI/UX**

- **Mobile-First Design**: Optimized for all devices
- **Dark Theme**: Easy on the eyes with modern aesthetics
- **Bottom Navigation**: Intuitive mobile navigation
- **Background Timer**: Web Worker-based timer that survives app switching
- **Wake Lock**: Keeps screen awake during workouts (when supported)
- **Push Notifications**: Workout reminders and completion alerts
- **Real-time Updates**: Live sync across devices
- **Offline Support**: Continue tracking without internet

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, JavaScript (ES6+)
- **UI Framework**: Material-UI (MUI) with custom theming
- **Backend**: Firebase (Authentication + Firestore)
- **Routing**: React Router DOM v7
- **State Management**: React Context API
- **API**: wger Exercise Database (Free & Open Source)
- **Icons**: React Icons (Material Design)
- **Date Handling**: date-fns
- **Build Tool**: Vite for fast development and builds

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Firebase account
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/fitForge_web.git
   cd fitForge_web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration

4. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔥 Firebase Configuration

### Firestore Database Structure

```
users/{userId}
├── email: string
├── displayName: string
├── createdAt: timestamp
└── preferences: object

workouts/{workoutId}
├── userId: string
├── name: string
├── date: timestamp
├── duration: number
├── exercises: array
└── completed: boolean

exercises/{exerciseId}
├── userId: string
├── name: string
├── category: string
├── muscleGroups: array
├── equipment: string
└── isCustom: boolean

workoutSessions/{sessionId}
├── userId: string
├── workoutId: string
├── startTime: timestamp
├── endTime: timestamp
├── exercises: array
└── totalVolume: number
```

### Security Rules

The app includes comprehensive Firestore security rules that ensure:

- Users can only access their own data
- Proper authentication is required for all operations
- Data validation and sanitization

## 📖 User Guide

### Getting Started

1. **Sign Up**: Create your account with email and password
2. **Complete Profile**: Add your personal information and fitness goals
3. **Explore**: Browse the exercise library to familiarize yourself with available exercises

### Creating Your First Workout

1. **Start Workout**: Tap the "Start Workout" button from the home screen
2. **Add Exercises**:
   - Use "Add Exercise" to browse the exercise library
   - Search by name, muscle group, or equipment
   - Select exercises and configure sets/reps/weight
3. **Track Progress**:
   - Use the built-in timer between sets
   - Log your actual performance for each set
   - Add notes for future reference
4. **Complete Workout**: Save your session when finished

### Using Workout Templates

1. **Create Template**: During or after a workout, save it as a template
2. **Quick Start**: Use templates to quickly start familiar routines
3. **Customize**: Modify templates as your fitness level improves

### Monitoring Progress

1. **History**: View all past workouts with detailed breakdowns
2. **Progress Charts**: Track improvements over time
3. **Personal Records**: See your best performances for each exercise
4. **Statistics**: Weekly and monthly summaries of your activity

### Managing Exercises

1. **Exercise Library**: Browse 800+ exercises with instructions
2. **Custom Exercises**: Create exercises specific to your routine
3. **Exercise Details**: View muscle groups, equipment needed, and instructions
4. **Favorites**: Mark frequently used exercises for quick access

## 💻 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Project Structure

```
src/
├── components/           # React components
│   ├── common/          # Reusable components
│   ├── workout/         # Workout-specific components
│   └── [pages].jsx      # Main page components
├── contexts/            # React Context providers
├── pages/               # Route implementations and page-specific UI
├── services/            # API services and utilities
├── theme/              # Material-UI theming
└── utils/              # Helper functions
```

### Code Style

- Follow React best practices and hooks patterns
- Use Material-UI components and theming system
- Implement proper error handling and loading states
- Write clean, documented code

## 🚀 Deployment

### Vercel

1. **Build and verify the production bundle**

   ```bash
   npm run build
   ```

2. **Import the repository into Vercel**

   Vercel reads the Vite build settings and SPA rewrites from `vercel.json`.

3. **Configure production environment variables**

   Add the required `VITE_*` values in the Vercel project settings before deploying.

4. **Deploy from Vercel**

   Use a preview deployment for review, then promote the approved deployment to production.

### Environment Variables for Production

Add production environment variables in the Vercel project settings. Do not commit `.env` or `.env.local`.

## 🔧 Troubleshooting

### Common Issues

**Firebase Connection Issues**

- Verify your Firebase configuration in `.env`
- Check Firebase project settings
- Ensure Firestore rules are properly configured

**Exercise API Not Loading**

- wger API is free but may have rate limits
- Check network connectivity
- Review browser console for API errors

**Build Errors**

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`
- Check for ESLint errors: `npm run lint`

**Authentication Issues**

- Verify Firebase Auth is enabled
- Check email/password provider is configured
- Review browser console for auth errors

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper commit messages
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow the existing code style and patterns
- Add proper error handling
- Update documentation for new features
- Test on multiple devices/browsers

<!-- ## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details. -->

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for backend infrastructure
- [Material-UI](https://mui.com/) for beautiful React components
- The open-source community for inspiration and tools

---

**Built with ❤️ for fitness enthusiasts worldwide**
