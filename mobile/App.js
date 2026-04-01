import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StatusBar } from 'react-native';
import HistoryScreen from './screens/HistoryScreen';
import FlightPlanScreen from './screens/FlightPlanScreen';
import SimulationScreen from './screens/SimulationScreen';
import DashboardScreen  from './screens/DashboardScreen';
import MapScreen        from './screens/MapScreen';
import WeightBalanceScreen from './screens/WeightBalanceScreen';
import GreatCircleScreen from './screens/GreatCircleScreen';
const Tab = createBottomTabNavigator();

const ICONS = {
  'Flight Plan': '✈️',
  'Simulation':  '🛰️',
  'Dashboard':   '📊',
  'Map':         '🗺️',
  'History': '📋',
  'W&B': '⚖️',
  'Route': '🌍',
};

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: focused ? 22 : 18 }}>
                {ICONS[route.name]}
              </Text>
            ),
            tabBarActiveTintColor:    '#00D4FF',
            tabBarInactiveTintColor:  '#556',
            tabBarStyle: {
              backgroundColor: '#0A0E1A',
              borderTopColor:  '#1A2035',
              paddingBottom:   4,
            },
            headerStyle:      { backgroundColor: '#0A0E1A' },
            headerTintColor:  '#FFFFFF',
            headerTitleStyle: { fontWeight: '700', letterSpacing: 1 },
          })}
        >
          <Tab.Screen name="Flight Plan" component={FlightPlanScreen} />
          <Tab.Screen name="Simulation"  component={SimulationScreen} />
          <Tab.Screen name="Dashboard"   component={DashboardScreen}  />
          <Tab.Screen name="Map"         component={MapScreen}        />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="W&B" component={WeightBalanceScreen} />
          <Tab.Screen name="Route" component={GreatCircleScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}