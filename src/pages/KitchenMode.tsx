import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Refrigerator, Sparkles, Plus, Check, Clock, ArrowRight, Loader2, Lightbulb } from 'lucide-react';
import { getMyIngredients, saveMyIngredients, getLastPreferences } from '../utils/storage';
import { suggestRecipesFromKitchen, type KitchenIdea } from '../utils/gemini';

const MOOD_OPTIONS = [
  '甘いスイーツ・焼き菓子が食べたい',
  '腸活・発酵食材で体が喜ぶごはんやおやつ',
  '罪悪感のない軽めのおやつ・軽食',
  '高タンパクで満足感のあるメイン・食事',
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
    setSelectedIngredients((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
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
    if (selectedIngredients.length === 0) { alert('使いたい食材を1つ以上タップして選んでください！'); return; }
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
    <main className="page-shell" style={{ maxWidth: '760px', padding: '40px 0 80px' }}>
      <header style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Refrigerator size={16} color="var(--terracotta)" /><span className="eyebrow">FROM YOUR PANTRY</span>
        </div>
        <h1 style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.15, margin: '0 0 10px 0' }}>
          What&apos;s in your kitchen?
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
          今家にある食材と気分を選ぶだけで、あなたの好みに合わせたレシピアイデアを3つ提案します。
        </p>
      </header>

      <section style={{ padding: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '24px' }}>
        <div className="eyebrow" style={{ marginBottom: '4px', color: 'var(--sage-dark)' }}>STEP 01 — INGREDIENTS</div>
        <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '14px' }}>今キッチンにある食材をタップ</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {availableList.map((item) => {
            const isSelected = selectedIngredients.includes(item);
            return (
              <button key={item} type="button" onClick={() => toggleIngredient(item)} style={{ minHeight: '42px', padding: '8px 15px', borderRadius: '22px', border: isSelected ? '1.5px solid var(--sage-dark)' : '1px solid var(--line)', backgroundColor: isSelected ? 'var(--sage-pale)' : 'var(--paper)', color: isSelected ? 'var(--ink)' : 'var(--muted)', fontSize: '13px', fontWeight: isSelected ? 600 : 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {isSelected && <Check size={14} color="var(--sage-dark)" />}<span>{item}</span>
              </button>
            );
          })}
        </div>
        <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="冷蔵庫の食材を追加（例：ヨーグルト、味噌、バナナ、ツナ缶）" value={newIngredient} onChange={(e) => setNewIngredient(e.target.value)} style={{ flex: 1, minHeight: '46px', padding: '0 14px', borderRadius: '6px', backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)', fontSize: '13px' }} />
          <button type="submit" className="secondary-link" style={{ minHeight: '46px', padding: '0 16px', fontSize: '13px' }}><Plus size={15} /><span>追加</span></button>
        </form>
      </section>

      <section style={{ padding: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '28px' }}>
        <div className="eyebrow" style={{ marginBottom: '4px', color: 'var(--sage-dark)' }}>STEP 02 — MOOD &amp; STYLE</div>
        <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '14px' }}>今の気分は？</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {MOOD_OPTIONS.map((option) => {
            const active = mood === option;
            return (
              <button key={option} type="button" onClick={() => setMood(option)} style={{ minHeight: '48px', padding: '12px 16px', borderRadius: '6px', border: active ? '1.5px solid var(--sage-dark)' : '1px solid var(--line)', backgroundColor: active ? 'var(--sage-pale)' : 'var(--paper)', color: 'var(--ink)', textAlign: 'left', fontSize: '14px', fontWeight: active ? 600 : 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{option}</span>{active && <Check size={16} color="var(--sage-dark)" />}
              </button>
            );
          })}
        </div>
      </section>

      <button type="button" onClick={handleSuggest} disabled={loading} className="primary-link" style={{ width: '100%', minHeight: '56px', fontSize: '15px', marginBottom: '32px', opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? (<><Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /><style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style><span>手持ち食材からアイデアを考案中...</span></>) : (<><Sparkles size={19} /><span>この食材で作れるレシピを3つ提案する</span></>)}
      </button>

      {error && <div style={{ padding: '16px', backgroundColor: 'var(--card-bg)', border: '1.5px solid var(--terracotta)', borderRadius: '6px', color: 'var(--terracotta)', fontSize: '14px', marginBottom: '24px' }}>{error}</div>}

      {ideas.length > 0 && (
        <section>
          <div className="eyebrow" style={{ marginBottom: '4px' }}>CURATED IDEAS FOR YOU</div>
          <h2 className="section-title" style={{ fontSize: '20px', marginBottom: '16px' }}>あなたへの提案（タップで詳しい分量・作り方を生成）</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ideas.map((idea, idx) => (
              <div key={idx} onClick={() => handleSelectIdea(idea)} className="entry-card" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', padding: '22px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--ink)' }}>{idea.title}</h3>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--muted)', flexShrink: 0, padding: '4px 10px', backgroundColor: 'var(--paper)', borderRadius: '4px' }}><Clock size={13} /> 約{idea.cookingTime}分</span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>{idea.description}</p>
                {idea.extraIngredientTip && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8a5338', backgroundColor: 'rgba(217, 185, 155, 0.22)', padding: '8px 12px', borderRadius: '4px', marginBottom: '14px' }}>
                    <Lightbulb size={14} color="var(--terracotta)" /><span>{idea.extraIngredientTip}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--sage-dark)' }}>
                  <span>このレシピを詳しく作る</span><ArrowRight size={15} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
