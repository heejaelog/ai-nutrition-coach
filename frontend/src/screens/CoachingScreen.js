import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

// MVP: 룰 기반 코칭 로직
function generateCoaching(user) {
  const today = { water: 1500, waterGoal: 2000, protein: 80, proteinGoal: 120, exercise: 50, exerciseGoal: 60 };
  const messages = [];

  const waterRate = today.water / today.waterGoal;
  const proteinRate = today.protein / today.proteinGoal;
  const exerciseRate = today.exercise / today.exerciseGoal;

  if (waterRate < 0.8) {
    messages.push({
      title: '💧 수분 섭취 부족',
      message: `오늘 수분 섭취가 목표의 ${Math.round(waterRate * 100)}%에 그쳤어요.`,
      reason: '운동 중 체내 수분이 부족하면 피로감과 근육 경련이 발생할 수 있어요. 남은 시간 동안 ${Math.round((today.waterGoal - today.water) / 100) * 100}ml를 더 마셔보세요.',
      tip: '🥤 물 한 컵(200ml)씩 시간마다 마시는 습관을 들여보세요.',
    });
  }

  if (proteinRate < 0.9) {
    messages.push({
      title: '🥩 단백질 섭취 필요',
      message: `오늘 단백질 섭취량이 목표(${today.proteinGoal}g)에 ${today.proteinGoal - today.protein}g 부족해요.`,
      reason: '근육 합성을 위해서는 운동 후 단백질 보충이 중요해요. 특히 운동 30분~1시간 이내 섭취가 효과적이에요.',
      tip: '🍗 닭가슴살 샐러드 또는 단백질 쉐이크로 보충해보세요.',
    });
  }

  if (exerciseRate >= 1) {
    messages.push({
      title: '🏋️ 운동 목표 달성!',
      message: `오늘 운동 목표 ${today.exerciseGoal}분을 달성했어요! 훌륭해요.`,
      reason: '꾸준한 운동 습관이 장기적인 건강 관리의 핵심이에요.',
      tip: '😴 운동 후 충분한 수면(7~8시간)으로 근육 회복을 도와주세요.',
    });
  }

  if (messages.length === 0) {
    messages.push({
      title: '✅ 오늘 컨디션 양호',
      message: '오늘 모든 목표를 잘 달성하고 있어요!',
      reason: '지금처럼 균형 잡힌 영양 섭취와 운동을 유지하면 좋은 결과를 얻을 수 있어요.',
      tip: '📊 분석 화면에서 주간 패턴을 확인해보세요.',
    });
  }

  return messages;
}

export default function CoachingScreen() {
  const { user } = useAuth();
  const coachingMessages = generateCoaching(user);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>AI 코칭 메시지</Text>
        <Text style={styles.greeting}>안녕하세요, {user?.name}님! 👋</Text>

        {coachingMessages.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>왜 그런가요?</Text>
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  greeting: { fontSize: 15, color: '#6B7280', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  message: { fontSize: 14, color: '#374151', marginBottom: 12, lineHeight: 22 },
  reasonBox: { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 10 },
  reasonLabel: { fontSize: 13, fontWeight: 'bold', color: '#15803D', marginBottom: 4 },
  reasonText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  tipBox: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12 },
  tipText: { fontSize: 13, color: '#1D4ED8', lineHeight: 20 },
});
