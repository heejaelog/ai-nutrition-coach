import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { C, card } from '../theme';

const W = Dimensions.get('window').width;

const TREND_META = {
  '증가':      { icon: 'trending-up',   color: '#16A34A' },
  '감소':      { icon: 'trending-down', color: '#DC2626' },
  '유지':      { icon: 'remove',        color: '#94A3B8' },
  '데이터 부족': { icon: null,           color: '#94A3B8' },
};

function StatChip({ icon, label, value, unit, color, bg, trend }) {
  const tm = trend ? TREND_META[trend] : null;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.chipValue, { color }]}>{value}<Text style={styles.chipUnit}>{unit}</Text></Text>
      <Text style={styles.chipLabel}>{label} 평균</Text>
      {tm && tm.icon && (
        <View style={styles.trendRow}>
          <Ionicons name={tm.icon} size={11} color={tm.color} />
          <Text style={[styles.trendText, { color: tm.color }]}>{trend}</Text>
        </View>
      )}
    </View>
  );
}

function TabBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CompareRow({ label, mine, avg, unit, color }) {
  const isAbove = mine >= avg;
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.compareValues}>
        <View style={styles.compareItem}>
          <Text style={styles.compareSmall}>나</Text>
          <Text style={[styles.compareNum, { color }]}>{mine}<Text style={styles.compareUnit}>{unit}</Text></Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isAbove ? C.mintSoft : C.dangerBg }]}>
          <Ionicons name={isAbove ? 'trending-up' : 'trending-down'} size={12} color={isAbove ? C.primary : C.danger} />
          <Text style={[styles.badgeText, { color: isAbove ? C.primary : C.danger }]}>
            {isAbove ? '+' : ''}{mine - avg}{unit}
          </Text>
        </View>
        <View style={styles.compareItem}>
          <Text style={styles.compareSmall}>평균</Text>
          <Text style={styles.compareNum}>{avg}<Text style={styles.compareUnit}>{unit}</Text></Text>
        </View>
      </View>
    </View>
  );
}

