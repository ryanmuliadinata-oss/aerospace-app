import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AIRCRAFT = ['B737', 'A320', 'B777', 'B747', 'A380'];

export default function RunwayScreen() {
  const [aircraft,  setAircraft]  = useState('B737');
  const [icao,      setIcao]      = useState('KLAX');
  const [windSpeed, setWindSpeed] = useState('10');
  const [windDir,   setWindDir]   = useState('270');
  const [tempC,     setTempC]     = useState('15');
  const [pressHpa,  setPressHpa]  = useState('1013');
  const [category,  setCategory]  = useState('VFR');
  const [fuelKg,    setFuelKg]    = useState('15000');
  const [payloadKg, setPayloadKg] = useState('15000');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/runway`, {
        aircraftType: aircraft,
        fuelKg:    parseFloat(fuelKg),
        payloadKg: parseFloat(payloadKg),
        weather: {
          waypoint:           { name: icao, latitude: 0, longitude: 0, altitudeFt: 0 },
          windSpeedKts:       parseFloat(windSpeed),
          windDirectionDeg:   parseFloat(windDir),
          temperatureCelsius: parseFloat(tempC),
          pressureHpa:        parseFloat(pressHpa),
          flightCategory:     category,
          rawMetar:           'N/A',
          sigmetAlert:        false,
        },
      });
      setResult(res.data);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container}>

      <Text style={s.sectionTitle}>AIRCRAFT</Text>
      <View style={s.presetRow}>
        {AIRCRAFT.map(ac => (
          <TouchableOpacity
            key={ac}
            style={[s.acBtn, aircraft === ac && s.acBtnActive]}
            onPress={() => setAircraft(ac)}
          >
            <Text style={[s.acText, aircraft === ac && s.acTextActive]}>{ac}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>WEATHER CONDITIONS</Text>
      {[
        ['Airport ICAO',    icao,      setIcao,      'KLAX',  'characters'],
        ['Wind Speed (kts)', windSpeed, setWindSpeed, '10',    'numeric'],
        ['Wind Dir (°)',     windDir,   setWindDir,   '270',   'numeric'],
        ['Temp (°C)',        tempC,     setTempC,     '15',    'numeric'],
        ['Pressure (hPa)',   pressHpa,  setPressHpa,  '1013',  'numeric'],
      ].map(([label, val, setter, ph, caps]) => (
        <View key={label} style={s.field}>
          <Text style={s.label}>{label}</Text>
          <TextInput
            style={s.input}
            value={val}
            onChangeText={setter}
            placeholder={ph}
            placeholderTextColor="#445"
            autoCapitalize={caps}
            keyboardType={caps === 'numeric' ? 'numeric' : 'default'}
          />
        </View>
      ))}

      <Text style={s.sectionTitle}>FLIGHT CATEGORY</Text>
      <View style={s.presetRow}>
        {['VFR', 'MVFR', 'IFR', 'LIFR'].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.catBtn, category === cat && s.catBtnActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[s.catText, category === cat && s.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>LOAD</Text>
      {[
        ['Fuel (kg)',    fuelKg,    setFuelKg,    '15000'],
        ['Payload (kg)', payloadKg, setPayloadKg, '15000'],
      ].map(([label, val, setter, ph]) => (
        <View key={label} style={s.field}>
          <Text style={s.label}>{label}</Text>
          <TextInput
            style={s.input}
            value={val}
            onChangeText={setter}
            placeholder={ph}
            placeholderTextColor="#445"
            keyboardType="numeric"
          />
        </View>
      ))}

      <TouchableOpacity
        style={[s.btn, loading && s.btnDisabled]}
        onPress={analyze}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#000" size="small" />
          : <Text style={s.btnText}>🛬  ANALYZE RUNWAY</Text>
        }
      </TouchableOpacity>

      {result && (
        <>
          <View style={[s.banner,
            result.crosswindOk ? s.bannerGo : s.bannerNogo]}>
            <Text style={s.bannerIcon}>{result.crosswindOk ? '✅' : '⚠️'}</Text>
            <Text style={s.bannerText}>{result.assessment}</Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>🛫  TAKEOFF</Text>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>Required Distance</Text>
              <Text style={s.resultValue}>{result.takeoffDistanceM} m</Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>In Feet</Text>
              <Text style={s.resultValue}>
                {Math.round(result.takeoffDistanceM * 3.281)} ft
              </Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>🛬  LANDING</Text>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>Required Distance</Text>
              <Text style={s.resultValue}>{result.landingDistanceM} m</Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>In Feet</Text>
              <Text style={s.resultValue}>
                {Math.round(result.landingDistanceM * 3.281)} ft
              </Text>
            </View>
          </View>

          <View style={[s.card, { marginBottom: 40 }]}>
            <Text style={s.cardTitle}>💨  WIND ANALYSIS</Text>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>Crosswind Component</Text>
              <Text style={[s.resultValue,
                { color: result.crosswindOk ? '#00FF88' : '#FF3333' }]}>
                {result.crosswindKts} kts
              </Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>Max Crosswind ({result.aircraftType})</Text>
              <Text style={s.resultValue}>{result.maxCrosswindKts} kts</Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>Flight Category</Text>
              <Text style={s.resultValue}>{result.flightCategory}</Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>Wind</Text>
              <Text style={s.resultValue}>
                {result.windSpeedKts} kts @ {result.windDirectionDeg}°
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#0A0E1A', padding:16 },
  sectionTitle: { color:'#00D4FF', fontSize:11, fontWeight:'700',
                  letterSpacing:2.5, marginTop:24, marginBottom:12 },
  presetRow:    { flexDirection:'row', gap:8, flexWrap:'wrap', marginBottom:8 },
  acBtn:        { backgroundColor:'#111827', borderRadius:8,
                  paddingHorizontal:14, paddingVertical:9,
                  borderWidth:1, borderColor:'#1F2937' },
  acBtnActive:  { borderColor:'#00D4FF', backgroundColor:'#00D4FF18' },
  acText:       { color:'#667788', fontSize:12, fontWeight:'600' },
  acTextActive: { color:'#00D4FF' },
  catBtn:       { backgroundColor:'#111827', borderRadius:8,
                  paddingHorizontal:14, paddingVertical:9,
                  borderWidth:1, borderColor:'#1F2937' },
  catBtnActive: { borderColor:'#00FF88', backgroundColor:'#00FF8818' },
  catText:      { color:'#667788', fontSize:12, fontWeight:'600' },
  catTextActive:{ color:'#00FF88' },
  field:        { marginBottom:12 },
  label:        { color:'#667788', fontSize:11, marginBottom:6, letterSpacing:1 },
  input:        { backgroundColor:'#111827', color:'#FFF', borderRadius:10,
                  padding:13, fontSize:15, borderWidth:1, borderColor:'#1F2937' },
  btn:          { backgroundColor:'#00D4FF', borderRadius:12, padding:16,
                  alignItems:'center', marginTop:8, marginBottom:16 },
  btnDisabled:  { opacity:0.4 },
  btnText:      { color:'#000919', fontSize:15, fontWeight:'800', letterSpacing:1.5 },
  banner:       { borderRadius:12, padding:16, marginBottom:16,
                  flexDirection:'row', alignItems:'center', gap:12 },
  bannerGo:     { backgroundColor:'#00FF8818', borderWidth:1, borderColor:'#00FF88' },
  bannerNogo:   { backgroundColor:'#FF8C0018', borderWidth:1, borderColor:'#FF8C00' },
  bannerIcon:   { fontSize:22 },
  bannerText:   { color:'#FFF', fontSize:13, fontWeight:'700', flex:1 },
  card:         { backgroundColor:'#111827', borderRadius:14, padding:16,
                  marginBottom:14, borderWidth:1, borderColor:'#1F2937' },
  cardTitle:    { color:'#00D4FF', fontSize:11, fontWeight:'700',
                  letterSpacing:2.5, marginBottom:14 },
  resultRow:    { flexDirection:'row', justifyContent:'space-between',
                  paddingVertical:8, borderBottomWidth:1,
                  borderBottomColor:'#1F2937' },
  resultLabel:  { color:'#667788', fontSize:12 },
  resultValue:  { color:'#FFF', fontWeight:'700', fontSize:12 },
});