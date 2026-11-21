import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, Sparkles, Clock, Users, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { saveRecipe } from '../utils/storage';
import { transformRecipeWithGemini } from '../utils/gemini';
import type { Recipe, Ingredient } from '../types/recipe';

export const TransformResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    inputType = 'text',
    recipeText = 'サンプル：濃厚チョコレートケーキ（小麦粉100g、砂糖60g、バター50g、卵2個）',
    imagePreview = null,
    selectedIngredients = ['米粉', 'デーツ'],
    preference = 'ヘルシー・砂糖控えめ',
  } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(2);
  const [cookingTime, setCookingTime] = useState(25);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<string[]>([]);

  const generateRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await transformRecipeWithGemini({
        inputType,
        recipeText,
        imagePreview,
        selectedIngredients,
        preference,
      });
      setTitle(result.title);
      setDescription(result.description);
      setServings(result.servings);
      setCookingTime(result.cookingTime);
      setIngredients(result.ingredients);
      setSteps(result.steps);
    } catch (err: any) {
      setError(err.message || 'レシピの生成中にエラーが発生しました。');
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
        <Loader2 size={48} color="#818cf8" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <h3>AIがレシピを再構築しています...</h3>
        <p style={{ color: '#aaa', fontSize: '14px' }}>
          選んだ食材（{selectedIngredients.join('・')}）の水分量や甘みを計算し、最適な分量と手順を作成中です。
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', backgroundColor: '#2a1515', border: '1px solid #ef4444', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', marginBottom: '12px' }}>
          <AlertCircle size={24} />
          <h3 style={{ margin: 0 }}>AI変換エラー</h3>
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
          再試行する
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
          <Sparkles size={20} />
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>AIレシピ再構築完了（内容は自由に編集できます）</span>
        </div>
        <button
          onClick={generateRecipe}
          style={{
            padding: '6px 12px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RefreshCw size={12} /> 再生成
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
          padding: '10px',
          backgroundColor: '#222',
          color: '#fff',
          border: '1px solid #444',
          borderRadius: '8px',
          marginBottom: '12px',
        }}
      />

      {/* 説明文 */}
      <textarea
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          border: '1px solid #334155',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '15px',
        }}
      />

      {/* 人数・調理時間 */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', fontSize: '14px' }}>
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

      {/* 材料リスト */}
      <h3>材料・分量（代替ポイント）</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
        {ingredients.map((item, idx) => (
          <div
            key={item.id || idx}
            style={{
              padding: '12px',
              backgroundColor: item.isSubstituted ? 'rgba(16, 185, 129, 0.1)' : '#222',
              border: item.isSubstituted ? '1px solid #10b981' : '1px solid #333',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleIngredientChange(item.id, 'name', e.target.value)}
                style={{ flex: 2, padding: '6px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              />
              <input
                type="text"
                value={item.amount}
                onChange={(e) => handleIngredientChange(item.id, 'amount', e.target.value)}
                style={{ width: '60px', padding: '6px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', textAlign: 'right' }}
              />
              <input
                type="text"
                value={item.unit}
                onChange={(e) => handleIngredientChange(item.id, 'unit', e.target.value)}
                style={{ width: '60px', padding: '6px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              />
            </div>
            {item.isSubstituted && item.substitutionReason && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '8px', fontSize: '12px', color: '#6ee7b7' }}>
                <RefreshCw size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{item.substitutionReason}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 調理手順 */}
      <h3>調理手順</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
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
          padding: '15px',
          backgroundColor: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
      >
        <Save size={20} /> このレシピをマイレシピに保存する
      </button>
    </div>
  );
};