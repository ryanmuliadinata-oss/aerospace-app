import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { getGreatCircleRoute } from '../api/flightApi';

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
      Alert.alert('Error', 'Please enter valid 4-letter ICAO codes');
      return;
    }
    setLoading(true);
    try {
      const data = await getGreatCircleRoute(
        origin.toUpperCase(),
        destination.toUpperCase(),
        parseInt(waypoints) || 3,
        parseFloat(altitude) || 35000
      );
      setResult(data);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container}>
      <Text style={s.sectionTitle}>QUICK ROUTES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.presetScroll}>
        {AIRPORT_PAIRS.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={s.presetBtn}
            onPress={() => {
              setOrigin(p.origin);
              setDestination(p.dest);
            }}
          >
            <Text style={s.presetText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.sectionTitle}>ROUTE INPUTS</Text>
      {[
        ['Origin ICAO',      origin,      setOrigin,      'KLAX'],
        ['Destination ICAO', destination, setDestination, 'KJFK'],
        ['Waypoints (2-8)',  waypoints,   setWaypoints,   '3'   ],
        ['Cruise Alt (ft)',  altitude,    setAltitude,    '35000'],
      ].map(([label, val, setter, ph]) => (
        <View key={label} style={s.field}>
          <Text style={s.label}>{label}</Text>
          <TextInput
            style={s.input}
            value={val}
            onChangeText={setter}
            placeholder={ph}
            placeholderTextColor="#445"
            autoCapitalize="characters"
          />
        </View>
      ))}

      <TouchableOpacity
        style={[s.btn, loading && s.btnDisabled]}
        onPress={calculate}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#000" size="small" />
          : <Text style={s.btnText}>🌍  CALCULATE GREAT CIRCLE</Text>
        }
      </TouchableOpacity>

      {result && (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>📍  ROUTE INFO</Text>
            <View style={s.routeRow}>
              <Text style={s.icao}>{result.origin}</Text>
              <Text style={s.arrow}>— 🌍 —</Text>
              <Text style={s.icao}>{result.destination}</Text>
            </View>
            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={s.statVal}>{result.distanceNm.toFixed(0)}</Text>
                <Text style={s.statLbl}>NM</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>{result.initialBearing.toFixed(0)}°</Text>
                <Text style={s.statLbl}>INIT HDG</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>{(result.distanceNm / 450).toFixed(1)}</Text>
                <Text style={s.statLbl}>EST HRS</Text>
              </View>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>🗺️  WAYPOINTS</Text>
            {result.waypoints.map((wp, i) => (
              <View key={i} style={s.wpRow}>
                <View style={[s.wpDot, {
                  backgroundColor: i === 0 ? '#00FF88'
                    : i === result.waypoints.length - 1 ? '#FF3333'
                    : '#00D4FF'
                }]} />
                <Text style={s.wpName}>{wp.name}</Text>
                <Text style={s.wpCoord}>
                  {wp.latitude.toFixed(2)}°, {wp.longitude.toFixed(2)}°
                </Text>
                <Text style={s.wpAlt}>
                  {i === 0 || i === result.waypoints.length - 1
                    ? 'GND' : `FL${(wp.altitudeFt/100).toFixed(0)}`}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.mapBtn}
            onPress={() => navigation.navigate('Map', {
              waypoints: result.waypoints,
              weather: [],
              turbulence: [],
            })}
          >
            <Text style={s.mapBtnText}>🗺️  VIEW ON MAP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.simBtn, { marginBottom: 40 }]}
            onPress={() => navigation.navigate('Flight Plan')}
          >
            <Text style={s.simBtnText}>✈️  USE FOR SIMULATION</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#0A0E1A', padding:16 },
  sectionTitle: { color:'#00D4FF', fontSize:11, fontWeight:'700',
                  letterSpacing:2.5, marginTop:24, marginBottom:12 },
  presetScroll: { marginBottom:8 },
  presetBtn:    { backgroundColor:'#111827', borderRadius:8,
                  paddingHorizontal:14, paddingVertical:9,
                  borderWidth:1, borderColor:'#1F2937', marginRight:8 },
  presetText:   { color:'#00D4FF', fontSize:12, fontWeight:'600' },
  field:        { marginBottom:12 },
  label:        { color:'#667788', fontSize:11, marginBottom:6, letterSpacing:1 },
  input:        { backgroundColor:'#111827', color:'#FFF', borderRadius:10,
                  padding:13, fontSize:15, borderWidth:1, borderColor:'#1F2937' },
  btn:          { backgroundColor:'#00D4FF', borderRadius:12, padding:16,
                  alignItems:'center', marginTop:8, marginBottom:16 },
  btnDisabled:  { opacity:0.4 },
  btnText:      { color:'#000919', fontSize:15, fontWeight:'800', letterSpacing:1.5 },
  card:         { backgroundColor:'#111827', borderRadius:14, padding:16,
                  marginBottom:14, borderWidth:1, borderColor:'#1F2937' },
  cardTitle:    { color:'#00D4FF', fontSize:11, fontWeight:'700',
                  letterSpacing:2.5, marginBottom:14 },
  routeRow:     { flexDirection:'row', alignItems:'center',
                  justifyContent:'center', gap:16, marginBottom:16 },
  icao:         { color:'#FFF', fontSize:28, fontWeight:'800' },
  arrow:        { color:'#00D4FF', fontSize:16 },
  statsRow:     { flexDirection:'row', justifyContent:'space-around' },
  stat:         { alignItems:'center' },
  statVal:      { color:'#FFF', fontSize:18, fontWeight:'700' },
  statLbl:      { color:'#445566', fontSize:9, letterSpacing:1.5, marginTop:3 },
  wpRow:        { flexDirection:'row', alignItems:'center', gap:10,
                  paddingVertical:9, borderBottomWidth:1,
                  borderBottomColor:'#1F2937' },
  wpDot:        { width:10, height:10, borderRadius:5 },
  wpName:       { color:'#FFF', fontWeight:'700', width:50 },
  wpCoord:      { color:'#667788', fontSize:11, flex:1 },
  wpAlt:        { color:'#00D4FF', fontSize:11, width:44, textAlign:'right' },
  mapBtn:       { backgroundColor:'#00D4FF22', borderRadius:12, padding:14,
                  alignItems:'center', marginBottom:12,
                  borderWidth:1, borderColor:'#00D4FF55' },
  mapBtnText:   { color:'#00D4FF', fontWeight:'700', fontSize:13, letterSpacing:1 },
  simBtn:       { backgroundColor:'#00FF8822', borderRadius:12, padding:14,
                  alignItems:'center', borderWidth:1, borderColor:'#00FF8855' },
  simBtnText:   { color:'#00FF88', fontWeight:'700', fontSize:13, letterSpacing:1 },
});