import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, S, T } from '../theme';
 
const HISTORY_KEY = 'flight_history';
 
export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
 
  useEffect(() => {
    loadHistory();
  }, []);
 
  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const data = raw ? JSON.parse(raw) : [];
      setHistory(data.reverse());
    } catch (e) { console.error('Failed to load history', e); }
  };
 
  const clearHistory = () => {
    Alert.alert('Clear History', 'Delete all saved simulations?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem(HISTORY_KEY);
        setHistory([]);
      }},
    ]);
  };
 
  return (
    <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
      <View style={[S.titleBlock, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }]}>
        <View>
          <Text style={[T.screenLabel, { marginBottom: 4 }]}>LOGBOOK</Text>
          <Text style={T.screenTitle}>History</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>
 
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No simulations yet</Text>
          <Text style={styles.emptySub}>Run a simulation from the Flight Plan tab.</Text>
        </View>
      ) : (
        history.map((item, i) => (
          <TouchableOpacity key={i} style={[S.card,
            item.isGo ? S.cardGreen : styles.cardRed]}
            onPress={() => navigation.navigate('Simulation', { report: item })}>
            <View style={styles.histHeader}>
              <View>
                <Text style={styles.flightId}>{item.flightId}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              <View style={[styles.goBadge, {
                backgroundColor: item.isGo ? C.greenFaint : C.redFaint,
                borderColor:     item.isGo ? C.greenDim   : C.redDim,
              }]}>
                <Text style={[styles.goBadgeText, { color: item.isGo ? C.green : C.red }]}>
                  {item.isGo ? 'GO' : 'NO-GO'}
                </Text>
              </View>
            </View>
            <View style={S.divider} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.routeIcao}>{item.origin}</Text>
                <Text style={[T.screenLabel, { fontSize: 9 }]}>ORIGIN</Text>
              </View>
              <Text style={{ color: C.textDim, fontSize: 18, alignSelf: 'center' }}>→</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.routeIcao}>{item.destination}</Text>
                <Text style={[T.screenLabel, { fontSize: 9, textAlign: 'right' }]}>DEST</Text>
              </View>
            </View>
            <View style={[S.divider, { marginBottom: 4 }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.meta}>{item.aircraftType}</Text>
              <Text style={styles.meta}>{item.estimatedFlightTimeHrs?.toFixed(1)} hrs</Text>
              <Text style={styles.meta}>{item.recommendedAltitude}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  clearBtn:       { paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: 8, backgroundColor: C.redFaint,
                    borderWidth: 1, borderColor: C.redDim },
  clearText:      { color: C.red, fontSize: 11, fontWeight: '600' },
  emptyState:     { alignItems: 'center', paddingTop: 80 },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { color: C.textPrimary, fontSize: 18, fontWeight: '700' },
  emptySub:       { color: C.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' },
  cardRed:        { borderColor: C.redDim },
  histHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  flightId:       { color: C.textPrimary, fontSize: 15, fontWeight: '700' },
  date:           { color: C.textMuted, fontSize: 10, marginTop: 2 },
  goBadge:        { paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 100, borderWidth: 1 },
  goBadgeText:    { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  routeIcao:      { color: C.textPrimary, fontSize: 20, fontWeight: '800' },
  meta:           { color: C.textMuted, fontSize: 11 },
});
 