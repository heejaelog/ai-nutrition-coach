import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C, card, shadow } from '../theme';

// 스킨 적용 시 이 소스만 교체하면 됨
const TURTLE_IMG = require('../../assets/꼬부기.png');

// 원형 점수 링
function ScoreRing({ score }) {
  const size = 112;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(score / 100, 1) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation="-90" origin={`${size / 2},${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke="#4ADE80" strokeWidth={stroke} fill="none"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <Text style={styles.scoreNum}>{score}</Text>
      <Text style={styles.scoreLabel}>점</Text>
    </View>
  );
}

// 지표 카드
function MetricCard({ icon, label, value, max, unit, color, bg }) {
  const pct = Math.min(value / max, 1);
  const remaining = max - value;

  return (
    <View style={[card, styles.metricCard]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricPct}>{Math.round(pct * 100)}%</Text>
      </View>

      <View style={styles.metricBar}>
        <View style={[styles.metricFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.metricFooter}>
        <Text style={styles.metricValue}>
          <Text style={[styles.metricCurrent, { color }]}>{value}</Text>
          <Text style={styles.metricMax}> / {max}{unit}</Text>
        </Text>
        {remaining > 0 && (
          <Text style={styles.metricRemain}>{remaining}{unit} 남음</Text>
        )}
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  const today = {
    water: 1500, waterGoal: 2000,
    protein: 80, proteinGoal: 120,
    exercise: 50, exerciseGoal: 60,
  };

  const score = Math.round(
    (today.water / today.waterGoal) * 33 +
    (today.protein / today.proteinGoal) * 33 +
    (today.exercise / today.exerciseGoal) * 34
  );

  const turtleCount = 23;
  const nextSkin = 50;
  const toNext = nextSkin - turtleCount;

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });

  return (
    <View style={styles.root}>
      {/* 히어로 */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroDate}>{dateStr}</Text>
              <Text style={styles.heroGreeting}>안녕하세요,</Text>
              <Text style={styles.heroName}>{user?.name}님 👋</Text>

              <TouchableOpacity
                style={styles.turtleChip}
                onPress={() => {/* TODO: 컬렉션 화면 */}}
                activeOpacity={0.75}
              >
                <Image source={TURTLE_IMG} style={styles.turtleImg} resizeMode="contain" />
                <Text style={styles.turtleCount}>× {turtleCount}</Text>
                <View style={styles.turtleDivider} />
                <Text style={styles.turtleNext}>다음 스킨까지 {toNext}개</Text>
                <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <ScoreRing score={score} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <MetricCard
          icon="water" label="수분"
          value={today.water} max={today.waterGoal} unit="ml"
          color={C.water} bg={C.waterBg}
        />
        <MetricCard
          icon="nutrition" label="단백질"
          value={today.protein} max={today.proteinGoal} unit="g"
          color={C.protein} bg={C.proteinBg}
        />
        <MetricCard
          icon="barbell" label="운동"
          value={today.exercise} max={today.exerciseGoal} unit="분"
          color={C.primary} bg={C.exerciseBg}
        />

        {/* 기록하기 버튼 */}
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => navigation.navigate('Record')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.recordBtnText}>오늘 기록하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // 히어로
  hero: { backgroundColor: C.hero, paddingBottom: 28, paddingHorizontal: 22 },
  heroInner: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 6 },
  heroLeft: { flex: 1, marginRight: 12 },
  heroDate: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500', marginBottom: 6 },
  heroGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '400' },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 14 },

  turtleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  turtleImg: { width: 18, height: 18 },
  turtleCount: { color: '#fff', fontSize: 13, fontWeight: '700' },
  turtleDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.25)' },
  turtleNext: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500' },

  scoreNum: { color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 36 },
  scoreLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500' },

  // 지표 카드
  scroll: { padding: 18, paddingTop: 16 },
  metricCard: { padding: 16, marginBottom: 12 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metricIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  metricLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },
  metricPct: { fontSize: 14, fontWeight: '700', color: C.sub },

  metricBar: {
    height: 6, backgroundColor: C.border, borderRadius: 3,
    overflow: 'hidden', marginBottom: 10,
  },
  metricFill: { height: 6, borderRadius: 3 },

  metricFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricValue: {},
  metricCurrent: { fontSize: 16, fontWeight: '700' },
  metricMax: { fontSize: 13, color: C.muted, fontWeight: '400' },
  metricRemain: { fontSize: 12, color: C.muted },

  // 기록 버튼
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 16, marginTop: 6,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  recordBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
