import { StyleSheet, Dimensions } from 'react-native';
 
export const SCREEN_W = Dimensions.get('window').width;
 
// ─── Color palette ────────────────────────────────────────────────────────────
export const C = {
  // Backgrounds
  bgBase:        '#13112A',   // deep purple-navy base
  bgCard:        '#1C1A35',   // slightly lighter card surface
  bgCardAlt:     '#191730',   // alternate card bg
  bgInput:       '#0F0E22',   // input field background
  bgDark:        '#0D0C1F',   // darkest surface
 
  // Gradients (used as inline LinearGradient props)
  gradGreen:     ['#50DC8C22', '#1D6B4408'],
  gradPurple:    ['#9664FF22', '#5032B408'],
  gradBlue:      ['#4AA0FF22', '#1850A408'],
  gradGold:      ['#FFD70022', '#A88000  08'],
 
  // Accent colors
  green:         '#50DC8C',
  greenDim:      '#50DC8C55',
  greenFaint:    '#50DC8C18',
  blue:          '#78AAFF',
  blueDim:       '#78AAFF55',
  blueFaint:     '#78AAFF18',
  purple:        '#C896FF',
  purpleDim:     '#C896FF55',
  purpleFaint:   '#C896FF18',
  gold:          '#FFD770',
  goldDim:       '#FFD77055',
  goldFaint:     '#FFD77018',
  red:           '#FF6060',
  redDim:        '#FF606055',
  redFaint:      '#FF606018',
  cyan:          '#00D4FF',
  cyanDim:       '#00D4FF55',
  cyanFaint:     '#00D4FF18',
 
  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#8899BB',
  textMuted:     '#445566',
  textDim:       '#2A3A4A',
 
  // Borders
  border:        'rgba(255,255,255,0.08)',
  borderMed:     'rgba(255,255,255,0.13)',
  borderGreen:   'rgba(80,220,140,0.25)',
  borderPurple:  'rgba(200,150,255,0.25)',
  borderBlue:    'rgba(120,170,255,0.25)',
  borderGold:    'rgba(255,215,112,0.25)',
};
 
// ─── Typography ───────────────────────────────────────────────────────────────
export const T = StyleSheet.create({
  screenLabel:  { color: C.textMuted,     fontSize: 11, letterSpacing: 1.5 },
  screenTitle:  { color: C.textPrimary,   fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  sectionTitle: { color: C.textMuted,     fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },
  heroIcao:     { color: C.textPrimary,   fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  heroSub:      { color: C.textMuted,     fontSize: 10, letterSpacing: 2 },
  cardTitle:    { color: C.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },
  label:        { color: C.textMuted,     fontSize: 10, letterSpacing: 1.5 },
  value:        { color: C.textPrimary,   fontSize: 13, fontWeight: '600' },
  valueLg:      { color: C.textPrimary,   fontSize: 20, fontWeight: '700' },
  dim:          { color: C.textDim,       fontSize: 10 },
  mono:         { color: C.textSecondary, fontSize: 11, fontFamily: 'monospace' },
});
 
// ─── Shared component styles ─────────────────────────────────────────────────
export const S = StyleSheet.create({
  // Layout
  container:    { flex: 1, backgroundColor: C.bgBase },
  scroll:       { flex: 1, backgroundColor: C.bgBase },
  padded:       { paddingHorizontal: 16 },
 
  // Section headers
  sectionHeader: {
    color: C.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 2.5, marginTop: 24, marginBottom: 10,
    paddingHorizontal: 16,
  },
 
  // Cards
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 18, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  cardGreen: {
    backgroundColor: C.bgCard,
    borderRadius: 18, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.borderGreen,
  },
  cardPurple: {
    backgroundColor: C.bgCard,
    borderRadius: 18, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.borderPurple,
  },
  cardGold: {
    backgroundColor: C.bgCard,
    borderRadius: 18, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.borderGold,
  },
 
  // Hero route card
  heroCard: {
    borderRadius: 22, padding: 20, marginHorizontal: 16,
    marginBottom: 14, borderWidth: 1,
    borderColor: 'rgba(80,220,140,0.2)',
    backgroundColor: '#1A2A22',
  },
 
  // Input field
  inputWrap: { marginHorizontal: 16, marginBottom: 10 },
  inputLabel: {
    color: C.textMuted, fontSize: 10, letterSpacing: 1.5,
    marginBottom: 6, fontWeight: '600',
  },
  input: {
    backgroundColor: C.bgInput,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 12, paddingHorizontal: 14,
    color: C.textPrimary, fontSize: 14,
  },
 
  // Pill tags
  tagRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 10 },
  tag:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
               backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  tagActive: { borderColor: C.greenDim, backgroundColor: C.greenFaint },
  tagGold:   { borderColor: C.goldDim,  backgroundColor: C.goldFaint },
  tagBlue:   { borderColor: C.blueDim,  backgroundColor: C.blueFaint },
  tagText:      { color: C.textMuted,   fontSize: 11, fontWeight: '600' },
  tagTextActive:{ color: C.green,       fontSize: 11, fontWeight: '600' },
  tagTextGold:  { color: C.gold,        fontSize: 11, fontWeight: '600' },
  tagTextBlue:  { color: C.blue,        fontSize: 11, fontWeight: '600' },
 
  // Primary button
  btnPrimary: {
    backgroundColor: C.green,
    borderRadius: 100, padding: 15,
    alignItems: 'center', marginHorizontal: 16,
    marginTop: 8, marginBottom: 16,
  },
  btnPrimaryText: {
    color: '#0A1F14', fontSize: 14,
    fontWeight: '800', letterSpacing: 1.5,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 100, padding: 13,
    alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
  },
  btnSecondaryText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  btnGold: {
    backgroundColor: C.goldFaint,
    borderWidth: 1, borderColor: C.goldDim,
    borderRadius: 100, padding: 13,
    alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
  },
  btnGoldText: { color: C.gold, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  btnDisabled: { opacity: 0.4 },
 
  // Banners
  bannerGo: {
    borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenDim,
  },
  bannerNogo: {
    borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.redFaint, borderWidth: 1, borderColor: C.redDim,
  },
  bannerIcon: { fontSize: 20 },
  bannerText: { color: C.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 },
 
  // Data rows inside cards
  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dataLbl: { color: C.textMuted,    fontSize: 11 },
  dataVal: { color: C.textPrimary,  fontSize: 12, fontWeight: '600' },
 
  // Stat cluster
  statRow:  { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  stat:     { alignItems: 'center' },
  statVal:  { color: C.textPrimary,   fontSize: 20, fontWeight: '700' },
  statLbl:  { color: C.textMuted,     fontSize: 9,  letterSpacing: 1.5, marginTop: 4 },
 
  // Progress bar
  barTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.07)',
              borderRadius: 3, overflow: 'hidden', flex: 1 },
  barFill:  { height: '100%', borderRadius: 3 },
 
  // Divider
  divider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.05)',
              marginVertical: 10 },
 
  // Screen title block
  titleBlock: { paddingHorizontal: 16, paddingTop: 20, marginBottom: 6 },
});
 
// ─── Status badge helper ──────────────────────────────────────────────────────
export const statusColor = (ok) => ok ? C.green : C.red;
export const statusBg    = (ok) => ok ? C.greenFaint : C.redFaint;
export const statusBorder = (ok) => ok ? C.greenDim : C.redDim;
 