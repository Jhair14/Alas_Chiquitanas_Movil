module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '**/_tests_/**/*.test.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|@testing-library|@apollo|apollo-client|react-clone-referenced-element|react-navigation|expo(nent)?|@expo(nent)?|expo-linear-gradient|@unimodules|unimodules|sentry-expo|native-base|@sentry/.*|@gorhom/.*|moti|react-native-reanimated|react-native-svg|react-native-safe-area-context|react-native-gesture-handler|react-native-screens|react-native/Libraries/Animated/src/NativeAnimatedHelper).*)"
  ],
};