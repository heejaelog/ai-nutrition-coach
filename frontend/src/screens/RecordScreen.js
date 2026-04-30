import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, FlatList, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { C, card } from '../theme';

const TURTLE_IMG = require('../../assets/꼬부기.png');

const STRENGTH_TYPES = ['웨이트', '바벨', '머신', '맨몸운동', '크로스핏', '기타'];
const CARDIO_TYPES = ['러닝', '사이클', '수영', '걷기', '줄넘기', '기타'];

function SectionCard({ iconName, title, color, bg, children }) {
  return (
    <View style={[card, { padding: 18, marginBottom: 12 }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconBox, { backgroundColor: bg }]}>
          <Ionicons name={iconName} size={18} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function QuickBtn({ label, onPress, color }) {
  return (
    <TouchableOpacity
      style={[styles.quickBtn, { borderColor: color + '40', backgroundColor: color + '12' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.quickBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ExerciseSection({ iconName, title, color, bg, types, minVal, setMin, kcalVal, setKcal, typeVal, setType }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <SectionCard iconName={iconName} title={title} color={color} bg={bg}>
      <View style={styles.exerciseRow}>
        <View style={styles.exerciseCol}>
          <Text style={styles.inputLabel}>시간 (분)</Text>
          <View style={styles.directRow}>
            <TextInput
              style={styles.directInput}
              placeholder="0"
              placeholderTextColor={C.muted}
              value={minVal === 0 ? '' : String(minVal)}
              onChangeText={(v) => setMin(parseInt(v) || 0)}
              keyboardType="numeric"
            />
            <Text style={styles.unitLabel}>분</Text>
          </View>
        </View>
        <View style={[styles.exerciseCol, { marginLeft: 12 }]}>
          <Text style={styles.inputLabel}>소모 칼로리</Text>
          <View style={styles.directRow}>
            <TextInput
              style={styles.directInput}
              placeholder="0"
              placeholderTextColor={C.muted}
              value={kcalVal === 0 ? '' : String(kcalVal)}
              onChangeText={(v) => setKcal(parseInt(v) || 0)}
              keyboardType="numeric"
            />
            <Text style={styles.unitLabel}>kcal</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.inputLabel, { marginTop: 14 }]}>운동 종류</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(true)} activeOpacity={0.7}>
        <Text style={[styles.dropdownText, !typeVal && { color: C.muted }]}>
          {typeVal || '선택하세요'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={C.muted} />
      </TouchableOpacity>

      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setShowDropdown(false)} activeOpacity={1}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{title} 종류</Text>
            <FlatList
              data={types}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, typeVal === item && styles.modalItemActive]}
                  onPress={() => { setType(item); setShowDropdown(false); }}
                >
                  <Text style={[styles.modalItemText, typeVal === item && styles.modalItemTextActive]}>{item}</Text>
                  {typeVal === item && <Ionicons name="checkmark" size={16} color={C.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SectionCard>
  );
}

export default function RecordScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [water, setWater] = useState(0);
  const [protein, setProtein] = useState(0);
  const [strengthMin, setStrengthMin] = useState(0);
  const [strengthKcal, setStrengthKcal] = useState(0);
  const [strengthType, setStrengthType] = useState('');
  const [cardioMin, setCardioMin] = useState(0);
  const [cardioKcal, setCardioKcal] = useState(0);
  const [cardioType, setCardioType] = useState('');
  const [loading, setLoading] = useState(false);
  const [turtleModal, setTurtleModal] = useState(false);
  const [newTurtleCount, setNewTurtleCount] = useState(0);

  // 오늘 기존 기록 불러오기
  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.getTodayRecord();
        setWater(r.water_ml);
        setProtein(r.protein_g);
        setStrengthMin(r.strength_min);
        setStrengthKcal(r.strength_kcal);
        setStrengthType(r.strength_type);
        setCardioMin(r.cardio_min);
        setCardioKcal(r.cardio_kcal);
        setCardioType(r.cardio_type);
      } catch {}
    };
    load();
  }, []);

  const handleSave = async () => {
    if (water === 0 && protein === 0 && strengthMin === 0 && cardioMin === 0) {
      Alert.alert('알림', '최소 하나의 항목을 입력해주세요.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.saveRecord({
        water_ml: water,
        protein_g: protein,
        strength_min: strengthMin,
        strength_kcal: strengthKcal,
        strength_type: strengthType,
        cardio_min: cardioMin,
        cardio_kcal: cardioKcal,
        cardio_type: cardioType,
      });

      // AuthContext turtle_count 갱신
      if (res.turtle_gained) {
        updateUser({ ...user, turtle_count: res.turtle_count });
        setNewTurtleCount(res.turtle_count);
        setTurtleModal(true);
      } else {
        Alert.alert('저장 완료', '오늘의 기록이 저장되었어요!', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('저장 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* 꼬부기 획득 모달 */}
      <Modal visible={turtleModal} transparent animationType="fade">
        <View style={styles.turtleOverlay}>
          <View style={styles.turtleBox}>
            <Image source={TURTLE_IMG} style={styles.turtleModalImg} resizeMode="contain" />
            <Text style={styles.turtleModalTitle}>꼬부기 코인 획득!</Text>
            <Text style={styles.turtleModalMsg}>오늘의 기록을 저장했어요!{'\n'}꼬부기 코인 1개를 획득했습니다!</Text>
            <Text style={styles.turtleModalCount}>총 {newTurtleCount}개 보유</Text>
            <TouchableOpacity
              style={styles.turtleModalBtn}
              onPress={() => { setTurtleModal(false); navigation.goBack(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.turtleModalBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 수분 */}
        <SectionCard iconName="water" title="수분" color={C.water} bg={C.waterBg}>
          <View style={styles.quickRow}>
            <QuickBtn label="+100ml" onPress={() => setWater((p) => p + 100)} color={C.water} />
            <QuickBtn label="+200ml" onPress={() => setWater((p) => p + 200)} color={C.water} />
            <QuickBtn label="+500ml" onPress={() => setWater((p) => p + 500)} color={C.water} />
          </View>
          <Text style={[styles.bigNum, { color: C.water }]}>{water} <Text style={styles.bigUnit}>ml</Text></Text>
          <View style={styles.directRow}>
            <TextInput
              style={styles.directInput}
              placeholder="직접 입력"
              placeholderTextColor={C.muted}
              value={water === 0 ? '' : String(water)}
              onChangeText={(v) => setWater(parseInt(v) || 0)}
              keyboardType="numeric"
            />
            <Text style={styles.unitLabel}>ml</Text>
          </View>
        </SectionCard>

        {/* 단백질 */}
        <SectionCard iconName="nutrition" title="단백질" color={C.protein} bg={C.proteinBg}>
          <View style={styles.quickRow}>
            <QuickBtn label="+5g" onPress={() => setProtein((p) => p + 5)} color={C.protein} />
            <QuickBtn label="+10g" onPress={() => setProtein((p) => p + 10)} color={C.protein} />
            <QuickBtn label="+20g" onPress={() => setProtein((p) => p + 20)} color={C.protein} />
          </View>
          <Text style={[styles.bigNum, { color: C.protein }]}>{protein} <Text style={styles.bigUnit}>g</Text></Text>
          <View style={styles.directRow}>
            <TextInput
              style={styles.directInput}
              placeholder="직접 입력"
              placeholderTextColor={C.muted}
              value={protein === 0 ? '' : String(protein)}
              onChangeText={(v) => setProtein(parseInt(v) || 0)}
              keyboardType="numeric"
            />
            <Text style={styles.unitLabel}>g</Text>
          </View>
        </SectionCard>

        {/* 근력 운동 */}
        <ExerciseSection
          iconName="barbell" title="근력 운동"
          color={C.primary} bg={C.exerciseBg}
          types={STRENGTH_TYPES}
          minVal={strengthMin} setMin={setStrengthMin}
          kcalVal={strengthKcal} setKcal={setStrengthKcal}
          typeVal={strengthType} setType={setStrengthType}
        />

        {/* 유산소 운동 */}
        <ExerciseSection
          iconName="bicycle" title="유산소 운동"
          color={C.protein} bg={C.proteinBg}
          types={CARDIO_TYPES}
          minVal={cardioMin} setMin={setCardioMin}
          kcalVal={cardioKcal} setKcal={setCardioKcal}
          typeVal={cardioType} setType={setCardioType}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>기록 저장하기</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 18, paddingTop: 8 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, alignItems: 'center',
  },
  quickBtnText: { fontSize: 13, fontWeight: '700' },

  bigNum: { fontSize: 40, fontWeight: '800', textAlign: 'center', marginVertical: 8 },
  bigUnit: { fontSize: 20, fontWeight: '400' },

  directRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  directInput: {
    flex: 1, backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.text,
  },
  unitLabel: { fontSize: 14, color: C.sub, fontWeight: '500', minWidth: 28 },

  exerciseRow: { flexDirection: 'row' },
  exerciseCol: { flex: 1 },
  inputLabel: { fontSize: 12, color: C.sub, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },

  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 14, marginTop: 4,
  },
  dropdownText: { fontSize: 15, color: C.text },

  saveBtn: {
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  turtleOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  turtleBox: {
    backgroundColor: '#fff', borderRadius: 24,
    alignItems: 'center', padding: 32, width: '100%',
  },
  turtleModalImg: { width: 100, height: 100, marginBottom: 16 },
  turtleModalTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 10 },
  turtleModalMsg: { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  turtleModalCount: { fontSize: 18, fontWeight: '800', color: C.primary, marginBottom: 24 },
  turtleModalBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  turtleModalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 16, fontWeight: '700', color: C.text,
    padding: 20, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.bg,
  },
  modalItemActive: { backgroundColor: C.mintSoft },
  modalItemText: { fontSize: 15, color: C.text },
  modalItemTextActive: { color: C.primary, fontWeight: '700' },
});
