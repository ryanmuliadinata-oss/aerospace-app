import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { checkHealth } from '../api/flightApi';
import { API_BASE_URL } from '../config';

const SOURCES = [
  {
    name:  'Aviation Weather (NOAA)',
    desc:  'METAR · SIGMET · PIREP',
    url:   'aviationweather.gov',
    free:  true,
  },
  {
    name:  'FlightAware AeroAPI',
    desc:  'Fuel burn · Flight tracking',
    url:   'flightaware.com/aeroapi',
    free:  false,
  },
  {
    name:  'Open-Meteo',
    desc:  'Upper winds · Pressure layers',
    url:   'open-meteo.com',
    free:  true,
  },
];

export default function DashboardScreen({ navigation }) {
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    checkHealth()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  return (
    <ScrollView style={s.container}>

      {/* Server Status */}
      <Text style={s.sectionTitle}>BACKEND STATUS</Text>
      <View style={s.statusCard}>
        <View style={s.statusLeft}>
          <Text style={s.statusName}>Spring Boot API</Text>
          <Text style={s.statusUrl}>{API_BASE_URL}</Text>
        </View>
        {serverStatus === 'checking'
          ? <ActivityIndicator color="#00D4FF" size="small" />
          : (
            <View style={[s.badge,
              serverStatus === 'online' ? s.badgeOnline : s.badgeOffline]}>
              <Text style={[s.badgeText,
                { color: serverStatus === 'online' ? '#00FF88' : '#FF3333' }]}>
                {serverStatus === 'online' ? '● ONLINE' : '● OFFLINE'}
              </Text>
            </View>
          )
        }
      </View>

      {/* Data Sources */}
      <Text style={s.sectionTitle}>LIVE DATA SOURCES</Text>
      {SOURCES.map((src, i) => (
        <View key={i} style={s.sourceCard}>
          <View style={s.srcLeft}>
            <View style={s.srcTitleRow}>
              <Text style={s.srcName}>{src.name}</Text>
              <View style={[s.freeBadge,
                { borderColor: src.free ? '#00FF8866' : '#FFD70066' }]}>
                <Text style={[s.freeText,
                  { color: src.free ? '#00FF88' : '#FFD700' }]}>
                  {src.free ? 'FREE' : 'PAID'}
                </Text>
              </View>
            </View>
            <Text style={s.srcDesc}>{src.desc}</Text>
            <Text style={s.srcUrl}>{src.url}</Text>
          </View>
          <View style={s.liveDot} />
        </View>
      ))}

      {/* Key Setup */}
      <Text style={s.sectionTitle}>API KEY SETUP</Text>
      <View style={s.keyCard}>
        {[
          ['Aviation Weather', 'aviationweather.gov',    'No key needed'],
          ['FlightAware',      'flightaware.com/aeroapi','Add to application.properties'],
          ['Open-Meteo',       'open-meteo.com',         'No key needed'],
        ].map(([name, url, note], i) => (
          <View key={i} style={[s.keyRow,
            i < 2 && { borderBottomWidth:1, borderBottomColor:'#1F2937' }]}>
            <View style={{ flex:1 }}>
              <Text style={s.keyName}>{name}</Text>
              <Text style={s.keyUrl}>{url}</Text>
            </View>
            <Text style={s.keyNote}>{note}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={s.simBtn}
        onPress={() => navigation.navigate('Flight Plan')}
      >
        <Text style={s.simBtnText}>✈  NEW SIMULATION</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#0A0E1A', padding:16 },
  sectionTitle: { color:'#00D4FF', fontSize:11, fontWeight:'700',
                  letterSpacing:2.5, marginTop:24, marginBottom:12 },
  statusCard:   { backgroundColor:'#111827', borderRadius:12, padding:16,
                  flexDirection:'row', alignItems:'center',
                  justifyContent:'space-between',
                  borderWidth:1, borderColor:'#1F2937' },
  statusLeft:   { flex:1 },
  statusName:   { color:'#FFF', fontWeight:'700', fontSize:14 },
  statusUrl:    { color:'#445566', fontSize:11, marginTop:2 },
  badge:        { paddingHorizontal:10, paddingVertical:5,
                  borderRadius:20, borderWidth:1 },
  badgeOnline:  { backgroundColor:'#00FF8818', borderColor:'#00FF8844' },
  badgeOffline: { backgroundColor:'#FF333318', borderColor:'#FF333344' },
  badgeText:    { fontSize:11, fontWeight:'700', letterSpacing:1 },
  sourceCard:   { backgroundColor:'#111827', borderRadius:12,
                  padding:14, marginBottom:10,
                  flexDirection:'row', alignItems:'center',
                  borderWidth:1, borderColor:'#1F2937' },
  srcLeft:      { flex:1 },
  srcTitleRow:  { flexDirection:'row', alignItems:'center', gap:8 },
  srcName:      { color:'#FFF', fontWeight:'700', fontSize:14 },
  freeBadge:    { paddingHorizontal:7, paddingVertical:2,
                  borderRadius:4, borderWidth:1 },
  freeText:     { fontSize:9, fontWeight:'800', letterSpacing:1 },
  srcDesc:      { color:'#556677', fontSize:11, marginTop:3 },
  srcUrl:       { color:'#334455', fontSize:10, marginTop:2 },
  liveDot:      { width:8, height:8, borderRadius:4, backgroundColor:'#00FF88' },
  keyCard:      { backgroundColor:'#111827', borderRadius:12,
                  overflow:'hidden', borderWidth:1, borderColor:'#1F2937' },
  keyRow:       { padding:14, flexDirection:'row', alignItems:'center' },
  keyName:      { color:'#FFF', fontWeight:'600', fontSize:13 },
  keyUrl:       { color:'#445566', fontSize:10, marginTop:2 },
  keyNote:      { color:'#556677', fontSize:10,
                  textAlign:'right', maxWidth:130 },
  simBtn:       { backgroundColor:'#00D4FF', borderRadius:12,
                  padding:16, alignItems:'center',
                  marginTop:24, marginBottom:48 },
  simBtnText:   { color:'#000919', fontSize:15,
                  fontWeight:'800', letterSpacing:1.5 },
});