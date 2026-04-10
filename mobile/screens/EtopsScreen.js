import React, { useState } from 'react';
import { C, S, T } from '../theme';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText, Rect } from 'react-native-svg';
import axios from 'axios';
import { API_BASE_URL } from '../config';
 
// Known ETOPS routes with preset waypoints
const PRESET_ROUTES = [
  {
    label: 'LHR → JFK (North Atlantic)',
    aircraft: 'B777',
    waypoints: [
      { name: 'EGLL', latitude: 51.4775,  longitude: -0.4614,   altitudeFt: 37000 },
      { name: 'EINN', latitude: 52.7020,  longitude: -8.9248,   altitudeFt: 37000 },
      { name: 'WP01', latitude: 55.0000,  longitude: -20.0000,  altitudeFt: 37000 },
      { name: 'WP02', latitude: 55.0000,  longitude: -40.0000,  altitudeFt: 37000 },
      { name: 'CYYT', latitude: 47.6186,  longitude: -52.7319,  altitudeFt: 37000 },
      { name: 'KJFK', latitude: 40.6413,  longitude: -73.7781,  altitudeFt: 0     },
    ],
  },
  {
    label: 'LAX → SYD (South Pacific)',
    aircraft: 'B777',
    waypoints: [
      { name: 'KLAX', latitude: 33.9425,  longitude: -118.4081, altitudeFt: 37000 },
      { name: 'WP01', latitude: 25.0000,  longitude: -145.0000, altitudeFt: 37000 },
      { name: 'WP02', latitude: 10.0000,  longitude: -170.0000, altitudeFt: 37000 },
      { name: 'WP03', latitude: -10.0000, longitude: 175.0000,  altitudeFt: 37000 },
      { name: 'YBBN', latitude: -27.3842, longitude: 153.1175,  altitudeFt: 37000 },
      { name: 'YSSY', latitude: -33.9461, longitude: 151.1772,  altitudeFt: 0     },
    ],
  },
  {
    label: 'SFO → NRT (North Pacific)',
    aircraft: 'B777',
    waypoints: [
      { name: 'KSFO', latitude: 37.6213,  longitude: -122.3790, altitudeFt: 37000 },
      { name: 'WP01', latitude: 47.0000,  longitude: -160.0000, altitudeFt: 37000 },
      { name: 'WP02', latitude: 51.0000,  longitude: -175.0000, altitudeFt: 37000 },
      { name: 'WP03', latitude: 47.0000,  longitude: 160.0000,  altitudeFt: 37000 },
      { name: 'RJTT', latitude: 35.5494,  longitude: 139.7798,  altitudeFt: 0     },
    ],
  },
  {
    label: 'DXB → LAX (Polar)',
    aircraft: 'B777',
    waypoints: [
      { name: 'OMDB', latitude: 25.2532,  longitude: 55.3657,   altitudeFt: 37000 },
      { name: 'WP01', latitude: 55.0000,  longitude: 70.0000,   altitudeFt: 37000 },
      { name: 'WP02', latitude: 75.0000,  longitude: 90.0000,   altitudeFt: 37000 },
      { name: 'WP03', latitude: 80.0000,  longitude: -120.0000, altitudeFt: 37000 },
      { name: 'WP04', latitude: 60.0000,  longitude: -140.0000, altitudeFt: 37000 },
      { name: 'KLAX', latitude: 33.9425,  longitude: -118.4081, altitudeFt: 0     },
    ],
  },
];
 
const ETOPS_RATINGS = [60, 90, 120, 138, 180, 207, 240];
const AIRCRAFT = ['B737', 'A320', 'B777', 'B747', 'A380'];
 
// Simple world map projection for corridor visualization
const MAP_W = 320;
const MAP_H = 160;
 
const projectLonLat = (lon, lat) => ({
  x: ((lon + 180) / 360) * MAP_W,
  y: ((90 - lat) / 180) * MAP_H,
});
 
