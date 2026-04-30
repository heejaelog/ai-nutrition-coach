import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { C, card, shadow } from '../theme';

const TURTLE_IMG = require('../../assets/꼬부기.png');

// 이미지 준비 전 플레이스홀더 색상
const SKIN_COLORS = {
  fire: '#EF4444',
  ice: '#60A5FA',
  gold: '#FBBF24',
  sakura: '#F472B6',
  space: '#818CF8',
};

function SkinCard({ item, equippedId, onBuy, onEquip, onUnequip }) {
  const isOwned = item.owned;
  const isEquipped = item.id === equippedId;
  const color = SKIN_COLORS[item.image_key] || C.primary;

  return (
    <View style={[card, styles.skinCard, isEquipped && styles.skinCardEquipped]}>
      {/* 플레이스홀더 아이콘 (나중에 실제 이미지로 교체) */}
      <View style={[styles.skinImgBox, { backgroundColor: color + '22', borderColor: color + '55' }]}>
        <Image source={TURTLE_IMG} style={styles.skinImg} resizeMode="contain"
          tintColor={color}  // 나중에 실제 스킨 이미지로 교체 시 제거
        />
        {isEquipped && (
          <View style={styles.equippedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={C.primary} />
          </View>
        )}
      </View>

      <Text style={styles.skinName}>{item.name}</Text>
      <Text style={styles.skinDesc}>{item.description}</Text>

      {isOwned ? (
        isEquipped ? (
          <TouchableOpacity style={styles.unequipBtn} onPress={() => onUnequip(item.id)}>
            <Text style={styles.unequipBtnText}>해제</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.equipBtn} onPress={() => onEquip(item.id)}>
            <Text style={styles.equipBtnText}>장착</Text>
          </TouchableOpacity>
        )
      ) : (
        <TouchableOpacity style={styles.buyBtn} onPress={() => onBuy(item)}>
          <Image source={TURTLE_IMG} style={{ width: 14, height: 14 }} resizeMode="contain" />
          <Text style={styles.buyBtnText}>{item.price}개</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SkinShopScreen() {
  const { user, updateUser } = useAuth();
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getSkins();
      setSkins(data);
    } catch (e) {
      console.error('스킨 로드 실패:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refreshUser = async () => {
    const me = await api.getMe();
    updateUser(me);
  };

  const handleBuy = (skin) => {
    Alert.alert(
      `${skin.name} 구매`,
      `꼬부기 ${skin.price}개를 사용해서 구매할까요?\n현재 보유: ${user?.turtle_count}개`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매', onPress: async () => {
            try {
              const res = await api.buySkin(skin.id);
              Alert.alert('구매 완료', res.message);
              await refreshUser();
              load();
            } catch (e) {
              Alert.alert('구매 실패', e.message);
            }
          },
        },
      ],
    );
  };

  const handleEquip = async (skinId) => {
    try {
      await api.equipSkin(skinId);
      await refreshUser();
      load();
    } catch (e) {
      Alert.alert('실패', e.message);
    }
  };

  const handleUnequip = async () => {
    try {
      await api.unequipSkin();
      await refreshUser();
      load();
    } catch (e) {
      Alert.alert('실패', e.message);
    }
  };

  const equippedId = user?.equipped_skin_id ?? null;
  const owned = skins.filter((s) => s.owned);
  const shop = skins.filter((s) => !s.owned);

  return (
    <View style={styles.root}>
      {/* 코인 현황 */}
      <View style={styles.coinBar}>
        <Image source={TURTLE_IMG} style={{ width: 22, height: 22 }} resizeMode="contain" />
        <Text style={styles.coinText}>보유 꼬부기 코인</Text>
        <Text style={styles.coinNum}>{user?.turtle_count ?? 0}개</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 내 컬렉션 */}
        {owned.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>내 컬렉션 ({owned.length})</Text>
            <View style={styles.grid}>
              {owned.map((item) => (
                <SkinCard
                  key={item.id}
                  item={item}
                  equippedId={equippedId}
                  onBuy={handleBuy}
                  onEquip={handleEquip}
                  onUnequip={handleUnequip}
                />
              ))}
            </View>
          </>
        )}

        {/* 상점 */}
        <Text style={styles.sectionLabel}>상점 ({shop.length})</Text>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} />
        ) : shop.length === 0 ? (
          <View style={styles.allOwned}>
            <Ionicons name="checkmark-circle" size={40} color={C.primary} />
            <Text style={styles.allOwnedText}>모든 스킨을 보유하고 있어요!</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {shop.map((item) => (
              <SkinCard
                key={item.id}
                item={item}
                equippedId={equippedId}
                onBuy={handleBuy}
                onEquip={handleEquip}
                onUnequip={handleUnequip}
              />
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  coinBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.hero, paddingHorizontal: 20, paddingVertical: 14,
  },
  coinText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  coinNum: { color: '#fff', fontSize: 18, fontWeight: '800' },

  scroll: { padding: 18 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: C.sub,
    letterSpacing: 0.3, marginBottom: 12, marginTop: 4,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },

  skinCard: {
    width: '47%', padding: 16, alignItems: 'center', marginBottom: 0,
  },
  skinCardEquipped: {
    borderWidth: 2, borderColor: C.primary,
  },
  skinImgBox: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, marginBottom: 10, position: 'relative',
  },
  skinImg: { width: 48, height: 48 },
  equippedBadge: {
    position: 'absolute', top: -8, right: -8,
    backgroundColor: '#fff', borderRadius: 10,
  },
  skinName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 4, textAlign: 'center' },
  skinDesc: { fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 12, minHeight: 30 },

  buyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.hero, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  equipBtn: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  equipBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  unequipBtn: {
    backgroundColor: C.border, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  unequipBtnText: { color: C.sub, fontWeight: '700', fontSize: 13 },

  allOwned: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  allOwnedText: { fontSize: 15, fontWeight: '600', color: C.sub },
});
