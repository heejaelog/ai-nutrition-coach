import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C, card } from '../theme';

// 스킨 적용 시 이 소스만 교체하면 됨
const TURTLE_IMG = require('../../assets/꼬부기.png');

function Row({ icon, label, value, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.65}>
      <Ionicons name={icon} size={18} color={danger ? C.danger : C.sub} style={{ marginRight: 12 }} />
      <Text style={[styles.rowLabel, danger && { color: C.danger }]}>{label}</Text>
      {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={15} color={C.border} />
    </TouchableOpacity>
  );
}

function SectionLabel({ label }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export default function MyPageScreen() {
  const { user, logout } = useAuth();

  const turtleCount = 23;
  const nextSkin = 50;

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '확인', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* 상단 프로필 */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <View style={styles.avatarWrap}>
              <Image source={TURTLE_IMG} style={styles.avatarImg} resizeMode="contain" />
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            {/* 거북이 현황 */}
            <View style={styles.turtleBar}>
              <View style={styles.turtleStat}>
                <Text style={styles.turtleStatNum}>{turtleCount}</Text>
                <Text style={styles.turtleStatLabel}>보유 거북이</Text>
              </View>
              <View style={styles.turtleStatDivider} />
              <View style={styles.turtleStat}>
                <Text style={styles.turtleStatNum}>{nextSkin - turtleCount}</Text>
                <Text style={styles.turtleStatLabel}>다음 스킨까지</Text>
              </View>
              <View style={styles.turtleStatDivider} />
              <View style={styles.turtleStat}>
                <Text style={styles.turtleStatNum}>0</Text>
                <Text style={styles.turtleStatLabel}>보유 스킨</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <SectionLabel label="신체 정보" />
        <View style={[card, { padding: 0, overflow: 'hidden' }]}>
          <Row icon="body-outline" label="키" value="175 cm" />
          <Row icon="scale-outline" label="몸무게" value="70 kg" />
          <Row icon="calendar-outline" label="나이" value="25 세" />
          <Row icon="person-outline" label="성별" value="남" />
        </View>

        <SectionLabel label="목표 설정" />
        <View style={[card, { padding: 0, overflow: 'hidden' }]}>
          <Row icon="trophy-outline" label="목표" value="근육 증량" />
          <Row icon="water-outline" label="수분 목표" value="2.0 L" />
          <Row icon="nutrition-outline" label="단백질 목표" value="120 g" />
          <Row icon="barbell-outline" label="운동 목표" value="60 분/일" />
        </View>

        <SectionLabel label="앱 설정" />
        <View style={[card, { padding: 0, overflow: 'hidden' }]}>
          <Row icon="notifications-outline" label="알림 설정" />
          <Row icon="shield-checkmark-outline" label="개인정보 처리방침" />
          <Row icon="information-circle-outline" label="앱 버전" value="1.0.0" />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={18} color={C.danger} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: { backgroundColor: C.hero, paddingBottom: 24 },
  heroInner: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarImg: { width: 56, height: 56 },
  userName: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  userEmail: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 20 },

  turtleBar: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20,
    width: '100%', justifyContent: 'space-around',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  turtleStat: { alignItems: 'center', flex: 1 },
  turtleStatNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  turtleStatLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 2, fontWeight: '500' },
  turtleStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  scroll: { padding: 18, paddingTop: 12 },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: C.sub,
    letterSpacing: 0.5, marginBottom: 8, marginTop: 8, paddingHorizontal: 4,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: C.bg,
  },
  rowLabel: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  rowValue: { fontSize: 14, color: C.sub, marginRight: 8 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.dangerBg, borderRadius: 14,
    paddingVertical: 15, marginTop: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { color: C.danger, fontWeight: '700', fontSize: 15 },
});
