import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, card } from '../theme';

const EXERCISE_TYPES = ['웨이트', '러닝', '사이클', '수영', '요가', '기타'];

function SectionCard({ icon, iconName, title, color, bg, children }) {
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

export default function RecordScreen({ navigation }) {
  const [water, setWater] = useState(0);
  const [protein, setProtein] = useState(0);
  const [exerciseMin, setExerciseMin] = useState('');
  const [exerciseKcal, setExerciseKcal] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSave = () => {
    if (water === 0 && protein === 0 && !exerciseMin) {
      Alert.alert('알림', '최소 하나의 항목을 입력해주세요.');
      return;
    }
    Alert.alert('저장 완료 🐢', '오늘의 기록이 저장되었어요!\n거북이 1개를 획득했습니다.', [
      { text: '확인', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.root}>
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

        {/* 운동 */}
        <SectionCard iconName="barbell" title="운동" color={C.primary} bg={C.exerciseBg}>
          <View style={styles.exerciseRow}>
            <View style={styles.exerciseCol}>
              <Text style={styles.inputLabel}>시간 (분)</Text>
              <View style={styles.directRow}>
                <TextInput
                  style={styles.directInput}
                  placeholder="0"
                  placeholderTextColor={C.muted}
                  value={exerciseMin}
                  onChangeText={setExerciseMin}
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
                  value={exerciseKcal}
                  onChangeText={setExerciseKcal}
                  keyboardType="numeric"
                />
                <Text style={styles.unitLabel}>kcal</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>운동 종류</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(true)} activeOpacity={0.7}>
            <Text style={[styles.dropdownText, !selectedExercise && { color: C.muted }]}>
              {selectedExercise || '선택하세요'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={C.muted} />
          </TouchableOpacity>
        </SectionCard>

        {/* 저장 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>기록 저장하기</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 드롭다운 모달 */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setShowDropdown(false)} activeOpacity={1}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>운동 종류 선택</Text>
            <FlatList
              data={EXERCISE_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedExercise === item && styles.modalItemActive]}
                  onPress={() => { setSelectedExercise(item); setShowDropdown(false); }}
                >
                  <Text style={[styles.modalItemText, selectedExercise === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {selectedExercise === item && (
                    <Ionicons name="checkmark" size={16} color={C.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
