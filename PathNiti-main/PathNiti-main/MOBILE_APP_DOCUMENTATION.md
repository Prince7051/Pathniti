# PathNiti Mobile App Documentation

## Overview

This document provides comprehensive information about the PathNiti hybrid mobile application built with Capacitor.js. The mobile app reuses the existing Next.js web application codebase while adding mobile-specific features and optimizations.

## Architecture

### Technology Stack
- **Framework**: Next.js 15 with React 18
- **Mobile Wrapper**: Capacitor.js 7.x
- **Platforms**: Android & iOS
- **Database**: Supabase (same as web app)
- **Authentication**: Supabase Auth (same as web app)
- **Offline Storage**: IndexedDB + SQLite sync
- **State Management**: React Context + Hooks

### Key Features
- ✅ **Offline-First**: Works without internet connection
- ✅ **Push Notifications**: Native push notifications
- ✅ **Camera Integration**: Take photos for profiles
- ✅ **GPS/Location**: Find nearby colleges
- ✅ **Haptic Feedback**: Enhanced user experience
- ✅ **Background Sync**: Automatic data synchronization
- ✅ **PWA Support**: Installable web app

## Project Structure

```
/Users/deepakpandey/Sih/
├── src/
│   ├── lib/
│   │   ├── capacitor-service.ts      # Capacitor device integration
│   │   ├── offline-storage.ts        # Offline data management
│   │   └── mobile-api-service.ts     # API with offline support
│   ├── components/
│   │   ├── MobileProvider.tsx        # Mobile context provider
│   │   ├── MobileSplashScreen.tsx    # Custom splash screen
│   │   └── MobileOfflineIndicator.tsx # Offline status indicator
│   └── hooks/
│       └── useMobileApi.ts           # Mobile API hooks
├── android/                          # Android native project
├── ios/                              # iOS native project
├── public/
│   ├── sw-mobile.js                  # Mobile service worker
│   └── manifest.json                 # PWA manifest
├── capacitor.config.ts               # Capacitor configuration
└── env.capacitor.example             # Mobile environment variables
```

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the example environment file and configure your variables:
```bash
cp env.capacitor.example .env.capacitor
```

Edit `.env.capacitor` with your actual values:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 3. Build for Mobile
```bash
# Build the web app for mobile
npm run build:mobile

# Sync with Android
npm run sync:android

# Sync with iOS
npm run sync:ios
```

## Development Workflow

### Web Development
The web app continues to work exactly as before:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Mobile Development

#### Android
```bash
# Build and sync Android
npm run build:android

# Open in Android Studio
npm run open:android

# Run on device/emulator
npm run run:android
```

#### iOS
```bash
# Build and sync iOS
npm run build:ios

# Open in Xcode
npm run open:ios

# Run on device/simulator
npm run run:ios
```

## Mobile-Specific Features

### 1. Offline Support
- **Automatic Caching**: API responses are cached for offline access
- **Background Sync**: Data syncs when connection is restored
- **Offline Indicators**: Visual feedback for offline status
- **Queue Management**: Offline actions are queued and synced later

### 2. Push Notifications
- **Native Integration**: Uses device push notification services
- **Permission Handling**: Automatic permission requests
- **Custom Actions**: Notification actions for app navigation
- **Background Processing**: Notifications work when app is closed

### 3. Device Features
- **Camera**: Take photos for profiles and assessments
- **GPS**: Location-based college recommendations
- **Haptic Feedback**: Enhanced user interactions
- **Status Bar**: Custom status bar styling
- **Splash Screen**: Custom app launch experience

### 4. Performance Optimizations
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Optimized images for mobile
- **Bundle Splitting**: Smaller initial bundle size
- **Memory Management**: Efficient memory usage

## API Integration

### Mobile API Service
The `mobileApiService` provides offline-capable API calls:

```typescript
import { mobileApiService } from '@/lib/mobile-api-service';

// GET request with caching
const response = await mobileApiService.get('/colleges', 'colleges_cache');

// POST request with offline queuing
const result = await mobileApiService.post('/assessment', assessmentData);
```

### Mobile API Hooks
React hooks for easy API integration:

```typescript
import { useColleges, useAssessmentQuestions } from '@/hooks/useMobileApi';

function CollegesPage() {
  const { data: colleges, loading, error, offline, cached } = useColleges();
  
  return (
    <div>
      {offline && <OfflineIndicator />}
      {cached && <CachedIndicator />}
      {/* Render colleges */}
    </div>
  );
}
```

## Offline Storage

