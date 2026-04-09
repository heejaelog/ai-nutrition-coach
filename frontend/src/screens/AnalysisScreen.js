import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width - 40;

// MVP: 임시 데이터
const weeklyData = {
  labels: ['1일', '2일', '3일', '4일', '5일', '6일', '7일'],
  water: [1200, 1500, 1800, 1400, 2000, 1600, 1500],
  protein: [70, 80, 90, 75, 110, 85, 80],
  exercise: [30, 50, 60, 40, 60, 55, 50],
};

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
  propsForLabels: { fontSize: 11 },
};

export default function AnalysisScreen() {
  const navigation = useNavigation();

  const myAvg = {
    water: Math.round(weeklyData.water.reduce((a, b) => a + b) / 7),
    protein: Math.round(weeklyData.protein.reduce((a, b) => a + b) / 7),
  };
  const avgUser = { water: 1300, protein: 65 };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>주간 분석 리포트</Text>
        <Text style={styles.period}>기간: 4/1 ~ 4/7 (주간)</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>나의 섭취 패턴</Text>
          <LineChart
            data={{
              labels: weeklyData.labels,
              datasets: [
                { data: weeklyData.water.map((v) => v / 10), color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`, strokeWidth: 2 },
                { data: weeklyData.protein, color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`, strokeWidth: 2 },
                { data: weeklyData.exercise, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, strokeWidth: 2 },
              ],
              legend: ['수분(x10)', '단백질', '운동'],
            }}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>평균 사용자 비교</Text>
          <BarChart
            data={{
              labels: ['수분(ml)', '단백질(g)'],
              datasets: [{ data: [myAvg.water, myAvg.protein] }],
            }}
            width={screenWidth}
            height={180}
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})` }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>나</Text>
              <Text style={styles.compareValue}>{myAvg.water}ml / {myAvg.protein}g</Text>
            </View>
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>평균 사용자</Text>
              <Text style={styles.compareValue}>{avgUser.water}ml / {avgUser.protein}g</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.coachingBtn}
          onPress={() => navigation.navigate('Coaching')}
        >
          <Text style={styles.coachingBtnText}>💬 코칭 메시지 보기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  period: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  chart: { borderRadius: 12, marginLeft: -10 },
  compareRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  compareItem: { alignItems: 'center' },
  compareLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  compareValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  coachingBtn: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center' },
  coachingBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
