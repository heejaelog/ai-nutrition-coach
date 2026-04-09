import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RecordScreen from '../screens/RecordScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import CoachingScreen from '../screens/CoachingScreen';
import MyPageScreen from '../screens/MyPageScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E5E7EB' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '홈', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{ tabBarLabel: '분석', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text> }}
      />
      <Tab.Screen
        name="Coaching"
        component={CoachingScreen}
        options={{ tabBarLabel: '코칭', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text> }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{ tabBarLabel: '마이', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Record" component={RecordScreen} options={{ headerShown: true, title: '오늘 기록 입력', headerTintColor: '#3B82F6' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
