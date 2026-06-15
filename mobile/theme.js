import { StyleSheet, Dimensions } from 'react-native';

export const SCREEN_W = Dimensions.get('window').width;

// ─── Color palette ─────────────────────────────────────────────────────────────
export const C = {
  bgBase:        '#111318',
  bgCard:        '#1A1D26',
  bgCardAlt:     '#161920',
  bgInput:       '#0D0F14',
  bgDark:        '#0B0D11',

  green:         '#50DC8C',
  greenDim:      '#50DC8C55',
  greenFaint:    '#50DC8C12',
  greenDark:     '#0A1F14',

  gold:          '#F0C060',
  goldDim:       '#F0C06055',
  goldFaint:     '#F0C06012',

  red:           '#E05252',
  redDim:        '#E0525255',
  redFaint:      '#E0525212',

  textPrimary:   '#FFFFFF',
  textSecondary: '#8A9BB0',
  textMuted:     '#4A5568',
  textDim:       '#2D3748',

  border:        'rgba(255,255,255,0.06)',
  borderMed:     'rgba(255,255,255,0.10)',
  borderGreen:   'rgba(80,220,140,0.20)',
  borderGold:    'rgba(240,192,96,0.20)',
  borderRed:     'rgba(224,82,82,0.20)',
};

// ─── Font families ─────────────────────────────────────────────────────────────
// Use F.bold instead of fontWeight: '700' so Inter renders correctly.
// fontWeight is ignored when an explicit fontFamily is set in React Native.
export const F = {
  regular:  'Inter_400Regular',
  semiBold: 'Inter_600SemiBold',
  bold:     'Inter_700Bold',
  xBold:    'Inter_800ExtraBold',
  mono:     'monospace',          // system mono for raw METAR / code strings
};

// ─── Typography ─────────────────────────────────────────────────────────────────
export const T = StyleSheet.create({
  screenLabel:  { color: C.textMuted,     fontFamily: F.semiBold, fontSize: 11, letterSpacing: 1.5, lineHeight: 15 },
  screenTitle:  { color: C.textPrimary,   fontFamily: F.bold,     fontSize: 24, letterSpacing: -0.5, lineHeight: 30 },
  sectionTitle: { color: C.textMuted,     fontFamily: F.bold,     fontSize: 10, letterSpacing: 2.5,  lineHeight: 14 },
  heroIcao:     { color: C.textPrimary,   fontFamily: F.xBold,    fontSize: 40, letterSpacing: -1,   lineHeight: 46 },
  heroSub:      { color: C.textMuted,     fontFamily: F.semiBold, fontSize: 10, letterSpacing: 2,    lineHeight: 14 },
  cardTitle:    { color: C.textMuted,     fontFamily: F.bold,     fontSize: 10, letterSpacing: 2.5,  lineHeight: 14 },
  label:        { color: C.textMuted,     fontFamily: F.semiBold, fontSize: 10, letterSpacing: 1.5,  lineHeight: 14 },
  value:        { color: C.textPrimary,   fontFamily: F.semiBold, fontSize: 13,                      lineHeight: 18 },
  valueLg:      { color: C.textPrimary,   fontFamily: F.bold,     fontSize: 20,                      lineHeight: 26 },
  dim:          { color: C.textDim,       fontFamily: F.regular,  fontSize: 10,                      lineHeight: 15 },
  mono:         { color: C.textSecondary, fontFamily: F.mono,     fontSize: 11,                      lineHeight: 16 },
});