### IndexedDB Structure
- **offline_data**: Queued API requests for sync
- **cached_data**: Cached API responses
- **user_data**: User preferences and settings

### Sync Process
1. **Store Offline**: Non-GET requests are stored locally
2. **Background Sync**: Automatic sync when online
3. **Conflict Resolution**: Last-write-wins strategy
4. **Error Handling**: Failed syncs are retried

## Configuration

### Capacitor Configuration
The `capacitor.config.ts` file contains mobile-specific settings:

```typescript
const config: CapacitorConfig = {
  appId: 'com.pathniti.app',
  appName: 'PathNiti',
  webDir: 'out',
  plugins: {
    SplashScreen: { /* splash screen config */ },
    PushNotifications: { /* push config */ },
    StatusBar: { /* status bar config */ },
    // ... other plugins
  },
};
```

### Platform-Specific Settings

#### Android (AndroidManifest.xml)
- Camera permissions
- Location permissions
- Network permissions
- Push notification permissions

#### iOS (Info.plist)
- Camera usage description
- Location usage description
- Background modes
- App transport security

## Building & Deployment

### Development Build
```bash
# Build for development
npm run build:mobile
npm run sync:android  # or sync:ios
```

### Production Build
```bash
# Build for production
CAPACITOR_BUILD=true npm run build
npm run sync:android  # or sync:ios
```

### App Store Deployment

#### Android (Google Play Store)
1. Build release APK/AAB in Android Studio
2. Sign with release keystore
3. Upload to Google Play Console
4. Configure store listing and pricing

#### iOS (App Store)
1. Build release in Xcode
2. Archive and upload to App Store Connect
3. Configure app information and pricing
4. Submit for review

## Testing

### Web Testing
```bash
npm run test              # Run unit tests
npm run test:coverage     # Run with coverage
npm run test:watch        # Watch mode
```

### Mobile Testing
- **Android**: Use Android Studio emulator or physical device
- **iOS**: Use Xcode simulator or physical device
- **Cross-platform**: Test on both platforms for consistency

### Offline Testing
1. Disable network connection
2. Test app functionality
3. Re-enable network
4. Verify data sync

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next out node_modules
npm install
npm run build:mobile
```

#### Sync Issues
```bash
# Clean and resync
npx cap clean
npm run sync:android  # or sync:ios
```

#### Permission Issues
- Check AndroidManifest.xml for required permissions
- Verify Info.plist has proper usage descriptions
- Test permission requests on device

### Debug Mode
Enable debug logging:
```typescript
// In capacitor-service.ts
console.log('Debug mode enabled');
```

## Performance Monitoring

### Metrics to Track
- **App Launch Time**: Time to first screen
- **API Response Times**: Network request performance
- **Offline Sync Success**: Sync completion rates
- **Memory Usage**: App memory consumption
- **Battery Usage**: Power consumption impact

### Tools
- **Android**: Android Studio Profiler
- **iOS**: Xcode Instruments
- **Web**: Chrome DevTools
- **Analytics**: Firebase Analytics (optional)

## Security Considerations

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Secure Storage**: Use device secure storage for tokens
- **Network Security**: HTTPS for all API calls
- **Input Validation**: Validate all user inputs

### Privacy
- **Permissions**: Request only necessary permissions
- **Data Collection**: Transparent data usage
- **User Consent**: Clear consent for data processing
- **GDPR Compliance**: European privacy regulations

## Future Enhancements

### Planned Features
- **Voice Recognition**: Voice-based assessments
- **AR Integration**: Augmented reality features
- **Biometric Auth**: Fingerprint/face recognition
- **Advanced Analytics**: User behavior tracking
- **Multi-language**: Internationalization support

### Performance Improvements
- **Code Splitting**: Further bundle optimization
- **Image Compression**: Advanced image optimization
- **Lazy Loading**: More aggressive lazy loading
- **Caching Strategy**: Improved caching algorithms

## Support & Maintenance

### Regular Maintenance
- **Dependency Updates**: Keep packages updated
- **Security Patches**: Apply security updates
- **Performance Monitoring**: Monitor app performance
- **User Feedback**: Address user issues

### Contact Information
- **Technical Issues**: Check GitHub issues
- **Feature Requests**: Submit via GitHub
- **Documentation**: Update this file as needed

## Conclusion

The PathNiti mobile app successfully extends the web application with native mobile features while maintaining code reusability and consistency. The offline-first approach ensures users can access the app even without internet connectivity, while the hybrid architecture allows for rapid development and deployment across multiple platforms.

For additional support or questions, please refer to the Capacitor.js documentation or create an issue in the project repository.
