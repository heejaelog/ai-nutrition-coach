import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { C, card } from '../theme';

const TURTLE_IMG = require('../../assets/꼬부기.png');
const GOALS = ['근육 증량', '체중 감량'];
const GENDERS = ['남', '여'];

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

// 숫자/텍스트 단일 편집 모달
function EditModal({ visible, title, value, unit, keyboardType = 'default', onClose, onSave }) {
  const [val, setVal] = useState(String(value ?? ''));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title} 수정</Text>
          <View style={styles.modalInputRow}>
            <TextInput
              style={styles.modalInput}
              value={val}
              onChangeText={setVal}
              keyboardType={keyboardType}
              autoFocus
            />
            {unit && <Text style={styles.modalUnit}>{unit}</Text>}
          </View>
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => onSave(val)}>
              <Text style={styles.modalSaveText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// 선택형 모달
function SelectModal({ visible, title, options, selected, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.selectItem, selected === opt && styles.selectItemActive]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.selectItemText, selected === opt && styles.selectItemTextActive]}>{opt}</Text>
              {selected === opt && <Ionicons name="checkmark" size={16} color={C.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function MyPageScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [editModal, setEditModal] = useState(null); // { field, title, value, unit, type }
  const [selectModal, setSelectModal] = useState(null); // { field, title, options }
  const [saving, setSaving] = useState(false);

  const turtleCount = user?.turtle_count ?? 0;
  const nextSkin = user?.next_skin ?? 0;

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '확인', style: 'destructive', onPress: logout },
    ]);
  };

  const saveField = async (field, rawVal) => {
    try {
      setSaving(true);
      const isNum = ['height', 'weight', 'age', 'water_goal', 'protein_goal', 'strength_goal', 'cardio_goal'].includes(field);
      const value = isNum ? (field === 'height' || field === 'weight' ? parseFloat(rawVal) : parseInt(rawVal)) : rawVal;
      if (isNum && isNaN(value)) { Alert.alert('알림', '올바른 숫자를 입력해주세요.'); return; }
      const updated = await api.updateMe({ [field]: value });
      updateUser(updated);
      setEditModal(null);
      setSelectModal(null);
    } catch (e) {
      Alert.alert('저장 실패', e.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (field, title, value, unit, keyboardType = 'numeric') => {
    setEditModal({ field, title, value, unit, keyboardType });
  };

  const openSelect = (field, title, options) => {
    setSelectModal({ field, title, options });
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <View style={styles.avatarWrap}>
              <Image source={TURTLE_IMG} style={styles.avatarImg} resizeMode="contain" />
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userId}>ID: {user?.id}</Text>

            <View style={styles.turtleBar}>
              <View style={styles.turtleStat}>
                <Text style={styles.turtleStatNum}>{turtleCount}</Text>
                <Text style={styles.turtleStatLabel}>보유 거북이</Text>
              </View>
              <View style={styles.turtleStatDivider} />
              <View style={styles.turtleStat}>
                <Text style={styles.turtleStatNum}>{Math.max(nextSkin - turtleCount, 0)}</Text>
                <Text style={styles.turtleStatLabel}>다음 스킨까지</Text>
              </View>
              <View style={styles.turtleStatDivider} />
              <View style={styles.turtleStat}>
                <Text style={styles.turtleStatNum}>{user?.owned_skin_count ?? 0}</Text>
                <Text style={styles.turtleStatLabel}>보유 스킨</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <SectionLabel label="신체 정보" />
        <View style={[card, { padding: 0, overflow: 'hidden' }]}>
          <Row icon="body-outline" label="키" value={`${user?.height ?? '-'} cm`}
            onPress={() => openEdit('height', '키', user?.height, 'cm', 'decimal-pad')} />
          <Row icon="scale-outline" label="몸무게" value={`${user?.weight ?? '-'} kg`}
            onPress={() => openEdit('weight', '몸무게', user?.weight, 'kg', 'decimal-pad')} />
          <Row icon="calendar-outline" label="나이" value={`${user?.age ?? '-'} 세`}
            onPress={() => openEdit('age', '나이', user?.age, '세', 'numeric')} />
          <Row icon="person-outline" label="성별" value={user?.gender ?? '-'}
            onPress={() => openSelect('gender', '성별 선택', GENDERS)} />
        </View>

        <SectionLabel label="목표 설정" />
        <View style={[card, { padding: 0, overflow: 'hidden' }]}>
          <Row icon="trophy-outline" label="목표" value={user?.goal ?? '-'}
            onPress={() => openSelect('goal', '목표 선택', GOALS)} />
          <Row icon="water-outline" label="수분 목표" value={`${((user?.water_goal ?? 0) / 1000).toFixed(1)} L`}
            onPress={() => openEdit('water_goal', '수분 목표', user?.water_goal, 'ml', 'numeric')} />
          <Row icon="nutrition-outline" label="단백질 목표" value={`${user?.protein_goal ?? '-'} g`}
            onPress={() => openEdit('protein_goal', '단백질 목표', user?.protein_goal, 'g', 'numeric')} />
          <Row icon="barbell-outline" label="근력 운동 목표" value={`${user?.strength_goal ?? '-'} 분/일`}
            onPress={() => openEdit('strength_goal', '근력 운동 목표', user?.strength_goal, '분', 'numeric')} />
          <Row icon="bicycle-outline" label="유산소 목표" value={`${user?.cardio_goal ?? '-'} 분/일`}
            onPress={() => openEdit('cardio_goal', '유산소 목표', user?.cardio_goal, '분', 'numeric')} />
        </View>

        <SectionLabel label="스킨" />
        <View style={[card, { padding: 0, overflow: 'hidden' }]}>
          <Row
            icon="sparkles-outline"
            label="스킨 상점"
            value={user?.equipped_skin_id ? '장착 중' : '없음'}
            onPress={() => navigation.navigate('SkinShop')}
          />
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

      {/* 편집 모달 */}
      {editModal && (
        <EditModal
          visible={true}
          title={editModal.title}
          value={editModal.value}
          unit={editModal.unit}
          keyboardType={editModal.keyboardType}
          onClose={() => setEditModal(null)}
          onSave={(val) => saveField(editModal.field, val)}
        />
      )}

      {/* 선택 모달 */}
      {selectModal && (
        <SelectModal
          visible={true}
          title={selectModal.title}
          options={selectModal.options}
          selected={user?.[selectModal.field]}
          onClose={() => setSelectModal(null)}
          onSelect={(val) => saveField(selectModal.field, val)}
        />
      )}
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
  userEmail: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 4 },
  userId: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 20 },

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

  // 모달
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, width: '100%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  modalInput: {
    flex: 1, borderWidth: 1.5, borderColor: C.primary,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, fontWeight: '700', color: C.text,
  },
  modalUnit: { fontSize: 15, color: C.sub, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: C.sub, fontWeight: '600' },
  modalSaveBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center',
  },
  modalSaveText: { fontSize: 15, color: '#fff', fontWeight: '700' },

  selectItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.bg,
  },
  selectItemActive: { },
  selectItemText: { fontSize: 15, color: C.text },
  selectItemTextActive: { color: C.primary, fontWeight: '700' },
});