// ─── Shared component styles ────────────────────────────────────────────────────
export const S = StyleSheet.create({
  // Layout
  container:    { flex: 1, backgroundColor: C.bgBase },
  scroll:       { flex: 1, backgroundColor: C.bgBase },
  padded:       { paddingHorizontal: 16 },

  // Section headers
  sectionHeader: {
    fontFamily: F.bold, color: C.textMuted,
    fontSize: 10, letterSpacing: 2.5, lineHeight: 14,
    marginTop: 24, marginBottom: 10, paddingHorizontal: 16,
  },

  // Cards
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 12, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  cardGreen: {
    backgroundColor: C.bgCard,
    borderRadius: 12, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.borderGreen,
  },
  cardGold: {
    backgroundColor: C.bgCard,
    borderRadius: 12, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.borderGold,
  },
  heroCard: {
    borderRadius: 14, padding: 20, marginHorizontal: 16,
    marginBottom: 14, borderWidth: 1,
    borderColor: C.borderGreen, backgroundColor: C.bgCard,
  },

  // Input
  inputWrap:  { marginHorizontal: 16, marginBottom: 10 },
  inputLabel: {
    fontFamily: F.semiBold, color: C.textMuted,
    fontSize: 10, letterSpacing: 1.5, lineHeight: 14, marginBottom: 6,
  },
  input: {
    fontFamily: F.regular,
    backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 12, paddingHorizontal: 14,
    color: C.textPrimary, fontSize: 14, lineHeight: 20,
  },

  // Tags
  tagRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 10 },
  tag:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                   backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  tagActive:     { borderColor: C.greenDim, backgroundColor: C.greenFaint },
  tagGold:       { borderColor: C.goldDim,  backgroundColor: C.goldFaint },
  tagText:       { fontFamily: F.semiBold, color: C.textMuted, fontSize: 11, lineHeight: 15 },
  tagTextActive: { fontFamily: F.semiBold, color: C.green,     fontSize: 11, lineHeight: 15 },
  tagTextGold:   { fontFamily: F.semiBold, color: C.gold,      fontSize: 11, lineHeight: 15 },

  // Buttons
  btnPrimary: {
    backgroundColor: C.green, borderRadius: 10, padding: 15,
    alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 16,
  },
  btnPrimaryText: {
    fontFamily: F.xBold, color: C.greenDark,
    fontSize: 14, letterSpacing: 1.5, lineHeight: 20,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 13, alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
  },
  btnSecondaryText: { fontFamily: F.semiBold, color: C.textSecondary, fontSize: 13, lineHeight: 18 },
  btnGold: {
    backgroundColor: C.goldFaint, borderWidth: 1, borderColor: C.goldDim,
    borderRadius: 10, padding: 13, alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
  },
  btnGoldText:  { fontFamily: F.bold, color: C.gold, fontSize: 13, letterSpacing: 1, lineHeight: 18 },
  btnDisabled:  { opacity: 0.4 },

  // Banners
  bannerGo: {
    borderRadius: 10, padding: 14, marginHorizontal: 16, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenDim,
  },
  bannerNogo: {
    borderRadius: 10, padding: 14, marginHorizontal: 16, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.redFaint, borderWidth: 1, borderColor: C.redDim,
  },
  bannerIcon: { fontSize: 20 },
  bannerText: { fontFamily: F.bold, color: C.textPrimary, fontSize: 13, lineHeight: 18, flex: 1 },

  // Data rows
  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dataLbl: { fontFamily: F.regular,  color: C.textMuted,    fontSize: 11, lineHeight: 16 },
  dataVal: { fontFamily: F.semiBold, color: C.textPrimary,  fontSize: 12, lineHeight: 16 },

  // Stat cluster
  statRow:  { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  stat:     { alignItems: 'center' },
  statVal:  { fontFamily: F.bold,    color: C.textPrimary, fontSize: 20, lineHeight: 26 },
  statLbl:  { fontFamily: F.semiBold, color: C.textMuted,  fontSize: 9,  letterSpacing: 1.5, lineHeight: 13, marginTop: 4 },

  // Progress bar
  barTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', flex: 1 },
  barFill:  { height: '100%', borderRadius: 3 },

  // Misc
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 10 },
  titleBlock: { paddingHorizontal: 16, paddingTop: 20, marginBottom: 6 },
});

// ─── Status helpers ─────────────────────────────────────────────────────────────
export const statusColor  = (ok) => ok ? C.green : C.red;
export const statusBg     = (ok) => ok ? C.greenFaint : C.redFaint;
export const statusBorder = (ok) => ok ? C.greenDim   : C.redDim;
