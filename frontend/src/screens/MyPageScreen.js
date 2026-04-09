import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

function InfoRow({ label, value, unit, onPress }) {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value} {unit}</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function MyPageScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    height: '175', weight: '70', age: '25', gender: '남',
    goalType: '근육 증량', waterGoal: '2.0', proteinGoal: '120', exerciseGoal: '60',
  });

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>신체 정보</Text>
          <InfoRow label="키 (cm)" value={profile.height} unit="cm" />
          <InfoRow label="몸무게 (kg)" value={profile.weight} unit="kg" />
          <InfoRow label="나이" value={profile.age} unit="세" />
          <InfoRow label="성별" value={profile.gender} unit="" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>목표 설정</Text>
          <InfoRow label="목적" value={profile.goalType} unit="" />
          <InfoRow label="수분 목표" value={profile.waterGoal} unit="L" />
          <InfoRow label="단백질 목표" value={profile.proteinGoal} unit="g" />
          <InfoRow label="운동 목표" value={profile.exerciseGoal} unit="분/일" />
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>설정</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20 },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 36 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, elevation: 2, overflow: 'hidden' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#6B7280', padding: 16, paddingBottom: 8 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  infoLabel: { flex: 1, fontSize: 15, color: '#111827' },
  infoValue: { fontSize: 15, color: '#6B7280', marginRight: 8 },
  arrow: { fontSize: 18, color: '#D1D5DB' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  settingLabel: { flex: 1, fontSize: 15, color: '#111827' },
  logoutBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  logoutText: { color: '#DC2626', fontWeight: 'bold', fontSize: 15 },
});
