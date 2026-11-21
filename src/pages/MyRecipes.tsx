import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Clock, Users, ChefHat, Plus, CheckSquare, Square, Edit3, Check, AlertTriangle } from 'lucide-react';
import { getSavedRecipes, deleteRecipe, updateRecipeNote } from '../utils/storage';
import type { Recipe } from '../types/recipe';

export const MyRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [noteDraft, setNoteDraft] = useState('');
  const [savedToastId, setSavedToastId] = useState<string | null>(null);

  useEffect(() => { setRecipes(getSavedRecipes()); }, []);

  const handleSelectRecipe = (recipe: Recipe) => {
    if (selectedRecipeId === recipe.id) setSelectedRecipeId(null);
    else { setSelectedRecipeId(recipe.id); setNoteDraft(recipe.cookNote || ''); }
  };

  const toggleCheck = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateRecipeNote(id, noteDraft);
    setRecipes(getSavedRecipes());
    setSavedToastId(id);
    setTimeout(() => setSavedToastId(null), 2000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('このレシピを削除してもよろしいですか？')) {
      deleteRecipe(id);
      setRecipes(getSavedRecipes());
      if (selectedRecipeId === id) setSelectedRecipeId(null);
    }
  };

  return (
    <main className="page-shell" style={{ maxWidth: '820px', padding: '40px 0 80px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--line)' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: '6px' }}>YOUR RECIPE JOURNAL ({recipes.length})</div>
          <h1 style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.15, margin: '0 0 6px 0' }}>My Recipes</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>あなた仕様に仕立て直したレシピ帳と、キッチンのメモ。</p>
        </div>
        <Link to="/input" className="primary-link" style={{ minHeight: '48px', padding: '0 20px', fontSize: '13px' }}>
          <Plus size={16} /><span>新しく Re:Make する</span>
        </Link>
      </header>

      {recipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: '8px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: 'var(--sage-pale)', color: 'var(--sage-dark)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><ChefHat size={26} /></div>
          <h3 style={{ fontFamily: 'var(--display-jp)', fontSize: '18px', marginBottom: '8px' }}>まだ保存されたレシピがありません</h3>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>お気に入りのレシピをアレンジして、最初の1ページを追加してみましょう。</p>
          <Link to="/input" className="primary-link"><span>最初のレシピを Re:Make する</span></Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recipes.map((recipe) => {
            const isOpen = selectedRecipeId === recipe.id;
            return (
              <article key={recipe.id} onClick={() => handleSelectRecipe(recipe)} style={{ padding: '22px 24px', backgroundColor: 'var(--card-bg)', border: isOpen ? '1.5px solid var(--sage-dark)' : '1px solid var(--line)', borderRadius: '8px', cursor: 'pointer', boxShadow: isOpen ? '0 12px 28px rgba(48, 58, 48, 0.06)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--display-jp)', margin: '0 0 10px 0', fontSize: '18px', color: 'var(--ink)' }}>{recipe.title}</h2>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Users size={14} color="var(--sage-dark)" /> {recipe.servings}人分</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} color="var(--sage-dark)" /> 約{recipe.cookingTime}分</span>
                      {recipe.reproducibility && <span style={{ padding: '2px 10px', borderRadius: '12px', backgroundColor: 'var(--sage-pale)', color: 'var(--sage-dark)', fontWeight: 600 }}>再現性: {recipe.reproducibility}</span>}
                      <span>保存日: {recipe.createdAt}</span>
                    </div>
                  </div>
                  <button type="button" onClick={(e) => handleDelete(recipe.id, e)} style={{ background: 'none', border: 'none', color: 'var(--muted)', padding: '8px', borderRadius: '4px' }} title="削除"><Trash2 size={17} /></button>
                </div>

                {isOpen && (
                  <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--line)', cursor: 'default' }}>
                    {recipe.description && <p style={{ fontSize: '14px', color: 'var(--ink)', marginBottom: '20px', lineHeight: 1.75 }}>{recipe.description}</p>}
                    <div style={{ marginBottom: '24px' }}>
                      <div className="eyebrow" style={{ marginBottom: '4px', color: 'var(--sage-dark)' }}>INGREDIENTS CHECKLIST</div>
                      <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>材料（タップで準備チェック）</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recipe.ingredients.map((ing, i) => {
                          const checkKey = `${recipe.id}-${i}`;
                          const checked = !!checkedItems[checkKey];
                          return (
                            <div key={ing.id || i} onClick={(e) => toggleCheck(checkKey, e)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'var(--paper)', borderRadius: '6px', cursor: 'pointer', textDecoration: checked ? 'line-through' : 'none', color: checked ? 'var(--muted)' : 'var(--ink)', fontSize: '14px' }}>
                              {checked ? <CheckSquare size={17} color="var(--sage-dark)" /> : <Square size={17} color="var(--muted)" />}
                              <span>{ing.name}：{ing.amount}{ing.unit}</span>
                              {ing.isSubstituted && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: 'var(--terracotta)', backgroundColor: 'rgba(185, 111, 80, 0.12)', padding: '2px 8px', borderRadius: '10px' }}>Re:Make</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <div className="eyebrow" style={{ marginBottom: '4px', color: 'var(--sage-dark)' }}>METHOD</div>
                      <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>作り方</h3>
                      <ol style={{ paddingLeft: '20px', fontSize: '14px', margin: 0, color: 'var(--ink)' }}>
                        {recipe.steps.map((step, i) => <li key={i} style={{ marginBottom: '10px', lineHeight: 1.7 }}>{step}</li>)}
                      </ol>
                    </div>

                    {recipe.failurePoints && recipe.failurePoints.length > 0 && (
                      <div style={{ padding: '16px', backgroundColor: 'rgba(217, 185, 155, 0.2)', border: '1px solid var(--sand)', borderRadius: '6px', marginBottom: '24px', fontSize: '13px', color: 'var(--ink)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#8a5338', marginBottom: '6px' }}>
                          <AlertTriangle size={15} color="var(--terracotta)" /><span>おいしく仕上げるコツ・注意点</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>{recipe.failurePoints.map((pt, idx) => <li key={idx}>{pt}</li>)}</ul>
                      </div>
                    )}

                    <div style={{ padding: '16px 18px', backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--sage-dark)' }}><Edit3 size={14} /><span>作った記録・次回アレンジメモ</span></div>
                      <textarea rows={2} placeholder="例：焼き時間は20分でしっとり仕上がった！次は甘酒を少し足してみる。" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--card-bg)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', lineHeight: 1.6, marginBottom: '10px' }} />
                      <button type="button" onClick={(e) => handleSaveNote(recipe.id, e)} className="primary-link" style={{ minHeight: '40px', padding: '0 16px', fontSize: '12px' }}>
                        {savedToastId === recipe.id ? (<><Check size={14} /><span>メモを保存しました</span></>) : (<span>メモを保存する</span>)}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};
