import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, Alert
} from 'react-native';

const AIRCRAFT_LIMITS = {
  B737: { maxTakeoffKg: 79016, maxLandingKg: 66360, maxZeroFuelKg: 62732,
          emptyWeightKg: 41413, maxPax: 189, cgMin: 15, cgMax: 35 },
  A320: { maxTakeoffKg: 78000, maxLandingKg: 66000, maxZeroFuelKg: 61000,
          emptyWeightKg: 42600, maxPax: 180, cgMin: 16, cgMax: 34 },
  B777: { maxTakeoffKg: 299370, maxLandingKg: 213180, maxZeroFuelKg: 201840,
          emptyWeightKg: 145150, maxPax: 396, cgMin: 12, cgMax: 38 },
  B747: { maxTakeoffKg: 412775, maxLandingKg: 295742, maxZeroFuelKg: 272155,
          emptyWeightKg: 178756, maxPax: 467, cgMin: 13, cgMax: 37 },
  A380: { maxTakeoffKg: 575000, maxLandingKg: 394000, maxZeroFuelKg: 369000,
          emptyWeightKg: 276800, maxPax: 555, cgMin: 14, cgMax: 40 },
};

const AVG_PAX_KG = 95; // avg passenger + baggage weight

export default function WeightBalanceScreen() {
  const [aircraft,    setAircraft]    = useState('B737');
  const [passengers,  setPassengers]  = useState('150');
  const [cargoKg,     setCargoKg]     = useState('2000');
  const [fuelKg,      setFuelKg]      = useState('15000');
  const [result,      setResult]      = useState(null);

  const calculate = () => {
    const limits = AIRCRAFT_LIMITS[aircraft];
    if (!limits) { Alert.alert('Error', 'Unknown aircraft type'); return; }

    const pax        = parseInt(passengers)  || 0;
    const cargo      = parseFloat(cargoKg)   || 0;
    const fuel       = parseFloat(fuelKg)    || 0;
    const paxWeight  = pax * AVG_PAX_KG;

    if (pax > limits.maxPax) {
      Alert.alert('Error', `Max passengers for ${aircraft} is ${limits.maxPax}`);
      return;
    }

    const zeroFuelWeight  = limits.emptyWeightKg + paxWeight + cargo;
    const takeoffWeight   = zeroFuelWeight + fuel;
    const landingWeight   = takeoffWeight - (fuel * 0.85);
    const cgEstimate      = 25 + ((paxWeight - cargo) / takeoffWeight) * 10;

    const checks = {
      zeroFuel:  zeroFuelWeight  <= limits.maxZeroFuelKg,
      takeoff:   takeoffWeight   <= limits.maxTakeoffKg,
      landing:   landingWeight   <= limits.maxLandingKg,
      cg:        cgEstimate >= limits.cgMin && cgEstimate <= limits.cgMax,
      paxCount:  pax <= limits.maxPax,
    };

    const allGood = Object.values(checks).every(Boolean);

    setResult({
      zeroFuelWeight, takeoffWeight, landingWeight,
      cgEstimate, checks, allGood, limits,
      paxWeight, cargo, fuel,
    });
  };

  const StatusRow = ({ label, value, max, unit, ok }) => (
    <View style={s.statusRow}>
      <View style={s.statusLeft}>
        <Text style={s.statusLabel}>{label}</Text>
        <View style={s.barTrack}>
          <View style={[s.barFill, {
            width: `${Math.min((value/max)*100, 100)}%`,
            backgroundColor: ok ? '#00FF88' : '#FF3333'
          }]} />
        </View>
      </View>
      <View style={s.statusRight}>
        <Text style={[s.statusValue, { color: ok ? '#00FF88' : '#FF3333' }]}>
          {value.toFixed(0)} {unit}
        </Text>
        <Text style={s.statusMax}>/ {max.toFixed(0)} {unit}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={s.container}>
      <Text style={s.sectionTitle}>AIRCRAFT TYPE</Text>
      <View style={s.presetRow}>
        {Object.keys(AIRCRAFT_LIMITS).map(ac => (
          <TouchableOpacity
            key={ac}
            style={[s.acBtn, aircraft === ac && s.acBtnActive]}
            onPress={() => setAircraft(ac)}
          >
            <Text style={[s.acText, aircraft === ac && s.acTextActive]}>
              {ac}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>LOAD INPUTS</Text>
      {[
        ['Passengers', passengers, setPassengers, 'numeric', 'e.g. 150'],
        ['Cargo (kg)',  cargoKg,   setCargoKg,   'numeric', 'e.g. 2000'],
        ['Fuel (kg)',   fuelKg,    setFuelKg,    'numeric', 'e.g. 15000'],
      ].map(([label, val, setter, kb, ph]) => (
        <View key={label} style={s.field}>
          <Text style={s.label}>{label}</Text>
          <TextInput
            style={s.input}
            value={val}
            onChangeText={setter}
            keyboardType={kb}
            placeholder={ph}
            placeholderTextColor="#445"
          />
        </View>
      ))}

      <View style={s.note}>
        <Text style={s.noteText}>
          Avg passenger + baggage weight: {AVG_PAX_KG} kg
        </Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={calculate}>
        <Text style={s.btnText}>⚖️  CALCULATE</Text>
      </TouchableOpacity>

      {result && (
        <>
          <View style={[s.banner,
            result.allGood ? s.bannerGo : s.bannerNogo]}>
            <Text style={s.bannerIcon}>{result.allGood ? '✅' : '❌'}</Text>
            <Text style={s.bannerText}>
              {result.allGood
                ? 'WITHIN LIMITS — Safe to load'
                : 'EXCEEDS LIMITS — Adjust load'}
            </Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>⚖️  WEIGHT ANALYSIS</Text>
            <StatusRow
              label="Zero Fuel Weight"
              value={result.zeroFuelWeight}
              max={result.limits.maxZeroFuelKg}
              unit="kg"
              ok={result.checks.zeroFuel}
            />
            <StatusRow
              label="Takeoff Weight"
              value={result.takeoffWeight}
              max={result.limits.maxTakeoffKg}
              unit="kg"
              ok={result.checks.takeoff}
            />
            <StatusRow
              label="Landing Weight"
              value={result.landingWeight}
              max={result.limits.maxLandingKg}
              unit="kg"
              ok={result.checks.landing}
            />
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>📍  CENTER OF GRAVITY</Text>
            <View style={s.cgRow}>
              <Text style={s.cgLabel}>Estimated CG</Text>
              <Text style={[s.cgValue,
                { color: result.checks.cg ? '#00FF88' : '#FF3333' }]}>
                {result.cgEstimate.toFixed(1)}% MAC
              </Text>
            </View>
            <View style={s.cgTrack}>
              <View style={[s.cgLimit, {
                left: `${result.limits.cgMin}%`,
                width: `${result.limits.cgMax - result.limits.cgMin}%`,
              }]} />
              <View style={[s.cgMarker, {
                left: `${Math.min(Math.max(result.cgEstimate, 0), 100)}%`,
              }]} />
            </View>
            <View style={s.cgLabels}>
              <Text style={s.cgLimitLabel}>FWD {result.limits.cgMin}%</Text>
              <Text style={s.cgLimitLabel}>AFT {result.limits.cgMax}%</Text>
            </View>
          </View>

          <View style={[s.card, { marginBottom: 40 }]}>
            <Text style={s.cardTitle}>📋  LOAD BREAKDOWN</Text>
            {[
              ['Empty Weight',    result.limits.emptyWeightKg],
              ['Passengers',      result.paxWeight],
              ['Cargo',           result.cargo],
              ['Fuel',            result.fuel],
              ['Total (Takeoff)', result.takeoffWeight],
            ].map(([label, val]) => (
              <View key={label} style={s.breakRow}>
                <Text style={s.breakLabel}>{label}</Text>
                <Text style={s.breakValue}>{val.toFixed(0)} kg</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:'#0A0E1A', padding:16 },
  sectionTitle:  { color:'#00D4FF', fontSize:11, fontWeight:'700',
                   letterSpacing:2.5, marginTop:24, marginBottom:12 },
  presetRow:     { flexDirection:'row', gap:8, flexWrap:'wrap' },
  acBtn:         { backgroundColor:'#111827', borderRadius:8,
                   paddingHorizontal:14, paddingVertical:9,
                   borderWidth:1, borderColor:'#1F2937' },
  acBtnActive:   { borderColor:'#00D4FF', backgroundColor:'#00D4FF18' },
  acText:        { color:'#667788', fontSize:12, fontWeight:'600' },
  acTextActive:  { color:'#00D4FF' },
  field:         { marginBottom:12 },
  label:         { color:'#667788', fontSize:11, marginBottom:6, letterSpacing:1 },
  input:         { backgroundColor:'#111827', color:'#FFF', borderRadius:10,
                   padding:13, fontSize:15, borderWidth:1, borderColor:'#1F2937' },
  note:          { backgroundColor:'#111827', borderRadius:10, padding:12,
                   borderWidth:1, borderColor:'#1F2937', marginBottom:16 },
  noteText:      { color:'#445566', fontSize:11, textAlign:'center' },
  btn:           { backgroundColor:'#00D4FF', borderRadius:12, padding:16,
                   alignItems:'center', marginTop:8, marginBottom:16 },
  btnText:       { color:'#000919', fontSize:15, fontWeight:'800', letterSpacing:1.5 },
  banner:        { borderRadius:12, padding:16, marginBottom:16,
                   flexDirection:'row', alignItems:'center', gap:12 },
  bannerGo:      { backgroundColor:'#00FF8818', borderWidth:1, borderColor:'#00FF88' },
  bannerNogo:    { backgroundColor:'#FF333318', borderWidth:1, borderColor:'#FF3333' },
  bannerIcon:    { fontSize:22 },
  bannerText:    { color:'#FFF', fontSize:14, fontWeight:'700', flex:1 },
  card:          { backgroundColor:'#111827', borderRadius:14, padding:16,
                   marginBottom:14, borderWidth:1, borderColor:'#1F2937' },
  cardTitle:     { color:'#00D4FF', fontSize:11, fontWeight:'700',
                   letterSpacing:2.5, marginBottom:14 },
  statusRow:     { flexDirection:'row', alignItems:'center',
                   marginBottom:14, gap:12 },
  statusLeft:    { flex:1 },
  statusLabel:   { color:'#667788', fontSize:11, marginBottom:6 },
  barTrack:      { height:8, backgroundColor:'#1F2937',
                   borderRadius:4, overflow:'hidden' },
  barFill:       { height:'100%', borderRadius:4 },
  statusRight:   { alignItems:'flex-end', width:90 },
  statusValue:   { fontWeight:'700', fontSize:13 },
  statusMax:     { color:'#445566', fontSize:10, marginTop:2 },
  cgRow:         { flexDirection:'row', justifyContent:'space-between',
                   marginBottom:12 },
  cgLabel:       { color:'#667788', fontSize:13 },
  cgValue:       { fontWeight:'700', fontSize:13 },
  cgTrack:       { height:16, backgroundColor:'#1F2937', borderRadius:8,
                   marginBottom:6, position:'relative' },
  cgLimit:       { position:'absolute', height:'100%',
                   backgroundColor:'#00FF8833', borderRadius:8 },
  cgMarker:      { position:'absolute', width:4, height:'100%',
                   backgroundColor:'#00D4FF', borderRadius:2, marginLeft:-2 },
  cgLabels:      { flexDirection:'row', justifyContent:'space-between' },
  cgLimitLabel:  { color:'#445566', fontSize:10 },
  breakRow:      { flexDirection:'row', justifyContent:'space-between',
                   paddingVertical:8, borderBottomWidth:1,
                   borderBottomColor:'#1F2937' },
  breakLabel:    { color:'#667788', fontSize:12 },
  breakValue:    { color:'#FFF', fontWeight:'700', fontSize:12 },
});