import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { fetchLiveAircraft, bboxFromWaypoints } from '../api/openSkyApi';
 
const SEV_COLOR = {
  NIL:      '#00FF88',
  LIGHT:    '#FFD700',
  MODERATE: '#FF8C00',
  SEVERE:   '#FF3333',
  EXTREME:  '#CC0000',
  UNKNOWN:  '#556677',
};
 
const WX_COLOR = {
  VFR:  '#00FF88',
  MVFR: '#6699FF',
  IFR:  '#FF3333',
  LIFR: '#FF00FF',
  UNKN: '#556677',
};
 
// Convert heading degrees to a rotated plane emoji direction label
const headingToArrow = (deg) => {
  const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
  return dirs[Math.round(deg / 45) % 8];
};
 
const REFRESH_INTERVAL_MS = 30000; // refresh live traffic every 30 s
 
export default function MapScreen({ route }) {
  const { waypoints, weather, turbulence } = route.params || {};
  const [showWeather,    setShowWeather]    = useState(true);
  const [showTurbulence, setShowTurbulence] = useState(true);
  const [showTraffic,    setShowTraffic]    = useState(true);
  const [liveAircraft,   setLiveAircraft]   = useState([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [selectedAc,     setSelectedAc]     = useState(null); // callsign of tapped a/c
  const intervalRef = useRef(null);
 
  const loadTraffic = async () => {
    if (!waypoints || waypoints.length === 0) return;
    setTrafficLoading(true);
    try {
      const bbox = bboxFromWaypoints(waypoints, 3);
      const aircraft = await fetchLiveAircraft(
        bbox.minLat, bbox.maxLat, bbox.minLon, bbox.maxLon
      );
      setLiveAircraft(aircraft);
    } catch (e) {
      console.warn('[MapScreen] traffic fetch error:', e.message);
    } finally {
      setTrafficLoading(false);
    }
  };
 
  useEffect(() => {
    if (!waypoints || waypoints.length === 0) return;
    loadTraffic();
    intervalRef.current = setInterval(loadTraffic, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
 
  if (!waypoints || waypoints.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>No waypoints to display.{'\n'}Run a simulation first.</Text>
      </View>
    );
  }
 
  const coords = waypoints.map(wp => ({
    latitude: wp.latitude,
    longitude: wp.longitude,
  }));
 
  const midpoint = coords[Math.floor(coords.length / 2)];
 
  return (
    <View style={s.container}>
      <MapView
        style={s.map}
        initialRegion={{
          latitude: midpoint.latitude,
          longitude: midpoint.longitude,
          latitudeDelta: 20,
          longitudeDelta: 20,
        }}
      >
        {/* Flight route line */}
        <Polyline
          coordinates={coords}
          strokeColor="#00D4FF"
          strokeWidth={2}
        />
 
        {/* Waypoint markers */}
        {waypoints.map((wp, i) => (
          <Marker
            key={`wp-${i}`}
            coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
            title={wp.name}
            pinColor={i === 0 ? 'green' : i === waypoints.length - 1 ? 'red' : 'blue'}
          />
        ))}
 
        {/* Weather overlays */}
        {showWeather && weather && weather.map((w, i) => {
          const wp = waypoints.find(p => p.name === w.icao);
          if (!wp) return null;
          const color = WX_COLOR[w.category] || '#556677';
          return (
            <React.Fragment key={`wx-${i}`}>
              <Circle
                center={{ latitude: wp.latitude, longitude: wp.longitude }}
                radius={80000}
                fillColor={color + '22'}
                strokeColor={color + '88'}
                strokeWidth={1}
              />
              {w.sigmet && (
                <Circle
                  center={{ latitude: wp.latitude, longitude: wp.longitude }}
                  radius={120000}
                  fillColor="#FF8C0011"
                  strokeColor="#FF8C00"
                  strokeWidth={2}
                />
              )}
            </React.Fragment>
          );
        })}
 
        {/* Turbulence overlays */}
        {showTurbulence && turbulence && turbulence.map((t, i) => {
          const wp = waypoints.find(p => p.name === t.icao);
          if (!wp) return null;
          const color = SEV_COLOR[t.severity] || '#556677';
          if (t.severity === 'NIL') return null;
          return (
            <Circle
              key={`turb-${i}`}
              center={{ latitude: wp.latitude, longitude: wp.longitude }}
              radius={60000}
              fillColor={color + '33'}
              strokeColor={color}
              strokeWidth={1}
            />
          );
        })}
        {/* Live aircraft markers (OpenSky Network) */}
        {showTraffic && liveAircraft.map((ac) => (
          <Marker
            key={`ac-${ac.icao24}`}
            coordinate={{ latitude: ac.latitude, longitude: ac.longitude }}
            title={`${headingToArrow(ac.headingDeg)} ${ac.callsign}`}
            description={`${ac.altitudeFt.toLocaleString()} ft · ${ac.speedKts} kts · ${ac.country}`}
            onPress={() => setSelectedAc(ac.callsign === selectedAc ? null : ac.callsign)}
          >
            <View style={s.acMarker}>
              <Text style={s.acEmoji}>✈</Text>
            </View>
          </Marker>
        ))}
      </MapView>
 
      {/* Selected aircraft detail callout */}
      {selectedAc && (() => {
        const ac = liveAircraft.find(a => a.callsign === selectedAc);
        if (!ac) return null;
        return (
          <View style={s.acCallout}>
            <Text style={s.acCalloutTitle}>✈  {ac.callsign}</Text>
            <Text style={s.acCalloutRow}>Alt   <Text style={s.acCalloutVal}>{ac.altitudeFt.toLocaleString()} ft</Text></Text>
            <Text style={s.acCalloutRow}>Spd   <Text style={s.acCalloutVal}>{ac.speedKts} kts</Text></Text>
            <Text style={s.acCalloutRow}>Hdg   <Text style={s.acCalloutVal}>{Math.round(ac.headingDeg)}°  {headingToArrow(ac.headingDeg)}</Text></Text>
            <Text style={s.acCalloutRow}>Reg   <Text style={s.acCalloutVal}>{ac.country}</Text></Text>
            <TouchableOpacity onPress={() => setSelectedAc(null)}>
              <Text style={s.acCalloutClose}>✕ close</Text>
            </TouchableOpacity>
          </View>
        );
      })()}
 
      {/* Legend */}
      <View style={s.legend}>
        <Text style={s.legendTitle}>OVERLAY</Text>
        <TouchableOpacity
          style={[s.legendBtn, showWeather && s.legendBtnActive]}
          onPress={() => setShowWeather(!showWeather)}
        >
          <Text style={s.legendText}>🌦 Weather</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.legendBtn, showTurbulence && s.legendBtnActive]}
          onPress={() => setShowTurbulence(!showTurbulence)}
        >
          <Text style={s.legendText}>💨 Turbulence</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.legendBtn, showTraffic && s.legendBtnActive]}
          onPress={() => setShowTraffic(!showTraffic)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={s.legendText}>✈ Traffic</Text>
            {trafficLoading && <ActivityIndicator size="small" color="#00D4FF" />}
            {!trafficLoading && (
              <Text style={s.acCount}>{liveAircraft.length}</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.refreshBtn} onPress={loadTraffic}>
          <Text style={s.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
 
      {/* Weather category legend */}
      <View style={s.wxLegend}>
        {Object.entries(WX_COLOR).map(([cat, color]) => (
          <View key={cat} style={s.wxRow}>
            <View style={[s.wxDot, { backgroundColor: color }]} />
            <Text style={s.wxLabel}>{cat}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
 
const s = StyleSheet.create({
  container:      { flex: 1 },
  map:            { width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height },
  empty:          { flex: 1, backgroundColor: '#0A0E1A',
                    justifyContent: 'center', alignItems: 'center' },
  emptyText:      { color: '#00D4FF', fontSize: 16, textAlign: 'center' },
  legend:         { position: 'absolute', top: 50, right: 12,
                    backgroundColor: '#0A0E1Aee', borderRadius: 10,
                    padding: 10, borderWidth: 1, borderColor: '#1F2937' },
  legendTitle:    { color: '#00D4FF', fontSize: 9, fontWeight: '700',
                    letterSpacing: 2, marginBottom: 8 },
  legendBtn:      { paddingVertical: 6, paddingHorizontal: 10,
                    borderRadius: 6, marginBottom: 4,
                    backgroundColor: '#1F2937' },
  legendBtnActive:{ backgroundColor: '#00D4FF22',
                    borderWidth: 1, borderColor: '#00D4FF55' },
  legendText:     { color: '#FFF', fontSize: 12 },
  wxLegend:       { position: 'absolute', bottom: 40, left: 12,
                    backgroundColor: '#0A0E1Aee', borderRadius: 10,
                    padding: 10, borderWidth: 1, borderColor: '#1F2937' },
  wxRow:          { flexDirection: 'row', alignItems: 'center',
                    marginBottom: 4 },
  wxDot:          { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  wxLabel:        { color: '#FFF', fontSize: 11 },
  // Live aircraft
  acMarker:       { backgroundColor: '#000919cc', borderRadius: 12,
                    padding: 4, borderWidth: 1, borderColor: '#00D4FF88' },
  acEmoji:        { fontSize: 16, color: '#00D4FF' },
  acCount:        { color: '#00D4FF', fontSize: 9, fontWeight: '800',
                    backgroundColor: '#00D4FF22', borderRadius: 4,
                    paddingHorizontal: 4, paddingVertical: 1 },
  refreshBtn:     { marginTop: 6, paddingVertical: 4, alignItems: 'center',
                    borderTopWidth: 1, borderTopColor: '#1F2937' },
  refreshText:    { color: '#445566', fontSize: 10, fontWeight: '600' },
  acCallout:      { position: 'absolute', bottom: 40, right: 12,
                    backgroundColor: '#0A0E1Aee', borderRadius: 12,
                    padding: 14, borderWidth: 1, borderColor: '#00D4FF55',
                    minWidth: 170 },
  acCalloutTitle: { color: '#00D4FF', fontWeight: '800', fontSize: 14,
                    marginBottom: 10, letterSpacing: 1 },
  acCalloutRow:   { color: '#445566', fontSize: 11, marginBottom: 5,
                    fontFamily: 'monospace' },
  acCalloutVal:   { color: '#FFF', fontWeight: '700' },
  acCalloutClose: { color: '#445566', fontSize: 10, marginTop: 8,
                    textAlign: 'right' },
});