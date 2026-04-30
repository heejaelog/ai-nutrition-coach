import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const GOALS = ['근육 증량', '체중 감량'];

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('근육 증량');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    try {
      setLoading(true);
      await register(email, password, name, goal);
    } catch (e) {
      Alert.alert('회원가입 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroContent}>
            <Image source={require('../../assets/꼬부기.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>꼬부기 헬스케어</Text>
            <Text style={styles.appSub}>AI 맞춤형 영양·운동 코칭</Text>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

          <Text style={styles.formTitle}>회원가입</Text>

          {/* 이름 */}
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={C.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="이름"
              placeholderTextColor={C.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 이메일 */}
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={C.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor={C.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={C.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor={C.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* 목표 선택 */}
          <Text style={styles.goalLabel}>나의 목표</Text>
          <View style={styles.goalRow}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.goalBtn, goal === g && styles.goalBtnActive]}
                onPress={() => setGoal(g)}
                activeOpacity={0.75}
              >
                <Text style={[styles.goalBtnText, goal === g && styles.goalBtnTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.registerBtnText}>{loading ? '가입 중...' : '회원가입'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginRow} onPress={() => navigation.goBack()}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  hero: { backgroundColor: C.hero },
  heroContent: { alignItems: 'center', paddingVertical: 28 },
  logo: { width: 64, height: 64, marginBottom: 10 },
  appName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  appSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  form: { padding: 28, paddingTop: 28 },
  formTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 20 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.border, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.text },
  eyeBtn: { padding: 4 },

  goalLabel: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 10 },
  goalRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  goalBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', backgroundColor: C.bg,
  },
  goalBtnActive: { borderColor: C.primary, backgroundColor: C.mintSoft },
  goalBtnText: { fontSize: 14, fontWeight: '600', color: C.sub },
  goalBtnTextActive: { color: C.primary },

  registerBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  registerBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: C.sub, fontSize: 14 },
  loginLink: { color: C.primary, fontWeight: '700', fontSize: 14 },
});
