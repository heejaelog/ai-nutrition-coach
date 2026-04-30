import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { C, card } from '../theme';

const TURTLE_IMG = require('../../assets/꼬부기.png');

function MetricRow({ icon, label, value, max, unit, color, bg }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={styles.metricRow}>
      <View style={[styles.metricIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={[styles.metricValue, { color }]}>
            {value}<Text style={styles.metricMax}> / {max}{unit}</Text>
          </Text>
        </View>
        <View style={styles.metricBarBg}>
          <View style={[styles.metricBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

export default function FriendProfileScreen({ route }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getFriendProfile(userId);
        setProfile(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.danger }}>{error || '데이터를 불러올 수 없습니다.'}</Text>
      </View>
    );
  }

  const totalExercise = profile.strength_min + profile.cardio_min;
  const totalExerciseGoal = profile.strength_goal + profile.cardio_goal;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 프로필 헤더 */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Image source={TURTLE_IMG} style={styles.avatarImg} resizeMode="contain" />
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.profileMeta}>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>{profile.goal}</Text>
            </View>
            {profile.equipped_skin_name && (
              <View style={styles.skinBadge}>
                <Ionicons name="sparkles" size={11} color={C.primary} />
                <Text style={styles.skinBadgeText}>{profile.equipped_skin_name}</Text>
              </View>
            )}
          </View>
          <View style={styles.turtleRow}>
            <Image source={TURTLE_IMG} style={{ width: 16, height: 16 }} resizeMode="contain" />
            <Text style={styles.turtleCount}>× {profile.turtle_count}</Text>
          </View>
        </View>

        {/* 오늘 달성률 */}
        <View style={[card, styles.scoreCard]}>
          <Text style={styles.scoreCardTitle}>오늘의 달성률</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNum}>{profile.score}</Text>
            <Text style={styles.scoreSuffix}>점</Text>
          </View>
          <View style={styles.scoreBg}>
            <View style={[styles.scoreFill, { width: `${profile.score}%` }]} />
          </View>
        </View>

        {/* 수분 / 단백질 / 운동 */}
        <View style={card}>
          <Text style={styles.sectionTitle}>오늘 기록</Text>
          <MetricRow
            icon="water" label="수분"
            value={profile.water_ml} max={profile.water_goal} unit="ml"
            color={C.water} bg={C.waterBg}
          />
          <MetricRow
            icon="nutrition" label="단백질"
            value={profile.protein_g} max={profile.protein_goal} unit="g"
            color={C.protein} bg={C.proteinBg}
          />
          <MetricRow
            icon="barbell" label="근력 운동"
            value={profile.strength_min} max={profile.strength_goal} unit="분"
            color={C.primary} bg={C.exerciseBg}
          />
          <MetricRow
            icon="bicycle" label="유산소 운동"
            value={profile.cardio_min} max={profile.cardio_goal} unit="분"
            color="#F59E0B" bg="#FFFBEB"
          />
        </View>

        {/* 총 운동 요약 */}
        <View style={[card, { padding: 16 }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{profile.water_ml}</Text>
              <Text style={styles.summaryLabel}>수분(ml)</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{profile.protein_g}</Text>
              <Text style={styles.summaryLabel}>단백질(g)</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalExercise}</Text>
              <Text style={styles.summaryLabel}>운동(분)</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 18, paddingTop: 16 },

  profileHeader: { alignItems: 'center', paddingVertical: 20, marginBottom: 6 },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.mintSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3, borderColor: C.primary,
  },
  avatarImg: { width: 60, height: 60 },
  profileName: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8 },
  profileMeta: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  goalBadge: {
    backgroundColor: C.mintSoft, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  goalBadgeText: { color: C.primary, fontSize: 12, fontWeight: '700' },
  skinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF7ED', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  skinBadgeText: { color: C.protein, fontSize: 12, fontWeight: '700' },
  turtleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  turtleCount: { fontSize: 14, fontWeight: '700', color: C.sub },

  scoreCard: { alignItems: 'center', padding: 24, marginBottom: 14 },
  scoreCardTitle: { fontSize: 14, fontWeight: '700', color: C.sub, marginBottom: 16 },
  scoreCircle: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  scoreNum: { fontSize: 56, fontWeight: '900', color: C.primary, lineHeight: 60 },
  scoreSuffix: { fontSize: 20, fontWeight: '500', color: C.sub, marginBottom: 8 },
  scoreBg: {
    width: '100%', height: 8, backgroundColor: C.border,
    borderRadius: 4, overflow: 'hidden',
  },
  scoreFill: { height: 8, backgroundColor: C.primary, borderRadius: 4 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 16 },

  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metricContent: { flex: 1 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metricLabel: { fontSize: 13, fontWeight: '600', color: C.sub },
  metricValue: { fontSize: 13, fontWeight: '700' },
  metricMax: { fontSize: 11, fontWeight: '400', color: C.muted },
  metricBarBg: { height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  metricBarFill: { height: 5, borderRadius: 3 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryNum: { fontSize: 22, fontWeight: '800', color: C.text },
  summaryLabel: { fontSize: 11, color: C.muted, marginTop: 4 },
  summaryDivider: { width: 1, height: 36, backgroundColor: C.border },
});
