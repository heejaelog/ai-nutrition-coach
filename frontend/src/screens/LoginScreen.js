import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    login({ name: '사용자', email });
  };

  return (
    <View style={styles.root}>
      {/* 상단 녹색 히어로 */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroContent}>
            <Image source={require('../../assets/꼬부기.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>꼬부기 헬스케어</Text>
            <Text style={styles.appSub}>AI 맞춤형 영양·운동 코칭</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* 하단 폼 */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

          <Text style={styles.formTitle}>로그인</Text>

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

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={C.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor={C.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupRow}>
            <Text style={styles.signupText}>아직 계정이 없으신가요? </Text>
            <Text style={styles.signupLink}>회원가입</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.snsRow}>
            <TouchableOpacity style={[styles.snsBtn, { backgroundColor: '#03C75A' }]}>
              <Text style={[styles.snsBtnText, { color: '#fff' }]}>N</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.snsBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border }]}>
              <Text style={[styles.snsBtnText, { color: '#374151' }]}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.snsBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border }]}>
              <Ionicons name="logo-apple" size={20} color="#000" />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  hero: { backgroundColor: C.hero },
  heroContent: { alignItems: 'center', paddingVertical: 36 },
  logo: { width: 80, height: 80, marginBottom: 12 },
  appName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  appSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '400' },

  form: { padding: 28, paddingTop: 32 },
  formTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 24 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.text },
  eyeBtn: { padding: 4 },

  loginBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginTop: 4, marginBottom: 16,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 28 },
  signupText: { color: C.sub, fontSize: 14 },
  signupLink: { color: C.primary, fontWeight: '700', fontSize: 14 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { color: C.muted, fontSize: 13, marginHorizontal: 12 },

  snsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  snsBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  snsBtnText: { fontWeight: '700', fontSize: 16 },
});
