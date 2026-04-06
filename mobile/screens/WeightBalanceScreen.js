import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Polyline } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
 
const AIRCRAFT_DATA = {
  B737: {
    maxTakeoffKg: 79016, maxLandingKg: 66360, maxZeroFuelKg: 62732,
    emptyWeightKg: 41413, emptyArmM: 17.8, macLengthM: 3.73,
    datumToLemacM: 13.46, maxPax: 189, cgMin: 12, cgMax: 36, fuelArmM: 18.2,
    avgPaxKg: 95,
    zones: [
      { name: 'Zone A (Rows 1-10)',  seats: 50, armM: 15.2 },
      { name: 'Zone B (Rows 11-22)', seats: 72, armM: 19.6 },
      { name: 'Zone C (Rows 23-32)', seats: 67, armM: 23.1 },
    ],
    holds: [
      { name: 'Fwd Hold', maxKg: 7285, armM: 13.1 },
      { name: 'Aft Hold', maxKg: 5985, armM: 22.7 },
    ],
    envelope: [
      [12,41],[12,60],[15,79],[36,79],[36,60],[33,41],[12,41],
    ],
  },
  A320: {
    maxTakeoffKg: 78000, maxLandingKg: 66000, maxZeroFuelKg: 61000,
    emptyWeightKg: 42600, emptyArmM: 17.0, macLengthM: 4.194,
    datumToLemacM: 13.46, maxPax: 180, cgMin: 15, cgMax: 38, fuelArmM: 17.6,
    avgPaxKg: 95,
    zones: [
      { name: 'Zone A (Rows 1-11)',  seats: 44, armM: 14.8 },
      { name: 'Zone B (Rows 12-24)', seats: 68, armM: 19.4 },
      { name: 'Zone C (Rows 25-34)', seats: 68, armM: 23.8 },
    ],
    holds: [
      { name: 'Fwd Hold',  maxKg: 3402, armM: 12.2 },
      { name: 'Aft Hold',  maxKg: 4536, armM: 22.1 },
      { name: 'Bulk Hold', maxKg: 1497, armM: 25.8 },
    ],
    envelope: [
      [15,42],[15,62],[18,78],[38,78],[38,60],[34,42],[15,42],
    ],
  },
  B777: {
    maxTakeoffKg: 299370, maxLandingKg: 213180, maxZeroFuelKg: 201840,
    emptyWeightKg: 145150, emptyArmM: 28.9, macLengthM: 9.0,
    datumToLemacM: 22.0, maxPax: 396, cgMin: 11, cgMax: 40, fuelArmM: 31.0,
    avgPaxKg: 95,
    zones: [
      { name: 'Zone A (Rows 1-14)',  seats: 56,  armM: 22.0 },
      { name: 'Zone B (Rows 15-32)', seats: 144, armM: 31.0 },
      { name: 'Zone C (Rows 33-47)', seats: 196, armM: 40.0 },
    ],
    holds: [
      { name: 'Fwd Hold 1', maxKg: 16329, armM: 20.0 },
      { name: 'Fwd Hold 2', maxKg: 13608, armM: 25.0 },
      { name: 'Aft Hold',   maxKg: 18597, armM: 38.0 },
      { name: 'Bulk Hold',  maxKg: 2722,  armM: 43.0 },
    ],
    envelope: [
      [11,145],[11,210],[15,299],[40,299],[40,210],[36,145],[11,145],
    ],
  },
  B747: {
    maxTakeoffKg: 412775, maxLandingKg: 295742, maxZeroFuelKg: 272155,
    emptyWeightKg: 178756, emptyArmM: 31.1, macLengthM: 9.44,
    datumToLemacM: 25.6, maxPax: 467, cgMin: 13, cgMax: 38, fuelArmM: 32.0,
    avgPaxKg: 95,
    zones: [
      { name: 'Upper Deck',          seats: 24,  armM: 23.0 },
      { name: 'Zone A (Rows 1-16)',  seats: 112, armM: 27.0 },
      { name: 'Zone B (Rows 17-34)', seats: 153, armM: 35.0 },
      { name: 'Zone C (Rows 35-47)', seats: 178, armM: 42.0 },
    ],
    holds: [
      { name: 'Fwd Belly', maxKg: 20412, armM: 24.0 },
      { name: 'Mid Belly', maxKg: 18144, armM: 31.0 },
      { name: 'Aft Belly', maxKg: 16329, armM: 40.0 },
    ],
    envelope: [
      [13,179],[13,295],[18,413],[38,413],[38,295],[34,179],[13,179],
    ],
  },
  A380: {
    maxTakeoffKg: 575000, maxLandingKg: 394000, maxZeroFuelKg: 369000,
    emptyWeightKg: 276800, emptyArmM: 38.0, macLengthM: 12.0,
    datumToLemacM: 30.0, maxPax: 555, cgMin: 14, cgMax: 42, fuelArmM: 38.0,
    avgPaxKg: 95,
    zones: [
      { name: 'Upper Fwd',             seats: 80,  armM: 30.0 },
      { name: 'Upper Aft',             seats: 97,  armM: 40.0 },
      { name: 'Main Fwd (Rows 1-20)',  seats: 148, armM: 32.0 },
      { name: 'Main Mid (Rows 21-40)', seats: 148, armM: 40.0 },
      { name: 'Main Aft (Rows 41-55)', seats: 82,  armM: 47.0 },
    ],
    holds: [
      { name: 'Fwd Hold 1', maxKg: 18000, armM: 28.0 },
      { name: 'Fwd Hold 2', maxKg: 18000, armM: 33.0 },
      { name: 'Aft Hold',   maxKg: 20000, armM: 44.0 },
      { name: 'Bulk Hold',  maxKg: 5000,  armM: 49.0 },
    ],
    envelope: [
      [14,277],[14,394],[18,575],[42,575],[42,394],[38,277],[14,277],
    ],
  },
};
 
