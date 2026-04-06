import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runSimulation } from '../api/flightApi';
import { C, S, T } from '../theme';
 
const HISTORY_KEY = 'flight_history';
 
const PRESETS = [
  { label: 'LAX→JFK', plan: {
    flightId: 'AAL001', aircraftType: 'B737', origin: 'KLAX', destination: 'KJFK',
    fuelCapacityKg: 20000, cruiseSpeedKts: 450,
    waypoints: [
      { name:'KLAX', latitude:33.9425, longitude:-118.4081, altitudeFt:35000 },
      { name:'KDFW', latitude:32.8998, longitude:-97.0403,  altitudeFt:35000 },
      { name:'KMEM', latitude:35.0424, longitude:-89.9767,  altitudeFt:36000 },
      { name:'KJFK', latitude:40.6413, longitude:-73.7781,  altitudeFt:0     },
    ],
  }},
  { label: 'SFO→ORD', plan: {
    flightId: 'UAL202', aircraftType: 'A320', origin: 'KSFO', destination: 'KORD',
    fuelCapacityKg: 18000, cruiseSpeedKts: 420,
    waypoints: [
      { name:'KSFO', latitude:37.6213, longitude:-122.3790, altitudeFt:37000 },
      { name:'KSLC', latitude:40.7884, longitude:-111.9778, altitudeFt:37000 },
      { name:'KDEN', latitude:39.8561, longitude:-104.6737, altitudeFt:38000 },
      { name:'KORD', latitude:41.9742, longitude:-87.9073,  altitudeFt:0     },
    ],
  }},
  { label: 'LHR→JFK', plan: {
    flightId: 'BAW001', aircraftType: 'B777', origin: 'EGLL', destination: 'KJFK',
    fuelCapacityKg: 145000, cruiseSpeedKts: 490,
    waypoints: [
      { name:'EGLL', latitude:51.4775, longitude:-0.4614,  altitudeFt:37000 },
      { name:'EINN', latitude:52.7020, longitude:-8.9248,  altitudeFt:37000 },
      { name:'CYYT', latitude:47.6186, longitude:-52.7319, altitudeFt:38000 },
      { name:'KJFK', latitude:40.6413, longitude:-73.7781, altitudeFt:0     },
    ],
  }},
];
 
export default function FlightPlanScreen({ navigation }) {
  const [idx,          setIdx]          = useState(0);
  const [flightId,     setFlightId]     = useState('AAL001');
  const [aircraftType, setAircraftType] = useState('B737');
  const [origin,       setOrigin]       = useState('KLAX');
  const [destination,  setDestination]  = useState('KJFK');
  const [fuelCapacity, setFuelCapacity] = useState('20000');
  const [cruiseSpeed,  setCruiseSpeed]  = useState('450');
  const [loading,      setLoading]      = useState(false);
 
  const applyPreset = (i) => {
    const p = PRESETS[i].plan;
    setIdx(i); setFlightId(p.flightId); setAircraftType(p.aircraftType);
    setOrigin(p.origin); setDestination(p.destination);
    setFuelCapacity(String(p.fuelCapacityKg));
    setCruiseSpeed(String(p.cruiseSpeedKts));
  };
 
  const saveToHistory = async (result) => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history = raw ? JSON.parse(raw) : [];
      history.push({ ...result, date: new Date().toLocaleString() });
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) { console.error('Failed to save history', e); }
  };
 
  const handleRun = async () => {
    if (!flightId || !origin || !destination) {
      Alert.alert('Missing Fields', 'Fill in all fields.'); return;
    }
    const preset = PRESETS.find(p => p.plan.flightId === flightId) || PRESETS[idx];
    setLoading(true);
    try {
      const result = await runSimulation({
        ...preset.plan, flightId, aircraftType, origin, destination,
        fuelCapacityKg: parseFloat(fuelCapacity),
        cruiseSpeedKts: parseFloat(cruiseSpeed),
      });
      await saveToHistory(result);
      navigation.navigate('Simulation', { report: result, waypoints: preset.plan.waypoints });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e.message || 'Server unreachable.');
    } finally { setLoading(false); }
  };
 
  return (
    <ScrollView style={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={S.titleBlock}>
        <Text style={[T.screenLabel, { marginBottom: 4 }]}>DISPATCH</Text>
        <Text style={T.screenTitle}>Flight Plan</Text>
      </View>
 
      {/* Quick load presets */}
      <Text style={S.sectionHeader}>QUICK LOAD</Text>
      <View style={[S.tagRow]}>
        {PRESETS.map((p, i) => (
          <TouchableOpacity key={i}
            style={[S.tag, idx === i && S.tagActive]}
            onPress={() => applyPreset(i)}>
            <Text style={[S.tagText, idx === i && S.tagTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
 
      {/* Hero route card */}
      <View style={S.heroCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={T.heroIcao}>{origin || '????'}</Text>
            <Text style={T.heroSub}>ORIGIN</Text>
          </View>
          <Text style={{ color: C.textDim, fontSize: 24 }}>→</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={T.heroIcao}>{destination || '????'}</Text>
            <Text style={[T.heroSub, { textAlign: 'right' }]}>DEST</Text>
          </View>
        </View>
      </View>
 
      {/* Fields */}
      <Text style={S.sectionHeader}>FLIGHT DETAILS</Text>
      {[
        ['FLIGHT ID',          flightId,     setFlightId,     'AAL001',  'characters'],
        ['AIRCRAFT TYPE',      aircraftType, setAircraftType, 'B737',    'characters'],
        ['ORIGIN ICAO',        origin,       setOrigin,       'KLAX',    'characters'],
        ['DESTINATION ICAO',   destination,  setDestination,  'KJFK',    'characters'],
        ['FUEL CAPACITY (KG)', fuelCapacity, setFuelCapacity, '20000',   'numeric'],
        ['CRUISE SPEED (KTS)', cruiseSpeed,  setCruiseSpeed,  '450',     'numeric'],
      ].map(([label, val, setter, ph, caps]) => (
        <View key={label} style={S.inputWrap}>
          <Text style={S.inputLabel}>{label}</Text>
          <TextInput
            style={S.input} value={val} onChangeText={setter}
            placeholder={ph} placeholderTextColor={C.textDim}
            autoCapitalize={caps} keyboardType={caps === 'numeric' ? 'numeric' : 'default'}
          />
        </View>
      ))}
 
      <TouchableOpacity
        style={[S.btnPrimary, loading && S.btnDisabled]}
        onPress={handleRun} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#0A1F14" size="small" />
          : <Text style={S.btnPrimaryText}>🛰  RUN SIMULATION</Text>}
      </TouchableOpacity>
 
      <View style={[styles.note, { marginBottom: 48 }]}>
        <Text style={styles.noteText}>
          Pulls live data from Aviation Weather, Open-Meteo, OpenSky & OpenAIP. Allow up to 15s.
        </Text>
      </View>
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  note:     { marginHorizontal: 16, padding: 12, backgroundColor: C.bgCard,
              borderRadius: 12, borderWidth: 1, borderColor: C.border },
  noteText: { color: C.textDim, fontSize: 11, textAlign: 'center', lineHeight: 17 },
});
 