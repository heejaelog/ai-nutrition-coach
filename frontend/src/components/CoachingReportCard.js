import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C } from '../theme';

// ── 트렌드 태그 스타일 ─────────────────────────────────
const TREND = {
  '증가':     { bg: '#fff3e0', color: '#e65100', arrow: '↑' },
  '감소':     { bg: '#e3f2fd', color: '#0277bd', arrow: '↓' },
  '유지':     { bg: '#f5f5f5', color: '#666',    arrow: '→' },
  '데이터 부족': { bg: '#f5f5f5', color: '#999',  arrow: '-' },
};

// ── SVG 원형 점수 링 ───────────────────────────────────
function ScoreRing({ score }) {
  const SIZE = 68;
  const R    = 26;
  const cx   = SIZE / 2;
  const cy   = SIZE / 2;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - Math.min(score, 100) / 100);
  const color  = score >= 70 ? C.primary : score >= 40 ? '#f59e0b' : C.danger;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={R} stroke="#e5e7eb" strokeWidth={8} fill="none" />
        <Circle
          cx={cx} cy={cy} r={R}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <Text style={[s.scoreNum, { color }]}>{score}</Text>
    </View>
  );
}

// ── 프로그레스 바 ──────────────────────────────────────
function ProgressBar({ pct, color }) {
  return (
    <View style={s.progressWrap}>
      <View style={[s.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

// ── 트렌드 태그 ───────────────────────────────────────
function TrendTag({ trend }) {
  const t = TREND[trend] || TREND['데이터 부족'];
  return (
    <View style={[s.trendTag, { backgroundColor: t.bg }]}>
      <Text style={[s.trendText, { color: t.color }]}>{t.arrow} {trend}</Text>
    </View>
  );
}

// ── 출처 박스 ─────────────────────────────────────────
function SourceBox({ title = '📌 권장 기준', children }) {
  return (
    <View style={s.sourceBox}>
      <Text style={s.sourceTitleText}>{title}</Text>
      <Text style={s.sourceBodyText}>{children}</Text>
    </View>
  );
}

// ── 유사사용자 비교 행 ────────────────────────────────
function CompareRow({ mine, sim, diff, unit }) {
  const isPos = diff >= 0;
  return (
    <View style={s.compareRow}>
      <View style={s.compareMe}>
        <Text style={s.compareSmall}>나</Text>
        <Text style={s.compareBig}>{mine}</Text>
      </View>
      <View style={[s.diffTag, isPos ? s.diffPos : s.diffNeg]}>
        <Text style={[s.diffText, { color: isPos ? C.primary : C.danger }]}>
          {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{Math.round(diff)}{unit}
        </Text>
      </View>
      <View style={s.compareAvg}>
        <Text style={s.compareSmall}>유사사용자</Text>
        <Text style={s.compareBig}>{sim}</Text>
      </View>
    </View>
  );
}

// ── 카드 1: 종합 점수 ─────────────────────────────────
function ScoreCard({ data }) {
  const { score, cluster_name_ko, trends } = data;
  return (
    <View style={[s.card, s.scoreCard]}>
      <View style={[s.cardHeader, { backgroundColor: C.hero }]}>
        <Text style={s.cardTitleWhite}>📊 이번 주 종합 리포트</Text>
      </View>
      <View style={s.cardBody}>
        <View style={s.scoreRingRow}>
          <ScoreRing score={score} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={s.scoreRow}>
              <Text style={s.scoreLabel}>행동 유형</Text>
              <View style={s.clusterTag}>
                <Text style={s.clusterTagText}>{cluster_name_ko}</Text>
              </View>
            </View>
            {[
              { key: 'water',   label: '수분' },
              { key: 'protein', label: '단백질' },
              { key: 'exercise',label: '운동' },
            ].map(({ key, label }) => (
              <View style={s.scoreRow} key={key}>
                <Text style={s.scoreLabel}>{label}</Text>
                <TrendTag trend={trends?.[key] || '데이터 부족'} />
              </View>
            ))}
          </View>
        </View>
        <SourceBox title="📌 점수 산출 기준">
          {'수분 + 단백질 + 운동 목표 달성률 가중합산 (최대 100점)'}
        </SourceBox>
      </View>
    </View>
  );
}

// ── 카드 2: 수분 ──────────────────────────────────────
function WaterCard({ data }) {
  const { my_values, goals, similar_user_average, difference } = data;
  const pct  = Math.round((my_values.water_ml / goals.water_goal) * 100);
  const diff = difference.water_ml;
  const color = pct >= 100 ? C.primary : C.water;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>💧 수분 섭취</Text>
        <Text style={s.cardSub}>이번 주 일평균</Text>
      </View>
      <View style={s.cardBody}>
        <View style={s.itemRow}>
          <Text style={s.itemLabel}>나의 평균</Text>
          <Text style={[s.itemVal, { color: pct >= 100 ? C.primary : C.protein }]}>
            {Math.round(my_values.water_ml).toLocaleString()} ml
          </Text>
        </View>
        <ProgressBar pct={pct} color={color} />
        <View style={s.pctRow}>
          <Text style={s.pctLabel}>목표 {goals.water_goal.toLocaleString()}ml 대비</Text>
          <Text style={[s.pctVal, { color: pct >= 100 ? C.primary : C.protein }]}>
            {pct}%{pct >= 100 ? ' ✅' : ''}
          </Text>
        </View>
        <CompareRow
          mine={`${Math.round(my_values.water_ml).toLocaleString()}ml`}
          sim={`${Math.round(similar_user_average.water_ml).toLocaleString()}ml`}
          diff={diff}
          unit="ml"
        />
        <SourceBox>
          {'개인 체중 기반 산출 (근육증량 체중×40ml / 체중감량 체중×35ml)\n일반 성인 권장 기준 약 2~2.5L 범위 내 개인화 적용'}
        </SourceBox>
      </View>
    </View>
  );
}

// ── 카드 3: 단백질 ────────────────────────────────────
function ProteinCard({ data }) {
  const { my_values, goals, similar_user_average, difference } = data;
  const pct  = Math.round((my_values.protein_g / goals.protein_goal) * 100);
  const diff = difference.protein_g;
  const color = pct >= 100 ? C.primary : C.protein;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>🥩 단백질 섭취</Text>
        <Text style={s.cardSub}>이번 주 일평균</Text>
      </View>
      <View style={s.cardBody}>
        <View style={s.itemRow}>
          <Text style={s.itemLabel}>나의 평균</Text>
          <Text style={[s.itemVal, { color }]}>
            {Math.round(my_values.protein_g)} g
          </Text>
        </View>
        <ProgressBar pct={pct} color={color} />
        <View style={s.pctRow}>
          <Text style={s.pctLabel}>목표 {Math.round(goals.protein_goal)}g 대비</Text>
          <Text style={[s.pctVal, { color }]}>
            {pct}%{pct >= 100 ? ' ✅' : ''}
          </Text>
        </View>
        <CompareRow
          mine={`${Math.round(my_values.protein_g)}g`}
          sim={`${Math.round(similar_user_average.protein_g)}g`}
          diff={diff}
          unit="g"
        />
        <SourceBox>
          {'근육증량: 체중 1kg당 1.2~1.7g\n출처: 보건복지부,\n「한국인을 위한 식생활 지침」, 2021'}
        </SourceBox>
      </View>
    </View>
  );
}

// ── 카드 4: 운동 ──────────────────────────────────────
function ExerciseCard({ data }) {
  const { my_values, goals } = data;
  const sPct = goals.strength_goal > 0 ? Math.round((my_values.strength_min / goals.strength_goal) * 100) : 0;
  const cPct = goals.cardio_goal   > 0 ? Math.round((my_values.cardio_min   / goals.cardio_goal)   * 100) : 0;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>💪 운동량</Text>
        <Text style={s.cardSub}>근력 / 유산소 분리 분석</Text>
      </View>
      <View style={s.cardBody}>
        <View style={s.itemRow}>
          <Text style={s.itemLabel}>🏋️ 근력 운동</Text>
          <Text style={[s.itemVal, { color: sPct >= 100 ? C.primary : C.protein }]}>
            {Math.round(my_values.strength_min)}분
          </Text>
        </View>
        <ProgressBar pct={sPct} color={sPct >= 100 ? C.primary : C.protein} />
        <View style={[s.pctRow, { marginBottom: 10 }]}>
          <Text style={s.pctLabel}>목표 {goals.strength_goal}분 대비</Text>
          <Text style={[s.pctVal, { color: sPct >= 100 ? C.primary : C.protein }]}>
            {sPct}%{sPct >= 100 ? ' ✅' : ''}
          </Text>
        </View>

        <View style={s.itemRow}>
          <Text style={s.itemLabel}>🚴 유산소 운동</Text>
          <Text style={[s.itemVal, { color: cPct >= 100 ? C.primary : C.protein }]}>
            {Math.round(my_values.cardio_min)}분
          </Text>
        </View>
        <ProgressBar pct={cPct} color={cPct >= 100 ? C.primary : '#f59e0b'} />
        <View style={s.pctRow}>
          <Text style={s.pctLabel}>목표 {goals.cardio_goal}분 대비</Text>
          <Text style={[s.pctVal, { color: cPct >= 100 ? C.primary : C.protein }]}>
            {cPct}%{cPct < 50 ? ' ⚠️' : cPct >= 100 ? ' ✅' : ''}
          </Text>
        </View>
        <SourceBox>
          {'체중감량 목적 유산소: 주 200~300분 권장 (약 45분/일)\n출처: ACSM,\n「Physical Activity and Weight Management Position Stand」, 2009'}
        </SourceBox>
      </View>
    </View>
  );
}

// ── 카드 5: 유사사용자 비교표 ────────────────────────
function CompareTableCard({ data }) {
  const { my_values, similar_user_average, difference, similar_user_count } = data;

  const rows = [
    { label: '💧 수분',  mine: `${Math.round(my_values.water_ml).toLocaleString()}ml`,  sim: `${Math.round(similar_user_average.water_ml).toLocaleString()}ml`,  diff: difference.water_ml,    unit: 'ml' },
    { label: '🥩 단백질', mine: `${Math.round(my_values.protein_g)}g`,                  sim: `${Math.round(similar_user_average.protein_g)}g`,                  diff: difference.protein_g,   unit: 'g'  },
    { label: '🏋️ 근력',  mine: `${Math.round(my_values.strength_min)}분`,               sim: `${Math.round(similar_user_average.strength_min)}분`,               diff: difference.strength_min, unit: '분' },
    { label: '🚴 유산소', mine: `${Math.round(my_values.cardio_min)}분`,                 sim: `${Math.round(similar_user_average.cardio_min)}분`,                 diff: difference.cardio_min,  unit: '분' },
  ];

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>👥 유사 사용자 비교</Text>
        <Text style={s.cardSub}>
          {similar_user_count > 0 ? `유사사용자 ${similar_user_count}명 기준` : '합성데이터 기준'}
        </Text>
      </View>
      <View style={s.cardBody}>
        {/* 헤더 행 */}
        <View style={[s.tableRow, s.tableHeaderRow]}>
          <Text style={[s.tableCell, s.tableLabelCol, s.tableHeaderText]}>항목</Text>
          <Text style={[s.tableCell, s.tableHeaderText]}>나</Text>
          <Text style={[s.tableCell, s.tableHeaderText]}>차이</Text>
          <Text style={[s.tableCell, s.tableHeaderText]}>그룹 평균</Text>
        </View>
        {rows.map((row, i) => (
          <View style={[s.tableRow, i < rows.length - 1 && s.tableRowBorder]} key={row.label}>
            <Text style={[s.tableCell, s.tableLabelCol]}>{row.label}</Text>
            <Text style={[s.tableCell, s.tableMyCol]}>{row.mine}</Text>
            <Text style={[s.tableCell, { color: row.diff >= 0 ? C.primary : C.danger, fontWeight: '700', fontSize: 11, textAlign: 'center' }]}>
              {row.diff >= 0 ? '▲' : '▼'}{Math.abs(Math.round(row.diff))}{row.unit}
            </Text>
            <Text style={[s.tableCell, s.tableSimCol]}>{row.sim}</Text>
          </View>
        ))}
        <SourceBox title="📌 분류 방식">
          {'K-Means 클러스터링 (K=4) 기반 행동 유형 분류\n출처: MacQueen (1967), scikit-learn KMeans\n신체조건 매칭: 키±2cm, 몸무게±2kg, 나이±2세'}
        </SourceBox>
      </View>
    </View>
  );
}

// ── 카드 6: 액션 플랜 ─────────────────────────────────
function ActionPlanCard({ data }) {
  const { my_values, goals } = data;

  const items = [
    { key: 'water',    label: '💧 수분',  pct: my_values.water_ml     / goals.water_goal,    val: my_values.water_ml,    goal: goals.water_goal,    unit: 'ml' },
    { key: 'protein',  label: '🥩 단백질', pct: my_values.protein_g    / goals.protein_goal,  val: my_values.protein_g,   goal: goals.protein_goal,  unit: 'g'  },
    { key: 'strength', label: '🏋️ 근력',  pct: goals.strength_goal > 0 ? my_values.strength_min / goals.strength_goal : 1, val: my_values.strength_min, goal: goals.strength_goal, unit: '분' },
    { key: 'cardio',   label: '🚴 유산소', pct: goals.cardio_goal   > 0 ? my_values.cardio_min   / goals.cardio_goal   : 1, val: my_values.cardio_min,   goal: goals.cardio_goal,   unit: '분' },
  ];

  items.sort((a, b) => a.pct - b.pct);
  const ADVICE = {
    water:    '운동 전 300ml + 식간 물 2잔 습관화',
    protein:  '닭가슴살·계란·그릭요거트로 매 끼니 단백질 추가',
    strength: '주 3회 이상 웨이트 트레이닝 20~30분',
    cardio:   '주 3회 걷기 20분 또는 가벼운 조깅 추가',
  };

  const display = [items[0], items[1], items[items.length - 1]];
  const rankStyle = [s.rank1, s.rank2, s.rankOk];
  const rankTextStyle = [s.rank1Text, s.rank2Text, s.rankOkText];
  const rankLabel = ['1', '2', '✓'];

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>🎯 이번 주 액션 플랜</Text>
        <Text style={s.cardSub}>우선순위 기반 개선 제안</Text>
      </View>
      <View style={s.cardBody}>
        {display.map((item, i) => (
          <View style={[s.actionItem, i < display.length - 1 && s.actionItemBorder]} key={item.key}>
            <View style={[s.actionRank, rankStyle[i]]}>
              <Text style={rankTextStyle[i]}>{rankLabel[i]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actionTitle}>
                {item.label} {item.pct >= 1
                  ? '현 수준 유지'
                  : `+${Math.round(item.goal - item.val)}${item.unit} 추가`}
              </Text>
              <Text style={s.actionDesc}>
                {item.pct >= 1 ? '목표 달성 중 — 이 패턴 유지' : ADVICE[item.key]}
              </Text>
            </View>
          </View>
        ))}
        <SourceBox title="📚 영양 정보 출처">
          {'· 보건복지부, 한국인을 위한 식생활 지침 2021\n  (단백질 목표: 체중 1kg당 1.2~1.7g)\n· ACSM, Position Stand 2009\n  (체중감량 유산소: 주 200~300분)\n· MacQueen(1967), scikit-learn KMeans\n  (유사 사용자 클러스터링)'}
        </SourceBox>
      </View>
    </View>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export default function CoachingReportCard({ data }) {
  if (!data) return null;
  return (
    <View style={s.wrapper}>
      <ScoreCard    data={data} />
      <WaterCard    data={data} />
      <ProteinCard  data={data} />
      <ExerciseCard data={data} />
      <CompareTableCard data={data} />
      <ActionPlanCard   data={data} />
    </View>
  );
}

// ── 스타일 ────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: { marginTop: 8, gap: 8 },

  // 카드 공통
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  scoreCard: {},
  cardHeader: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle:      { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  cardTitleWhite: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cardSub:        { fontSize: 10, color: '#888', marginTop: 2 },
  cardBody:       { padding: 12 },

  // 점수 링
  scoreNum: { fontSize: 19, fontWeight: '800' },
  scoreRingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  scoreLabel: { fontSize: 11, color: '#555', width: 48 },

  // 클러스터 태그
  clusterTag:     { backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  clusterTagText: { fontSize: 10, fontWeight: '600', color: C.primary },

  // 트렌드 태그
  trendTag:  { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  trendText: { fontSize: 10, fontWeight: '600' },

  // 프로그레스 바
  progressWrap: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 6, overflow: 'hidden', marginVertical: 5 },
  progressFill: { height: '100%', borderRadius: 6 },

  // 항목 행
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  itemLabel: { fontSize: 11, color: '#555' },
  itemVal:   { fontSize: 15, fontWeight: '700' },

  // 퍼센트 행
  pctRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pctLabel: { fontSize: 10, color: '#888' },
  pctVal:   { fontSize: 11, fontWeight: '600' },

  // 비교 행
  compareRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fafafa', borderRadius: 8, padding: 8, marginTop: 4,
  },
  compareMe:    { alignItems: 'flex-start' },
  compareAvg:   { alignItems: 'flex-end' },
  compareSmall: { fontSize: 10, color: '#555' },
  compareBig:   { fontSize: 13, fontWeight: '700', color: '#111' },
  diffTag:      { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  diffPos:      { backgroundColor: '#dcfce7' },
  diffNeg:      { backgroundColor: '#fee2e2' },
  diffText:     { fontSize: 11, fontWeight: '700' },

  // 출처 박스
  sourceBox: {
    backgroundColor: '#f9fbe7',
    borderLeftWidth: 3,
    borderLeftColor: '#aed581',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  sourceTitleText: { fontSize: 10, fontWeight: '700', color: '#558b2f', marginBottom: 2 },
  sourceBodyText:  { fontSize: 10, color: '#555', lineHeight: 16 },

  // 비교 테이블
  tableRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  tableHeaderRow: { backgroundColor: '#f5f5f5', borderRadius: 6, marginBottom: 2 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableCell:      { flex: 1, fontSize: 11, textAlign: 'center' },
  tableLabelCol:  { flex: 1.4, textAlign: 'left', color: '#444' },
  tableMyCol:     { fontWeight: '700', color: C.primary, textAlign: 'center' },
  tableSimCol:    { color: '#555', textAlign: 'center' },
  tableHeaderText:{ fontSize: 10, fontWeight: '600', color: '#555' },

  // 액션 플랜
  actionItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 7 },
  actionItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  actionRank:       { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  rank1:     { backgroundColor: '#ffcdd2' },
  rank2:     { backgroundColor: '#fff9c4' },
  rankOk:    { backgroundColor: '#dcfce7' },
  rank1Text: { fontSize: 10, fontWeight: '700', color: '#c62828' },
  rank2Text: { fontSize: 10, fontWeight: '700', color: '#f57f17' },
  rankOkText:{ fontSize: 10, fontWeight: '700', color: C.primary },
  actionTitle: { fontSize: 12, fontWeight: '600', color: '#111' },
  actionDesc:  { fontSize: 10, color: '#666', marginTop: 1 },
});
