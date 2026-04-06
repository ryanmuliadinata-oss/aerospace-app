import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { checkHealth } from '../api/flightApi';
import { API_BASE_URL } from '../config';
import { C, S, T } from '../theme';
 
const SOURCES = [
  { name: 'Aviation Weather', desc: 'METAR · SIGMET · PIREP', free: true,  color: '#50DC8C' },
  { name: 'OpenSky Network',  desc: 'Live aircraft positions', free: true,  color: '#50DC8C' },
  { name: 'Open-Meteo',       desc: 'Winds aloft · Air quality', free: true, color: '#50DC8C' },
  { name: 'OpenAIP',          desc: 'Runway data · Elevation',  free: true,  color: '#50DC8C' },
  { name: 'Sunrise-Sunset',   desc: 'Day/night · Civil twilight', free: true, color: '#50DC8C' },
  { name: 'FlightAware',      desc: 'Fuel burn · Tracking',    free: false, color: '#FFD770' },
];
 
export default function DashboardScreen({ navigation }) {
  const [status, setStatus] = useState('checking');
 
  useEffect(() => {
    checkHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);
 
  return (
    <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
      <View style={S.titleBlock}>
        <Text style={[T.screenLabel, { marginBottom: 4 }]}>GOOD MORNING</Text>
        <Text style={T.screenTitle}>Aerospace Dispatch</Text>
      </View>
 
      {/* Server status */}
      <Text style={S.sectionHeader}>SYSTEM STATUS</Text>
      <View style={[S.card, status === 'online' ? S.cardGreen : styles.cardRed]}>
        <View style={styles.statusRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusName}>Spring Boot API</Text>
            <Text style={styles.statusUrl} numberOfLines={1}>{API_BASE_URL}</Text>
          </View>
          {status === 'checking'
            ? <ActivityIndicator color={C.green} size="small" />
            : (
              <View style={[styles.pill, {
                backgroundColor: status === 'online' ? C.greenFaint : C.redFaint,
                borderColor:     status === 'online' ? C.greenDim   : C.redDim,
              }]}>
                <View style={[styles.pillDot, {
                  backgroundColor: status === 'online' ? C.green : C.red
                }]} />
                <Text style={[styles.pillText, {
                  color: status === 'online' ? C.green : C.red
                }]}>
                  {status === 'online' ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>
            )}
        </View>
      </View>
 
      {/* Data sources */}
      <Text style={S.sectionHeader}>LIVE DATA SOURCES</Text>
      {SOURCES.map((src, i) => (
        <View key={i} style={[S.card, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Text style={styles.srcName}>{src.name}</Text>
              <View style={[styles.freeBadge, {
                borderColor: src.free ? C.greenDim : C.goldDim,
                backgroundColor: src.free ? C.greenFaint : C.goldFaint,
              }]}>
                <Text style={[styles.freeText, { color: src.free ? C.green : C.gold }]}>
                  {src.free ? 'FREE' : 'PAID'}
                </Text>
              </View>
            </View>
            <Text style={styles.srcDesc}>{src.desc}</Text>
          </View>
          <View style={[styles.liveDot, { backgroundColor: src.color + '33',
            borderColor: src.color }]} />
        </View>
      ))}
 
      <TouchableOpacity
        style={[S.btnPrimary, { marginTop: 16, marginBottom: 48 }]}
        onPress={() => navigation.navigate('Flight Plan')}>
        <Text style={S.btnPrimaryText}>✈  NEW SIMULATION</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  cardRed:    { borderColor: C.redDim },
  statusRow:  { flexDirection: 'row', alignItems: 'center' },
  statusName: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
  statusUrl:  { color: C.textDim, fontSize: 10, marginTop: 3 },
  pill:       { flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 10, paddingVertical: 5,
                borderRadius: 100, borderWidth: 1 },
  pillDot:    { width: 6, height: 6, borderRadius: 3 },
  pillText:   { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  srcName:    { color: C.textPrimary, fontSize: 13, fontWeight: '600' },
  srcDesc:    { color: C.textMuted, fontSize: 10, marginTop: 2 },
  freeBadge:  { paddingHorizontal: 7, paddingVertical: 2,
                borderRadius: 5, borderWidth: 1 },
  freeText:   { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  liveDot:    { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
});
 