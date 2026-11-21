import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Refrigerator, Sparkles, Plus, Check, Clock, ArrowRight, Loader2, Lightbulb } from 'lucide-react';
import { getMyIngredients, saveMyIngredients, getLastPreferences } from '../utils/storage';
import { suggestRecipesFromKitchen, type KitchenIdea } from '../utils/gemini';

const MOOD_OPTIONS = [
  '甘いスイーツ・焼き菓子が食べたい',
  '罪悪感のないおやつ・軽食',
  '高タンパクで満足感のある食事',
  '朝ごはんにぴったりのパン・パンケーキ系',
  '火を使わない・レンジで時短レシピ',
];

export const KitchenMode = () => {
  const navigate = useNavigate();
  const [availableList, setAvailableList] = useState<string[]>(getMyIngredients());
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [mood, setMood] = useState(MOOD_OPTIONS[0]);

  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<KitchenIdea[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleIngredient = (item: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newIngredient.trim();
    if (trimmed && !availableList.includes(trimmed)) {
      const updated = [...availableList, trimmed];
      setAvailableList(updated);
      saveMyIngredients(updated);
      setSelectedIngredients([...selectedIngredients, trimmed]);
      setNewIngredient('');
    }
  };

  const handleSuggest = async () => {
    if (selectedIngredients.length === 0) {
      alert('使いたい食材を1つ以上タップして選んでください！');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await suggestRecipesFromKitchen(selectedIngredients, mood);
      setIdeas(results);
    } catch (err: any) {
      setError(err.message || '提案の生成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIdea = (idea: KitchenIdea) => {
    // 選んだアイデアをもとに、そのまま詳細レシピ（Before/After・失敗ポイント付き）を生成する画面へ遷移
    navigate('/result', {
      state: {
        inputType: 'text',
        recipeText: `【逆引き提案からの作成】\n料理名：${idea.title}\n概要：${idea.description}\n使いたい食材：${selectedIngredients.join('、')}\n気分・ジャンル：${mood}`,
        imagePreview: null,
        selectedIngredients,
        preferences: getLastPreferences(),
      },
    });
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Refrigerator size={28} color="#38bdf8" />
        <h2 style={{ margin: 0 }}>What&apos;s in My Kitchen?</h2>
      </div>
      <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '24px' }}>
        今家にある食材と気分から、あなたの好みに合った失敗しないレシピを3つ提案します。
      </p>

      {/* 1. 家にある食材を選ぶ */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>1. 今キッチンにある食材をタップ</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {availableList.map((item) => {
            const isSelected = selectedIngredients.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleIngredient(item)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: isSelected ? '2px solid #38bdf8' : '1px solid #444',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#1e1e1e',
                  color: '#fff',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                {isSelected && <Check size={14} color="#38bdf8" />}
                {item}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input
            type="text"
            placeholder="冷蔵庫の食材を追加（例：バナナ、ヨーグルト、ツナ缶）"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #444',
              fontSize: '13px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            <Plus size={14} /> 追加
          </button>
        </form>
      </div>

      {/* 2. 今の気分を選ぶ */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>2. 今の気分は？</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MOOD_OPTIONS.map((option) => {
            const active = mood === option;
            return (
              <button
                key={option}
                onClick={() => setMood(option)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: active ? '2px solid #818cf8' : '1px solid #333',
                  backgroundColor: active ? 'rgba(99, 102, 241, 0.15)' : '#1e1e1e',
                  color: '#fff',
                  textAlign: 'left',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{option}</span>
                {active && <Check size={16} color="#818cf8" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 提案ボタン */}
      <button
        onClick={handleSuggest}
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: '#0284c7',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '28px',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            手持ち食材からアイデアを考案中...
          </>
        ) : (
          <>
            <Sparkles size={20} /> この食材で作れるレシピを3つ提案する
          </>
        )}
      </button>

      {error && (
        <div style={{ padding: '14px', backgroundColor: '#2a1515', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '14px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* 提案された3つのレシピカード */}
      {ideas.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#38bdf8' }}>
            あなたへの提案（タップで詳しい分量・作り方を生成）
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {ideas.map((idea, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectIdea(idea)}
                style={{
                  padding: '18px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '17px', color: '#fff' }}>{idea.title}</h4>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>
                    <Clock size={13} /> 約{idea.cookingTime}分
                  </span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {idea.description}
                </p>
                {idea.extraIngredientTip && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fde68a', marginBottom: '12px' }}>
                    <Lightbulb size={14} />
                    <span>{idea.extraIngredientTip}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold', color: '#34d399' }}>
                  このレシピを詳しく作る <ArrowRight size={15} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};