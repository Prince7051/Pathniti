# PathNiti Mobile App - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Android Studio (for Android) or Xcode (for iOS)
- Your Supabase credentials

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp env.capacitor.example .env.capacitor

# Edit with your actual values
nano .env.capacitor
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 3. Build for Mobile
```bash
# For Android
npm run mobile:build android

# For iOS
npm run mobile:build ios
```

### 4. Open in IDE
```bash
# For Android (opens Android Studio)
npm run mobile:open android

# For iOS (opens Xcode)
npm run mobile:open ios
```

### 5. Run on Device/Emulator
```bash
# For Android
npm run mobile:run android

# For iOS
npm run mobile:run ios
```

## 📱 Available Commands

| Command | Description |
|---------|-------------|
| `npm run mobile:build android` | Build and sync for Android |
| `npm run mobile:build ios` | Build and sync for iOS |
| `npm run mobile:sync android` | Sync web app to Android |
| `npm run mobile:sync ios` | Sync web app to iOS |
| `npm run mobile:open android` | Open Android Studio |
| `npm run mobile:open ios` | Open Xcode |
| `npm run mobile:run android` | Run on Android device/emulator |
| `npm run mobile:run ios` | Run on iOS device/simulator |

## 🔧 Development Workflow

### Web Development (Unchanged)
```bash
npm run dev          # Start web development server
npm run build        # Build for web production
npm run start        # Start web production server
```

### Mobile Development
```bash
# 1. Make changes to your web app
# 2. Build for mobile
npm run mobile:build android

# 3. Test on device
npm run mobile:run android
```

## 📋 What's Included

### ✅ Mobile Features
- **Offline Support**: Works without internet
- **Push Notifications**: Native notifications
- **Camera Integration**: Take photos
- **GPS/Location**: Find nearby colleges
- **Haptic Feedback**: Enhanced UX
- **Background Sync**: Auto-sync when online

### ✅ Preserved Web Features
- **Authentication**: Same Supabase auth
- **Database**: Same Supabase database
- **APIs**: All existing API endpoints
- **UI Components**: All React components
- **Styling**: Same Tailwind CSS

## 🐛 Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf .next out node_modules
npm install
npm run mobile:build android
```

### Sync Issues
```bash
# Clean and resync
npx cap clean
npm run mobile:sync android
```

### Permission Issues
- **Android**: Check `android/app/src/main/AndroidManifest.xml`
- **iOS**: Check `ios/App/App/Info.plist`

## 📚 Next Steps

1. **Read Full Documentation**: See `MOBILE_APP_DOCUMENTATION.md`
2. **Test Offline Features**: Disable network and test app
3. **Configure Push Notifications**: Set up FCM/APNS
4. **Deploy to App Stores**: Follow deployment guide

## 🆘 Need Help?

- **Documentation**: `MOBILE_APP_DOCUMENTATION.md`
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Issues**: Create GitHub issue
- **Support**: Check project README

---

**🎉 You're ready to build mobile apps with PathNiti!**