function CorridorMap({ routePoints, alternates }) {
  if (!routePoints || routePoints.length === 0) return null;
 
  const routePts = routePoints.map(rp => projectLonLat(rp.lon, rp.lat));
  const polyline = routePts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
 
  return (
    <Svg width={MAP_W} height={MAP_H} style={s.mapSvg}>
      {/* Background */}
      <Rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#0D1526" rx="8" />
 
      {/* Latitude grid lines */}
      {[-60, -30, 0, 30, 60].map(lat => {
        const y = projectLonLat(0, lat).y;
        return (
          <Line key={lat} x1="0" y1={y} x2={MAP_W} y2={y}
            stroke="#1F2937" strokeWidth="0.5" />
        );
      })}
      {[-120, -60, 0, 60, 120].map(lon => {
        const x = projectLonLat(lon, 0).x;
        return (
          <Line key={lon} x1={x} y1="0" x2={x} y2={MAP_H}
            stroke="#1F2937" strokeWidth="0.5" />
        );
      })}
 
      {/* ETOPS diversion radius circles (approximate) */}
      {routePoints.filter((_, i) => i % 6 === 0).map((rp, i) => {
        const center = projectLonLat(rp.lon, rp.lat);
        const radiusDeg = (rp.diversionNm / 60) * 1.2; // rough visual
        const radiusPx  = (radiusDeg / 180) * MAP_H * 1.5;
        const color = rp.compliant ? '#00FF8820' : '#FF333320';
        const stroke = rp.compliant ? '#00FF8840' : '#FF333340';
        return (
          <Circle key={i} cx={center.x} cy={center.y}
            r={Math.min(radiusPx, 40)}
            fill={color} stroke={stroke} strokeWidth="0.5" />
        );
      })}
 
      {/* Route polyline */}
      {routePts.length >= 2 && (
        <Polyline points={polyline}
          fill="none" stroke="#00D4FF" strokeWidth="1.5"
          strokeDasharray="4,2" />
      )}
 
      {/* Route sample dots */}
      {routePts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r="2"
          fill={routePoints[i].compliant ? '#00FF88' : '#FF3333'} />
      ))}
 
      {/* Alternate airports */}
      {alternates && alternates.map((alt, i) => {
        const p = projectLonLat(alt.lon, alt.lat);
        return (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r="4"
              fill="#FFD70022" stroke="#FFD700" strokeWidth="1" />
            <SvgText x={p.x + 5} y={p.y + 3}
              fill="#FFD700" fontSize="6">{alt.icao}</SvgText>
          </React.Fragment>
        );
      })}
 
      {/* Equator label */}
      <SvgText x="4" y={projectLonLat(0, 0).y - 2}
        fill="#334455" fontSize="6">EQ</SvgText>
    </Svg>
  );
}
 
