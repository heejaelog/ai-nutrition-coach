import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

// MVP: 룰 기반 초기 코칭 메시지
const INIT_MESSAGES = [
  {
    id: '1',
    role: 'ai',
    text: '안녕하세요! 저는 꼬부기 AI 코치예요 🐢\n오늘의 기록을 분석해드릴게요.',
    time: '지금',
  },
  {
    id: '2',
    role: 'ai',
    text: '💧 수분: 오늘 목표의 75%를 달성했어요. 남은 500ml를 마저 채워보세요!\n\n🥩 단백질: 목표까지 40g 남았어요. 운동 후 30분 이내에 섭취하면 효과적이에요.',
    time: '지금',
  },
];

function Bubble({ item }) {
  const isAI = item.role === 'ai';
  return (
    <View style={[styles.bubbleRow, isAI ? styles.bubbleRowAI : styles.bubbleRowUser]}>
      {isAI && (
        <View style={styles.avatar}>
          <Text style={{ fontSize: 16 }}>🐢</Text>
        </View>
      )}
      <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, isAI ? styles.bubbleTextAI : styles.bubbleTextUser]}>
          {item.text}
        </Text>
        <Text style={styles.bubbleTime}>{item.time}</Text>
      </View>
    </View>
  );
}

export default function CoachingScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: input.trim(), time: '지금' };
    const aiReply = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      text: 'AI 연동 준비 중이에요. 곧 실제 코칭을 드릴게요! 🐢',
      time: '지금',
    };
    setMessages((prev) => [...prev, userMsg, aiReply]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={styles.root}>
      {/* 헤더 */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatar}>
                <Text style={{ fontSize: 20 }}>🐢</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>꼬부기 AI 코치</Text>
                <View style={styles.onlineRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>온라인</Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* 메시지 목록 */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Bubble item={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
        />

        {/* 입력창 */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="코치에게 물어보세요..."
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },

  header: { backgroundColor: C.hero },
  headerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  onlineText: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },

  messageList: { padding: 16, gap: 12 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowAI: { justifyContent: 'flex-start' },
  bubbleRowUser: { justifyContent: 'flex-end' },

  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center',
  },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAI: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextAI: { color: C.text },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: C.muted, marginTop: 5, textAlign: 'right' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  textInput: {
    flex: 1, backgroundColor: C.bg, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: C.text, maxHeight: 100,
    borderWidth: 1, borderColor: C.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.muted },
});
