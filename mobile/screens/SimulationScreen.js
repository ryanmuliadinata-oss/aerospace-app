import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { fetchRouteAirQuality } from '../api/airQualityApi';
import { C, S, T } from '../theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
const SEV_COLOR = {
  NIL:      C.green,
  LIGHT:    C.gold,
  MODERATE: '#FF8C00',
  SEVERE:   C.red,
  EXTREME:  '#CC0000',
  UNKNOWN:  C.textDim,
};
 
const WX_COLOR = {
  VFR:  C.green,
  MVFR: C.blue,
  IFR:  C.red,
  LIFR: C.purple,
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
  const { report, waypoints } = route?.params || {};
  const [airQuality,    setAirQuality]    = useState([]);
  const [aqLoading,     setAqLoading]     = useState(false);
 
  useEffect(() => {
    if (!waypoints || waypoints.length === 0) return;
    setAqLoading(true);
    fetchRouteAirQuality(waypoints)
      .then(setAirQuality)
      .catch(e => console.warn('[SimulationScreen] AQ error:', e))
      .finally(() => setAqLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
 
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
 
  const shareReport = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
            h1 { color: #003366; border-bottom: 2px solid #003366; padding-bottom:10px; }
            h2 { color: #003366; font-size: 14px; margin-top: 24px; }
            .banner { padding: 12px; border-radius: 6px; font-weight: bold; font-size: 18px;
                      background: ${report.isGo ? '#e6fff2' : '#ffe6e6'};
                      color: ${report.isGo ? '#006633' : '#cc0000'};
                      border: 2px solid ${report.isGo ? '#00cc66' : '#cc0000'}; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #003366; color: white; padding: 8px; text-align: left; font-size: 12px; }
            td { padding: 7px 8px; border-bottom: 1px solid #ddd; font-size: 12px; }
            tr:nth-child(even) { background: #f5f5f5; }
            .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <h1>✈ Flight Dispatch Report</h1>
          <p><b>Generated:</b> ${new Date().toLocaleString()}</p>
          <div class="banner">
            ${report.isGo ? '✅ GO — All Systems Nominal' : '❌ ' + report.goNoGoDecision}
          </div>
          <h2>ROUTE SUMMARY</h2>
          <table>
            <tr><th>Field</th><th>Value</th></tr>
            <tr><td>Flight ID</td><td>${report.flightId}</td></tr>
            <tr><td>Origin</td><td>${report.origin}</td></tr>
            <tr><td>Destination</td><td>${report.destination}</td></tr>
            <tr><td>Aircraft</td><td>${report.aircraftType}</td></tr>
            <tr><td>Est. Flight Time</td><td>${report.estimatedFlightTimeHrs?.toFixed(1)} hrs</td></tr>
            <tr><td>Recommended Altitude</td><td>FL${report.recommendedAltitude}</td></tr>
          </table>
          <h2>FUEL ANALYSIS</h2>
          <table>
            <tr><th>Field</th><th>Value</th></tr>
            <tr><td>Est. Burn</td><td>${report.fuel.burnKg.toFixed(0)} kg</td></tr>
            <tr><td>Reserve</td><td>${report.fuel.reserveKg.toFixed(0)} kg</td></tr>
            <tr><td>Total Required</td><td>${report.fuel.totalRequiredKg.toFixed(0)} kg</td></tr>
            <tr><td>On Board</td><td>${report.fuel.onBoardKg.toFixed(0)} kg</td></tr>
            <tr><td>Status</td><td>${report.fuel.sufficient ? '✅ SUFFICIENT' : '❌ INSUFFICIENT'}</td></tr>
          </table>
          <h2>WEATHER (METAR)</h2>
          <table>
            <tr><th>ICAO</th><th>Category</th><th>Wind</th><th>Temp</th><th>SIGMET</th></tr>
            ${report.weather.map(w => `
              <tr>
                <td>${w.icao}</td>
                <td>${w.category}</td>
                <td>${w.windSpeedKts.toFixed(0)}kts @ ${w.windDirDeg.toFixed(0)}°</td>
                <td>${w.tempC.toFixed(1)}°C</td>
                <td>${w.sigmet ? '⚠ ACTIVE' : 'None'}</td>
              </tr>
            `).join('')}
          </table>
          <h2>TURBULENCE (PIREP)</h2>
          <table>
            <tr><th>ICAO</th><th>Severity</th><th>Altitude</th></tr>
            ${report.turbulence.map(t => `
              <tr>
                <td>${t.icao}</td>
                <td>${t.severity}</td>
                <td>FL${(t.altitudeFt / 100).toFixed(0)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="footer">
            Generated by Aerospace Flight Simulation App — For simulation purposes only
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Flight Report',
      });
    } catch (e) {
      Alert.alert('Error', 'Could not generate report.');
    }
  };
 
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
{/* Alternate Airports — only shown on NO-GO */}
      {!report.isGo && report.alternates && report.alternates.length > 0 && (
        <View style={s.altCard}>
          <Text style={s.altTitle}>🔄  ALTERNATE AIRPORTS</Text>
          {report.alternates.map((alt, i) => (
            <View key={i} style={s.altRow}>
              <View style={s.altLeft}>
                <Text style={s.altIcao}>{alt.icao}</Text>
                <Text style={s.altName}>{alt.name}</Text>
                <Text style={s.altReason}>{alt.reason}</Text>
              </View>
              <Text style={s.altDist}>{alt.distanceNm.toFixed(0)} nm</Text>
            </View>
          ))}
        </View>
      )}
      {/* View on Map Button */}
      {report.weather && report.weather.length > 0 && (
        <TouchableOpacity
          style={s.mapBtn}
          onPress={() => navigation.navigate('Map', {
            waypoints: waypoints,
            weather: report.weather,
            turbulence: report.turbulence,
          })}
        >
          <Text style={s.mapBtnText}>🗺️  VIEW ROUTE ON MAP</Text>
        </TouchableOpacity>
      )}
 
      {/* Share Report Button */}
      <TouchableOpacity style={s.shareBtn} onPress={shareReport}>
        <Text style={s.shareBtnText}>📄  SHARE DISPATCH REPORT</Text>
      </TouchableOpacity>
 
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
          <View style={s.stat}>
  <Text style={s.statVal}>FL{report.recommendedAltitude}</Text>
  <Text style={s.statLbl}>REC ALT</Text>
  {report.flightLevelReason ? (
    <Text style={s.altReason}>{report.flightLevelReason}</Text>
  ) : null}
</View>
        </View>
      </View>
 
      {/* Weather */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🌦  METAR WEATHER</Text>
        {report.weather.map((w, i) => (
          <View key={i}>
            <View style={s.tableRow}>
              <Text style={[s.td, { flex:1, color: C.textPrimary, fontWeight:'700' }]}>
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
{/* Fuel Burn Graph */}
      {waypoints && waypoints.length > 1 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>📈  FUEL BURN OVER ROUTE</Text>
          <LineChart
            data={{
              labels: waypoints.map(wp => wp.name),
              datasets: [{
                data: waypoints.map((_, i) => {
                  const burnPerLeg = report.fuel.burnKg / (waypoints.length - 1);
                  return Math.max(0, report.fuel.onBoardKg - (burnPerLeg * i));
                }),
              }],
            }}
            width={Dimensions.get('window').width - 64}
            height={180}
            chartConfig={{
              backgroundColor: '#111827',
              backgroundGradientFrom: '#111827',
              backgroundGradientTo: '#111827',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 120, 140, ${opacity})`,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#00D4FF',
              },
            }}
            bezier
            style={{ borderRadius: 10, marginTop: 8 }}
          />
          <Text style={s.graphSub}>Estimated fuel remaining (kg) per waypoint</Text>
        </View>
      )}
      {/* Turbulence */}
      <View style={s.card}>
        <Text style={s.cardTitle}>💨  TURBULENCE (PIREP)</Text>
        {report.turbulence.map((t, i) => (
          <View key={i} style={s.turbRow}>
            <View style={[s.dot,
              { backgroundColor: SEV_COLOR[t.severity] || '#556' }]} />
            <Text style={[s.td, { width:44, color: C.textPrimary, fontWeight:'700' }]}>
              {t.icao}
            </Text>
            <Text style={[s.td, { flex:1, fontWeight:'700',
              color: SEV_COLOR[t.severity] || '#556' }]}>
              {t.severity}
            </Text>
            <Text style={[s.td, { width:44 }]}>
              FL{(t.altitudeFt / 100).toFixed(0)}
            </Text>
            <Text style={[s.td, { color: C.textDim, fontSize:9 }]}>
              {t.source}
            </Text>
          </View>
        ))}
      </View>
 
      {/* Air Quality (Open-Meteo) */}
      <View style={[s.card, { marginBottom: 14 }]}>
        <View style={s.aqHeader}>
          <Text style={s.cardTitle}>🌫  AIR QUALITY (Open-Meteo)</Text>
          {aqLoading && <ActivityIndicator size="small" color="#00D4FF" />}
        </View>
        {airQuality.length === 0 && !aqLoading && (
          <Text style={s.aqEmpty}>No air quality data available.</Text>
        )}
        {airQuality.map((aq, i) => (
          <View key={i} style={s.aqRow}>
            <View style={s.aqLeft}>
              <Text style={s.aqIcao}>{aq.name}</Text>
              <View style={[s.aqiBadge, { borderColor: aq.aqiColor + '88' }]}>
                <Text style={[s.aqiLabel, { color: aq.aqiColor }]}>{aq.aqiLabel}</Text>
              </View>
            </View>
            <View style={s.aqStats}>
              <View style={s.aqStat}>
                <Text style={s.aqVal}>
                  {aq.pm25 != null ? aq.pm25.toFixed(1) : '—'}
                </Text>
                <Text style={s.aqStatLbl}>PM2.5</Text>
              </View>
              <View style={s.aqStat}>
                <Text style={s.aqVal}>
                  {aq.pm10 != null ? aq.pm10.toFixed(1) : '—'}
                </Text>
                <Text style={s.aqStatLbl}>PM10</Text>
              </View>
              <View style={s.aqStat}>
                <Text style={s.aqVal}>
                  {aq.visibilityKm != null ? `${aq.visibilityKm}` : '—'}
                </Text>
                <Text style={s.aqStatLbl}>VIS km</Text>
              </View>
              <View style={s.aqStat}>
                <Text style={s.aqVal}>
                  {aq.uv != null ? aq.uv.toFixed(1) : '—'}
                </Text>
                <Text style={s.aqStatLbl}>UV</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
 
      {/* Fuel Optimization Engine */}
      {report.fuelOptimization && (
        <View style={s.card}>
          <Text style={s.cardTitle}>⚡  FUEL OPTIMIZATION ENGINE</Text>
 
          {/* Savings hero banner */}
          <View style={s.foptBanner}>
            <View style={s.foptBannerLeft}>
              <Text style={s.foptSavedKg}>
                {report.fuelOptimization.fuelSavedKg > 0
                  ? `−${Math.round(report.fuelOptimization.fuelSavedKg)} kg`
                  : 'Optimal'}
              </Text>
              <Text style={s.foptSavedLbl}>FUEL SAVED</Text>
            </View>
            <View style={s.foptDivider} />
            <View style={s.foptBannerMid}>
              <Text style={s.foptSavedKg} numberOfLines={1}>
                {report.fuelOptimization.costSavedUsd > 0
                  ? `$${Math.round(report.fuelOptimization.costSavedUsd).toLocaleString()}`
                  : '$0'}
              </Text>
              <Text style={s.foptSavedLbl}>USD SAVED</Text>
            </View>
            <View style={s.foptDivider} />
            <View style={s.foptBannerRight}>
              <Text style={s.foptOptFL}>
                FL{report.fuelOptimization.optimalFL}
              </Text>
              <Text style={s.foptSavedLbl}>OPTIMAL FL</Text>
            </View>
          </View>
 
          {/* Recommendation text */}
          <View style={s.foptRec}>
            <Text style={s.foptRecText}>{report.fuelOptimization.recommendation}</Text>
          </View>
 
          {/* Step climb advice if applicable */}
          {report.fuelOptimization.stepClimbRecommended && (
            <View style={s.foptStepCard}>
              <Text style={s.foptStepIcon}>📈</Text>
              <Text style={s.foptStepText}>{report.fuelOptimization.stepClimbAdvice}</Text>
            </View>
          )}
 
          {/* FL comparison table */}
          <Text style={s.foptTableTitle}>FL COMPARISON</Text>
          <View style={s.foptTableHeader}>
            <Text style={[s.foptTh, { width: 40 }]}>FL</Text>
            <Text style={[s.foptTh, { flex: 1 }]}>FUEL kg</Text>
            <Text style={[s.foptTh, { flex: 1 }]}>GS kts</Text>
            <Text style={[s.foptTh, { flex: 1 }]}>WIND</Text>
            <Text style={[s.foptTh, { flex: 1, textAlign: 'right' }]}>COST $</Text>
          </View>
          {report.fuelOptimization.flightLevels.map((fl, i) => {
            const isOptimal = fl.flightLevel === report.fuelOptimization.optimalFL;
            return (
              <View key={i} style={[s.foptRow, isOptimal && s.foptRowOptimal]}>
                <Text style={[s.foptFl, isOptimal && { color: '#00FF88' }, { width: 40 }]}>
                  {isOptimal ? '★' : ''} FL{fl.flightLevel}
                </Text>
                <Text style={[s.foptTd, { flex: 1 }, isOptimal && { color: '#fff' }]}>
                  {Math.round(fl.blockFuelKg).toLocaleString()}
                </Text>
                <Text style={[s.foptTd, { flex: 1 }, isOptimal && { color: '#fff' }]}>
                  {Math.round(fl.groundSpeedKts)}
                </Text>
                <Text style={[s.foptTd, { flex: 1 },
                  fl.headwindKts > 0
                    ? { color: '#FF8C00' }
                    : { color: '#00FF88' }]}>
                  {fl.headwindKts > 0
                    ? `HW ${Math.round(fl.headwindKts)}`
                    : `TW ${Math.round(Math.abs(fl.headwindKts))}`}
                </Text>
                <Text style={[s.foptTd, { flex: 1, textAlign: 'right' },
                  isOptimal && { color: '#fff' }]}>
                  ${Math.round(fl.costUsd).toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      )}
 
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
{/* NOTAMs */}
      {report.notams && report.notams.length > 0 && (
        <View style={[s.card, { marginBottom:40 }]}>
          <Text style={s.cardTitle}>📋  NOTAMS</Text>
          {report.notams.map((n, i) => (
            <View key={i} style={s.notamRow}>
              <View style={s.notamHeader}>
                <Text style={s.notamNumber}>{n.number}</Text>
                <Text style={s.notamClass}>{n.classification}</Text>
              </View>
              <Text style={s.notamText}>{n.text}</Text>
              {n.effectiveStart !== '' && (
                <Text style={s.notamDate}>
                  {n.effectiveStart} → {n.effectiveEnd}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
 
const s = StyleSheet.create({
  container:      { flex:1, backgroundColor: C.bgBase },
  empty:          { flex:1, backgroundColor: C.bgBase,
                    alignItems:'center', justifyContent:'center', padding:32 },
  emptyIcon:      { fontSize:64, marginBottom:16 },
  emptyTitle:     { color: C.textPrimary, fontSize:20, fontWeight:'700' },
  emptySub:       { color:'#556', fontSize:14, marginTop:8, textAlign:'center' },
  banner:         { borderRadius:14, padding:14, marginHorizontal:16, marginBottom:14, flexDirection:'row', alignItems:'center', gap:12 },
  bannerGo:       { backgroundColor: C.greenFaint, borderWidth:1, borderColor: C.greenDim },
  bannerNogo:     { backgroundColor: C.redFaint, borderWidth:1, borderColor: C.redDim },
  bannerIcon:     { fontSize:22 },
  bannerText:     { color: C.textPrimary, fontSize:14, fontWeight:'700', flex:1 },
  mapBtn:         { backgroundColor: C.blueFaint, borderRadius:100, padding:13, alignItems:'center', marginHorizontal:16, marginBottom:10, borderWidth:1, borderColor: C.blueDim },
  mapBtnText:     { color: C.blue, fontWeight:'700', fontSize:13, letterSpacing:1 },
  shareBtn:       { backgroundColor: C.goldFaint, borderRadius:100, padding:13, alignItems:'center', marginHorizontal:16, marginBottom:10, borderWidth:1, borderColor: C.goldDim },
  shareBtnText:   { color: C.gold, fontWeight:'700', fontSize:13, letterSpacing:1 },
  card:           { backgroundColor: C.bgCard, borderRadius:18, padding:16, marginBottom:12, marginHorizontal:0, borderWidth:1, borderColor: C.border },
  cardTitle:      { color: C.textMuted, fontSize:10, fontWeight:'700', letterSpacing:2.5, marginBottom:14 },
  routeRow:       { flexDirection:'row', alignItems:'center',
                    justifyContent:'space-between', marginBottom:16 },
  apt:            { alignItems:'center' },
  icao:           { color: C.textPrimary, fontSize:30, fontWeight:'800' },
  icaoSub:        { color: C.textDim, fontSize:9, letterSpacing:2, marginTop:2 },
  routeArrow:     { color:'#00D4FF', fontSize:16 },
  statsRow:       { flexDirection:'row', justifyContent:'space-around' },
  stat:           { alignItems:'center' },
  statVal:        { color: C.textPrimary, fontSize:15, fontWeight:'700' },
  statLbl:        { color: C.textDim, fontSize:9, letterSpacing:1.5, marginTop:3 },
  tableRow:       { flexDirection:'row', paddingVertical:8,
                    borderBottomWidth:1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  td:             { color: C.textSecondary, fontSize:12 },
  sigmetBanner:   { backgroundColor:'#FF8C0022', borderRadius:6,
                    padding:6, marginVertical:4,
                    borderWidth:1, borderColor:'#FF8C0055' },
  sigmetText:     { color:'#FF8C00', fontSize:11, fontWeight:'700' },
  rawMetar:       { color: C.textDim, fontSize:9, marginBottom:6, paddingHorizontal:4 },
  fuelRow:        { flexDirection:'row', alignItems:'center',
                    gap:10, marginBottom:10 },
  fuelLbl:        { color: C.textMuted, fontSize:11, width:72 },
  fuelTrack:      { flex:1, height:8, backgroundColor: C.border,
                    borderRadius:4, overflow:'hidden' },
  fuelFill:       { height:'100%', borderRadius:4 },
  fuelVal:        { fontSize:11, fontWeight:'700', width:76, textAlign:'right' },
  fuelStatus:     { borderRadius:8, padding:10, alignItems:'center', marginTop:8 },
  fuelOk:         { backgroundColor:'#00FF8818',
                    borderWidth:1, borderColor:'#00FF8844' },
  fuelBad:        { backgroundColor:'#FF333318',
                    borderWidth:1, borderColor:'#FF333344' },
  fuelStatusText: { color: C.textPrimary, fontWeight:'700', fontSize:13 },
  turbRow:        { flexDirection:'row', alignItems:'center',
                    gap:10, paddingVertical:9,
                    borderBottomWidth:1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  dot:            { width:9, height:9, borderRadius:5 },
  windRow:        { flexDirection:'row', alignItems:'center',
                    gap:10, paddingVertical:9,
                    borderBottomWidth:1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  windAlt:        { color:'#00D4FF', fontWeight:'700', width:44 },
  windArrow:      { fontSize:16, color: C.textPrimary, width:20, textAlign:'center' },
  windSpeed:      { color: C.textPrimary, fontWeight:'600', flex:1 },
  windDir:        { color: C.textMuted, fontSize:11, width:54 },
  windTemp:       { color: C.textMuted, fontSize:11, width:52, textAlign:'right' },
  altCard:    { backgroundColor: C.bgCard, borderRadius:14, padding:16,
                marginBottom:14, borderWidth:1, borderColor:'#FFD70044' },
  altTitle:   { color: C.gold, fontSize:10, fontWeight:'700', letterSpacing:2.5, marginBottom:14 },
  altRow:     { flexDirection:'row', alignItems:'center',
                justifyContent:'space-between', paddingVertical:10,
                borderBottomWidth:1, borderBottomColor: C.border },
  altLeft:    { flex:1 },
  altIcao:    { color: C.textPrimary, fontWeight:'800', fontSize:16 },
  altName:    { color: C.textMuted, fontSize:11, marginTop:2 },
  altReason:  { color: C.textDim, fontSize:10, marginTop:2 },
  altDist:    { color: C.gold, fontWeight:'700', fontSize:13 },
  graphSub: { color: C.textDim, fontSize:10, textAlign:'center', marginTop:6 },
  // Fuel Optimization
  foptBanner:      { flexDirection:'row', backgroundColor:'#0D1526',
                     borderRadius:10, padding:12, marginBottom:12,
                     borderWidth:1, borderColor:'#00FF8822' },
  foptBannerLeft:  { flex:1, alignItems:'center' },
  foptBannerMid:   { flex:1, alignItems:'center' },
  foptBannerRight: { flex:1, alignItems:'center' },
  foptDivider:     { width:1, backgroundColor: C.border, marginHorizontal:8 },
  foptSavedKg:     { color:'#00FF88', fontSize:18, fontWeight:'800' },
  foptOptFL:       { color:'#00D4FF', fontSize:18, fontWeight:'800' },
  foptSavedLbl:    { color: C.textDim, fontSize:8, letterSpacing:1.5, marginTop:3 },
  foptRec:         { backgroundColor: C.bgCard, borderRadius:8, padding:10,
                     marginBottom:10, borderWidth:1, borderColor: C.border },
  foptRecText:     { color: C.textSecondary, fontSize:11, lineHeight:17 },
  foptStepCard:    { flexDirection:'row', alignItems:'flex-start', gap:8,
                     backgroundColor:'#FFD70012', borderRadius:8, padding:10,
                     marginBottom:10, borderWidth:1, borderColor:'#FFD70033' },
  foptStepIcon:    { fontSize:14 },
  foptStepText:    { color:'#FFD700', fontSize:11, flex:1, lineHeight:16 },
  foptTableTitle:  { color: C.textDim, fontSize:9, letterSpacing:2,
                     fontWeight:'700', marginBottom:6 },
  foptTableHeader: { flexDirection:'row', paddingBottom:6,
                     borderBottomWidth:1, borderBottomColor: C.border,
                     marginBottom:2 },
  foptTh:          { color: C.textDim, fontSize:9, fontWeight:'700',
                     letterSpacing:1 },
  foptRow:         { flexDirection:'row', alignItems:'center', paddingVertical:7,
                     borderBottomWidth:1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  foptRowOptimal:  { backgroundColor:'#00FF8808' },
  foptFl:          { color: C.textMuted, fontSize:11, fontWeight:'700' },
  foptTd:          { color: C.textMuted, fontSize:11 },
  aqHeader:    { flexDirection:'row', justifyContent:'space-between',
                 alignItems:'center', marginBottom:14 },
  aqEmpty:     { color: C.textDim, fontSize:12, textAlign:'center', padding:8 },
  aqRow:       { flexDirection:'row', alignItems:'center',
                 paddingVertical:10, borderBottomWidth:1,
                 borderBottomColor: 'rgba(255,255,255,0.04)', gap:12 },
  aqLeft:      { width:80, gap:4 },
  aqIcao:      { color: C.textPrimary, fontWeight:'800', fontSize:14 },
  aqiBadge:    { borderWidth:1, borderRadius:4,
                 paddingHorizontal:5, paddingVertical:2, alignSelf:'flex-start' },
  aqiLabel:    { fontSize:8, fontWeight:'800', letterSpacing:1 },
  aqStats:     { flex:1, flexDirection:'row', justifyContent:'space-between' },
  aqStat:      { alignItems:'center' },
  aqVal:       { color: C.textPrimary, fontWeight:'700', fontSize:13 },
  aqStatLbl:   { color: C.textDim, fontSize:8, letterSpacing:1, marginTop:2 },
  notamRow:    { paddingVertical:10, borderBottomWidth:1,
                 borderBottomColor: C.border },
  notamHeader: { flexDirection:'row', justifyContent:'space-between',
                 marginBottom:4 },
  notamNumber: { color: C.textPrimary, fontWeight:'700', fontSize:12 },
  notamClass:  { color:'#00D4FF', fontSize:11 },
  notamText:   { color: C.textSecondary, fontSize:11, lineHeight:16 },
  notamDate:   { color: C.textDim, fontSize:10, marginTop:4 },
  altReason: { color: C.textDim, fontSize:9, textAlign:'center',
             marginTop:3, maxWidth:100 },
});