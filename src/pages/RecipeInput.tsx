import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, FileText, Link2, Sparkles, Plus, Check, AlertCircle } from 'lucide-react';
import { getMyIngredients, saveMyIngredients, getLastPreferences, saveLastPreferences } from '../utils/storage';

const PREFERENCE_OPTIONS = [
  '腸活（発酵・食物繊維）',
  '高タンパク',
  'グルテンフリー',
  '糖質控えめ',
  '砂糖控えめ',
  '脂質・カロリー控えめ',
  '乳製品なし',
  '卵なし',
  'ヴィーガン・植物性',
  'しっとり食感',
  '時短・簡単',
];

export const RecipeInput = () => {
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<'image' | 'text' | 'url'>('text');
  const [recipeText, setRecipeText] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [urlNotice, setUrlNotice] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<string[]>(getLastPreferences());
  const [availableList, setAvailableList] = useState<string[]>(getMyIngredients());
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUrlCheck = () => {
    if (!recipeUrl.trim()) return;
    setUrlNotice(true);
  };

  const togglePreference = (pref: string) => {
    setPreferences((prev) => (prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]));
  };

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
    <main className="page-shell" style={{ maxWidth: '760px', padding: '40px 0 80px' }}>
      <header style={{ marginBottom: '28px' }}>
        <div className="eyebrow" style={{ marginBottom: '8px' }}>RE:MAKE YOUR FAVORITE</div>
        <h1 style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.15, margin: '0 0 10px 0' }}>
          Make it yours.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
          気になるレシピを取り込んで、今の気分や体質、家にある食材に合わせて仕立て直します。
        </p>
      </header>

      <section style={{ padding: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '24px' }}>
        <div className="eyebrow" style={{ marginBottom: '4px', color: 'var(--sage-dark)' }}>STEP 01 — SOURCE RECIPE</div>
        <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>元のレシピを取り込む</h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { setInputType('image'); setUrlNotice(false); }} style={{ flex: 1, minWidth: '130px', minHeight: '46px', padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', backgroundColor: inputType === 'image' ? 'var(--ink)' : 'var(--paper)', color: inputType === 'image' ? 'var(--paper)' : 'var(--ink)', border: `1px solid ${inputType === 'image' ? 'var(--ink)' : 'var(--line)'}`, borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
            <ImageIcon size={16} /> スクショ・写真
          </button>
          <button type="button" onClick={() => { setInputType('text'); setUrlNotice(false); }} style={{ flex: 1, minWidth: '130px', minHeight: '46px', padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', backgroundColor: inputType === 'text' ? 'var(--ink)' : 'var(--paper)', color: inputType === 'text' ? 'var(--paper)' : 'var(--ink)', border: `1px solid ${inputType === 'text' ? 'var(--ink)' : 'var(--line)'}`, borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
            <FileText size={16} /> レシピ文章
          </button>
          <button type="button" onClick={() => setInputType('url')} style={{ flex: 1, minWidth: '130px', minHeight: '46px', padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', backgroundColor: inputType === 'url' ? 'var(--ink)' : 'var(--paper)', color: inputType === 'url' ? 'var(--paper)' : 'var(--ink)', border: `1px solid ${inputType === 'url' ? 'var(--ink)' : 'var(--line)'}`, borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
            <Link2 size={16} /> URLリンク
          </button>
        </div>

        {inputType === 'image' && (
          <div style={{ border: '1.5px dashed var(--sage)', backgroundColor: 'var(--paper)', borderRadius: '6px', padding: '28px 20px', textAlign: 'center' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '12px', fontSize: '13px' }} />
            {imagePreview ? (
              <img src={imagePreview} alt="プレビュー" style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '6px', display: 'block', margin: '10px auto 0', border: '1px solid var(--line)' }} />
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>InstagramやPinterestのレシピスクリーンショット、料理写真を選択してください</p>
            )}
          </div>
        )}

        {inputType === 'text' && (
          <textarea rows={5} placeholder="例：&#13;&#10;【材料】薄力粉 100g、砂糖 70g、無塩バター 60g、卵 2個&#13;&#10;【作り方】材料を混ぜて180度で25分焼く。" value={recipeText} onChange={(e) => setRecipeText(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '6px', backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)', fontSize: '14px', lineHeight: 1.65 }} />
        )}

        {inputType === 'url' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input type="url" placeholder="https://www.instagram.com/p/... またはレシピサイトURL" value={recipeUrl} onChange={(e) => { setRecipeUrl(e.target.value); setUrlNotice(false); }} style={{ flex: 1, minWidth: '220px', minHeight: '48px', padding: '0 14px', borderRadius: '6px', backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)', fontSize: '14px' }} />
              <button type="button" onClick={handleUrlCheck} className="secondary-link" style={{ minHeight: '48px', padding: '0 18px' }}>読み込む</button>
            </div>
            {urlNotice && (
              <div style={{ marginTop: '14px', padding: '16px', backgroundColor: 'rgba(217, 185, 155, 0.2)', border: '1px solid var(--sand)', borderRadius: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8a5338', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertCircle size={16} color="var(--terracotta)" />
                  <span>このリンクは外部から直接テキストを取得できない形式です</span>
                </div>
                <p style={{ margin: '0 0 12px 0', color: 'var(--ink)', lineHeight: 1.6 }}>投稿のスクリーンショットを撮って読み込むか、材料の文章をコピーして貼り付けるとすぐに再構築できます。</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => { setInputType('image'); setUrlNotice(false); }} className="primary-link" style={{ minHeight: '40px', padding: '0 14px', fontSize: '12px' }}>スクリーンショットを選ぶ</button>
                  <button type="button" onClick={() => { setInputType('text'); setUrlNotice(false); }} className="secondary-link" style={{ minHeight: '40px', padding: '0 14px', fontSize: '12px' }}>文章を貼り付ける</button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section style={{ padding: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '24px' }}>
        <div className="eyebrow" style={{ marginBottom: '4px', color: 'var(--sage-dark)' }}>STEP 02 — PREFERENCES</div>
        <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '4px' }}>どんな風に仕立て直す？</h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>複数選択できます。未選択の場合は、美味しさとバランスを重視しておまかせで調整します。</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {PREFERENCE_OPTIONS.map((pref) => {
            const active = preferences.includes(pref);
            return (
              <button key={pref} type="button" onClick={() => togglePreference(pref)} style={{ minHeight: '42px', padding: '8px 16px', borderRadius: '24px', border: active ? '1.5px solid var(--sage-dark)' : '1px solid var(--line)', backgroundColor: active ? 'var(--sage-pale)' : 'var(--paper)', color: active ? 'var(--ink)' : 'var(--muted)', fontSize: '13px', fontWeight: active ? 600 : 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {active && <Check size={14} color="var(--sage-dark)" />}
                <span>{pref}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ padding: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '32px' }}>
        <div className="eyebrow" style={{ marginBottom: '4px', color: 'var(--sage-dark)' }}>STEP 03 — PANTRY ITEMS (OPTIONAL)</div>
        <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '4px' }}>使いたい手持ち食材（任意）</h2>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>家にある食材をタップすると、優先的にレシピへ組み込みます。</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {availableList.map((item) => {
            const isSelected = selectedIngredients.includes(item);
            return (
              <button key={item} type="button" onClick={() => toggleIngredient(item)} style={{ minHeight: '40px', padding: '6px 14px', borderRadius: '20px', border: isSelected ? '1.5px solid var(--terracotta)' : '1px solid var(--line)', backgroundColor: isSelected ? 'rgba(185, 111, 80, 0.14)' : 'var(--paper)', color: isSelected ? 'var(--ink)' : 'var(--muted)', fontSize: '13px', fontWeight: isSelected ? 600 : 500, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {isSelected && <Check size={13} color="var(--terracotta)" />}
                <span>{item}</span>
              </button>
            );
          })}
        </div>
        <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="食材を追加（例：塩麹、オートミール、豆乳、バナナ）" value={newIngredient} onChange={(e) => setNewIngredient(e.target.value)} style={{ flex: 1, minHeight: '46px', padding: '0 14px', borderRadius: '6px', backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)', fontSize: '13px' }} />
          <button type="submit" className="secondary-link" style={{ minHeight: '46px', padding: '0 16px', fontSize: '13px' }}><Plus size={15} /><span>追加</span></button>
        </form>
      </section>

      <button type="button" onClick={handleStartRemake} className="primary-link" style={{ width: '100%', minHeight: '56px', fontSize: '15px', cursor: 'pointer' }}>
        <Sparkles size={19} /><span>この条件でレシピをRe:Makeする</span>
      </button>
    </main>
  );
};
