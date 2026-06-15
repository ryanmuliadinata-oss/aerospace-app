import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkHealth } from '../api/flightApi';
import { API_BASE_URL } from '../config';
import { C, F, S, T } from '../theme';

const HISTORY_KEY = 'flight_history';

// Concrete specs per data source — not marketing copy, just what they actually provide
const SOURCES = [
  {
    name:   'Aviation Weather',
    stat:   '~50K airports',
    detail: 'METAR · TAF · SIGMET · PIREP',
    free:   true,
  },
  {
    name:   'OpenSky Network',
    stat:   'Live · 30 s refresh',
    detail: 'ADS-B · Mode-S transponders',
    free:   true,
  },
  {
    name:   'Open-Meteo',
    stat:   '2 km res · 16-day',
    detail: 'Winds aloft · 7 pressure levels',
    free:   true,
  },
  {
    name:   'OpenAIP',
    stat:   '~60K airports',
    detail: 'Runways · ILS · Elevation',
    free:   true,
  },
  {
    name:   'Sunrise-Sunset',
    stat:   'Sub-second precision',
    detail: 'Civil · Nautical · Astronomical',
    free:   true,
  },
  {
    name:   'FlightAware',
    stat:   'AeroAPI v4',
    detail: 'Block fuel · Flight tracking',
    free:   false,
  },
];

export default function DashboardScreen({ navigation }) {
  const [status,  setStatus]  = useState('checking');
  const [stats,   setStats]   = useState(null);   // derived from history

  // Re-check API and reload stats every time this tab comes into focus
  useFocusEffect(useCallback(() => {
    checkHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));

    AsyncStorage.getItem(HISTORY_KEY).then(raw => {
      const history = raw ? JSON.parse(raw) : [];
      if (history.length === 0) { setStats(null); return; }

      const goCount      = history.filter(h => h.isGo).length;
      const totalHrs     = history.reduce((sum, h) => sum + (h.estimatedFlightTimeHrs || 0), 0);
      const last         = history[history.length - 1];
      const uniqueRoutes = new Set(history.map(h => `${h.origin}-${h.destination}`)).size;

      setStats({
        total:       history.length,
        goRate:      Math.round((goCount / history.length) * 100),
        totalHrs:    totalHrs.toFixed(1),
        uniqueRoutes,
        lastRoute:   `${last.origin} → ${last.destination}`,
        lastAircraft: last.aircraftType,
      });
    }).catch(() => {});
  }, []));

  return (
    <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
      <View style={S.titleBlock}>
        <Text style={[T.screenLabel, { marginBottom: 4 }]}>STATUS</Text>
        <Text style={T.screenTitle}>Aerospace Dispatch</Text>
      </View>

      {/* ── Your logbook stats ── */}
      {stats ? (
        <>
          <Text style={S.sectionHeader}>YOUR LOGBOOK</Text>
          <View style={[S.card, S.cardGreen]}>
            <View style={styles.statGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statBig}>{stats.total}</Text>
                <Text style={styles.statLbl}>SIMULATIONS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statBig}>{stats.goRate}%</Text>
                <Text style={styles.statLbl}>GO RATE</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statBig}>{stats.totalHrs}</Text>
                <Text style={styles.statLbl}>EST HRS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statBig}>{stats.uniqueRoutes}</Text>
                <Text style={styles.statLbl}>ROUTES</Text>
              </View>
            </View>
            <View style={S.divider} />
            <Text style={styles.lastFlight}>Last: {stats.lastRoute} · {stats.lastAircraft}</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={S.sectionHeader}>YOUR LOGBOOK</Text>
          <View style={S.card}>
            <Text style={styles.noStats}>No simulations yet — run one to see your stats.</Text>
          </View>
        </>
      )}

      {/* ── API status ── */}
      <Text style={S.sectionHeader}>SYSTEM STATUS</Text>
      <View style={[S.card, status === 'online' ? S.cardGreen : styles.cardRed]}>
        <View style={styles.statusRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusName}>Spring Boot API</Text>
            <Text style={styles.statusUrl} numberOfLines={1}>{API_BASE_URL}</Text>
          </View>
          {status === 'checking'
            ? <ActivityIndicator color={C.green} size="small" />
            : (
              <View style={[styles.pill, {
                backgroundColor: status === 'online' ? C.greenFaint : C.redFaint,
                borderColor:     status === 'online' ? C.greenDim   : C.redDim,
              }]}>
                <View style={[styles.pillDot, {
                  backgroundColor: status === 'online' ? C.green : C.red,
                }]} />
                <Text style={[styles.pillText, {
                  color: status === 'online' ? C.green : C.red,
                }]}>
                  {status === 'online' ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>
            )}
        </View>
      </View>

      {/* ── Data sources with real specs ── */}
      <Text style={S.sectionHeader}>DATA SOURCES</Text>
      {SOURCES.map((src, i) => (
        <View key={i} style={[S.card, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Text style={styles.srcName}>{src.name}</Text>
              <View style={[styles.freeBadge, {
                borderColor:     src.free ? C.greenDim  : C.goldDim,
                backgroundColor: src.free ? C.greenFaint : C.goldFaint,
              }]}>
                <Text style={[styles.freeText, { color: src.free ? C.green : C.gold }]}>
                  {src.free ? 'FREE' : 'PAID'}
                </Text>
              </View>
            </View>
            <Text style={styles.srcDetail}>{src.detail}</Text>
          </View>
          {/* Real spec instead of a colored dot */}
          <Text style={[styles.srcStat, { color: src.free ? C.green : C.gold }]}>
            {src.stat}
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={[S.btnPrimary, { marginTop: 16, marginBottom: 48 }]}
        onPress={() => navigation.navigate('Flight Plan')}>
        <Text style={S.btnPrimaryText}>✈  NEW SIMULATION</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardRed:      { borderColor: C.redDim },
  // Logbook stats
  statGrid:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  statCell:     { flex: 1, alignItems: 'center' },
  statBig:      { color: C.textPrimary, fontSize: 22, fontFamily: F.xBold },
  statLbl:      { color: C.textMuted, fontSize: 8, letterSpacing: 1.5, marginTop: 4 },
  statDivider:  { width: 1, height: 36, backgroundColor: C.border },
  lastFlight:   { color: C.textMuted, fontFamily: F.regular, fontSize: 10, lineHeight: 15, marginTop: 2 },
  noStats:      { color: C.textDim, fontFamily: F.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingVertical: 4 },
  // API status
  statusRow:    { flexDirection: 'row', alignItems: 'center' },
  statusName:   { color: C.textPrimary, fontSize: 14, fontFamily: F.semiBold },
  statusUrl:    { color: C.textDim, fontFamily: F.regular, fontSize: 10, lineHeight: 15, marginTop: 3 },
  pill:         { flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: 100, borderWidth: 1 },
  pillDot:      { width: 6, height: 6, borderRadius: 3 },
  pillText:     { fontSize: 10, fontFamily: F.bold, letterSpacing: 1 },
  // Source cards
  srcName:      { color: C.textPrimary, fontSize: 13, fontFamily: F.semiBold },
  srcDetail:    { color: C.textMuted, fontFamily: F.regular, fontSize: 10, lineHeight: 15, marginTop: 2 },
  srcStat:      { fontSize: 11, fontFamily: F.bold, textAlign: 'right',
                  maxWidth: 110, flexShrink: 0 },
  freeBadge:    { paddingHorizontal: 7, paddingVertical: 2,
                  borderRadius: 5, borderWidth: 1 },
  freeText:     { fontSize: 9, fontFamily: F.xBold, letterSpacing: 1 },
});
