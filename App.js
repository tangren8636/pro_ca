// 主应用入口
import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from './src/database';
import { Colors } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import PsaScreen from './src/screens/PsaScreen';
import TestosteroneScreen from './src/screens/TestosteroneScreen';
import ImagingScreen from './src/screens/ImagingScreen';
import InjectionScreen from './src/screens/InjectionScreen';
import ReportScreen from './src/screens/ReportScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============ 底部导航 Tab ============
function MainTabs({ userId, userNickname, onLogout, navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case '首页': iconName = focused ? 'home' : 'home-outline'; break;
            case 'PSA': iconName = focused ? 'analytics' : 'analytics-outline'; break;
            case '治疗': iconName = focused ? 'medical' : 'medical-outline'; break;
            case '报告': iconName = focused ? 'document-text' : 'document-text-outline'; break;
            case '我的': iconName = focused ? 'person' : 'person-outline'; break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: Colors.borderLight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="首页">
        {() => <HomeScreen navigation={navigation} userId={userId} userNickname={userNickname} />}
      </Tab.Screen>
      <Tab.Screen name="PSA">
        {() => <PsaScreen userId={userId} />}
      </Tab.Screen>
      <Tab.Screen name="治疗">
        {() => <InjectionScreen userId={userId} />}
      </Tab.Screen>
      <Tab.Screen name="报告">
        {() => <ReportScreen userId={userId} userNickname={userNickname} />}
      </Tab.Screen>
      <Tab.Screen name="我的">
        {() => <ProfileScreen userId={userId} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ============ 主应用 ============
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userNickname, setUserNickname] = useState('');

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      await initDatabase();
      const savedUserId = await AsyncStorage.getItem('userId');
      const savedNickname = await AsyncStorage.getItem('userNickname');
      if (savedUserId) {
        setUserId(parseInt(savedUserId));
        setUserNickname(savedNickname || '');
      }
    } catch (error) {
      console.error('初始化失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (user) => {
    await AsyncStorage.setItem('userId', String(user.id));
    await AsyncStorage.setItem('userNickname', user.nickname || '');
    setUserId(user.id);
    setUserNickname(user.nickname || '');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userNickname');
    setUserId(null);
    setUserNickname('');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle={userId ? "dark-content" : "light-content"} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userId ? (
            <>
              <Stack.Screen name="Main">
                {({ navigation }) => (
                  <MainTabs
                    userId={userId}
                    userNickname={userNickname}
                    onLogout={handleLogout}
                    navigation={navigation}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Testosterone" options={{ headerShown: true, title: '睾酮跟踪', headerTintColor: Colors.primary }}>
                {() => <TestosteroneScreen userId={userId} />}
              </Stack.Screen>
              <Stack.Screen name="Imaging" options={{ headerShown: true, title: '影像管理', headerTintColor: Colors.primary }}>
                {() => <ImagingScreen userId={userId} />}
              </Stack.Screen>
              <Stack.Screen name="Profile" options={{ headerShown: true, title: '个人中心', headerTintColor: Colors.primary }}>
                {() => <ProfileScreen userId={userId} onLogout={handleLogout} />}
              </Stack.Screen>
            </>
          ) : (
            <>
              <Stack.Screen name="Login">
                {({ navigation }) => (
                  <LoginScreen navigation={navigation} onLoginSuccess={handleLoginSuccess} />
                )}
              </Stack.Screen>
              <Stack.Screen name="Register">
                {({ navigation }) => (
                  <RegisterScreen navigation={navigation} />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
