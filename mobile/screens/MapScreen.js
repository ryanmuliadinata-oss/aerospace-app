import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';

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

export default function MapScreen({ route }) {
  const { waypoints, weather, turbulence } = route.params || {};
  const [showWeather, setShowWeather]       = useState(true);
  const [showTurbulence, setShowTurbulence] = useState(true);

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
      </MapView>

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
});