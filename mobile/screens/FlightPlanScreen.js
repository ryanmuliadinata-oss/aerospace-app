import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { runSimulation } from '../api/flightApi';

const PRESETS = [
  {
    label: 'LAX→JFK',
    plan: {
      flightId: 'AAL001', aircraftType: 'B737',
      origin: 'KLAX', destination: 'KJFK',
      fuelCapacityKg: 20000, cruiseSpeedKts: 450,
      waypoints: [
        { name:'KLAX', latitude:33.9425, longitude:-118.4081, altitudeFt:35000 },
        { name:'KDFW', latitude:32.8998, longitude:-97.0403,  altitudeFt:35000 },
        { name:'KMEM', latitude:35.0424, longitude:-89.9767,  altitudeFt:36000 },
        { name:'KJFK', latitude:40.6413, longitude:-73.7781,  altitudeFt:0     },
      ],
    },
  },
  {
    label: 'SFO→ORD',
    plan: {
      flightId: 'UAL202', aircraftType: 'A320',
      origin: 'KSFO', destination: 'KORD',
      fuelCapacityKg: 18000, cruiseSpeedKts: 420,
      waypoints: [
        { name:'KSFO', latitude:37.6213, longitude:-122.3790, altitudeFt:37000 },
        { name:'KSLC', latitude:40.7884, longitude:-111.9778, altitudeFt:37000 },
        { name:'KDEN', latitude:39.8561, longitude:-104.6737, altitudeFt:38000 },
        { name:'KORD', latitude:41.9742, longitude:-87.9073,  altitudeFt:0     },
      ],
    },
  },
  {
    label: 'LHR→JFK',
    plan: {
      flightId: 'BAW001', aircraftType: 'B777',
      origin: 'EGLL', destination: 'KJFK',
      fuelCapacityKg: 145000, cruiseSpeedKts: 490,
      waypoints: [
        { name:'EGLL', latitude:51.4775, longitude:-0.4614,  altitudeFt:37000 },
        { name:'EINN', latitude:52.7020, longitude:-8.9248,  altitudeFt:37000 },
        { name:'CYYT', latitude:47.6186, longitude:-52.7319, altitudeFt:38000 },
        { name:'KJFK', latitude:40.6413, longitude:-73.7781, altitudeFt:0     },
      ],
    },
  },
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
    setIdx(i);
    setFlightId(p.flightId);
    setAircraftType(p.aircraftType);
    setOrigin(p.origin);
    setDestination(p.destination);
    setFuelCapacity(String(p.fuelCapacityKg));
    setCruiseSpeed(String(p.cruiseSpeedKts));
  };

  const handleRun = async () => {
    if (!flightId || !origin || !destination) {
      Alert.alert('Missing Fields', 'Fill in all fields.');
      return;
    }
    const preset = PRESETS.find(p => p.plan.flightId === flightId)
                || PRESETS[idx];
    setLoading(true);
    try {
      const result = await runSimulation({
        ...preset.plan,
        flightId,
        aircraftType,
        origin,
        destination,
        fuelCapacityKg: parseFloat(fuelCapacity),
        cruiseSpeedKts: parseFloat(cruiseSpeed),
      });
      navigation.navigate('Simulation', { report: result });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message
        || e.message || 'Server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.sectionTitle}>QUICK LOAD</Text>
      <View style={s.presetRow}>
        {PRESETS.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[s.presetBtn, idx === i && s.presetBtnActive]}
            onPress={() => applyPreset(i)}
          >
            <Text style={[s.presetText, idx === i && s.presetTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>FLIGHT DETAILS</Text>
      {[
        ['Flight ID',          flightId,     setFlightId,     'AAL001', 'default'],
        ['Aircraft Type',      aircraftType, setAircraftType, 'B737',   'default'],
        ['Origin ICAO',        origin,       setOrigin,       'KLAX',   'default'],
        ['Destination ICAO',   destination,  setDestination,  'KJFK',   'default'],
        ['Fuel Capacity (kg)', fuelCapacity, setFuelCapacity, '20000',  'numeric'],
        ['Cruise Speed (kts)', cruiseSpeed,  setCruiseSpeed,  '450',    'numeric'],
      ].map(([label, val, setter, ph, kb]) => (
        <View key={label} style={s.field}>
          <Text style={s.label}>{label}</Text>
          <TextInput
            style={s.input}
            value={val}
            onChangeText={setter}
            placeholder={ph}
            placeholderTextColor="#445"
            autoCapitalize={kb === 'default' ? 'characters' : 'none'}
            keyboardType={kb}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[s.btn, loading && s.btnDisabled]}
        onPress={handleRun}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#000" size="small" />
          : <Text style={s.btnText}>🛰  RUN SIMULATION</Text>
        }
      </TouchableOpacity>

      <View style={s.note}>
        <Text style={s.noteText}>
          Pulls live data from Aviation Weather, FlightAware and
          Open-Meteo. Allow up to 15 seconds.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#0A0E1A', padding:16 },
  sectionTitle:    { color:'#00D4FF', fontSize:11, fontWeight:'700',
                     letterSpacing:2.5, marginTop:24, marginBottom:12 },
  presetRow:       { flexDirection:'row', gap:8, flexWrap:'wrap' },
  presetBtn:       { backgroundColor:'#111827', borderRadius:8,
                     paddingHorizontal:14, paddingVertical:9,
                     borderWidth:1, borderColor:'#1F2937' },
  presetBtnActive: { borderColor:'#00D4FF', backgroundColor:'#00D4FF18' },
  presetText:      { color:'#667788', fontSize:12, fontWeight:'600' },
  presetTextActive:{ color:'#00D4FF' },
  field:           { marginBottom:12 },
  label:           { color:'#667788', fontSize:11,
                     marginBottom:6, letterSpacing:1 },
  input:           { backgroundColor:'#111827', color:'#FFF',
                     borderRadius:10, padding:13, fontSize:15,
                     borderWidth:1, borderColor:'#1F2937' },
  btn:             { backgroundColor:'#00D4FF', borderRadius:12,
                     padding:16, alignItems:'center', marginTop:24 },
  btnDisabled:     { opacity:0.4 },
  btnText:         { color:'#000919', fontSize:15,
                     fontWeight:'800', letterSpacing:1.5 },
  note:            { marginTop:16, marginBottom:40, padding:12,
                     backgroundColor:'#111827', borderRadius:10,
                     borderWidth:1, borderColor:'#1F2937' },
  noteText:        { color:'#445566', fontSize:11,
                     lineHeight:18, textAlign:'center' },
});