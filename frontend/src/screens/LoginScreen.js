import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const SNS_BUTTONS = [
  { key: 'naver', label: '네이버', bg: '#03C75A', color: '#fff' },
  { key: 'google', label: 'G', bg: '#fff', color: '#374151', border: '#D1D5DB' },
  { key: 'apple', label: '🍎', bg: '#fff', color: '#000', border: '#D1D5DB' },
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    login({ name: '사용자', email });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>

        <View style={styles.logoArea}>
          <Image source={require('../../assets/꼬부기.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>꼬부기 헬스케어 코칭</Text>
          <Text style={styles.subtitle}>맞춤형 영양·운동 관리 서비스</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="ID / Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signupBtn}>
          <Text style={styles.signupText}>회원가입</Text>
        </TouchableOpacity>

        <Text style={styles.snsLabel}>SNS 계정으로 로그인</Text>
        <View style={styles.snsRow}>
          {SNS_BUTTONS.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              style={[
                styles.snsBtn,
                { backgroundColor: btn.bg },
                btn.border && { borderWidth: 1, borderColor: btn.border },
              ]}
            >
              <Text style={[styles.snsBtnText, { color: btn.color }]}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logoArea: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 90, height: 90, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B7280' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 15,
  },
  loginBtn: { backgroundColor: '#3B82F6', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  signupBtn: { alignItems: 'center', marginTop: 16 },
  signupText: { color: '#3B82F6', fontSize: 14 },
  snsLabel: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 32, marginBottom: 16 },
  snsRow: { flexDirection: 'row', justifyContent: 'center' },
  snsBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 10, elevation: 2,
  },
  snsBtnText: { fontWeight: 'bold', fontSize: 15 },
});
