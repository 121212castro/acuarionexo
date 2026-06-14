import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = process.env.ACUARIONEXO_APP_URL || 'https://121212castro.github.io/acuarionexo/';

const config: CapacitorConfig = {
  appId: 'com.acuarionexo.app',
  appName: 'AcuarioNexo',
  webDir: 'web-fallback',
  server: {
    url: appUrl,
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      '121212castro.github.io',
      '*.supabase.co',
      'cdn.jsdelivr.net'
    ]
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#061523',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