export default function EtopsScreen() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [aircraft,       setAircraft]       = useState('B777');
  const [etopsRating,    setEtopsRating]    = useState(180);
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
 
  const preset = PRESET_ROUTES[selectedPreset];
 
  const runCheck = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/etops`, {
        waypoints:    preset.waypoints,
        aircraftType: aircraft,
        etopsRating:  etopsRating,
        excludeIcaos: [
          preset.waypoints[0].name,
          preset.waypoints[preset.waypoints.length - 1].name,
        ],
      });
      setResult(res.data);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
 
  const compliantColor = result?.compliant ? '#00FF88' : '#FF3333';
 
  return (
    <ScrollView style={s.container}>
 
      {/* Route presets */}
      <Text style={s.sectionTitle}>ROUTE</Text>
      {PRESET_ROUTES.map((r, i) => (
        <TouchableOpacity key={i}
          style={[s.presetCard, selectedPreset === i && s.presetCardActive]}
          onPress={() => { setSelectedPreset(i); setAircraft(r.aircraft); setResult(null); }}>
          <Text style={[s.presetLabel, selectedPreset === i && s.presetLabelActive]}>
            {r.label}
          </Text>
          <Text style={s.presetWp}>{r.waypoints.length} waypoints</Text>
        </TouchableOpacity>
      ))}
 
      {/* Aircraft */}
      <Text style={s.sectionTitle}>AIRCRAFT</Text>
      <View style={s.tagRow}>
        {AIRCRAFT.map(ac => (
          <TouchableOpacity key={ac}
            style={[s.tag, aircraft === ac && s.tagActive]}
            onPress={() => setAircraft(ac)}>
            <Text style={[s.tagText, aircraft === ac && s.tagTextActive]}>{ac}</Text>
          </TouchableOpacity>
        ))}
      </View>
 
      {/* ETOPS rating */}
      <Text style={s.sectionTitle}>ETOPS APPROVAL</Text>
      <View style={s.tagRow}>
        {ETOPS_RATINGS.map(r => (
          <TouchableOpacity key={r}
            style={[s.tag, etopsRating === r && s.tagActiveGold]}
            onPress={() => setEtopsRating(r)}>
            <Text style={[s.tagText, etopsRating === r && s.tagTextGold]}>
              {r} min
            </Text>
          </TouchableOpacity>
        ))}
      </View>
 
      <View style={s.infoCard}>
        <Text style={s.infoText}>
          ETOPS-{etopsRating}: At every point along the route, a diversion airport must be
          within {etopsRating} minutes at single-engine cruise speed.
        </Text>
      </View>
 
      <TouchableOpacity
        style={[s.btn, loading && s.btnDisabled]}
        onPress={runCheck} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#000919" size="small" />
          : <Text style={s.btnText}>🛡  CHECK ETOPS COMPLIANCE</Text>}
      </TouchableOpacity>
 
      {/* ── Results ── */}
      {result && (<>
 
        {/* Verdict banner */}
        <View style={[s.banner, result.compliant ? s.bannerGo : s.bannerNogo]}>
          <Text style={s.bannerIcon}>{result.compliant ? '✅' : '❌'}</Text>
          <Text style={s.bannerText}>
            {result.compliant
              ? `ETOPS-${result.approvedRatingMinutes} COMPLIANT`
              : `EXCEEDS ETOPS-${result.approvedRatingMinutes}`}
          </Text>
        </View>
 
        {/* Key metrics */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📊  ETOPS ANALYSIS</Text>
          <View style={s.metricRow}>
            <View style={s.metric}>
              <Text style={[s.metricVal, { color: compliantColor }]}>
                {Math.round(result.worstDiversionMinutes)} min
              </Text>
              <Text style={s.metricLbl}>WORST DIVERSION</Text>
            </View>
            <View style={s.metric}>
              <Text style={[s.metricVal, { color: C.cyan }]}>
                ETOPS-{result.requiredRatingMinutes}
              </Text>
              <Text style={s.metricLbl}>REQUIRED RATING</Text>
            </View>
            <View style={s.metric}>
              <Text style={[s.metricVal, { color: C.gold }]}>
                {result.seSpeedKts} kts
              </Text>
              <Text style={s.metricLbl}>SE SPEED</Text>
            </View>
          </View>
          <View style={s.assessCard}>
            <Text style={s.assessText}>{result.assessment}</Text>
          </View>
        </View>
 
        {/* Corridor map */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🗺  ETOPS CORRIDOR</Text>
          <CorridorMap
            routePoints={result.routePoints}
            alternates={result.alternates}
          />
          <View style={s.mapLegend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#00FF88' }]} />
              <Text style={s.legendText}>Within limit</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#FF3333' }]} />
              <Text style={s.legendText}>Exceeds limit</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#FFD700',
                borderRadius: 2, width: 10, height: 10 }]} />
              <Text style={s.legendText}>ETOPS alternate</Text>
            </View>
          </View>
        </View>
 
        {/* Critical point */}
        {result.criticalPoint && (
          <View style={[s.card, { borderColor: compliantColor + '44' }]}>
            <Text style={s.cardTitle}>⚠️  CRITICAL POINT</Text>
            <View style={s.dataRow}>
              <Text style={s.dataLbl}>Position</Text>
              <Text style={s.dataVal}>
                {result.criticalPoint.lat.toFixed(2)}°N {' '}
                {result.criticalPoint.lon.toFixed(2)}°E
              </Text>
            </View>
            <View style={s.dataRow}>
              <Text style={s.dataLbl}>Nearest Alternate</Text>
              <Text style={s.dataVal}>
                {result.criticalPoint.nearestAlternateIcao} — {result.criticalPoint.nearestAlternateName}
              </Text>
            </View>
            <View style={s.dataRow}>
              <Text style={s.dataLbl}>Diversion Distance</Text>
              <Text style={s.dataVal}>
                {Math.round(result.criticalPoint.diversionNm)} NM
              </Text>
            </View>
            <View style={s.dataRow}>
              <Text style={[s.dataLbl]}>Diversion Time</Text>
              <Text style={[s.dataVal, { color: compliantColor }]}>
                {Math.round(result.criticalPoint.diversionMinutes)} min
              </Text>
            </View>
          </View>
        )}
 
        {/* Alternate airports table */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🛬  ETOPS ALTERNATES USED</Text>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: 44 }]}>ICAO</Text>
            <Text style={[s.th, { flex: 1 }]}>NAME</Text>
            <Text style={[s.th, { width: 48 }]}>RWY ft</Text>
            <Text style={[s.th, { width: 32, textAlign: 'right' }]}>ILS</Text>
          </View>
          {result.alternates.map((alt, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.td, { width: 44, color: C.gold, fontWeight: '700' }]}>
                {alt.icao}
              </Text>
              <Text style={[s.td, { flex: 1 }]} numberOfLines={1}>{alt.name}</Text>
              <Text style={[s.td, { width: 48 }]}>
                {alt.runwayFt.toLocaleString()}
              </Text>
              <Text style={[s.td, { width: 32, textAlign: 'right',
                color: alt.hasIls ? '#00FF88' : '#FF8C00' }]}>
                {alt.hasIls ? '✓' : '—'}
              </Text>
            </View>
          ))}
        </View>
 
        {/* Route compliance breakdown */}
        <View style={[s.card, { marginBottom: 40 }]}>
          <Text style={s.cardTitle}>📋  ROUTE COMPLIANCE</Text>
          <View style={s.tableHeader}>
            <Text style={[s.th, { flex: 1 }]}>POINT</Text>
            <Text style={[s.th, { width: 56 }]}>ALT ICAO</Text>
            <Text style={[s.th, { width: 52, textAlign: 'right' }]}>MIN</Text>
            <Text style={[s.th, { width: 24, textAlign: 'right' }]}></Text>
          </View>
          {result.routePoints
            .filter((_, i) => i % 3 === 0) // show every 3rd to keep list manageable
            .map((rp, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.td, { flex: 1 }]}>
                {rp.lat.toFixed(1)}° {rp.lon.toFixed(1)}°
              </Text>
              <Text style={[s.td, { width: 56, color: C.gold }]}>
                {rp.nearestAlternateIcao}
              </Text>
              <Text style={[s.td, { width: 52, textAlign: 'right',
                color: rp.compliant ? '#00FF88' : '#FF3333' }]}>
                {Math.round(rp.diversionMinutes)}
              </Text>
              <Text style={[s.td, { width: 24, textAlign: 'right',
                color: rp.compliant ? '#00FF88' : '#FF3333' }]}>
                {rp.compliant ? '✓' : '✗'}
              </Text>
            </View>
          ))}
        </View>
      </>)}
    </ScrollView>
  );
}
 
const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: C.bgBase, padding: 16 },
  sectionTitle:     { color: C.cyan, fontSize: 11, fontWeight: '700',
                      letterSpacing: 2.5, marginTop: 24, marginBottom: 12 },
  // Presets
  presetCard:       { backgroundColor: C.bgCard, borderRadius: 14, padding: 12,
                      marginBottom: 8, borderWidth: 1, borderColor: C.border },
  presetCardActive: { borderColor: '#00D4FF', backgroundColor: '#00D4FF0A' },
  presetLabel:      { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  presetLabelActive:{ color: C.cyan },
  presetWp:         { color: C.textDim, fontSize: 10, marginTop: 3 },
  // Tags
  tagRow:           { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  tag:              { backgroundColor: C.bgCard, borderRadius: 8,
                      paddingHorizontal: 12, paddingVertical: 7,
                      borderWidth: 1, borderColor: C.border },
  tagActive:        { borderColor: '#00D4FF', backgroundColor: '#00D4FF18' },
  tagActiveGold:    { borderColor: '#FFD700', backgroundColor: '#FFD70018' },
  tagText:          { color: C.textMuted, fontSize: 11, fontWeight: '600' },
  tagTextActive:    { color: C.cyan },
  tagTextGold:      { color: C.gold },
  // Info
  infoCard:         { backgroundColor: C.bgDark, borderRadius: 14, padding: 12,
                      marginBottom: 16, borderWidth: 1, borderColor: C.border },
  infoText:         { color: C.textDim, fontSize: 11, lineHeight: 17 },
  // Button
  btn:              { backgroundColor: '#00D4FF', borderRadius: 16, padding: 16,
                      alignItems: 'center', marginBottom: 16 },
  btnDisabled:      { opacity: 0.4 },
  btnText:          { color: '#000919', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
  // Banner
  banner:           { borderRadius: 16, padding: 16, marginBottom: 14,
                      flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerGo:         { backgroundColor: '#00FF8818', borderWidth: 1, borderColor: '#00FF88' },
  bannerNogo:       { backgroundColor: '#FF333318', borderWidth: 1, borderColor: '#FF3333' },
  bannerIcon:       { fontSize: 22 },
  bannerText:       { color: '#fff', fontSize: 14, fontWeight: '800', flex: 1, letterSpacing: 1 },
  // Card
  card:             { backgroundColor: C.bgCard, borderRadius: 18, padding: 16,
                      marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle:        { color: C.cyan, fontSize: 11, fontWeight: '700',
                      letterSpacing: 2.5, marginBottom: 14 },
  // Metrics
  metricRow:        { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  metric:           { alignItems: 'center' },
  metricVal:        { fontSize: 18, fontWeight: '800' },
  metricLbl:        { color: C.textDim, fontSize: 8, letterSpacing: 1.5, marginTop: 4 },
  assessCard:       { backgroundColor: C.bgDark, borderRadius: 8, padding: 10,
                      borderWidth: 1, borderColor: C.border },
  assessText:       { color: C.textSecondary, fontSize: 11, lineHeight: 17 },
  // Map
  mapSvg:           { borderRadius: 8, overflow: 'hidden' },
  mapLegend:        { flexDirection: 'row', gap: 14, marginTop: 10 },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:        { width: 8, height: 8, borderRadius: 4 },
  legendText:       { color: C.textMuted, fontSize: 10 },
  // Data rows
  dataRow:          { flexDirection: 'row', justifyContent: 'space-between',
                      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  dataLbl:          { color: C.textMuted, fontSize: 11 },
  dataVal:          { color: '#fff', fontSize: 11, fontWeight: '600',
                      flex: 1, textAlign: 'right' },
  // Table
  tableHeader:      { flexDirection: 'row', paddingBottom: 6,
                      borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 2 },
  tableRow:         { flexDirection: 'row', alignItems: 'center',
                      paddingVertical: 7, borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255,255,255,0.04)' },
  th:               { color: C.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  td:               { color: C.textSecondary, fontSize: 11 },
});
 