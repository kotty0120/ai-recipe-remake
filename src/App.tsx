import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ChefHat, Sparkles, BookOpen } from 'lucide-react';
import { RecipeInput } from './pages/RecipeInput';
import { IngredientSelect } from './pages/IngredientSelect';
import { TransformResult } from './pages/TransformResult';
import { MyRecipes } from './pages/MyRecipes';
import { getSavedRecipes } from './utils/storage';

const Home = () => {
  const recentRecipes = getSavedRecipes().slice(0, 3);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '30px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', backgroundColor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', marginBottom: '15px' }}>
          <ChefHat size={40} color="#818cf8" />
        </div>
        <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>AI Recipe Re:Make</h1>
        <p style={{ color: '#aaa', fontSize: '16px', margin: 0 }}>
          好きな料理を、今ある食材で、もっと自分らしく。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
        <Link to="/input" style={{ textDecoration: 'none' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={28} style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>レシピを変換する</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>画像・文章から再構築</div>
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
            <BookOpen size={28} color="#10b981" style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>マイレシピ一覧</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>保存したレシピを見る</div>
          </div>
        </Link>
      </div>

      {/* 最近保存したレシピ */}
      {recentRecipes.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', color: '#ccc', marginBottom: '12px' }}>最近保存したレシピ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentRecipes.map((r) => (
              <Link key={r.id} to="/my-recipes" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '14px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' }}>
                  <div style={{ fontWeight: 'bold' }}>{r.title}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {r.servings}人分・約{r.cookingTime}分
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
          padding: '12px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          backgroundColor: '#111',
          fontSize: '14px',
        }}
      >
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>ホーム</Link>
        <Link to="/input" style={{ color: '#fff', textDecoration: 'none' }}>1.入力</Link>
        <Link to="/ingredients" style={{ color: '#fff', textDecoration: 'none' }}>2.食材</Link>
        <Link to="/result" style={{ color: '#fff', textDecoration: 'none' }}>3.結果</Link>
        <Link to="/my-recipes" style={{ color: '#fff', textDecoration: 'none' }}>マイレシピ</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/input" element={<RecipeInput />} />
        <Route path="/ingredients" element={<IngredientSelect />} />
        <Route path="/result" element={<TransformResult />} />
        <Route path="/my-recipes" element={<MyRecipes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;