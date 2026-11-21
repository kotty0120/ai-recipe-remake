import type { Recipe } from '../types/recipe';

const RECIPES_KEY = 'ai_recipe_remake_recipes_v2';
const INGREDIENTS_KEY = 'ai_recipe_remake_ingredients';
const PREFERENCES_KEY = 'ai_recipe_remake_preferences';

const DEFAULT_INGREDIENTS = [
  '米粉',
  'デーツ',
  'おからパウダー',
  '無調整豆乳',
  'オートミール',
  '鶏むね肉',
  '豆腐',
  'アーモンドミルク',
  'ラカント（低糖質甘味料）',
];

export const getSavedRecipes = (): Recipe[] => {
  try {
    const data = localStorage.getItem(RECIPES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveRecipe = (recipe: Recipe): void => {
  const current = getSavedRecipes();
  const updated = [recipe, ...current];
  localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
};

export const updateRecipeNote = (id: string, cookNote: string): void => {
  const current = getSavedRecipes();
  const updated = current.map((r) => (r.id === id ? { ...r, cookNote } : r));
  localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
};

export const deleteRecipe = (id: string): void => {
  const current = getSavedRecipes();
  const updated = current.filter((r) => r.id !== id);
  localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
};

export const getMyIngredients = (): string[] => {
  try {
    const data = localStorage.getItem(INGREDIENTS_KEY);
    return data ? JSON.parse(data) : DEFAULT_INGREDIENTS;
  } catch {
    return DEFAULT_INGREDIENTS;
  }
};

export const saveMyIngredients = (ingredients: string[]): void => {
  localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
};

export const getLastPreferences = (): string[] => {
  try {
    const data = localStorage.getItem(PREFERENCES_KEY);
    return data ? JSON.parse(data) : ['砂糖控えめ'];
  } catch {
    return ['砂糖控えめ'];
  }
};

export const saveLastPreferences = (prefs: string[]): void => {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
};
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ChefHat, Sparkles, BookOpen, Heart, Edit2, Check } from 'lucide-react';
import { RecipeInput } from './pages/RecipeInput';
import { TransformResult } from './pages/TransformResult';
import { MyRecipes } from './pages/MyRecipes';
import { getSavedRecipes, getTasteProfile, saveTasteProfile } from './utils/storage';

const Home = () => {
  const recentRecipes = getSavedRecipes().slice(0, 3);
  const [profile, setProfile] = useState(getTasteProfile());
  const [isEditingTexture, setIsEditingTexture] = useState(false);
  const [textureDraft, setTextureDraft] = useState(profile.texturePreference);

  const topIngredients = Object.entries(profile.favoriteIngredients)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topPreferences = Object.entries(profile.favoritePreferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const handleSaveTexture = () => {
    const updated = { ...profile, texturePreference: textureDraft };
    saveTasteProfile(updated);
    setProfile(updated);
    setIsEditingTexture(false);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '30px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', marginBottom: '14px' }}>
          <ChefHat size={40} color="#10b981" />
        </div>
        <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 'bold', marginBottom: '6px' }}>
          食べたいものを、あきらめない。
        </div>
        <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>AI Recipe Re:Make</h1>
        <p style={{ color: '#aaa', fontSize: '15px', margin: 0 }}>
          好きなレシピを、今の自分と家にある食材に合わせて再構築する。
        </p>
      </div>

      {/* メイン導線 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '28px' }}>
        <Link to="/input" style={{ textDecoration: 'none' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: '#10b981',
              color: '#fff',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={28} style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>レシピを Re:Make</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>スクショ・文章・URLから</div>
          </div>
        </Link>

        <Link to="/my-recipes" style={{ textDecoration: 'none' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: '#222',
              border: '1px solid #444',
              color: '#fff',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <BookOpen size={28} color="#818cf8" style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>My Recipes</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>自分だけのレシピ帳</div>
          </div>
        </Link>
      </div>

      {/* Your Taste Profile（味覚学習カード） */}
      <div
        style={{
          padding: '18px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f472b6', fontWeight: 'bold', fontSize: '14px' }}>
            <Heart size={16} /> Your Taste Profile（AIが学習中のあなたの好み）
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>累計 Re:Make: {profile.totalRemakes}回</span>
        </div>

        {/* 食感・味わいの好み */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>好みの食感・スタイル（次回の変換に自動反映）</div>
          {isEditingTexture ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={textureDraft}
                onChange={(e) => setTextureDraft(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '13px' }}
              />
              <button
                onClick={handleSaveTexture}
                style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                <Check size={14} /> 保存
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
              <span>{profile.texturePreference}</span>
              <button
                onClick={() => setIsEditingTexture(true)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                <Edit2 size={12} /> 編集
              </button>
            </div>
          )}
        </div>

        {/* よく使うお気に入り食材＆傾向 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {topPreferences.map(([pref]) => (
            <span key={pref} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
              #{pref}
            </span>
          ))}
          {topIngredients.map(([ing, count]) => (
            <span key={ing} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>
              {ing} ({count}回)
            </span>
          ))}
          {topPreferences.length === 0 && topIngredients.length === 0 && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              ※レシピをRe:Makeして保存すると、よく使う食材や好みがここに自動で蓄積されます。
            </span>
          )}
        </div>
      </div>

      {/* 最近保存したレシピ */}
      {recentRecipes.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', color: '#ccc', marginBottom: '12px' }}>最近 Re:Make したレシピ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentRecipes.map((r) => (
              <Link key={r.id} to="/my-recipes" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '14px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' }}>
                  <div style={{ fontWeight: 'bold' }}>{r.title}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {r.servings}人分・約{r.cookingTime}分・再現性: {r.reproducibility || '高'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <nav
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'center',
          gap: '28px',
          backgroundColor: '#111',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>ホーム</Link>
        <Link to="/input" style={{ color: '#34d399', textDecoration: 'none' }}>レシピを Re:Make</Link>
        <Link to="/my-recipes" style={{ color: '#fff', textDecoration: 'none' }}>My Recipes</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/input" element={<RecipeInput />} />
        <Route path="/result" element={<TransformResult />} />
        <Route path="/my-recipes" element={<MyRecipes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;