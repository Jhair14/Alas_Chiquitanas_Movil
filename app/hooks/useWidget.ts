import { Platform } from 'react-native';
import * as ExpoModules from 'expo-modules-core';

export const useWidget = () => {
  const updateWidget = async (activeFires: number, reports: number) => {
    try {
      if (Platform.OS === 'android') {
        const ExpoWidget = ExpoModules.NativeModulesProxy.ExpoWidget;
        if (ExpoWidget) {
          await ExpoWidget.updateWidgetData(activeFires, reports);
        } else {
          console.log('Widget module not available');
        }
      }
    } catch (error) {
      console.error('Error updating widget:', error);
    }
  };

  return { updateWidget };
}; 