import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

type ScreenHeaderOptions = {
  headerRight?: () => React.ReactNode;
  headerLargeTitle?: boolean;
  headerLargeTitleShadowVisible?: boolean;
};

/** Set a native-stack title and optional actions from a screen's current data. */
export function useScreenHeader(title: string, options?: ScreenHeaderOptions) {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title, ...options });
  }, [navigation, options, title]);
}
