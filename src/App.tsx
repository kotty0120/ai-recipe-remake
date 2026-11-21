import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ChefHat, Sparkles, BookOpen } from 'lucide-react';
import { RecipeInput } from './pages/RecipeInput';
import { TransformResult } from './pages/TransformResult';
import { MyRecipes } from './pages/MyRecipes';
import { getSavedRecipes } from './utils/storage';

const Home = () => {
  const recentRecipes = getSavedRecipes().slice(0, 3);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '30px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
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