export default function AnalysisScreen() {
  const [activeTab, setActiveTab] = useState('수분');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getWeekly();
        setData(res);
      } catch (e) {
        console.error('주간 데이터 로드 실패:', e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []));

  if (loading || !data) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const dataMap = {
    수분:   { data: data.water.map((v) => v / 100 || 0.01), color: C.water,   label: '수분 (×100ml)', unit: 'ml', avg: data.avg_water, globalAvg: data.global_avg_water },
    단백질: { data: data.protein.map((v) => v || 0.01),     color: C.protein,  label: '단백질 (g)',    unit: 'g',  avg: data.avg_protein, globalAvg: data.global_avg_protein },
    근력:   { data: data.strength.map((v) => v || 0.01),    color: C.primary,  label: '근력 (분)',     unit: '분', avg: data.avg_strength, globalAvg: null },
    유산소: { data: data.cardio.map((v) => v || 0.01),      color: '#F59E0B',  label: '유산소 (분)',   unit: '분', avg: data.avg_cardio, globalAvg: null },
  };

  const current = dataMap[activeTab];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <Text style={styles.headerTitle}>주간 리포트</Text>
            <Text style={styles.headerSub}>{data.labels[0]}요일 – {data.labels[6]}요일</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 요약 칩 */}
        <View style={styles.chipRow}>
          <StatChip icon="water"     label="수분"   value={data.avg_water}    unit="ml" color={C.water}   bg={C.waterBg}    trend={data.water_trend} />
          <StatChip icon="nutrition" label="단백질" value={data.avg_protein}  unit="g"  color={C.protein} bg={C.proteinBg}  trend={data.protein_trend} />
          <StatChip icon="barbell"   label="근력"   value={data.avg_strength} unit="분" color={C.primary} bg={C.exerciseBg} trend={data.exercise_trend} />
          <StatChip icon="bicycle"   label="유산소" value={data.avg_cardio}   unit="분" color="#F59E0B"   bg="#FFFBEB"       trend={null} />
        </View>

        {/* 차트 카드 */}
        <View style={[card, { padding: 18 }]}>
          <Text style={styles.cardTitle}>나의 섭취 패턴</Text>

          <View style={styles.tabRow}>
            {['수분', '단백질', '근력', '유산소'].map((t) => (
              <TabBtn key={t} label={t} active={activeTab === t} onPress={() => setActiveTab(t)} />
            ))}
          </View>

          <LineChart
            data={{
              labels: data.labels,
              datasets: [{ data: current.data, color: () => current.color, strokeWidth: 2.5 }],
              legend: [current.label],
            }}
            width={W - 56}
            height={180}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: () => current.color,
              strokeWidth: 2,
              decimalPlaces: 0,
              propsForLabels: { fontSize: 11, fill: C.sub },
              propsForDots: { r: 4, strokeWidth: 2, stroke: current.color },
              propsForBackgroundLines: { stroke: C.border, strokeDasharray: '4' },
            }}
            bezier
            withInnerLines
            style={{ borderRadius: 12, marginLeft: -8, marginTop: 12 }}
          />
        </View>

        {/* 클러스터 비교 카드 */}
        <View style={[card, { padding: 18 }]}>
          <Text style={styles.cardTitle}>
            {data.cluster_size > 0
              ? `나와 비슷한 사용자 ${data.cluster_size}명과 비교`
              : '유사 사용자 비교'}
          </Text>
          <Text style={styles.cardSub}>{data.cluster_label}</Text>
          {data.cluster_size > 0 ? (
            <>
              <CompareRow label="수분"        mine={data.avg_water    ?? 0} avg={data.cluster_avg_water     ?? 0} unit="ml" color={C.water} />
              <CompareRow label="단백질"      mine={data.avg_protein  ?? 0} avg={data.cluster_avg_protein   ?? 0} unit="g"  color={C.protein} />
              <CompareRow label="근력 운동"   mine={data.avg_strength ?? 0} avg={data.cluster_avg_strength  ?? 0} unit="분" color={C.primary} />
              <CompareRow label="유산소 운동" mine={data.avg_cardio   ?? 0} avg={data.cluster_avg_cardio    ?? 0} unit="분" color="#F59E0B" />
            </>
          ) : (
            <Text style={styles.noClusterText}>아직 같은 그룹의 비교 데이터가 없어요.{'\n'}사용자가 늘어나면 자동으로 비교됩니다.</Text>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { backgroundColor: C.hero, paddingBottom: 22, paddingHorizontal: 22 },
  headerInner: { paddingTop: 6 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  headerSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },

  scroll: { padding: 18, paddingTop: 16 },

  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  chip: { flex: 1, borderRadius: 14, padding: 10, alignItems: 'center', gap: 3 },
  chipValue: { fontSize: 14, fontWeight: '800' },
  chipUnit: { fontSize: 11, fontWeight: '400' },
  chipLabel: { fontSize: 10, color: C.sub, fontWeight: '500' },

  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  cardSub: { fontSize: 11, color: C.muted, marginBottom: 10 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  trendText: { fontSize: 10, fontWeight: '600' },

  tabRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  tabBtn: {
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: C.bg, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  tabBtnActive: { backgroundColor: C.hero, borderColor: C.hero },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: C.sub },
  tabBtnTextActive: { color: '#fff' },

  compareRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.bg },
  compareLabel: { fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 10 },
  compareValues: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compareItem: { alignItems: 'center', flex: 1 },
  compareSmall: { fontSize: 11, color: C.muted, marginBottom: 2 },
  compareNum: { fontSize: 18, fontWeight: '800', color: C.text },
  compareUnit: { fontSize: 12, fontWeight: '400', color: C.sub },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  noClusterText: { fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: 20, lineHeight: 20 },
});
