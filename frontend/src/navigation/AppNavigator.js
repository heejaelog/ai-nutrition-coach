import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import RecordScreen from '../screens/RecordScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import CoachingScreen from '../screens/CoachingScreen';
import MyPageScreen from '../screens/MyPageScreen';
import FriendScreen from '../screens/FriendScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import SkinShopScreen from '../screens/SkinShopScreen';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',     icon: 'home',         iconOutline: 'home-outline',         label: '홈' },
  { name: 'Analysis', icon: 'bar-chart',     iconOutline: 'bar-chart-outline',    label: '분석' },
  { name: 'Friends',  icon: 'people',        iconOutline: 'people-outline',       label: '친구' },
  { name: 'Coaching', icon: 'chatbubbles',   iconOutline: 'chatbubbles-outline',  label: '코칭' },
  { name: 'MyPage',   icon: 'person',        iconOutline: 'person-outline',       label: '마이' },
];

function CustomTabBar({ state, navigation }) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab} activeOpacity={0.7}>
            <Ionicons
              name={isFocused ? tab.icon : tab.iconOutline}
              size={22}
              color={isFocused ? C.primary : C.muted}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} />
      <Tab.Screen name="Friends"  component={FriendScreen} />
      <Tab.Screen name="Coaching" component={CoachingScreen} />
      <Tab.Screen name="MyPage"   component={MyPageScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Record"
              component={RecordScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: '오늘 기록',
                headerTintColor: C.primary,
                headerTitleStyle: { fontWeight: '700', color: C.text },
                headerStyle: { backgroundColor: '#fff' },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="FriendProfile"
              component={FriendProfileScreen}
              options={{
                headerShown: true,
                title: '친구 프로필',
                headerTintColor: C.primary,
                headerTitleStyle: { fontWeight: '700', color: C.text },
                headerStyle: { backgroundColor: '#fff' },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="SkinShop"
              component={SkinShopScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: '스킨 상점',
                headerTintColor: C.primary,
                headerTitleStyle: { fontWeight: '700', color: C.text },
                headerStyle: { backgroundColor: '#fff' },
                headerShadowVisible: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, color: C.muted, fontWeight: '500' },
  labelActive: { color: C.primary, fontWeight: '700' },
});
