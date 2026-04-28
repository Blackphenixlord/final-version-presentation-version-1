import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nasa.hunch.dslm',
  appName: 'DSLM NASA HUNCH',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.45:8080',
    cleartext: true,
  },
};

export default config;
