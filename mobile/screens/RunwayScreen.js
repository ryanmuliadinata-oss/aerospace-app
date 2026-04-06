import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { fetchAirportByIcao, bestRunwayForWind } from '../api/openAipApi';
import { C, S, T } from '../theme';
 
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
  const [airport,   setAirport]   = useState(null);
  const [apLoading, setApLoading] = useState(false);
 
  const fetchAirport = async (code) => {
    if (!code || code.length !== 4) return;
    setApLoading(true); setAirport(null);
    try {
      const data = await fetchAirportByIcao(code);
      setAirport(data);
      if (data?.elevationFt) {
        const stdPressure = +(1013.25 - data.elevationFt / 30).toFixed(0);
        setPressHpa(String(Math.max(950, stdPressure)));
      }
    } catch (e) { console.warn('[RunwayScreen] OpenAIP failed:', e.message); }
    finally { setApLoading(false); }
  };
 
  const analyze = async () => {
    setLoading(true);
    try {
      const bestRwy = airport
        ? bestRunwayForWind(parseFloat(windDir), parseFloat(windSpeed), airport.runways)
        : null;
      const effectiveWindDir = bestRwy != null
        ? parseFloat(windDir) - (bestRwy.runway.trueHeading ?? 0)
        : parseFloat(windDir);
      const res = await axios.post(`${API_BASE_URL}/runway`, {
        aircraftType: aircraft,
        fuelKg: parseFloat(fuelKg), payloadKg: parseFloat(payloadKg),
        weather: {
          waypoint: { name: icao, latitude: 0, longitude: 0, altitudeFt: airport?.elevationFt ?? 0 },
          windSpeedKts: parseFloat(windSpeed), windDirectionDeg: effectiveWindDir,
          temperatureCelsius: parseFloat(tempC), pressureHpa: parseFloat(pressHpa),
          flightCategory: category, rawMetar: 'N/A', sigmetAlert: false,
        },
      });
      setResult({ ...res.data, bestRwy, airport });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };
 
  const CAT_COLORS = { VFR: C.green, MVFR: C.blue, IFR: C.red, LIFR: C.purple };
 
  return (
    <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
      <View style={S.titleBlock}>
        <Text style={[T.screenLabel, { marginBottom: 4 }]}>PERFORMANCE</Text>
        <Text style={T.screenTitle}>Runway Analysis</Text>
      </View>
 
      <Text style={S.sectionHeader}>AIRCRAFT</Text>
      <View style={S.tagRow}>
        {AIRCRAFT.map(ac => (
          <TouchableOpacity key={ac} style={[S.tag, aircraft === ac && S.tagActive]}
            onPress={() => setAircraft(ac)}>
            <Text style={[S.tagText, aircraft === ac && S.tagTextActive]}>{ac}</Text>
          </TouchableOpacity>
        ))}
      </View>
 
      <Text style={S.sectionHeader}>AIRPORT (OpenAIP)</Text>
      <View style={S.inputWrap}>
        <Text style={S.inputLabel}>ICAO CODE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            style={[S.input, { flex: 1 }]} value={icao}
            onChangeText={v => { setIcao(v.toUpperCase()); setAirport(null); }}
            onBlur={() => fetchAirport(icao)}
            placeholder="KLAX" placeholderTextColor={C.textDim}
            autoCapitalize="characters" maxLength={4}
          />
          {apLoading && <ActivityIndicator color={C.green} />}
        </View>
      </View>
 
      {airport && (
        <View style={[S.cardGreen, { marginBottom: 10 }]}>
          <Text style={styles.apName}>{airport.name}</Text>
          <View style={styles.apMeta}>
            <Text style={styles.apMetaItem}>Elev <Text style={styles.apMetaVal}>
              {airport.elevationFt != null ? `${airport.elevationFt} ft` : 'N/A'}
            </Text></Text>
            <Text style={styles.apMetaItem}>Longest <Text style={styles.apMetaVal}>
              {airport.longestRunwayFt != null ? `${airport.longestRunwayFt.toLocaleString()} ft` : 'N/A'}
            </Text></Text>
            <Text style={styles.apMetaItem}>Runways <Text style={styles.apMetaVal}>
              {airport.runways.length}
            </Text></Text>
          </View>
          {airport.runways.length > 0 && (<>
            <Text style={[T.cardTitle, { marginBottom: 6, marginTop: 4 }]}>RUNWAYS</Text>
            {airport.runways.map((rwy, i) => (
              <View key={i} style={styles.rwyRow}>
                <Text style={styles.rwyDesig}>{rwy.designator}</Text>
                <Text style={styles.rwyLen}>
                  {rwy.lengthFt != null ? `${rwy.lengthFt.toLocaleString()} ft` : '—'}
                </Text>
                <Text style={styles.rwyHdg}>
                  {rwy.trueHeading != null ? `${rwy.trueHeading}°` : '—'}
                </Text>
                <Text style={styles.rwySurface}>{rwy.surface}</Text>
              </View>
            ))}
          </>)}
        </View>
      )}
 
      <Text style={S.sectionHeader}>WEATHER CONDITIONS</Text>
      {[
        ['WIND SPEED (KTS)', windSpeed, setWindSpeed, '10'],
        ['WIND DIR (°)',     windDir,   setWindDir,   '270'],
        ['TEMP (°C)',        tempC,     setTempC,     '15'],
        ['PRESSURE (HPA)',   pressHpa,  setPressHpa,  '1013'],
      ].map(([label, val, setter, ph]) => (
        <View key={label} style={S.inputWrap}>
          <Text style={S.inputLabel}>{label}</Text>
          <TextInput style={S.input} value={val} onChangeText={setter}
            placeholder={ph} placeholderTextColor={C.textDim} keyboardType="numeric" />
        </View>
      ))}
 
      <Text style={S.sectionHeader}>FLIGHT CATEGORY</Text>
      <View style={S.tagRow}>
        {['VFR', 'MVFR', 'IFR', 'LIFR'].map(cat => (
          <TouchableOpacity key={cat}
            style={[S.tag, category === cat && { borderColor: (CAT_COLORS[cat] || C.green) + '88',
              backgroundColor: (CAT_COLORS[cat] || C.green) + '18' }]}
            onPress={() => setCategory(cat)}>
            <Text style={[S.tagText, category === cat && { color: CAT_COLORS[cat] || C.green }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
 
      <Text style={S.sectionHeader}>LOAD</Text>
      {[
        ['FUEL (KG)',    fuelKg,    setFuelKg,    '15000'],
        ['PAYLOAD (KG)', payloadKg, setPayloadKg, '15000'],
      ].map(([label, val, setter, ph]) => (
        <View key={label} style={S.inputWrap}>
          <Text style={S.inputLabel}>{label}</Text>
          <TextInput style={S.input} value={val} onChangeText={setter}
            placeholder={ph} placeholderTextColor={C.textDim} keyboardType="numeric" />
        </View>
      ))}
 
      <TouchableOpacity style={[S.btnPrimary, loading && S.btnDisabled]}
        onPress={analyze} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#0A1F14" size="small" />
          : <Text style={S.btnPrimaryText}>🛬  ANALYZE RUNWAY</Text>}
      </TouchableOpacity>
 
      {result && (<>
        <View style={[result.crosswindOk ? S.bannerGo : S.bannerNogo]}>
          <Text style={S.bannerIcon}>{result.crosswindOk ? '✅' : '⚠️'}</Text>
          <Text style={S.bannerText}>{result.assessment}</Text>
        </View>
 
        {result.bestRwy && (
          <View style={S.cardGreen}>
            <Text style={[T.cardTitle, { marginBottom: 12 }]}>BEST RUNWAY (OpenAIP)</Text>
            {[
              ['Runway',           result.bestRwy.runway.designator],
              ['True Heading',     `${result.bestRwy.runway.trueHeading}°`],
              ['Length',           result.bestRwy.runway.lengthFt != null ? `${result.bestRwy.runway.lengthFt.toLocaleString()} ft` : 'N/A'],
              ['Surface',          result.bestRwy.runway.surface],
            ].map(([lbl, val]) => (
              <View key={lbl} style={S.dataRow}>
                <Text style={S.dataLbl}>{lbl}</Text>
                <Text style={S.dataVal}>{val}</Text>
              </View>
            ))}
            <View style={S.dataRow}>
              <Text style={S.dataLbl}>Headwind</Text>
              <Text style={[S.dataVal, { color: result.bestRwy.headwindKts >= 0 ? C.green : C.gold }]}>
                {result.bestRwy.headwindKts >= 0
                  ? `${result.bestRwy.headwindKts} kts HW`
                  : `${Math.abs(result.bestRwy.headwindKts)} kts TW`}
              </Text>
            </View>
            <View style={[S.dataRow, { borderBottomWidth: 0 }]}>
              <Text style={S.dataLbl}>Crosswind</Text>
              <Text style={[S.dataVal, { color: result.crosswindOk ? C.green : C.red }]}>
                {result.bestRwy.crosswindKts} kts
              </Text>
            </View>
          </View>
        )}
 
        <View style={S.card}>
          <Text style={[T.cardTitle, { marginBottom: 12 }]}>🛫  TAKEOFF</Text>
          <View style={S.dataRow}>
            <Text style={S.dataLbl}>Required Distance</Text>
            <Text style={S.dataVal}>{result.takeoffDistanceM} m</Text>
          </View>
          <View style={[S.dataRow, { borderBottomWidth: 0 }]}>
            <Text style={S.dataLbl}>In Feet</Text>
            <Text style={S.dataVal}>{Math.round(result.takeoffDistanceM * 3.281)} ft</Text>
          </View>
        </View>
 
        <View style={S.card}>
          <Text style={[T.cardTitle, { marginBottom: 12 }]}>🛬  LANDING</Text>
          <View style={S.dataRow}>
            <Text style={S.dataLbl}>Required Distance</Text>
            <Text style={S.dataVal}>{result.landingDistanceM} m</Text>
          </View>
          <View style={[S.dataRow, { borderBottomWidth: 0 }]}>
            <Text style={S.dataLbl}>In Feet</Text>
            <Text style={S.dataVal}>{Math.round(result.landingDistanceM * 3.281)} ft</Text>
          </View>
        </View>
 
        <View style={[S.card, { marginBottom: 48 }]}>
          <Text style={[T.cardTitle, { marginBottom: 12 }]}>💨  WIND ANALYSIS</Text>
          <View style={S.dataRow}>
            <Text style={S.dataLbl}>Crosswind Component</Text>
            <Text style={[S.dataVal, { color: result.crosswindOk ? C.green : C.red }]}>
              {result.crosswindKts} kts
            </Text>
          </View>
          <View style={S.dataRow}>
            <Text style={S.dataLbl}>Max Crosswind ({result.aircraftType})</Text>
            <Text style={S.dataVal}>{result.maxCrosswindKts} kts</Text>
          </View>
          <View style={S.dataRow}>
            <Text style={S.dataLbl}>Flight Category</Text>
            <Text style={[S.dataVal, { color: CAT_COLORS[result.flightCategory] || C.textPrimary }]}>
              {result.flightCategory}
            </Text>
          </View>
          <View style={[S.dataRow, { borderBottomWidth: 0 }]}>
            <Text style={S.dataLbl}>Wind</Text>
            <Text style={S.dataVal}>{result.windSpeedKts} kts @ {result.windDirectionDeg}°</Text>
          </View>
        </View>
      </>)}
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  apName:      { color: C.green, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  apMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 10 },
  apMetaItem:  { color: C.textMuted, fontSize: 11 },
  apMetaVal:   { color: C.textPrimary, fontWeight: '700' },
  rwyRow:      { flexDirection: 'row', alignItems: 'center', gap: 8,
                 paddingVertical: 6, borderTopWidth: 1,
                 borderTopColor: 'rgba(255,255,255,0.05)' },
  rwyDesig:    { color: C.textPrimary, fontWeight: '700', fontSize: 12, width: 36 },
  rwyLen:      { color: C.green, fontSize: 11, flex: 1 },
  rwyHdg:      { color: C.textMuted, fontSize: 11, width: 38 },
  rwySurface:  { color: C.textDim, fontSize: 10 },
});
 