import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { tokens } = useTheme();
  return (
    <NativeTabs
      backgroundColor={tokens.surface}
      blurEffect="systemMaterial"
      iconColor={{ default: tokens.textSecondary, selected: tokens.primary }}
      indicatorColor={tokens.surfaceElevated}
      labelStyle={{ default: { color: tokens.textSecondary }, selected: { color: tokens.primary } }}
      tabBarRespectsIMEInsets
      tintColor={tokens.primary}
    >
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home_filled' }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plans">
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
        <NativeTabs.Trigger.Label>Plans</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Icon sf="clock" md="history" />
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
