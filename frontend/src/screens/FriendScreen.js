import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { C, card, shadow } from '../theme';

const TURTLE_IMG = require('../../assets/꼬부기.png');

function ScoreBar({ score }) {
  return (
    <View style={styles.scoreBarWrap}>
      <View style={styles.scoreBarBg}>
        <View style={[styles.scoreBarFill, { width: `${score}%` }]} />
      </View>
      <Text style={styles.scoreText}>{score}점</Text>
    </View>
  );
}

function FriendCard({ item, onPress }) {
  return (
    <TouchableOpacity style={[card, styles.friendCard]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.friendAvatar}>
        <Image source={TURTLE_IMG} style={styles.friendAvatarImg} resizeMode="contain" />
        {item.equipped_skin_name && (
          <View style={styles.skinBadge}>
            <Text style={styles.skinBadgeText} numberOfLines={1}>{item.equipped_skin_name}</Text>
          </View>
        )}
      </View>
      <View style={styles.friendInfo}>
        <View style={styles.friendNameRow}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendGoal}>{item.goal}</Text>
        </View>
        <ScoreBar score={item.score} />
        <Text style={styles.friendTurtle}>꼬부기 {item.turtle_count}개 보유</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.muted} />
    </TouchableOpacity>
  );
}

function PendingCard({ item, onAccept }) {
  return (
    <View style={[card, styles.pendingCard]}>
      <View style={styles.pendingLeft}>
        <View style={styles.friendAvatar}>
          <Image source={TURTLE_IMG} style={styles.friendAvatarImg} resizeMode="contain" />
        </View>
        <Text style={styles.pendingName}>{item.requester_name}님의 친구 요청</Text>
      </View>
      <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(item.friendship_id)}>
        <Text style={styles.acceptBtnText}>수락</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FriendScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [friendList, pendingList] = await Promise.all([
        api.getFriends(),
        api.getPendingRequests(),
      ]);
      setFriends(friendList);
      setPending(pendingList);
    } catch (e) {
      console.error('친구 목록 로드 실패:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSearch = async () => {
    const id = parseInt(searchId);
    if (!id) { Alert.alert('알림', '숫자로 된 ID를 입력해주세요.'); return; }
    try {
      setSearching(true);
      setSearchResult(null);
      const result = await api.searchUser(id);
      setSearchResult(result);
    } catch (e) {
      Alert.alert('검색 실패', e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      const res = await api.sendFriendRequest(userId);
      Alert.alert('완료', res.message);
      setSearchResult((prev) => ({ ...prev, relation: 'pending_sent' }));
    } catch (e) {
      Alert.alert('실패', e.message);
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      await api.acceptFriendRequest(friendshipId);
      load();
    } catch (e) {
      Alert.alert('실패', e.message);
    }
  };

  const handleRemove = (friendshipId, name) => {
    Alert.alert('친구 삭제', `${name}님을 친구 목록에서 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            await api.removeFriend(friendshipId);
            load();
          } catch (e) {
            Alert.alert('실패', e.message);
          }
        },
      },
    ]);
  };

  const relationLabel = (relation) => {
    if (relation === 'friend') return { label: '이미 친구', disabled: true };
    if (relation === 'pending_sent') return { label: '요청 보냄', disabled: true };
    if (relation === 'pending_received') return { label: '요청 수락하기', disabled: false };
    return { label: '친구 추가', disabled: false };
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <Text style={styles.headerTitle}>친구</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ID 검색 */}
        <View style={[card, { padding: 16 }]}>
          <Text style={styles.sectionTitle}>ID로 친구 추가</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="친구 ID 입력 (숫자)"
              placeholderTextColor={C.muted}
              value={searchId}
              onChangeText={setSearchId}
              keyboardType="numeric"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
              {searching
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="search" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>

          {searchResult && (() => {
            const { label, disabled } = relationLabel(searchResult.relation);
            return (
              <View style={styles.searchResult}>
                <View style={styles.searchResultLeft}>
                  <View style={styles.searchAvatar}>
                    <Image source={TURTLE_IMG} style={{ width: 28, height: 28 }} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={styles.searchName}>{searchResult.name}</Text>
                    <Text style={styles.searchSub}>
                      ID: {searchResult.id} · {searchResult.goal}
                      {searchResult.equipped_skin_name ? ` · ${searchResult.equipped_skin_name}` : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, disabled && styles.addBtnDisabled]}
                  onPress={() => !disabled && handleSendRequest(searchResult.id)}
                  activeOpacity={disabled ? 1 : 0.8}
                >
                  <Text style={[styles.addBtnText, disabled && styles.addBtnTextDisabled]}>{label}</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>

        {/* 내 ID 안내 */}
        <View style={styles.myIdBanner}>
          <Ionicons name="information-circle-outline" size={14} color={C.sub} />
          <Text style={styles.myIdText}>내 ID는 마이페이지에서 확인할 수 있어요</Text>
        </View>

        {/* 받은 친구 요청 */}
        {pending.length > 0 && (
          <>
            <Text style={styles.listLabel}>받은 친구 요청 {pending.length}건</Text>
            {pending.map((item) => (
              <PendingCard key={item.friendship_id} item={item} onAccept={handleAccept} />
            ))}
          </>
        )}

        {/* 친구 목록 */}
        <Text style={styles.listLabel}>친구 {friends.length}명</Text>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
        ) : friends.length === 0 ? (
          <View style={styles.empty}>
            <Image source={TURTLE_IMG} style={styles.emptyImg} resizeMode="contain" />
            <Text style={styles.emptyText}>아직 친구가 없어요</Text>
            <Text style={styles.emptySubText}>위에서 ID로 친구를 추가해보세요</Text>
          </View>
        ) : (
          friends.map((item) => (
            <FriendCard
              key={item.friendship_id}
              item={item}
              onPress={() => navigation.navigate('FriendProfile', { userId: item.user_id, name: item.name })}
            />
          ))
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.hero, paddingBottom: 22, paddingHorizontal: 22 },
  headerInner: { paddingTop: 6 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },

  scroll: { padding: 18, paddingTop: 16 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12 },

  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: {
    flex: 1, backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.text,
  },
  searchBtn: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },

  searchResult: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  searchResultLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  searchAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center',
  },
  searchName: { fontSize: 15, fontWeight: '700', color: C.text },
  searchSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  addBtn: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnDisabled: { backgroundColor: C.border },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addBtnTextDisabled: { color: C.sub },

  myIdBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 16, paddingHorizontal: 4,
  },
  myIdText: { fontSize: 12, color: C.sub },

  listLabel: {
    fontSize: 12, fontWeight: '700', color: C.sub,
    letterSpacing: 0.3, marginBottom: 10, paddingHorizontal: 2,
  },

  friendCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  friendAvatar: { position: 'relative' },
  friendAvatarImg: { width: 44, height: 44 },
  skinBadge: {
    position: 'absolute', bottom: -4, left: -4,
    backgroundColor: C.hero, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    maxWidth: 72,
  },
  skinBadgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  friendInfo: { flex: 1, gap: 4 },
  friendNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  friendName: { fontSize: 15, fontWeight: '700', color: C.text },
  friendGoal: {
    fontSize: 11, color: C.primary, fontWeight: '600',
    backgroundColor: C.mintSoft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  friendTurtle: { fontSize: 11, color: C.muted },

  scoreBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreBarBg: { flex: 1, height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: 5, backgroundColor: C.primary, borderRadius: 3 },
  scoreText: { fontSize: 12, fontWeight: '700', color: C.primary, minWidth: 32 },

  pendingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  pendingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pendingName: { fontSize: 14, fontWeight: '600', color: C.text },
  acceptBtn: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyImg: { width: 72, height: 72, opacity: 0.4, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.sub },
  emptySubText: { fontSize: 13, color: C.muted, marginTop: 6 },
});
