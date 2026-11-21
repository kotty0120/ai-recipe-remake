import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Save, Sparkles, Clock, Users, RefreshCw, Loader2, AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { saveRecipe } from '../utils/storage';
import { transformRecipeWithGemini } from '../utils/gemini';
import type { Recipe, Ingredient } from '../types/recipe';

const LOADING_MESSAGES = [
  '食材の水分量と甘みのバランスを計算中...',
  '食感を損なわない配合比率を調整中...',
  '失敗しない焼き時間と温度の目安を整理中...',
];

export const TransformResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    inputType = 'text',
    recipeText = '濃厚チョコレートブラウニー（薄力粉 100g、砂糖 70g、無塩バター 60g、卵 2個）',
    imagePreview = null,
    selectedIngredients = [],
    preferences = ['砂糖控えめ'],
  } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(2);
  const [cookingTime, setCookingTime] = useState(25);
  const [reproducibility, setReproducibility] = useState<'高' | '中' | '工夫が必要'>('高');
  const [reproducibilityNote, setReproducibilityNote] = useState('');
  const [nutritionEstimate, setNutritionEstimate] = useState('');
  const [failurePoints, setFailurePoints] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<string[]>([]);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(timer);
  }, [loading]);

  const generateRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await transformRecipeWithGemini({ inputType, recipeText, imagePreview, selectedIngredients, preferences });
      setTitle(result.title);
      setDescription(result.description);
      setServings(result.servings);
      setCookingTime(result.cookingTime);
      setReproducibility(result.reproducibility);
      setReproducibilityNote(result.reproducibilityNote);
      setNutritionEstimate(result.nutritionEstimate || '');
      setFailurePoints(result.failurePoints);
      setIngredients(result.ingredients);
      setSteps(result.steps);
    } catch (err: any) {
      setError(err.message || 'レシピの再構築中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      generateRecipe();
    }
  }, []);

  const handleIngredientChange = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleStepChange = (index: number, value: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? value : step)));
  };

  const handleSave = () => {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title, description, servings, cookingTime, reproducibility, reproducibilityNote, nutritionEstimate, failurePoints, ingredients, steps,
      createdAt: new Date().toLocaleDateString('ja-JP'),
    };
    saveRecipe(newRecipe);
    navigate('/my-recipes');
  };

  if (loading) {
    return (
      <main className="page-shell" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '44px 28px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '8px' }}>
          <Loader2 size={40} color="var(--sage-dark)" style={{ animation: 'spin 1.1s linear infinite', margin: '0 auto 20px', display: 'block' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>CRAFTING YOUR RECIPE</div>
          <h2 style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: '28px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>Tailoring every detail...</h2>
          <p style={{ color: 'var(--sage-dark)', fontSize: '14px', fontWeight: 600, margin: 0 }}>{LOADING_MESSAGES[loadingMsgIndex]}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell" style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '28px', backgroundColor: 'var(--card-bg)', border: '1.5px solid var(--terracotta)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--terracotta)', marginBottom: '12px' }}>
            <AlertCircle size={22} /><h3 style={{ margin: 0, fontSize: '17px' }}>レシピを再構築できませんでした</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.7, marginBottom: '20px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={generateRecipe} className="primary-link" style={{ border: 'none', cursor: 'pointer' }}><RefreshCw size={16} /><span>もう一度試す</span></button>
            <Link to="/input" className="secondary-link"><ArrowLeft size={16} /><span>入力画面へ戻る</span></Link>
          </div>
        </div>
      </main>
    );
  }

  const substitutedList = ingredients.filter((i) => i.isSubstituted);

  return (
    <main className="page-shell" style={{ maxWidth: '800px', padding: '36px 0 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <Link to="/input" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textDecoration: 'none' }}>
          <ArrowLeft size={15} /> 条件を変えてやり直す
        </Link>
        <button onClick={generateRecipe} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '40px', padding: '0 16px', backgroundColor: 'var(--card-bg)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
          <RefreshCw size={14} /> 別パターンを提案
        </button>
      </div>

      <header style={{ marginBottom: '28px', borderBottom: '1px solid var(--line)', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={15} color="var(--terracotta)" /><span className="eyebrow">YOUR TAILORED RECIPE</span>
        </div>
        <div style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: 'clamp(28px, 3.6vw, 38px)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '14px' }}>
          Made for your taste.
        </div>
        <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>レシピタイトル（タップして自由に編集できます）</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', fontFamily: 'var(--display-jp)', fontSize: 'clamp(20px, 2.5vw, 24px)', fontWeight: 600, padding: '12px 16px', backgroundColor: 'var(--card-bg)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: '6px', marginBottom: '16px' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '6px' }}>
            <Users size={15} color="var(--sage-dark)" />
            <input type="number" min={1} value={servings} onChange={(e) => setServings(Number(e.target.value))} style={{ width: '44px', border: 'none', borderBottom: '1px solid var(--sand)', backgroundColor: 'transparent', textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }} />
            <span>人分</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '6px' }}>
            <Clock size={15} color="var(--sage-dark)" /><span>約</span>
            <input type="number" min={1} value={cookingTime} onChange={(e) => setCookingTime(Number(e.target.value))} style={{ width: '50px', border: 'none', borderBottom: '1px solid var(--sand)', backgroundColor: 'transparent', textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }} />
            <span>分</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: reproducibility === '高' ? 'var(--sage-pale)' : 'rgba(217, 185, 155, 0.3)', color: reproducibility === '高' ? 'var(--sage-dark)' : '#8a5338', border: `1px solid ${reproducibility === '高' ? 'var(--sage)' : 'var(--sand)'}` }}>
            <CheckCircle2 size={14} /><span>再現性の目安：{reproducibility}</span>
          </div>
        </div>
      </header>

      <section style={{ padding: '22px 24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderLeft: '4px solid var(--sage-dark)', borderRadius: '6px', marginBottom: '32px' }}>
        <div className="eyebrow" style={{ marginBottom: '6px', color: 'var(--sage-dark)' }}>EDITOR&apos;S NOTE &amp; BALANCE</div>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--ink)', lineHeight: 1.8 }}>{reproducibilityNote || description}</p>
        {nutritionEstimate && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'var(--paper)', borderRadius: '4px', fontSize: '12px', color: 'var(--sage-dark)', fontWeight: 600 }}>
            <Info size={14} color="var(--terracotta)" /><span>栄養バランスの目安：{nutritionEstimate}（※AIによる概算推定）</span>
          </div>
        )}
      </section>

      {substitutedList.length > 0 && (
        <section style={{ marginBottom: '36px' }}>
          <div className="eyebrow" style={{ marginBottom: '4px' }}>WHAT CHANGED</div>
          <h2 className="section-title" style={{ fontSize: '20px', marginBottom: '14px' }}>レシピの仕立て直しポイント（Before / After）</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {substitutedList.map((item, idx) => (
              <div key={item.id || idx} style={{ padding: '16px 20px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '14px', fontWeight: 600 }}>
                  <span style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{item.originalIngredient || '元の材料'}</span>
                  <ArrowRight size={15} color="var(--terracotta)" />
                  <span style={{ color: 'var(--sage-dark)' }}>{item.name} {item.amount}{item.unit}</span>
                </div>
                {item.substitutionReason && <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.65 }}>{item.substitutionReason}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {failurePoints.length > 0 && (
        <section style={{ padding: '20px 24px', backgroundColor: 'rgba(217, 185, 155, 0.18)', border: '1px solid var(--sand)', borderRadius: '6px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8a5338', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>
            <AlertTriangle size={16} color="var(--terracotta)" /><span>おいしく仕上げるためのコツ・注意点</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.75 }}>
            {failurePoints.map((pt, i) => <li key={i} style={{ marginBottom: '4px' }}>{pt}</li>)}
          </ul>
        </section>
      )}

      <section style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
          <div><div className="eyebrow" style={{ marginBottom: '4px' }}>INGREDIENTS</div><h2 className="section-title" style={{ fontSize: '20px', margin: 0 }}>材料・分量</h2></div>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>※数値や材料名は直接書き換えられます</span>
        </div>
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '6px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ingredients.map((item, idx) => (
            <div key={item.id || idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingBottom: idx === ingredients.length - 1 ? 0 : '10px', borderBottom: idx === ingredients.length - 1 ? 'none' : '1px dashed var(--line)' }}>
              <input type="text" value={item.name} onChange={(e) => handleIngredientChange(item.id, 'name', e.target.value)} style={{ flex: 2, minHeight: '40px', padding: '6px 10px', backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', fontWeight: item.isSubstituted ? 600 : 400 }} />
              <input type="text" value={item.amount} onChange={(e) => handleIngredientChange(item.id, 'amount', e.target.value)} style={{ width: '72px', minHeight: '40px', padding: '6px 10px', backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid transparent', borderRadius: '4px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }} />
              <input type="text" value={item.unit} onChange={(e) => handleIngredientChange(item.id, 'unit', e.target.value)} style={{ width: '64px', minHeight: '40px', padding: '6px 10px', backgroundColor: 'var(--paper)', color: 'var(--muted)', border: '1px solid transparent', borderRadius: '4px', fontSize: '13px' }} />
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '44px' }}>
        <div className="eyebrow" style={{ marginBottom: '4px' }}>METHOD</div>
        <h2 className="section-title" style={{ fontSize: '20px', marginBottom: '14px' }}>作り方</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((step, index) => (
            <div key={index} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '6px' }}>
              <span style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: '20px', fontWeight: 600, color: 'var(--terracotta)', minWidth: '28px', lineHeight: 1.3, paddingTop: '4px' }}>0{index + 1}</span>
              <textarea rows={2} value={step} onChange={(e) => handleStepChange(index, e.target.value)} style={{ flex: 1, padding: '8px 10px', backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', lineHeight: 1.65, resize: 'vertical' }} />
            </div>
          ))}
        </div>
      </section>

      <button onClick={handleSave} className="primary-link" style={{ width: '100%', minHeight: '56px', fontSize: '15px', cursor: 'pointer' }}>
        <Save size={19} /><span>My Recipes に保存する</span>
      </button>
    </main>
  );
};
