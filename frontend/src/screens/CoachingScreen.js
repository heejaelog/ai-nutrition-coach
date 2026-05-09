import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Image, ActivityIndicator, Dimensions,
} from 'react-native';

const W = Dimensions.get('window').width;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { C } from '../theme';
import CoachingReportCard from '../components/CoachingReportCard';

const TURTLE_IMG = require('../../assets/꼬부기.png');

const QUICK_ACTIONS = [
  { label: '📊 오늘 현황', message: '오늘 내 기록 어때?' },
  { label: '💪 코칭 받기', message: '이번 주 코칭해줘' },
  { label: '📋 리포트 분석', message: '이번 주 리포트 분석해줘' },
];

const INIT_MESSAGES = [
  {
    id: '0',
    role: 'ai',
    text: '안녕하세요! 저는 꼬부기 AI 코치예요 👋\n오늘 먹은 음식이나 운동을 자유롭게 말해주세요. 바로 기록해드릴게요!\n\n예) "닭가슴살 200g 먹었어", "헬스 1시간 했어", "코칭해줘"',
    time: '',
  },
];

function MiniBar({ pct, color }) {
  return (
    <View style={{ height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginTop: 3 }}>
      <View style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

function ScRow({ label, value, valueColor }) {
  return (
    <View style={sc.row}>
      <Text style={sc.rowLabel}>{label}</Text>
      <Text style={[sc.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function SaveCard({ data }) {
  const { added = {}, total_today = {}, goals = {} } = data;
  const hasWater    = (added.water_ml    || 0) > 0;
  const hasProtein  = (added.protein_g   || 0) > 0;
  const hasStrength = (added.strength_min || 0) > 0;
  const hasCardio   = (added.cardio_min  || 0) > 0;
  const count = [hasWater, hasProtein, hasStrength, hasCardio].filter(Boolean).length;
  const pct = (v, g) => g > 0 ? Math.min(Math.round(v / g * 100), 100) : 0;

  let headerText, headerBg, headerColor;
  if (count > 1)       { headerText = `✅ 기록 완료 (${count}가지)`; headerBg = '#E8F5E9'; headerColor = '#1B5E20'; }
  else if (hasWater)   { headerText = '💧 수분 기록 완료';           headerBg = '#E3F2FD'; headerColor = '#0D47A1'; }
  else if (hasProtein) { headerText = '🥩 단백질 기록 완료';         headerBg = '#E8F5E9'; headerColor = '#1B5E20'; }
  else if (hasStrength){ headerText = '🏋️ 근력 운동 기록 완료';       headerBg = '#FCE4EC'; headerColor = '#880E4F'; }
  else                 { headerText = '🚴 유산소 운동 기록 완료';     headerBg = '#FFF3E0'; headerColor = '#E65100'; }

  return (
    <View style={sc.card}>
      <View style={[sc.header, { backgroundColor: headerBg }]}>
        <Text style={[sc.headerText, { color: headerColor }]}>{headerText}</Text>
      </View>
      <View style={sc.body}>
        {hasWater && <>
          <ScRow label="추가된 수분" value={`+${added.water_ml}ml`} valueColor="#0D47A1" />
          <ScRow label="오늘 누적" value={`${total_today.water_ml}ml / 목표 ${goals.water_goal}ml`} />
          <MiniBar pct={pct(total_today.water_ml, goals.water_goal)} color="#42A5F5" />
          <Text style={sc.pctText}>{pct(total_today.water_ml, goals.water_goal)}% 달성</Text>
        </>}
        {hasProtein && <>
          <ScRow label="추가된 단백질" value={`+${added.protein_g}g`} valueColor="#1B5E20" />
          <ScRow label="오늘 누적" value={`${total_today.protein_g}g / 목표 ${goals.protein_goal}g`} />
          <MiniBar pct={pct(total_today.protein_g, goals.protein_goal)} color="#4CAF50" />
          <Text style={sc.pctText}>{pct(total_today.protein_g, goals.protein_goal)}% 달성</Text>
        </>}
        {hasStrength && <>
          <ScRow label={added.strength_type || '근력 운동'} value={`+${added.strength_min}분`} valueColor="#880E4F" />
          <ScRow label="오늘 목표" value={`목표 ${goals.strength_goal}분 · 누적 ${total_today.strength_min}분`} />
          <MiniBar pct={pct(total_today.strength_min, goals.strength_goal)} color="#FF7043" />
          <Text style={sc.pctText}>{pct(total_today.strength_min, goals.strength_goal)}% 달성</Text>
        </>}
        {hasCardio && <>
          <ScRow label={added.cardio_type || '유산소 운동'} value={`+${added.cardio_min}분`} valueColor="#E65100" />
          <ScRow label="오늘 목표" value={`목표 ${goals.cardio_goal}분 · 누적 ${total_today.cardio_min}분`} />
          <MiniBar pct={pct(total_today.cardio_min, goals.cardio_goal)} color="#FF9800" />
          <Text style={sc.pctText}>{pct(total_today.cardio_min, goals.cardio_goal)}% 달성</Text>
        </>}
      </View>
    </View>
  );
}

function StatusCard({ data }) {
  const today = new Date();
  const mmdd = `${today.getMonth() + 1}/${today.getDate()}`;
  const pctLabel = (v, g) => {
    const p = g > 0 ? Math.round(v / g * 100) : 0;
    return p >= 100 ? '100% ✅' : `${p}%`;
  };
  const isGood = (v, g) => g > 0 && v >= g;

  const rows = [
    { icon: '💧', label: '수분',   val: data.water_ml,    goal: data.water_goal,    unit: 'ml' },
    { icon: '🥩', label: '단백질', val: data.protein_g,   goal: data.protein_goal,  unit: 'g'  },
    { icon: '🏋️', label: '근력',   val: data.strength_min, goal: data.strength_goal, unit: '분' },
    { icon: '🚴', label: '유산소', val: data.cardio_min,   goal: data.cardio_goal,   unit: '분' },
  ];

  return (
    <View style={sc.card}>
      <View style={[sc.header, { backgroundColor: C.hero }]}>
        <Text style={[sc.headerText, { color: '#fff' }]}>📊 오늘 기록 현황 ({mmdd})</Text>
      </View>
      <View style={sc.body}>
        {rows.map((r) => (
          <View key={r.label} style={sc.statusRow}>
            <Text style={sc.statusLabel}>{r.icon} {r.label}</Text>
            <Text style={sc.statusMid}>{r.val}{r.unit} / {r.goal}{r.unit}</Text>
            <Text style={[sc.statusPct, { color: isGood(r.val, r.goal) ? '#1B5E20' : '#C62828' }]}>
              {pctLabel(r.val, r.goal)}
            </Text>
          </View>
        ))}
        <View style={[sc.statusRow, { borderTopWidth: 1, borderTopColor: '#EEE', marginTop: 4, paddingTop: 6 }]}>
          <Text style={[sc.statusLabel, { fontWeight: '700' }]}>종합 점수</Text>
          <Text />
          <Text style={sc.scoreValue}>{data.score}점</Text>
        </View>
      </View>
    </View>
  );
}

function FoodCard({ data }) {
  const { label, unit, amount_needed, foods = [], total, source } = data;
  return (
    <View style={sc.card}>
      <View style={[sc.header, { backgroundColor: '#FFF8E1' }]}>
        <Text style={[sc.headerText, { color: '#E65100' }]}>
          🍽️ {label} +{amount_needed}{unit} 채우기
        </Text>
      </View>
      <View style={sc.body}>
        {foods.map((f, i) => (
          <ScRow key={i} label={f.name} value={`+${f.amount}${f.unit}`} valueColor="#E65100" />
        ))}
        <View style={[sc.row, { borderTopWidth: 1.5, borderTopColor: '#E0E0E0', marginTop: 2, paddingTop: 6 }]}>
          <Text style={[sc.rowLabel, { fontWeight: '600' }]}>합계</Text>
          <Text style={[sc.rowValue, { color: '#E65100' }]}>+{total}{unit} ≈ 목표 달성</Text>
        </View>
        {source && (
          <Text style={{ fontSize: 9.5, color: '#888', marginTop: 6, lineHeight: 15 }}>
            📌 출처: {source}
          </Text>
        )}
      </View>
    </View>
  );
}

function TypingBubble() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
      <View style={styles.avatar}>
        <Image source={TURTLE_IMG} style={styles.bubbleAvatarImg} resizeMode="contain" />
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <ActivityIndicator size="small" color={C.primary} />
      </View>
    </View>
  );
}

function Bubble({ item }) {
  const isAI = item.role === 'ai';
  const hasReport = isAI && !!item.report_data;
  const hasSave   = isAI && !!item.save_data;
  const hasStatus = isAI && !!item.status_data;
  const hasFood   = isAI && !!item.food_data;
  const hasCard   = hasReport || hasSave || hasStatus || hasFood;

  return (
    <View style={[styles.bubbleRow, isAI ? styles.bubbleRowAI : styles.bubbleRowUser]}>
      {isAI && (
        <View style={styles.avatar}>
          <Image source={TURTLE_IMG} style={styles.bubbleAvatarImg} resizeMode="contain" />
        </View>
      )}
      <View style={hasCard ? styles.reportContainer : null}>
        {hasSave   && <SaveCard   data={item.save_data}   />}
        {hasStatus && <StatusCard data={item.status_data} />}
        {hasFood   && <FoodCard   data={item.food_data}   />}
        <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser, hasCard && { maxWidth: '100%' }]}>
          <Text style={[styles.bubbleText, isAI ? styles.bubbleTextAI : styles.bubbleTextUser]}>
            {item.text}
          </Text>
          {item.time ? <Text style={styles.bubbleTime}>{item.time}</Text> : null}
        </View>
        {hasReport && <CoachingReportCard data={item.report_data} />}
      </View>
    </View>
  );
}

function TurtleBanner({ count }) {
  return (
    <View style={styles.turtleBanner}>
      <Text style={styles.turtleBannerText}>꼬부기 코인 획득! ✨ 총 {count}개</Text>
    </View>
  );
}

export default function CoachingScreen() {
  const { user, setUser } = useAuth();
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [turtleNotice, setTurtleNotice] = useState(null);
  const listRef = useRef(null);

  const now = () => {
    const d = new Date();
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h < 12 ? '오전' : '오후';
    return `${ampm} ${h % 12 || 12}:${m}`;
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: trimmed, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.sendChatMessage(trimmed);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: res.reply,
        report_data:  res.report_data  || null,
        save_data:    res.saved        || null,
        status_data:  res.status_data  || null,
        food_data:    res.food_data    || null,
        time: now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 거북이 코인 획득 알림
      if (res.turtle_gained) {
        setTurtleNotice(res.turtle_count);
        if (setUser) setUser((prev) => ({ ...prev, turtle_count: res.turtle_count }));
        setTimeout(() => setTurtleNotice(null), 3000);
      }
    } catch (e) {
      console.log('[챗봇 오류]', e?.message);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: '죄송해요, 일시적인 오류가 발생했어요. 다시 시도해주세요.',
        time: now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={styles.root}>
      {/* 헤더 */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatar}>
                <Image source={TURTLE_IMG} style={styles.headerAvatarImg} resizeMode="contain" />
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

      {/* 거북이 획득 배너 */}
      {turtleNotice !== null && <TurtleBanner count={turtleNotice} />}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* 메시지 목록 */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Bubble item={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
          ListFooterComponent={isTyping ? <TypingBubble /> : null}
        />

        {/* 퀵 액션 버튼 */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              style={styles.quickBtn}
              onPress={() => sendMessage(qa.message)}
              disabled={isTyping}
              activeOpacity={0.7}
            >
              <Text style={styles.quickBtnText}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 입력창 */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="오늘 먹은 음식이나 운동을 입력하세요..."
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            editable={!isTyping}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
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
  headerAvatarImg: { width: 28, height: 28 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  onlineText: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },

  turtleBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  turtleBannerText: { fontSize: 13, fontWeight: '600', color: '#856404' },

  messageList: { padding: 16, gap: 12 },

  reportContainer: { flex: 1 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowAI: { justifyContent: 'flex-start' },
  bubbleRowUser: { justifyContent: 'flex-end' },

  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center',
  },
  bubbleAvatarImg: { width: 22, height: 22 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAI: {
    maxWidth: W * 0.72,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bubbleUser: {
    maxWidth: W * 0.78,
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  typingBubble: { paddingVertical: 14, paddingHorizontal: 18 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextAI: { color: C.text },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: C.muted, marginTop: 5, textAlign: 'right' },

  quickRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: C.border,
  },
  quickBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 16,
    backgroundColor: C.mintSoft, alignItems: 'center',
  },
  quickBtnText: { fontSize: 11, fontWeight: '600', color: C.primary },

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

const sc = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerText: { fontSize: 12, fontWeight: '700' },
  body: { paddingHorizontal: 12, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rowLabel: { fontSize: 11.5, color: '#555' },
  rowValue: { fontSize: 11.5, fontWeight: '700', color: '#1B5E20' },
  pctText: { fontSize: 10, color: '#888', marginTop: 2, marginBottom: 4 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statusLabel: { fontSize: 11, color: '#333', flex: 1 },
  statusMid:   { fontSize: 11, color: '#555', flex: 2, textAlign: 'center' },
  statusPct:   { fontSize: 11, fontWeight: '700', flex: 1, textAlign: 'right' },
  scoreValue:  { fontSize: 13, fontWeight: '800', color: '#1B5E20', flex: 1, textAlign: 'right' },
});
