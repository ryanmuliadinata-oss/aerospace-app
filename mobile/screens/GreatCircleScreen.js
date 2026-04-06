import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { getGreatCircleRoute } from '../api/flightApi';
import { C, S, T } from '../theme';
 
const AIRPORT_PAIRS = [
  { label: 'LAX → JFK', origin: 'KLAX', dest: 'KJFK' },
  { label: 'LHR → JFK', origin: 'EGLL', dest: 'KJFK' },
  { label: 'SFO → ORD', origin: 'KSFO', dest: 'KORD' },
  { label: 'DXB → LAX', origin: 'OMDB', dest: 'KLAX' },
  { label: 'SYD → LAX', origin: 'YSSY', dest: 'KLAX' },
];
 
export default function GreatCircleScreen({ navigation }) {
  const [origin,      setOrigin]      = useState('KLAX');
  const [destination, setDestination] = useState('KJFK');
  const [waypoints,   setWaypoints]   = useState('3');
  const [altitude,    setAltitude]    = useState('35000');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
 
  const calculate = async () => {
    if (origin.length !== 4 || destination.length !== 4) {
      Alert.alert('Error', 'Please enter valid 4-letter ICAO codes'); return;
    }
    setLoading(true);
    try {
      const data = await getGreatCircleRoute(
        origin.toUpperCase(), destination.toUpperCase(),
        parseInt(waypoints) || 3, parseFloat(altitude) || 35000);
      setResult(data);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'Failed to calculate route');
    } finally { setLoading(false); }
  };
 
  const WP_COLORS = ['#50DC8C', '#78AAFF', '#78AAFF', '#78AAFF', '#78AAFF', '#FF6060'];
 
  return (
    <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
      <View style={S.titleBlock}>
        <Text style={[T.screenLabel, { marginBottom: 4 }]}>NAVIGATION</Text>
        <Text style={T.screenTitle}>Great Circle</Text>
      </View>
 
      <Text style={S.sectionHeader}>QUICK ROUTES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ paddingLeft: 16, marginBottom: 10 }}
        contentContainerStyle={{ gap: 7, paddingRight: 16 }}>
        {AIRPORT_PAIRS.map((p, i) => (
          <TouchableOpacity key={i}
            style={[S.tag, { marginBottom: 0 }]}
            onPress={() => { setOrigin(p.origin); setDestination(p.dest); }}>
            <Text style={S.tagText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
 
      {/* Hero route */}
      <View style={S.heroCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={T.heroIcao}>{origin || '????'}</Text>
            <Text style={T.heroSub}>ORIGIN</Text>
          </View>
          <Text style={{ color: C.textDim, fontSize: 24 }}>⟶</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={T.heroIcao}>{destination || '????'}</Text>
            <Text style={[T.heroSub, { textAlign: 'right' }]}>DEST</Text>
          </View>
        </View>
      </View>
 
      <Text style={S.sectionHeader}>ROUTE INPUTS</Text>
      {[
        ['ORIGIN ICAO',      origin,      setOrigin,      'KLAX'],
        ['DESTINATION ICAO', destination, setDestination, 'KJFK'],
        ['WAYPOINTS (2-8)',  waypoints,   setWaypoints,   '3'],
        ['CRUISE ALT (FT)',  altitude,    setAltitude,    '35000'],
      ].map(([label, val, setter, ph]) => (
        <View key={label} style={S.inputWrap}>
          <Text style={S.inputLabel}>{label}</Text>
          <TextInput
            style={S.input} value={val} onChangeText={setter}
            placeholder={ph} placeholderTextColor={C.textDim}
            autoCapitalize="characters"
          />
        </View>
      ))}
 
      <TouchableOpacity
        style={[S.btnPrimary, loading && S.btnDisabled]}
        onPress={calculate} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#0A1F14" size="small" />
          : <Text style={S.btnPrimaryText}>🌍  CALCULATE GREAT CIRCLE</Text>}
      </TouchableOpacity>
 
      {result && (<>
        <View style={S.cardPurple}>
          <Text style={[T.cardTitle, { marginBottom: 14 }]}>ROUTE INFO</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <Text style={styles.icao}>{result.origin}</Text>
            <Text style={{ color: C.purple, fontSize: 16 }}>— 🌍 —</Text>
            <Text style={styles.icao}>{result.destination}</Text>
          </View>
          <View style={S.statRow}>
            <View style={S.stat}>
              <Text style={S.statVal}>{result.distanceNm.toFixed(0)}</Text>
              <Text style={S.statLbl}>NM</Text>
            </View>
            <View style={S.stat}>
              <Text style={S.statVal}>{result.initialBearing.toFixed(0)}°</Text>
              <Text style={S.statLbl}>INIT HDG</Text>
            </View>
            <View style={S.stat}>
              <Text style={S.statVal}>{(result.distanceNm / 450).toFixed(1)}</Text>
              <Text style={S.statLbl}>EST HRS</Text>
            </View>
          </View>
        </View>
 
        <View style={S.card}>
          <Text style={[T.cardTitle, { marginBottom: 14 }]}>WAYPOINTS</Text>
          {result.waypoints.map((wp, i) => (
            <View key={i} style={styles.wpRow}>
              <View style={[styles.wpDot, {
                backgroundColor: i === 0 ? C.green
                  : i === result.waypoints.length - 1 ? C.red : C.blue
              }]} />
              <Text style={styles.wpName}>{wp.name}</Text>
              <Text style={styles.wpCoord}>
                {wp.latitude.toFixed(2)}°, {wp.longitude.toFixed(2)}°
              </Text>
              <Text style={styles.wpAlt}>
                {i === 0 || i === result.waypoints.length - 1
                  ? 'GND' : `FL${(wp.altitudeFt / 100).toFixed(0)}`}
              </Text>
            </View>
          ))}
        </View>
 
        <TouchableOpacity style={S.btnSecondary}
          onPress={() => navigation.navigate('Map', {
            waypoints: result.waypoints, weather: [], turbulence: [],
          })}>
          <Text style={S.btnSecondaryText}>🗺️  VIEW ON MAP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.btnSecondary, { marginBottom: 48 }]}
          onPress={() => navigation.navigate('Flight Plan')}>
          <Text style={S.btnSecondaryText}>✈️  USE FOR SIMULATION</Text>
        </TouchableOpacity>
      </>)}
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  icao:    { color: C.textPrimary, fontSize: 28, fontWeight: '800' },
  wpRow:   { flexDirection: 'row', alignItems: 'center', gap: 10,
             paddingVertical: 9, borderBottomWidth: 1,
             borderBottomColor: 'rgba(255,255,255,0.05)' },
  wpDot:   { width: 9, height: 9, borderRadius: 5 },
  wpName:  { color: C.textPrimary, fontWeight: '700', width: 50, fontSize: 12 },
  wpCoord: { color: C.textMuted, fontSize: 11, flex: 1 },
  wpAlt:   { color: C.blue, fontSize: 11, width: 44, textAlign: 'right' },
});
 