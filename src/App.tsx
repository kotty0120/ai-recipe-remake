import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChefHat, Sparkles } from 'lucide-react';
import { RecipeInput } from './pages/RecipeInput';
import { TransformResult } from './pages/TransformResult';
import { MyRecipes } from './pages/MyRecipes';
import { KitchenMode } from './pages/KitchenMode';
import { getSavedRecipes } from './utils/storage';

const Home = () => {
  const recentRecipes = getSavedRecipes().slice(0, 3);

  return (
    <>
      <main className="page-shell">
        <section className="home-hero">
          <div className="hero-copy">
            <div className="eyebrow">COOK YOUR WAY</div>
            <h1 className="hero-en-title">Good food, your way.</h1>
            <p className="hero-jp-title">おいしいを、わたし仕様に。</p>
            <p className="hero-desc">
              好きなレシピに、ちょっとしたひと工夫を。
            </p>

            <div className="hero-actions">
              <Link to="/input" className="primary-link">
                <Sparkles size={18} />
                <span>レシピをRe:Makeする</span>
                <ArrowUpRight size={17} />
              </Link>
              <Link to="/kitchen" className="secondary-link">
                <span>食材から探す</span>
              </Link>
            </div>
          </div>

          <div className="hero-visual-wrap">
            <div className="hero-visual">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1100&q=85"
                alt="温かみのあるテーブルに並ぶ焼き菓子とコーヒー"
              />
            </div>
            <div className="hero-caption-row">
              <span>01 — YOUR NEXT FAVORITE</span>
              <span className="hero-caption-en">A little twist. A lot more you.</span>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="eyebrow">DISCOVER & REMAKE</div>
          <h2 className="section-title">いつもの一皿を、今の気分に合わせて。</h2>
          <p className="section-subtitle">
            グルテンフリー・糖質控えめ・高タンパク・腸活から、冷蔵庫の余りものまで。
          </p>
          <div className="entry-grid">
            <Link to="/input" className="entry-card">
              <div>
                <h3>見つけたレシピをRe:Makeする</h3>
                <p>スクショ・文章・URLから、好みの条件でアレンジ</p>
              </div>
              <span className="entry-icon">
                <Sparkles size={20} />
              </span>
            </Link>
            <Link to="/kitchen" className="entry-card">
              <div>
                <h3>家にある食材から探す</h3>
                <p>手元の材料と気分からつくれるレシピを提案</p>
              </div>
              <span className="entry-icon">
                <ChefHat size={20} />
              </span>
            </Link>
          </div>
        </section>

        <section className="home-section">
          <div className="eyebrow">ENJOY YOUR COLLECTION</div>
          <h2 className="section-title">わたしのレシピ帳</h2>
          <p className="section-subtitle">
            アレンジしたお気に入りや、つくった記録をいつでも見返せます。
          </p>
          {recentRecipes.length > 0 ? (
            <div className="recipe-list">
              {recentRecipes.map((r) => (
                <Link key={r.id} to="/my-recipes" className="recipe-mini">
                  <strong>{r.title}</strong>
                  <span>
                    {r.servings}人分 ・ 約{r.cookingTime}分 ・ 再現性: {r.reproducibility || '高'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              <Link to="/my-recipes" className="secondary-link">
                <span>My Recipes を開く</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">RE:CIPE · GOOD FOOD, YOUR WAY.</footer>
    </>
  );
};

function Navigation() {
  const location = useLocation();
  return (
    <nav className="site-nav">
      <Link to="/" className="brand">
        <span className="brand-mark">
          <ChefHat size={19} />
        </span>
        <span>
          <span className="brand-name">Re:cipe</span>
          <span className="brand-caption">MAKE IT YOURS</span>
        </span>
      </Link>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          ホーム
        </Link>
        <Link to="/input" className={location.pathname === '/input' ? 'active' : ''}>
          Re:Make
        </Link>
        <Link to="/kitchen" className={location.pathname === '/kitchen' ? 'active' : ''}>
          食材から探す
        </Link>
        <Link to="/my-recipes" className={location.pathname === '/my-recipes' ? 'active' : ''}>
          My Recipes
        </Link>
      </div>
    </nav>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/input" element={<RecipeInput />} />
        <Route path="/result" element={<TransformResult />} />
        <Route path="/kitchen" element={<KitchenMode />} />
        <Route path="/my-recipes" element={<MyRecipes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
