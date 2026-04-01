import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'flight_history';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  const clearHistory = async () => {
    Alert.alert('Clear History', 'Delete all saved simulations?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(HISTORY_KEY);
          setHistory([]);
        }
      }
    ]);
  };

  if (history.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>📋</Text>
        <Text style={s.emptyTitle}>No History Yet</Text>
        <Text style={s.emptySub}>Your past simulations will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>
      <TouchableOpacity style={s.clearBtn} onPress={clearHistory}>
        <Text style={s.clearText}>🗑️  CLEAR HISTORY</Text>
      </TouchableOpacity>

      {history.slice().reverse().map((item, i) => (
        <View key={i} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={[s.decision,
              { color: item.isGo ? '#00FF88' : '#FF3333' }]}>
              {item.isGo ? '✅ GO' : '❌ NO-GO'}
            </Text>
            <Text style={s.date}>{item.date}</Text>
          </View>
          <View style={s.routeRow}>
            <Text style={s.icao}>{item.origin}</Text>
            <Text style={s.arrow}>— ✈ —</Text>
            <Text style={s.icao}>{item.destination}</Text>
          </View>
          <View style={s.details}>
            <Text style={s.detail}>🛩️ {item.aircraftType}</Text>
            <Text style={s.detail}>⏱️ {item.estimatedFlightTimeHrs?.toFixed(1)} hr</Text>
            <Text style={s.detail}>⛽ {item.fuel?.sufficient ? 'Fuel OK' : 'Fuel LOW'}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#0A0E1A', padding:16 },
  empty:      { flex:1, backgroundColor:'#0A0E1A',
                alignItems:'center', justifyContent:'center', padding:32 },
  emptyIcon:  { fontSize:64, marginBottom:16 },
  emptyTitle: { color:'#FFF', fontSize:20, fontWeight:'700' },
  emptySub:   { color:'#556', fontSize:14, marginTop:8, textAlign:'center' },
  clearBtn:   { backgroundColor:'#FF333318', borderRadius:10, padding:12,
                alignItems:'center', marginBottom:16,
                borderWidth:1, borderColor:'#FF333344' },
  clearText:  { color:'#FF3333', fontWeight:'700', fontSize:12, letterSpacing:1 },
  card:       { backgroundColor:'#111827', borderRadius:14, padding:16,
                marginBottom:12, borderWidth:1, borderColor:'#1F2937' },
  cardHeader: { flexDirection:'row', justifyContent:'space-between',
                marginBottom:10 },
  decision:   { fontWeight:'800', fontSize:14 },
  date:       { color:'#445566', fontSize:11 },
  routeRow:   { flexDirection:'row', alignItems:'center',
                justifyContent:'center', gap:12, marginBottom:10 },
  icao:       { color:'#FFF', fontSize:24, fontWeight:'800' },
  arrow:      { color:'#00D4FF', fontSize:14 },
  details:    { flexDirection:'row', justifyContent:'space-around' },
  detail:     { color:'#667788', fontSize:12 },
});