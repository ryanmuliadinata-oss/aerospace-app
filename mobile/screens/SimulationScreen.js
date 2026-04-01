import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

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
};

const dirToArrow = (deg) => {
  const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
  return dirs[Math.round(deg / 45) % 8];
};

const Stat = ({ label, value }) => (
  <View style={s.stat}>
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statLbl}>{label}</Text>
  </View>
);

const FuelBar = ({ label, value, max, color }) => {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  return (
    <View style={s.fuelRow}>
      <Text style={s.fuelLbl}>{label}</Text>
      <View style={s.fuelTrack}>
        <View style={[s.fuelFill,
          { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[s.fuelVal, { color }]}>
        {value.toFixed(0)} kg
      </Text>
    </View>
  );
};

export default function SimulationScreen({ route, navigation }) {
  const report = route?.params?.report;

  if (!report) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>🛰️</Text>
        <Text style={s.emptyTitle}>No Simulation Yet</Text>
        <Text style={s.emptySub}>
          Go to Flight Plan and tap Run Simulation.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>

      {/* GO / NO-GO Banner */}
      <View style={[s.banner, report.isGo ? s.bannerGo : s.bannerNogo]}>
        <Text style={s.bannerIcon}>{report.isGo ? '✅' : '❌'}</Text>
        <Text style={s.bannerText}>
          {report.isGo
            ? 'GO — All Systems Nominal'
            : report.goNoGoDecision.replace('NO-GO:', 'NO-GO: ')}
        </Text>
      </View>

      {/* View on Map Button */}
      {report.weather && report.weather.length > 0 && (
        <TouchableOpacity
          style={s.mapBtn}
          onPress={() => navigation.navigate('Map', {
            waypoints: report.weather.map(w => ({
              name: w.icao,
              latitude: 0,
              longitude: 0,
            }))
          })}
        >
          <Text style={s.mapBtnText}>🗺️  VIEW ROUTE ON MAP</Text>
        </TouchableOpacity>
      )}

      {/* Route Summary */}
      <View style={s.card}>
        <Text style={s.cardTitle}>ROUTE SUMMARY</Text>
        <View style={s.routeRow}>
          <View style={s.apt}>
            <Text style={s.icao}>{report.origin}</Text>
            <Text style={s.icaoSub}>ORIGIN</Text>
          </View>
          <Text style={s.routeArrow}>— ✈ —</Text>
          <View style={s.apt}>
            <Text style={s.icao}>{report.destination}</Text>
            <Text style={s.icaoSub}>DEST</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          <Stat label="Aircraft" value={report.aircraftType} />
          <Stat label="Est Time" value={`${report.estimatedFlightTimeHrs.toFixed(1)} hr`} />
          <Stat label="Rec Alt"  value={`FL${report.recommendedAltitude}`} />
        </View>
      </View>

      {/* Weather */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🌦  METAR WEATHER</Text>
        {report.weather.map((w, i) => (
          <View key={i}>
            <View style={s.tableRow}>
              <Text style={[s.td, { flex:1, color:'#FFF', fontWeight:'700' }]}>
                {w.icao}
              </Text>
              <Text style={[s.td, { flex:1,
                color: WX_COLOR[w.category] || '#FFF' }]}>
                {w.category}
              </Text>
              <Text style={[s.td, { flex:2 }]}>
                {w.windSpeedKts.toFixed(0)}kts @ {w.windDirDeg.toFixed(0)}°
              </Text>
              <Text style={[s.td, { flex:1.5 }]}>
                {w.tempC.toFixed(1)}°C
              </Text>
            </View>
            {w.sigmet && (
              <View style={s.sigmetBanner}>
                <Text style={s.sigmetText}>⚠ SIGMET ACTIVE — {w.icao}</Text>
              </View>
            )}
            {w.rawMetar !== 'N/A' && (
              <Text style={s.rawMetar}>{w.rawMetar}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Fuel */}
      <View style={s.card}>
        <Text style={s.cardTitle}>⛽  FUEL ANALYSIS</Text>
        <FuelBar label="Est Burn"
          value={report.fuel.burnKg}
          max={report.fuel.onBoardKg}
          color="#FF8C00" />
        <FuelBar label="Reserve"
          value={report.fuel.reserveKg}
          max={report.fuel.onBoardKg}
          color="#FFD700" />
        <FuelBar label="Total Req"
          value={report.fuel.totalRequiredKg}
          max={report.fuel.onBoardKg}
          color={report.fuel.sufficient ? '#00FF88' : '#FF3333'} />
        <FuelBar label="On Board"
          value={report.fuel.onBoardKg}
          max={report.fuel.onBoardKg}
          color="#00D4FF" />
        <View style={[s.fuelStatus,
          report.fuel.sufficient ? s.fuelOk : s.fuelBad]}>
          <Text style={s.fuelStatusText}>
            {report.fuel.sufficient
              ? '✅  FUEL SUFFICIENT'
              : '❌  FUEL INSUFFICIENT'}
          </Text>
        </View>
      </View>

      {/* Turbulence */}
      <View style={s.card}>
        <Text style={s.cardTitle}>💨  TURBULENCE (PIREP)</Text>
        {report.turbulence.map((t, i) => (
          <View key={i} style={s.turbRow}>
            <View style={[s.dot,
              { backgroundColor: SEV_COLOR[t.severity] || '#556' }]} />
            <Text style={[s.td, { width:44, color:'#FFF', fontWeight:'700' }]}>
              {t.icao}
            </Text>
            <Text style={[s.td, { flex:1, fontWeight:'700',
              color: SEV_COLOR[t.severity] || '#556' }]}>
              {t.severity}
            </Text>
            <Text style={[s.td, { width:44 }]}>
              FL{(t.altitudeFt / 100).toFixed(0)}
            </Text>
            <Text style={[s.td, { color:'#334455', fontSize:9 }]}>
              {t.source}
            </Text>
          </View>
        ))}
      </View>

      {/* Wind Layers */}
      <View style={[s.card, { marginBottom:40 }]}>
        <Text style={s.cardTitle}>🌬  UPPER WINDS (Open-Meteo)</Text>
        {report.windLayers.map((w, i) => (
          <View key={i} style={s.windRow}>
            <Text style={s.windAlt}>
              FL{(w.altitudeFt / 100).toFixed(0)}
            </Text>
            <Text style={s.windArrow}>{dirToArrow(w.dirDeg)}</Text>
            <Text style={s.windSpeed}>{w.speedKts.toFixed(0)} kts</Text>
            <Text style={s.windDir}>@ {w.dirDeg.toFixed(0)}°</Text>
            <Text style={s.windTemp}>{w.tempC.toFixed(1)}°C</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#0A0E1A', padding:16 },
  empty:          { flex:1, backgroundColor:'#0A0E1A',
                    alignItems:'center', justifyContent:'center', padding:32 },
  emptyIcon:      { fontSize:64, marginBottom:16 },
  emptyTitle:     { color:'#FFF', fontSize:20, fontWeight:'700' },
  emptySub:       { color:'#556', fontSize:14, marginTop:8, textAlign:'center' },
  banner:         { borderRadius:12, padding:16, marginBottom:16,
                    flexDirection:'row', alignItems:'center', gap:12 },
  bannerGo:       { backgroundColor:'#00FF8818',
                    borderWidth:1, borderColor:'#00FF88' },
  bannerNogo:     { backgroundColor:'#FF333318',
                    borderWidth:1, borderColor:'#FF3333' },
  bannerIcon:     { fontSize:22 },
  bannerText:     { color:'#FFF', fontSize:14, fontWeight:'700', flex:1 },
  mapBtn:         { backgroundColor:'#00D4FF22', borderRadius:12, padding:14,
                    alignItems:'center', marginBottom:16,
                    borderWidth:1, borderColor:'#00D4FF55' },
  mapBtnText:     { color:'#00D4FF', fontWeight:'700', fontSize:13, letterSpacing:1 },
  card:           { backgroundColor:'#111827', borderRadius:14,
                    padding:16, marginBottom:14,
                    borderWidth:1, borderColor:'#1F2937' },
  cardTitle:      { color:'#00D4FF', fontSize:11, fontWeight:'700',
                    letterSpacing:2.5, marginBottom:14 },
  routeRow:       { flexDirection:'row', alignItems:'center',
                    justifyContent:'space-between', marginBottom:16 },
  apt:            { alignItems:'center' },
  icao:           { color:'#FFF', fontSize:30, fontWeight:'800' },
  icaoSub:        { color:'#445566', fontSize:9, letterSpacing:2, marginTop:2 },
  routeArrow:     { color:'#00D4FF', fontSize:16 },
  statsRow:       { flexDirection:'row', justifyContent:'space-around' },
  stat:           { alignItems:'center' },
  statVal:        { color:'#FFF', fontSize:15, fontWeight:'700' },
  statLbl:        { color:'#445566', fontSize:9, letterSpacing:1.5, marginTop:3 },
  tableRow:       { flexDirection:'row', paddingVertical:8,
                    borderBottomWidth:1, borderBottomColor:'#0F1520' },
  td:             { color:'#8899AA', fontSize:12 },
  sigmetBanner:   { backgroundColor:'#FF8C0022', borderRadius:6,
                    padding:6, marginVertical:4,
                    borderWidth:1, borderColor:'#FF8C0055' },
  sigmetText:     { color:'#FF8C00', fontSize:11, fontWeight:'700' },
  rawMetar:       { color:'#334455', fontSize:9, marginBottom:6, paddingHorizontal:4 },
  fuelRow:        { flexDirection:'row', alignItems:'center',
                    gap:10, marginBottom:10 },
  fuelLbl:        { color:'#667788', fontSize:11, width:72 },
  fuelTrack:      { flex:1, height:8, backgroundColor:'#1F2937',
                    borderRadius:4, overflow:'hidden' },
  fuelFill:       { height:'100%', borderRadius:4 },
  fuelVal:        { fontSize:11, fontWeight:'700', width:76, textAlign:'right' },
  fuelStatus:     { borderRadius:8, padding:10, alignItems:'center', marginTop:8 },
  fuelOk:         { backgroundColor:'#00FF8818',
                    borderWidth:1, borderColor:'#00FF8844' },
  fuelBad:        { backgroundColor:'#FF333318',
                    borderWidth:1, borderColor:'#FF333344' },
  fuelStatusText: { color:'#FFF', fontWeight:'700', fontSize:13 },
  turbRow:        { flexDirection:'row', alignItems:'center',
                    gap:10, paddingVertical:9,
                    borderBottomWidth:1, borderBottomColor:'#0F1520' },
  dot:            { width:9, height:9, borderRadius:5 },
  windRow:        { flexDirection:'row', alignItems:'center',
                    gap:10, paddingVertical:9,
                    borderBottomWidth:1, borderBottomColor:'#0F1520' },
  windAlt:        { color:'#00D4FF', fontWeight:'700', width:44 },
  windArrow:      { fontSize:16, color:'#FFF', width:20, textAlign:'center' },
  windSpeed:      { color:'#FFF', fontWeight:'600', flex:1 },
  windDir:        { color:'#667788', fontSize:11, width:54 },
  windTemp:       { color:'#667788', fontSize:11, width:52, textAlign:'right' },
});