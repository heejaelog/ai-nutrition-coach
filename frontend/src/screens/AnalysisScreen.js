import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { C, card } from '../theme';

const W = Dimensions.get('window').width;

const weeklyData = {
  labels: ['월', '화', '수', '목', '금', '토', '일'],
  water:    [1200, 1500, 1800, 1400, 2000, 1600, 1500],
  protein:  [70,   80,   90,   75,   110,  85,   80],
  exercise: [30,   50,   60,   40,   60,   55,   50],
};

const avg = (arr) => Math.round(arr.reduce((a, b) => a + b) / arr.length);

function StatChip({ icon, label, value, unit, color, bg }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.chipValue, { color }]}>{value}<Text style={styles.chipUnit}>{unit}</Text></Text>
      <Text style={styles.chipLabel}>{label} 평균</Text>
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

export default function AnalysisScreen() {
  const [activeTab, setActiveTab] = useState('수분');

  const dataMap = {
    수분:   { data: weeklyData.water.map((v) => v / 100), color: C.water,   label: '수분 (×100ml)', unit: 'ml' },
    단백질: { data: weeklyData.protein,                   color: C.protein,  label: '단백질 (g)',    unit: 'g' },
    운동:   { data: weeklyData.exercise,                  color: C.primary,  label: '운동 (분)',     unit: '분' },
  };

  const current = dataMap[activeTab];
  const myAvg = { water: avg(weeklyData.water), protein: avg(weeklyData.protein) };
  const avgUser = { water: 1300, protein: 65 };

  return (
    <View style={styles.root}>
      {/* 헤더 */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <Text style={styles.headerTitle}>주간 리포트</Text>
            <Text style={styles.headerSub}>4월 1일 – 7일</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 요약 칩 */}
        <View style={styles.chipRow}>
          <StatChip icon="water"    label="수분"   value={myAvg.water}   unit="ml" color={C.water}   bg={C.waterBg} />
          <StatChip icon="nutrition" label="단백질" value={myAvg.protein} unit="g"  color={C.protein} bg={C.proteinBg} />
          <StatChip icon="barbell"  label="운동"   value={avg(weeklyData.exercise)} unit="분" color={C.primary} bg={C.exerciseBg} />
        </View>

        {/* 차트 카드 */}
        <View style={[card, { padding: 18 }]}>
          <Text style={styles.cardTitle}>나의 섭취 패턴</Text>

          {/* 탭 */}
          <View style={styles.tabRow}>
            {['수분', '단백질', '운동'].map((t) => (
              <TabBtn key={t} label={t} active={activeTab === t} onPress={() => setActiveTab(t)} />
            ))}
          </View>

          <LineChart
            data={{
              labels: weeklyData.labels,
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

        {/* 평균 비교 카드 */}
        <View style={[card, { padding: 18 }]}>
          <Text style={styles.cardTitle}>평균 사용자와 비교</Text>

          <CompareRow label="수분" mine={myAvg.water} avg={avgUser.water} unit="ml" color={C.water} />
          <CompareRow label="단백질" mine={myAvg.protein} avg={avgUser.protein} unit="g" color={C.protein} />
        </View>

      </ScrollView>
    </View>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { backgroundColor: C.hero, paddingBottom: 22, paddingHorizontal: 22 },
  headerInner: { paddingTop: 6 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  headerSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },

  scroll: { padding: 18, paddingTop: 16 },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  chipValue: { fontSize: 16, fontWeight: '800' },
  chipUnit: { fontSize: 11, fontWeight: '400' },
  chipLabel: { fontSize: 10, color: C.sub, fontWeight: '500' },

  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },

  tabRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: C.bg, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  tabBtnActive: { backgroundColor: C.hero, borderColor: C.hero },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: C.sub },
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
});
