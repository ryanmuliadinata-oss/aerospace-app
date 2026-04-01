import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function MapScreen({ route }) {
  const { waypoints } = route.params || { waypoints: [] };

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
        {waypoints.map((wp, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
            title={wp.name}
            pinColor={i === 0 ? 'green' : i === waypoints.length - 1 ? 'red' : 'blue'}
          />
        ))}
        <Polyline
          coordinates={coords}
          strokeColor="#00D4FF"
          strokeWidth={2}
        />
      </MapView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  empty: { flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#00D4FF', fontSize: 16, textAlign: 'center' },
});