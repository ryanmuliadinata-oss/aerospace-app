import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import HistoryScreen       from './screens/HistoryScreen';
import FlightPlanScreen    from './screens/FlightPlanScreen';
import SimulationScreen    from './screens/SimulationScreen';
import DashboardScreen     from './screens/DashboardScreen';
import MapScreen           from './screens/MapScreen';
import WeightBalanceScreen from './screens/WeightBalanceScreen';
import GreatCircleScreen   from './screens/GreatCircleScreen';
import RunwayScreen        from './screens/RunwayScreen';
import EtopsScreen         from './screens/EtopsScreen';

const Tab = createMaterialTopTabNavigator();

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
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#111318' }} />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#111318" />
      <NavigationContainer>
        <Tab.Navigator
          tabBarPosition="bottom"
          screenOptions={({ route }) => ({
            swipeEnabled: true,
            tabBarScrollEnabled: true,
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: focused ? 20 : 16, opacity: focused ? 1 : 0.45 }}>
                {ICONS[route.name]}
              </Text>
            ),
            tabBarActiveTintColor:   '#50DC8C',
            tabBarInactiveTintColor: '#445566',
            tabBarStyle: {
              backgroundColor: '#111318',
              borderTopColor:  'rgba(255,255,255,0.07)',
              borderTopWidth:  1,
              paddingBottom:   6,
              paddingTop:      4,
              height:          58,
            },
            tabBarLabelStyle:    { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.5 },
            tabBarItemStyle:     { width: 72 },
            tabBarIndicatorStyle: { backgroundColor: '#50DC8C', height: 2, top: 0 },
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
