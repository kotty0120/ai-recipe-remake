import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Save,
  Sparkles,
  Clock,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
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
    const timer = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [loading]);

  const generateRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await transformRecipeWithGemini({
        inputType,
        recipeText,
        imagePreview,
        selectedIngredients,
        preferences,
      });
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
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleStepChange = (index: number, value: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? value : step)));
  };

  const handleSave = () => {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title,
      description,
      servings,
      cookingTime,
      reproducibility,
      reproducibilityNote,
      nutritionEstimate,
      failurePoints,
      ingredients,
      steps,
      createdAt: new Date().toLocaleDateString('ja-JP'),
    };
    saveRecipe(newRecipe);
    navigate('/my-recipes');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '20px' }}>
        <Loader2 size={48} color="#10b981" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <h3 style={{ marginBottom: '8px' }}>おいしくなるように調整中...</h3>
        <p style={{ color: '#a7f3d0', fontSize: '15px', fontWeight: 'bold' }}>
          {LOADING_MESSAGES[loadingMsgIndex]}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', backgroundColor: '#2a1515', border: '1px solid #ef4444', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', marginBottom: '12px' }}>
          <AlertCircle size={24} />
          <h3 style={{ margin: 0 }}>レシピを再構築できませんでした</h3>
        </div>
        <p style={{ fontSize: '14px', color: '#fca5a5', lineHeight: '1.6' }}>{error}</p>
        <button
          onClick={generateRecipe}
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Try another version（再試行する）
        </button>
      </div>
    );
  }

  const substitutedList = ingredients.filter((i) => i.isSubstituted);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
          <Sparkles size={20} />
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Your recipe is ready!（自由に編集・微調整できます）</span>
        </div>
        <button
          onClick={generateRecipe}
          style={{
            padding: '6px 12px',
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RefreshCw size={12} /> Try another version
        </button>
      </div>

      {/* 料理名 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: '100%',
          fontSize: '22px',
          fontWeight: 'bold',
          padding: '12px',
          backgroundColor: '#222',
          color: '#fff',
          border: '1px solid #444',
          borderRadius: '8px',
          marginBottom: '12px',
        }}
      />

      {/* 再現性の見込みバッジ＆解説 */}
      <div
        style={{
          padding: '14px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: reproducibility === '高' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: reproducibility === '高' ? '#34d399' : '#fbbf24',
              border: `1px solid ${reproducibility === '高' ? '#10b981' : '#f59e0b'}`,
            }}
          >
            <CheckCircle2 size={14} /> 再現性の見込み：{reproducibility}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>※AIによる仕上がり推定</span>
        </div>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5' }}>
          {reproducibilityNote || description}
        </p>
        {nutritionEstimate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#93c5fd' }}>
            <Info size={14} />
            <span>栄養変化の目安：{nutritionEstimate}</span>
          </div>
        )}
      </div>

      {/* 人数・調理時間 */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={16} color="#94a3b8" />
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            style={{ width: '50px', padding: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          />
          <span>人分</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} color="#94a3b8" />
          <span>約</span>
          <input
            type="number"
            value={cookingTime}
            onChange={(e) => setCookingTime(Number(e.target.value))}
            style={{ width: '60px', padding: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          />
          <span>分</span>
        </div>
      </div>

      {/* Before / After 変更ポイント比較 */}
      {substitutedList.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>今回の Re:Make ポイント（Before / After）</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {substitutedList.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontWeight: 'bold', fontSize: '14px' }}>
                  <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                    {item.originalIngredient || '元の材料'}
                  </span>
                  <ArrowRight size={14} color="#10b981" />
                  <span style={{ color: '#34d399' }}>
                    {item.name} {item.amount}{item.unit}
                  </span>
                </div>
                {item.substitutionReason && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                    {item.substitutionReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 失敗しないための注意ポイント */}
      {failurePoints.length > 0 && (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '10px',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
            <AlertTriangle size={16} /> 失敗しないための注意ポイント
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#fde68a', lineHeight: '1.6' }}>
            {failurePoints.map((pt, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 材料・分量（編集可能） */}
      <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>材料・分量</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
        {ingredients.map((item, idx) => (
          <div key={item.id || idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleIngredientChange(item.id, 'name', e.target.value)}
              style={{ flex: 2, padding: '8px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '14px' }}
            />
            <input
              type="text"
              value={item.amount}
              onChange={(e) => handleIngredientChange(item.id, 'amount', e.target.value)}
              style={{ width: '70px', padding: '8px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '6px', textAlign: 'right', fontSize: '14px' }}
            />
            <input
              type="text"
              value={item.unit}
              onChange={(e) => handleIngredientChange(item.id, 'unit', e.target.value)}
              style={{ width: '65px', padding: '8px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
        ))}
      </div>

      {/* 調理手順（編集可能） */}
      <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>作り方</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
        {steps.map((step, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span
              style={{
                backgroundColor: '#4f46e5',
                color: '#fff',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 'bold',
                flexShrink: 0,
                marginTop: '6px',
              }}
            >
              {index + 1}
            </span>
            <textarea
              rows={2}
              value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            />
          </div>
        ))}
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
      >
        <Save size={20} /> My Recipe に追加する
      </button>
    </div>
  );
};