import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

function ProgressBar({ value, max, color }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  // MVP: 임시 데이터 (백엔드 연동 전)
  const today = {
    water: 1500, waterGoal: 2000,
    protein: 80, proteinGoal: 120,
    exercise: 50, exerciseGoal: 60,
  };

  const score = Math.round(
    ((today.water / today.waterGoal) * 33 +
      (today.protein / today.proteinGoal) * 33 +
      (today.exercise / today.exerciseGoal) * 34)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>안녕하세요, {user?.name}님! 👋</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>오늘의 건강 점수</Text>
          <Text style={styles.scoreValue}>{score}점</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘의 요약</Text>

          <View style={styles.item}>
            <Text style={styles.itemIcon}>💧</Text>
            <View style={styles.itemContent}>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>수분 (ml)</Text>
                <Text style={styles.itemValue}>{today.water / 1000}L / {today.waterGoal / 1000}L</Text>
                <Text style={styles.itemPercent}>{Math.round((today.water / today.waterGoal) * 100)}%</Text>
              </View>
              <ProgressBar value={today.water} max={today.waterGoal} color="#60A5FA" />
            </View>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemIcon}>🥩</Text>
            <View style={styles.itemContent}>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>단백질 (g)</Text>
                <Text style={styles.itemValue}>{today.protein}g / {today.proteinGoal}g</Text>
                <Text style={styles.itemPercent}>{Math.round((today.protein / today.proteinGoal) * 100)}%</Text>
              </View>
              <ProgressBar value={today.protein} max={today.proteinGoal} color="#F97316" />
            </View>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemIcon}>🏋️</Text>
            <View style={styles.itemContent}>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>운동 (분)</Text>
                <Text style={styles.itemValue}>{today.exercise}분 / {today.exerciseGoal}분</Text>
                <Text style={styles.itemPercent}>{Math.round((today.exercise / today.exerciseGoal) * 100)}%</Text>
              </View>
              <ProgressBar value={today.exercise} max={today.exerciseGoal} color="#10B981" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.coachingBtn}
          onPress={() => navigation.navigate('Coaching')}
        >
          <Text style={styles.coachingBtnText}>📋 분석 및 코칭 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => navigation.navigate('Record')}
        >
          <Text style={styles.recordBtnText}>+ 오늘 기록하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  scoreCard: {
    backgroundColor: '#3B82F6', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  scoreLabel: { color: '#BFDBFE', fontSize: 14, marginBottom: 4 },
  scoreValue: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  itemIcon: { fontSize: 24, marginRight: 12 },
  itemContent: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemLabel: { flex: 1, fontSize: 14, color: '#374151' },
  itemValue: { fontSize: 13, color: '#6B7280', marginRight: 8 },
  itemPercent: { fontSize: 13, fontWeight: 'bold', color: '#374151', width: 36, textAlign: 'right' },
  progressBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  coachingBtn: {
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12,
  },
  coachingBtnText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
  recordBtn: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center' },
  recordBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
