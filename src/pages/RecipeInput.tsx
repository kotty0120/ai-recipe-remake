import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, FileText, Link2, Sparkles, Plus, Check, AlertCircle } from 'lucide-react';
import {
  getMyIngredients,
  saveMyIngredients,
  getLastPreferences,
  saveLastPreferences,
} from '../utils/storage';

const PREFERENCE_OPTIONS = [
  'いつもの食感・美味しさ重視',
  'グルテンフリー',
  '砂糖控えめ',
  '高タンパク',
  '脂質オフ・軽め',
  '家にある材料を使い切る',
];

export const RecipeInput = () => {
  const navigate = useNavigate();

  // 1. レシピ入力ステート
  const [inputType, setInputType] = useState<'image' | 'text' | 'url'>('image');
  const [recipeText, setRecipeText] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [urlNotice, setUrlNotice] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 2. 条件・食材ステート（前回の条件を自動復元）
  const [preferences, setPreferences] = useState<string[]>(getLastPreferences());
  const [availableList, setAvailableList] = useState<string[]>(getMyIngredients());
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlCheck = () => {
    if (!recipeUrl.trim()) return;
    // フロントエンド単体でのCORS/SNSブロックをユーザーに意識させない3段階フォールバック案内
    setUrlNotice(true);
  };

  const togglePreference = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

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

  const handleStartRemake = () => {
    saveLastPreferences(preferences);
    const effectiveInputType = inputType === 'url' ? 'text' : inputType;
    const fallbackText =
      recipeText.trim() ||
      (recipeUrl.trim() ? `参考URL: ${recipeUrl.trim()}` : '') ||
      '濃厚チョコレートブラウニー（薄力粉 100g、砂糖 70g、無塩バター 60g、卵 2個、板チョコ 100g）';

    navigate('/result', {
      state: {
        inputType: effectiveInputType,
        recipeText: fallbackText,
        imagePreview: effectiveInputType === 'image' ? imagePreview : null,
        selectedIngredients,
        preferences,
      },
    });
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px' }}>
      <h2>食べたいレシピを取り込む</h2>
      <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
        SNSで見つけたレシピやいつもの料理を、今の自分仕様に再構築します。
      </p>

      {/* 入力方法の切り替えタブ（3種類） */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => { setInputType('image'); setUrlNotice(false); }}
          style={{
            flex: 1,
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: inputType === 'image' ? '#4f46e5' : '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          <ImageIcon size={16} /> スクショ・写真
        </button>
        <button
          onClick={() => { setInputType('text'); setUrlNotice(false); }}
          style={{
            flex: 1,
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: inputType === 'text' ? '#4f46e5' : '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          <FileText size={16} /> レシピ文章
        </button>
        <button
          onClick={() => setInputType('url')}
          style={{
            flex: 1,
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: inputType === 'url' ? '#4f46e5' : '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          <Link2 size={16} /> URLリンク
        </button>
      </div>

      {/* A. 画像入力 */}
      {inputType === 'image' && (
        <div
          style={{
            border: '2px dashed #555',
            borderRadius: '10px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '12px' }} />
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="プレビュー"
              style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '8px', display: 'block', margin: '0 auto' }}
            />
          ) : (
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
              レシピのスクリーンショットや料理写真を選択してください
            </p>
          )}
        </div>
      )}

      {/* B. テキスト入力 */}
      {inputType === 'text' && (
        <div style={{ marginBottom: '24px' }}>
          <textarea
            rows={6}
            placeholder="例：&#13;&#10;【材料】薄力粉 100g、砂糖 70g、無塩バター 60g、卵 2個&#13;&#10;【作り方】材料を混ぜて180度で25分焼く。"
            value={recipeText}
            onChange={(e) => setRecipeText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #444',
              fontSize: '14px',
            }}
          />
        </div>
      )}

      {/* C. URL入力（3段階フォールバックUX） */}
      {inputType === 'url' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              placeholder="https://www.instagram.com/p/... またはレシピサイトURL"
              value={recipeUrl}
              onChange={(e) => { setRecipeUrl(e.target.value); setUrlNotice(false); }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleUrlCheck}
              style={{
                padding: '0 16px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              読み込む
            </button>
          </div>

          {urlNotice && (
            <div style={{ marginTop: '12px', padding: '14px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '6px' }}>
                <AlertCircle size={16} /> このリンクは外部から直接データを取得できない形式です
              </div>
              <p style={{ margin: '0 0 10px 0', color: '#cbd5e1', lineHeight: '1.5' }}>
                でも大丈夫です！投稿のスクリーンショットを撮って読み込むか、材料の文章をコピーして貼り付けるとすぐに再構築できます。
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setInputType('image'); setUrlNotice(false); }}
                  style={{ padding: '6px 12px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  スクリーンショットを選ぶ
                </button>
                <button
                  onClick={() => { setInputType('text'); setUrlNotice(false); }}
                  style={{ padding: '6px 12px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  文章を貼り付ける
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '24px 0' }} />

      {/* アレンジの方向性（複数選択・前回設定を記憶） */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>どんな風にアレンジする？（複数選択可・未選択ならおまかせ）</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {PREFERENCE_OPTIONS.map((pref) => {
            const active = preferences.includes(pref);
            return (
              <button
                key={pref}
                onClick={() => togglePreference(pref)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: active ? '2px solid #818cf8' : '1px solid #444',
                  backgroundColor: active ? 'rgba(99, 102, 241, 0.2)' : '#1e1e1e',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {active && <Check size={14} color="#818cf8" />}
                {pref}
              </button>
            );
          })}
        </div>
      </div>

      {/* 使いたい手持ち食材（任意指定） */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>使いたい手持ち食材（任意・選ばなければAIにおまかせ）</h3>
        <p style={{ fontSize: '12px', color: '#888', marginTop: 0, marginBottom: '10px' }}>
          家にある食材をタップすると優先的にレシピへ組み込みます。
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {availableList.map((item) => {
            const isSelected = selectedIngredients.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleIngredient(item)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid #10b981' : '1px solid #444',
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : '#1e1e1e',
                  color: '#fff',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                {isSelected && <Check size={13} color="#10b981" />}
                {item}
              </button>
            );
          })}
        </div>

        {/* 今回使いたい食材の追加 */}
        <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input
            type="text"
            placeholder="食材を追加（例：バナナ、プロテイン、豆乳）"
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

      {/* 実行ボタン */}
      <button
        onClick={handleStartRemake}
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
        <Sparkles size={20} /> Let&apos;s Re:Make（あなた仕様に再構築する）
      </button>
    </div>
  );
};