const SCREEN_W = Dimensions.get('window').width - 64;
const CHART_H  = 200;
const PAD      = { top: 16, right: 16, bottom: 28, left: 48 };
 
function CgEnvelope({ aircraft, dots }) {
  const d    = AIRCRAFT_DATA[aircraft];
  const env  = d.envelope;
  const macs = env.map(p => p[0]);
  const tons = env.map(p => p[1]);
  const minM = Math.min(...macs) - 2;
  const maxM = Math.max(...macs) + 2;
  const minT = Math.min(...tons) * 0.88;
  const maxT = Math.max(...tons) * 1.02;
  const cW   = SCREEN_W - PAD.left - PAD.right;
  const cH   = CHART_H  - PAD.top  - PAD.bottom;
  const toX  = (m) => PAD.left + ((m - minM) / (maxM - minM)) * cW;
  const toY  = (t) => PAD.top  + (1 - (t - minT) / (maxT - minT)) * cH;
 
  const pathD = env.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(p[0]).toFixed(1)},${toY(p[1]).toFixed(1)}`
  ).join(' ') + ' Z';
 
  const ySteps = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const t = minT + f * (maxT - minT);
    return { t, y: toY(t), lbl: Math.round(t) };
  });
 
  const xVals = [];
  for (let v = Math.ceil(minM / 5) * 5; v <= Math.floor(maxM / 5) * 5; v += 5) {
    xVals.push(v);
  }
 
  const validDots = dots.filter(dot => dot.ton > 0 && dot.mac > 0 && isFinite(dot.mac));
 
  return (
    <Svg width={SCREEN_W} height={CHART_H}>
      {ySteps.map(({ y, lbl }) => (
        <React.Fragment key={lbl}>
          <Line x1={PAD.left} y1={y} x2={SCREEN_W - PAD.right} y2={y}
            stroke="#1F2937" strokeWidth="1" />
          <SvgText x={PAD.left - 4} y={y + 4} fill="#445566"
            fontSize="8" textAnchor="end">{lbl}</SvgText>
        </React.Fragment>
      ))}
      {xVals.map(v => (
        <React.Fragment key={v}>
          <Line x1={toX(v)} y1={PAD.top} x2={toX(v)} y2={CHART_H - PAD.bottom}
            stroke="#1F2937" strokeWidth="1" />
          <SvgText x={toX(v)} y={CHART_H - PAD.bottom + 10} fill="#445566"
            fontSize="8" textAnchor="middle">{v}%</SvgText>
        </React.Fragment>
      ))}
      <Path d={pathD} fill="#00FF8812" stroke="#00FF8866" strokeWidth="1.5" />
      {validDots.length >= 2 && (
        <Polyline
          points={validDots.map(dot =>
            `${toX(dot.mac).toFixed(1)},${toY(dot.ton).toFixed(1)}`
          ).join(' ')}
          fill="none" stroke="#ffffff33" strokeWidth="1" strokeDasharray="3,2"
        />
      )}
      {validDots.map((dot) => (
        <React.Fragment key={dot.label}>
          <Circle cx={toX(dot.mac)} cy={toY(dot.ton)} r="5"
            fill={dot.color} opacity="0.9" />
          <SvgText x={toX(dot.mac) + 7} y={toY(dot.ton) - 3}
            fill={dot.color} fontSize="8" fontWeight="bold">{dot.label}</SvgText>
        </React.Fragment>
      ))}
      <Line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={CHART_H - PAD.bottom}
        stroke="#334455" strokeWidth="1" />
      <Line x1={PAD.left} y1={CHART_H - PAD.bottom}
        x2={SCREEN_W - PAD.right} y2={CHART_H - PAD.bottom}
        stroke="#334455" strokeWidth="1" />
      <SvgText x={10} y={CHART_H / 2} fill="#445566" fontSize="8"
        textAnchor="middle" rotation="-90" originX="10" originY={CHART_H / 2}>
        TONNES
      </SvgText>
      <SvgText x={SCREEN_W / 2} y={CHART_H - 2} fill="#445566"
        fontSize="8" textAnchor="middle">% MAC</SvgText>
    </Svg>
  );
}
 
function inEnvelope(cgPct, weightKg, envelope) {
  const weightT = weightKg / 1000;
  let inside = false;
  for (let i = 0, j = envelope.length - 1; i < envelope.length; j = i++) {
    const [xi, yi] = envelope[i];
    const [xj, yj] = envelope[j];
    if (((yi > weightT) !== (yj > weightT)) &&
        cgPct < ((xj - xi) * (weightT - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
 
export default function WeightBalanceScreen() {
  const [aircraft, setAircraft] = useState('B737');
  const [fuelKg,   setFuelKg]   = useState('15000');
  const [result,   setResult]   = useState(null);
  const [zonePax,  setZonePax]  = useState({ 0: '0', 1: '0', 2: '0' });
  const [holdKg,   setHoldKg]   = useState({ 0: '0', 1: '0' });
 
  const d = AIRCRAFT_DATA[aircraft];
 
  const handleAircraftChange = (ac) => {
    const nd = AIRCRAFT_DATA[ac];
    setAircraft(ac);
    setZonePax(Object.fromEntries(nd.zones.map((_, i) => [i, '0'])));
    setHoldKg(Object.fromEntries(nd.holds.map((_, i) => [i, '0'])));
    setResult(null);
  };
 
  const calculate = () => {
    const fuel = parseFloat(fuelKg) || 0;
    const zoneLoads = d.zones.map((z, i) => {
      const pax = Math.min(parseInt(zonePax[i]) || 0, z.seats);
      const kg  = pax * d.avgPaxKg;
      return { ...z, pax, kg, moment: kg * z.armM };
    });
    const holdLoads = d.holds.map((h, i) => {
      const kg = Math.min(parseFloat(holdKg[i]) || 0, h.maxKg);
      return { ...h, kg, moment: kg * h.armM };
    });
 
    const emptyMoment = d.emptyWeightKg * d.emptyArmM;
    const paxMoment   = zoneLoads.reduce((s, z) => s + z.moment, 0);
    const cargoMoment = holdLoads.reduce((s, h) => s + h.moment, 0);
    const fuelMoment  = fuel * d.fuelArmM;
    const paxKg       = zoneLoads.reduce((s, z) => s + z.kg, 0);
    const cargoKg     = holdLoads.reduce((s, h) => s + h.kg, 0);
    const totalPax    = zoneLoads.reduce((s, z) => s + z.pax, 0);
 
    const zfw     = d.emptyWeightKg + paxKg + cargoKg;
    const zfMom   = emptyMoment + paxMoment + cargoMoment;
    const zfArm   = zfw > 0 ? zfMom / zfw : d.emptyArmM;
    const zfCg    = ((zfArm - d.datumToLemacM) / d.macLengthM) * 100;
 
    const tow     = zfw + fuel;
    const toMom   = zfMom + fuelMoment;
    const toArm   = tow > 0 ? toMom / tow : zfArm;
    const toCg    = ((toArm - d.datumToLemacM) / d.macLengthM) * 100;
 
    const burnKg  = fuel * 0.85;
    const ldw     = tow - burnKg;
    const ldMom   = toMom - burnKg * d.fuelArmM;
    const ldArm   = ldw > 0 ? ldMom / ldw : toArm;
    const ldCg    = ((ldArm - d.datumToLemacM) / d.macLengthM) * 100;
 
    const checks = {
      zeroFuel:   zfw  <= d.maxZeroFuelKg,
      takeoff:    tow  <= d.maxTakeoffKg,
      landing:    ldw  <= d.maxLandingKg,
      paxCount:   totalPax <= d.maxPax,
      cgZeroFuel: inEnvelope(zfCg, zfw, d.envelope),
      cgTakeoff:  inEnvelope(toCg, tow, d.envelope),
      cgLanding:  inEnvelope(ldCg, ldw, d.envelope),
      holdLimits: holdLoads.every((h, i) => h.kg <= d.holds[i].maxKg),
    };
 
    setResult({
      zfw, tow, ldw, zfCg, toCg, ldCg,
      zfArm, toArm, ldArm,
      paxKg, cargoKg, fuel, totalPax,
      zoneLoads, holdLoads, checks,
      allGood: Object.values(checks).every(Boolean),
    });
  };
 
  const shareLoadSheet = async () => {
    if (!result) return;
    const r = result;
    const now = new Date().toLocaleString();
    const html = `<html><head><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111;font-size:12px;}
      h1{font-size:18px;border-bottom:2px solid #003366;padding-bottom:8px;color:#003366;}
      h2{font-size:13px;color:#003366;margin-top:20px;}
      table{width:100%;border-collapse:collapse;margin-top:8px;}
      th{background:#003366;color:#fff;padding:6px 8px;text-align:left;}
      td{padding:5px 8px;border-bottom:1px solid #ddd;}
      .go{color:#006633;font-weight:bold;}.nogo{color:#cc0000;font-weight:bold;}
      .banner{padding:10px;font-weight:bold;font-size:14px;
        background:${r.allGood?'#e6fff2':'#ffe6e6'};
        color:${r.allGood?'#006633':'#cc0000'};
        border:2px solid ${r.allGood?'#00cc66':'#cc0000'};}
      .sig{margin-top:48px;border-top:1px solid #ccc;padding-top:8px;}
      .footer{margin-top:20px;font-size:10px;color:#999;text-align:center;}
    </style></head><body>
      <h1>Load & Trim Sheet</h1>
      <p><b>Aircraft:</b> ${aircraft} &nbsp; <b>Generated:</b> ${now}</p>
      <div class="banner">${r.allGood?'WITHIN LIMITS — RELEASE APPROVED':'EXCEEDS LIMITS — DO NOT RELEASE'}</div>
      <h2>WEIGHT SUMMARY</h2>
      <table><tr><th>Item</th><th>Weight (kg)</th><th>Limit (kg)</th><th>Status</th></tr>
        <tr><td>Zero Fuel Weight</td><td>${Math.round(r.zfw)}</td><td>${d.maxZeroFuelKg}</td><td class="${r.checks.zeroFuel?'go':'nogo'}">${r.checks.zeroFuel?'OK':'EXCEED'}</td></tr>
        <tr><td>Takeoff Weight</td><td>${Math.round(r.tow)}</td><td>${d.maxTakeoffKg}</td><td class="${r.checks.takeoff?'go':'nogo'}">${r.checks.takeoff?'OK':'EXCEED'}</td></tr>
        <tr><td>Landing Weight</td><td>${Math.round(r.ldw)}</td><td>${d.maxLandingKg}</td><td class="${r.checks.landing?'go':'nogo'}">${r.checks.landing?'OK':'EXCEED'}</td></tr>
      </table>
      <h2>CENTER OF GRAVITY</h2>
      <table><tr><th>State</th><th>CG Arm (m)</th><th>% MAC</th><th>Envelope</th></tr>
        <tr><td>Zero Fuel</td><td>${r.zfArm.toFixed(3)}</td><td>${r.zfCg.toFixed(2)}%</td><td class="${r.checks.cgZeroFuel?'go':'nogo'}">${r.checks.cgZeroFuel?'IN ENVELOPE':'OUT OF ENVELOPE'}</td></tr>
        <tr><td>Takeoff</td><td>${r.toArm.toFixed(3)}</td><td>${r.toCg.toFixed(2)}%</td><td class="${r.checks.cgTakeoff?'go':'nogo'}">${r.checks.cgTakeoff?'IN ENVELOPE':'OUT OF ENVELOPE'}</td></tr>
        <tr><td>Landing</td><td>${r.ldArm.toFixed(3)}</td><td>${r.ldCg.toFixed(2)}%</td><td class="${r.checks.cgLanding?'go':'nogo'}">${r.checks.cgLanding?'IN ENVELOPE':'OUT OF ENVELOPE'}</td></tr>
      </table>
      <h2>PASSENGER ZONES</h2>
      <table><tr><th>Zone</th><th>Seats</th><th>Pax</th><th>Weight (kg)</th><th>Arm (m)</th><th>Moment</th></tr>
        ${r.zoneLoads.map(z=>`<tr><td>${z.name}</td><td>${z.seats}</td><td>${z.pax}</td><td>${Math.round(z.kg)}</td><td>${z.armM}</td><td>${Math.round(z.moment)}</td></tr>`).join('')}
      </table>
      <h2>CARGO HOLDS</h2>
      <table><tr><th>Hold</th><th>Max (kg)</th><th>Loaded (kg)</th><th>Arm (m)</th></tr>
        ${r.holdLoads.map(h=>`<tr><td>${h.name}</td><td>${h.maxKg}</td><td>${Math.round(h.kg)}</td><td>${h.armM}</td></tr>`).join('')}
      </table>
      <div class="sig">
        Load Controller: ________________________________ Date: __________<br/><br/>
        Captain: ________________________________ Date: __________
      </div>
      <div class="footer">Generated by Aerospace Dispatch — For simulation purposes only. Not for operational use.</div>
    </body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Load Sheet' });
    } catch (e) { Alert.alert('Error', 'Could not generate load sheet.'); }
  };
 
  const StatusBar = ({ label, value, max, unit, ok }) => (
    <View style={s.statusRow}>
      <View style={s.statusLeft}>
        <Text style={s.statusLabel}>{label}</Text>
        <View style={s.barTrack}>
          <View style={[s.barFill, {
            width: `${Math.min((value/max)*100,100)}%`,
            backgroundColor: ok ? '#00FF88' : '#FF3333'
          }]} />
        </View>
      </View>
      <View style={s.statusRight}>
        <Text style={[s.statusValue, { color: ok ? '#00FF88' : '#FF3333' }]}>
          {Math.round(value).toLocaleString()} {unit}
        </Text>
        <Text style={s.statusMax}>/ {Math.round(max).toLocaleString()}</Text>
      </View>
    </View>
  );
 
  return (
    <ScrollView style={s.container}>
      <Text style={s.sectionTitle}>AIRCRAFT TYPE</Text>
      <View style={s.presetRow}>
        {Object.keys(AIRCRAFT_DATA).map(ac => (
          <TouchableOpacity key={ac}
            style={[s.acBtn, aircraft === ac && s.acBtnActive]}
            onPress={() => handleAircraftChange(ac)}>
            <Text style={[s.acText, aircraft === ac && s.acTextActive]}>{ac}</Text>
          </TouchableOpacity>
        ))}
      </View>
 
      <Text style={s.sectionTitle}>PASSENGER DISTRIBUTION</Text>
      {d.zones.map((zone, i) => (
        <View key={i} style={s.zoneRow}>
          <View style={s.zoneInfo}>
            <Text style={s.zoneLabel}>{zone.name}</Text>
            <Text style={s.zoneSub}>Max {zone.seats} seats · Arm {zone.armM}m</Text>
          </View>
          <TextInput style={s.zoneInput}
            value={zonePax[i] ?? '0'}
            onChangeText={v => setZonePax(p => ({ ...p, [i]: v }))}
            keyboardType="numeric" placeholder="0" placeholderTextColor="#445" />
        </View>
      ))}
 
      <Text style={s.sectionTitle}>CARGO HOLDS</Text>
      {d.holds.map((hold, i) => (
        <View key={i} style={s.zoneRow}>
          <View style={s.zoneInfo}>
            <Text style={s.zoneLabel}>{hold.name}</Text>
            <Text style={s.zoneSub}>Max {hold.maxKg.toLocaleString()} kg · Arm {hold.armM}m</Text>
          </View>
          <TextInput style={s.zoneInput}
            value={holdKg[i] ?? '0'}
            onChangeText={v => setHoldKg(p => ({ ...p, [i]: v }))}
            keyboardType="numeric" placeholder="0" placeholderTextColor="#445" />
        </View>
      ))}
 
      <Text style={s.sectionTitle}>FUEL</Text>
      <View style={s.field}>
        <Text style={s.label}>Block Fuel (kg) — CG arm {d.fuelArmM}m</Text>
        <TextInput style={s.input} value={fuelKg} onChangeText={setFuelKg}
          keyboardType="numeric" placeholder="15000" placeholderTextColor="#445" />
      </View>
 
      <TouchableOpacity style={s.btn} onPress={calculate}>
        <Text style={s.btnText}>⚖️  CALCULATE W&B</Text>
      </TouchableOpacity>
 
      {result && (<>
        <View style={[s.banner, result.allGood ? s.bannerGo : s.bannerNogo]}>
          <Text style={s.bannerIcon}>{result.allGood ? '✅' : '❌'}</Text>
          <Text style={s.bannerText}>
            {result.allGood ? 'WITHIN LIMITS — Load approved' : 'EXCEEDS LIMITS — Adjust load'}
          </Text>
        </View>
 
        <View style={s.card}>
          <Text style={s.cardTitle}>📐  CG ENVELOPE</Text>
          <CgEnvelope aircraft={aircraft} dots={[
            { mac: result.zfCg, ton: result.zfw / 1000, color: '#00D4FF', label: 'ZFW' },
            { mac: result.toCg, ton: result.tow / 1000, color: '#00FF88', label: 'TOW' },
            { mac: result.ldCg, ton: result.ldw / 1000, color: '#FFD700', label: 'LDW' },
          ]} />
          <View style={s.cgLegend}>
            {[
              { color: '#00D4FF', label: `ZFW  ${result.zfCg.toFixed(1)}% MAC`, ok: result.checks.cgZeroFuel },
              { color: '#00FF88', label: `TOW  ${result.toCg.toFixed(1)}% MAC`, ok: result.checks.cgTakeoff },
              { color: '#FFD700', label: `LDW  ${result.ldCg.toFixed(1)}% MAC`, ok: result.checks.cgLanding },
            ].map(({ color, label, ok }) => (
              <View key={label} style={s.cgLegendItem}>
                <View style={[s.cgLegendDot, { backgroundColor: color }]} />
                <Text style={s.cgLegendText}>{label}</Text>
                <Text style={{ color: ok ? '#00FF88' : '#FF3333', fontSize: 10, marginLeft: 4 }}>
                  {ok ? '✓' : '✗'}
                </Text>
              </View>
            ))}
          </View>
        </View>
 
        <View style={s.card}>
          <Text style={s.cardTitle}>⚖️  WEIGHT ANALYSIS</Text>
          <StatusBar label="Zero Fuel Weight" value={result.zfw} max={d.maxZeroFuelKg} unit="kg" ok={result.checks.zeroFuel} />
          <StatusBar label="Takeoff Weight"   value={result.tow} max={d.maxTakeoffKg}  unit="kg" ok={result.checks.takeoff} />
          <StatusBar label="Landing Weight"   value={result.ldw} max={d.maxLandingKg}  unit="kg" ok={result.checks.landing} />
        </View>
 
        <View style={s.card}>
          <Text style={s.cardTitle}>📍  CG DETAIL</Text>
          {[
            ['Zero Fuel', result.zfArm, result.zfCg, result.checks.cgZeroFuel],
            ['Takeoff',   result.toArm, result.toCg, result.checks.cgTakeoff],
            ['Landing',   result.ldArm, result.ldCg, result.checks.cgLanding],
          ].map(([lbl, arm, pct, ok]) => (
            <View key={lbl} style={s.cgDetailRow}>
              <Text style={s.cgDetailLabel}>{lbl}</Text>
              <Text style={s.cgDetailArm}>{arm.toFixed(3)} m</Text>
              <Text style={[s.cgDetailPct, { color: ok ? '#00FF88' : '#FF3333' }]}>
                {pct.toFixed(2)}% MAC
              </Text>
              <Text style={{ color: ok ? '#00FF88' : '#FF3333', fontSize: 11, width: 16 }}>
                {ok ? '✓' : '✗'}
              </Text>
            </View>
          ))}
          <Text style={s.cgNote}>Envelope: FWD {d.cgMin}% — AFT {d.cgMax}% MAC</Text>
        </View>
 
        <View style={s.card}>
          <Text style={s.cardTitle}>🪑  ZONE BREAKDOWN</Text>
          {result.zoneLoads.map((z, i) => (
            <View key={i} style={s.breakRow}>
              <Text style={s.breakLabel}>{z.name}</Text>
              <Text style={s.breakSub}>{z.pax} pax</Text>
              <Text style={s.breakValue}>{Math.round(z.kg).toLocaleString()} kg</Text>
            </View>
          ))}
          <View style={[s.breakRow, { borderTopWidth: 1, borderTopColor: '#00D4FF33', marginTop: 4 }]}>
            <Text style={[s.breakLabel, { color: '#00D4FF' }]}>TOTAL PAX</Text>
            <Text style={s.breakSub}>{result.totalPax} / {d.maxPax}</Text>
            <Text style={[s.breakValue, { color: result.checks.paxCount ? '#00FF88' : '#FF3333' }]}>
              {Math.round(result.paxKg).toLocaleString()} kg
            </Text>
          </View>
        </View>
 
        <View style={s.card}>
          <Text style={s.cardTitle}>📦  HOLD BREAKDOWN</Text>
          {result.holdLoads.map((h, i) => (
            <View key={i} style={s.breakRow}>
              <Text style={s.breakLabel}>{h.name}</Text>
              <Text style={s.breakSub}>Max {h.maxKg.toLocaleString()}</Text>
              <Text style={[s.breakValue, { color: h.kg <= h.maxKg ? '#fff' : '#FF3333' }]}>
                {Math.round(h.kg).toLocaleString()} kg
              </Text>
            </View>
          ))}
        </View>
 
        <TouchableOpacity style={s.shareBtn} onPress={shareLoadSheet}>
          <Text style={s.shareBtnText}>📄  EXPORT LOAD SHEET (PDF)</Text>
        </TouchableOpacity>
 
        <View style={[s.card, { marginBottom: 40 }]}>
          <Text style={s.cardTitle}>📋  WEIGHT SUMMARY</Text>
          {[
            ['OEW (Empty)',       d.emptyWeightKg],
            ['Passengers',        result.paxKg],
            ['Cargo',             result.cargoKg],
            ['Zero Fuel Weight',  result.zfw],
            ['Fuel',              result.fuel],
            ['Takeoff Weight',    result.tow],
            ['Landing Weight',    result.ldw],
          ].map(([label, val]) => (
            <View key={label} style={s.breakRow}>
              <Text style={s.breakLabel}>{label}</Text>
              <Text style={s.breakValue}>{Math.round(val).toLocaleString()} kg</Text>
            </View>
          ))}
        </View>
      </>)}
    </ScrollView>
  );
}
 
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0A0E1A', padding: 16 },
  sectionTitle: { color: '#00D4FF', fontSize: 11, fontWeight: '700',
                  letterSpacing: 2.5, marginTop: 24, marginBottom: 12 },
  presetRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  acBtn:        { backgroundColor: '#111827', borderRadius: 8,
                  paddingHorizontal: 14, paddingVertical: 9,
                  borderWidth: 1, borderColor: '#1F2937' },
  acBtnActive:  { borderColor: '#00D4FF', backgroundColor: '#00D4FF18' },
  acText:       { color: '#667788', fontSize: 12, fontWeight: '600' },
  acTextActive: { color: '#00D4FF' },
  zoneRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10,
                  backgroundColor: '#111827', borderRadius: 10, padding: 12,
                  borderWidth: 1, borderColor: '#1F2937' },
  zoneInfo:     { flex: 1 },
  zoneLabel:    { color: '#fff', fontSize: 12, fontWeight: '600' },
  zoneSub:      { color: '#445566', fontSize: 10, marginTop: 2 },
  zoneInput:    { backgroundColor: '#0A0E1A', color: '#fff', borderRadius: 8,
                  padding: 10, fontSize: 14, borderWidth: 1, borderColor: '#1F2937',
                  width: 70, textAlign: 'center' },
  field:        { marginBottom: 12 },
  label:        { color: '#667788', fontSize: 11, marginBottom: 6, letterSpacing: 1 },
  input:        { backgroundColor: '#111827', color: '#fff', borderRadius: 10,
                  padding: 13, fontSize: 15, borderWidth: 1, borderColor: '#1F2937' },
  btn:          { backgroundColor: '#00D4FF', borderRadius: 12, padding: 16,
                  alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnText:      { color: '#000919', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
  shareBtn:     { backgroundColor: '#FFD70022', borderRadius: 12, padding: 14,
                  alignItems: 'center', marginBottom: 14,
                  borderWidth: 1, borderColor: '#FFD70055' },
  shareBtnText: { color: '#FFD700', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  banner:       { borderRadius: 12, padding: 16, marginBottom: 16,
                  flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerGo:     { backgroundColor: '#00FF8818', borderWidth: 1, borderColor: '#00FF88' },
  bannerNogo:   { backgroundColor: '#FF333318', borderWidth: 1, borderColor: '#FF3333' },
  bannerIcon:   { fontSize: 22 },
  bannerText:   { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  card:         { backgroundColor: '#111827', borderRadius: 14, padding: 16,
                  marginBottom: 14, borderWidth: 1, borderColor: '#1F2937' },
  cardTitle:    { color: '#00D4FF', fontSize: 11, fontWeight: '700',
                  letterSpacing: 2.5, marginBottom: 14 },
  statusRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  statusLeft:   { flex: 1 },
  statusLabel:  { color: '#667788', fontSize: 11, marginBottom: 6 },
  barTrack:     { height: 8, backgroundColor: '#1F2937', borderRadius: 4, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 4 },
  statusRight:  { alignItems: 'flex-end', width: 100 },
  statusValue:  { fontWeight: '700', fontSize: 12 },
  statusMax:    { color: '#445566', fontSize: 10, marginTop: 2 },
  cgLegend:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  cgLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cgLegendDot:  { width: 8, height: 8, borderRadius: 4 },
  cgLegendText: { color: '#667788', fontSize: 10 },
  cgDetailRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
                  borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  cgDetailLabel:{ color: '#667788', fontSize: 12, width: 70 },
  cgDetailArm:  { color: '#fff', fontSize: 11, width: 64 },
  cgDetailPct:  { fontSize: 12, fontWeight: '700', flex: 1 },
  cgNote:       { color: '#334455', fontSize: 10, marginTop: 10, textAlign: 'center' },
  breakRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
                  borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  breakLabel:   { color: '#667788', fontSize: 12, flex: 1 },
  breakSub:     { color: '#334455', fontSize: 10, width: 70, textAlign: 'center' },
  breakValue:   { color: '#fff', fontWeight: '700', fontSize: 12,
                  width: 90, textAlign: 'right' },
});