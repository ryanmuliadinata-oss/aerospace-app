import { StyleSheet, Dimensions } from 'react-native';

export const SCREEN_W = Dimensions.get('window').width;

// ─── Color palette ─────────────────────────────────────────────────────────────
// One accent (green). No gradients. No glassmorphism. No purple or blue.
export const C = {
  // Backgrounds — plain charcoal, no color cast
  bgBase:        '#111318',
  bgCard:        '#1A1D26',
  bgCardAlt:     '#161920',
  bgInput:       '#0D0F14',
  bgDark:        '#0B0D11',

  // Accent
  green:         '#50DC8C',
  greenDim:      '#50DC8C55',
  greenFaint:    '#50DC8C12',
  greenDark:     '#0A1F14',   // text color on green button backgrounds

  // Gold — warnings, paid tier
  gold:          '#F0C060',
  goldDim:       '#F0C06055',
  goldFaint:     '#F0C06012',

  // Red — errors, no-go states
  red:           '#E05252',
  redDim:        '#E0525255',
  redFaint:      '#E0525212',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#8A9BB0',
  textMuted:     '#4A5568',
  textDim:       '#2D3748',

  // Borders
  border:        'rgba(255,255,255,0.06)',
  borderMed:     'rgba(255,255,255,0.10)',
  borderGreen:   'rgba(80,220,140,0.20)',
  borderGold:    'rgba(240,192,96,0.20)',
  borderRed:     'rgba(224,82,82,0.20)',
};

// ─── Typography ─────────────────────────────────────────────────────────────────
export const T = StyleSheet.create({
  screenLabel:  { color: C.textMuted,     fontSize: 11, letterSpacing: 1.5 },
  screenTitle:  { color: C.textPrimary,   fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  sectionTitle: { color: C.textMuted,     fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },
  heroIcao:     { color: C.textPrimary,   fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  heroSub:      { color: C.textMuted,     fontSize: 10, letterSpacing: 2 },
  cardTitle:    { color: C.textMuted,     fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },
  label:        { color: C.textMuted,     fontSize: 10, letterSpacing: 1.5 },
  value:        { color: C.textPrimary,   fontSize: 13, fontWeight: '600' },
  valueLg:      { color: C.textPrimary,   fontSize: 20, fontWeight: '700' },
  dim:          { color: C.textDim,       fontSize: 10 },
  mono:         { color: C.textSecondary, fontSize: 11, fontFamily: 'monospace' },
});

// ─── Shared component styles ────────────────────────────────────────────────────
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

  // Cards — flat, consistent radius
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

  // Hero route card
  heroCard: {
    borderRadius: 14, padding: 20, marginHorizontal: 16,
    marginBottom: 14, borderWidth: 1,
    borderColor: C.borderGreen,
    backgroundColor: C.bgCard,
  },

  // Input field
  inputWrap:  { marginHorizontal: 16, marginBottom: 10 },
  inputLabel: {
    color: C.textMuted, fontSize: 10, letterSpacing: 1.5,
    marginBottom: 6, fontWeight: '600',
  },
  input: {
    backgroundColor: C.bgInput,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 12, paddingHorizontal: 14,
    color: C.textPrimary, fontSize: 14,
  },

  // Pill tags
  tagRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 10 },
  tag:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                   backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  tagActive:     { borderColor: C.greenDim,  backgroundColor: C.greenFaint },
  tagGold:       { borderColor: C.goldDim,   backgroundColor: C.goldFaint },
  tagText:       { color: C.textMuted,  fontSize: 11, fontWeight: '600' },
  tagTextActive: { color: C.green,      fontSize: 11, fontWeight: '600' },
  tagTextGold:   { color: C.gold,       fontSize: 11, fontWeight: '600' },

  // Primary button
  btnPrimary: {
    backgroundColor: C.green,
    borderRadius: 10, padding: 15,
    alignItems: 'center', marginHorizontal: 16,
    marginTop: 8, marginBottom: 16,
  },
  btnPrimaryText: {
    color: C.greenDark, fontSize: 14,
    fontWeight: '800', letterSpacing: 1.5,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 13,
    alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
  },
  btnSecondaryText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  btnGold: {
    backgroundColor: C.goldFaint,
    borderWidth: 1, borderColor: C.goldDim,
    borderRadius: 10, padding: 13,
    alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
  },
  btnGoldText: { color: C.gold, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  btnDisabled: { opacity: 0.4 },

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
  bannerText: { color: C.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 },

  // Data rows inside cards
  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dataLbl: { color: C.textMuted,   fontSize: 11 },
  dataVal: { color: C.textPrimary, fontSize: 12, fontWeight: '600' },

  // Stat cluster
  statRow:  { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  stat:     { alignItems: 'center' },
  statVal:  { color: C.textPrimary, fontSize: 20, fontWeight: '700' },
  statLbl:  { color: C.textMuted,   fontSize: 9,  letterSpacing: 1.5, marginTop: 4 },

  // Progress bar
  barTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 3, overflow: 'hidden', flex: 1 },
  barFill:  { height: '100%', borderRadius: 3 },

  // Divider
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 10 },

  // Screen title block
  titleBlock: { paddingHorizontal: 16, paddingTop: 20, marginBottom: 6 },
});

// ─── Status helpers ─────────────────────────────────────────────────────────────
export const statusColor  = (ok) => ok ? C.green : C.red;
export const statusBg     = (ok) => ok ? C.greenFaint : C.redFaint;
export const statusBorder = (ok) => ok ? C.greenDim   : C.redDim;
