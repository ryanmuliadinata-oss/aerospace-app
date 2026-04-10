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
import RunwayScreen from './screens/RunwayScreen';
import EtopsScreen from './screens/EtopsScreen';
const Tab = createBottomTabNavigator();
 
const ICONS = {
  'Flight Plan': '✈️',
  'Simulation':  '🛰️',
  'Dashboard':   '📊',
  'Map':         '🗺️',
  'History':     '📋',
  'W&B':         '⚖️',
  'Route':       '🌍',
  'Runway':      '🛬',
  'ETOPS':       '🛡️',
};
 
export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#13112A" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: focused ? 20 : 16, opacity: focused ? 1 : 0.45 }}>
                {ICONS[route.name]}
              </Text>
            ),
            tabBarActiveTintColor:   '#50DC8C',
            tabBarInactiveTintColor: '#445566',
            tabBarStyle: {
              backgroundColor: '#0F0E22',
              borderTopColor:  'rgba(255,255,255,0.07)',
              borderTopWidth:  1,
              paddingBottom:   6,
              paddingTop:      4,
              height:          58,
            },
            tabBarLabelStyle: { fontSize: 9, letterSpacing: 0.5, fontWeight: '600' },
            headerStyle:      { backgroundColor: '#13112A', borderBottomColor: 'rgba(255,255,255,0.07)' },
            headerTintColor:  '#FFFFFF',
            headerTitleStyle: { fontWeight: '700', letterSpacing: 1, fontSize: 15 },
          })}
        >
          <Tab.Screen name="Flight Plan" component={FlightPlanScreen} />
          <Tab.Screen name="Simulation"  component={SimulationScreen} />
          <Tab.Screen name="Dashboard"   component={DashboardScreen}  />
          <Tab.Screen name="Map"         component={MapScreen}        />
          <Tab.Screen name="History"     component={HistoryScreen}    />
          <Tab.Screen name="W&B"         component={WeightBalanceScreen} />
          <Tab.Screen name="Route"       component={GreatCircleScreen} />
          <Tab.Screen name="Runway"      component={RunwayScreen}     />
          <Tab.Screen name="ETOPS"       component={EtopsScreen}      />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}