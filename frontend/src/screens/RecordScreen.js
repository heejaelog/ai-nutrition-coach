import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXERCISE_TYPES = ['웨이트', '러닝'];

export default function RecordScreen({ navigation }) {
  const [water, setWater] = useState(0);
  const [waterInput, setWaterInput] = useState('');
  const [protein, setProtein] = useState(0);
  const [proteinInput, setProteinInput] = useState('');
  const [exerciseMin, setExerciseMin] = useState('');
  const [exerciseKcal, setExerciseKcal] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const addWater = (amount) => setWater((prev) => prev + amount);
  const addProtein = (amount) => setProtein((prev) => prev + amount);

  const handleWaterInput = (val) => {
    setWaterInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 0) setWater(num);
  };

  const handleProteinInput = (val) => {
    setProteinInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 0) setProtein(num);
  };

  const handleSave = () => {
    if (water === 0 && protein === 0 && !exerciseMin) {
      Alert.alert('알림', '최소 하나의 항목을 입력해주세요.');
      return;
    }
    Alert.alert('저장 완료', '오늘의 기록이 저장되었습니다!', [
      { text: '확인', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 수분 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💧 수분</Text>
          <View style={styles.quickBtns}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => addWater(100)}>
              <Text style={styles.quickBtnText}>+100ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => addWater(500)}>
              <Text style={styles.quickBtnText}>+500ml</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currentValue}>{water} ml</Text>
          <View style={styles.directInputRow}>
            <TextInput
              style={styles.directInput}
              placeholder="직접 입력"
              value={waterInput}
              onChangeText={handleWaterInput}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.unit}>ml</Text>
          </View>
        </View>

        {/* 단백질 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥩 단백질</Text>
          <View style={styles.quickBtns}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => addProtein(5)}>
              <Text style={styles.quickBtnText}>+5g</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => addProtein(10)}>
              <Text style={styles.quickBtnText}>+10g</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currentValue}>{protein} g</Text>
          <View style={styles.directInputRow}>
            <TextInput
              style={styles.directInput}
              placeholder="직접 입력"
              value={proteinInput}
              onChangeText={handleProteinInput}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.unit}>g</Text>
          </View>
        </View>

        {/* 운동 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏋️ 운동</Text>

          <View style={styles.exerciseRow}>
            <View style={styles.exerciseInputGroup}>
              <Text style={styles.inputLabel}>시간</Text>
              <View style={styles.directInputRow}>
                <TextInput
                  style={styles.directInput}
                  placeholder="0"
                  value={exerciseMin}
                  onChangeText={setExerciseMin}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.unit}>분</Text>
              </View>
            </View>
            <View style={[styles.exerciseInputGroup, { marginLeft: 16 }]}>
              <Text style={styles.inputLabel}>칼로리</Text>
              <View style={styles.directInputRow}>
                <TextInput
                  style={styles.directInput}
                  placeholder="0"
                  value={exerciseKcal}
                  onChangeText={setExerciseKcal}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.unit}>kcal</Text>
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>운동 종류</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDropdown(true)}
          >
            <Text style={[styles.dropdownText, !selectedExercise && { color: '#9CA3AF' }]}>
              {selectedExercise || '운동 종류 선택'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>저장</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 운동 종류 드롭다운 모달 */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>운동 종류 선택</Text>
            <FlatList
              data={EXERCISE_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedExercise === item && styles.modalItemSelected]}
                  onPress={() => { setSelectedExercise(item); setShowDropdown(false); }}
                >
                  <Text style={[styles.modalItemText, selectedExercise === item && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  quickBtns: { flexDirection: 'row', marginBottom: 10 },
  quickBtn: {
    flex: 1, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 10, padding: 14, alignItems: 'center', marginRight: 12,
  },
  quickBtnText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 15 },
  currentValue: { fontSize: 28, fontWeight: 'bold', color: '#1D4ED8', textAlign: 'center', marginVertical: 6 },
  directInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  directInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10,
    padding: 12, fontSize: 16, color: '#111827',
  },
  unit: { fontSize: 15, color: '#6B7280', marginLeft: 8 },
  exerciseRow: { flexDirection: 'row', marginBottom: 16 },
  exerciseInputGroup: { flex: 1 },
  inputLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, marginTop: 4,
  },
  dropdownText: { fontSize: 15, color: '#111827' },
  dropdownArrow: { fontSize: 12, color: '#9CA3AF' },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  modalItemSelected: { backgroundColor: '#EFF6FF' },
  modalItemText: { fontSize: 15, color: '#374151' },
  modalItemTextSelected: { color: '#3B82F6', fontWeight: 'bold' },
});
