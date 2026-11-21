import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Clock, Users, ChefHat, Plus, CheckSquare, Square, Edit3, Share2 } from 'lucide-react';
import { getSavedRecipes, deleteRecipe, updateRecipeNote } from '../utils/storage';
import { ShareCardModal } from '../components/ShareCardModal';
import type { Recipe } from '../types/recipe';

export const MyRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [noteDraft, setNoteDraft] = useState('');
  const [shareTargetRecipe, setShareTargetRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    setRecipes(getSavedRecipes());
  }, []);

  const handleSelectRecipe = (recipe: Recipe) => {
    if (selectedRecipeId === recipe.id) {
      setSelectedRecipeId(null);
    } else {
      setSelectedRecipeId(recipe.id);
      setNoteDraft(recipe.cookNote || '');
    }
  };

  const toggleCheck = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateRecipeNote(id, noteDraft);
    setRecipes(getSavedRecipes());
    alert('作ったメモを保存しました！');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('このレシピを削除してもよろしいですか？')) {
      deleteRecipe(id);
      setRecipes(getSavedRecipes());
      if (selectedRecipeId === id) {
        setSelectedRecipeId(null);
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Recipes（{recipes.length}件）</h2>
        <Link to="/input" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '10px 16px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            <Plus size={18} /> 新しく Re:Make する
          </button>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#1e1e1e', borderRadius: '12px' }}>
          <ChefHat size={48} color="#666" style={{ marginBottom: '10px' }} />
          <p style={{ color: '#aaa' }}>まだ保存されたレシピがありません。</p>
          <Link to="/input">
            <button style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              最初のレシピを Re:Make する
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {recipes.map((recipe) => {
            const isOpen = selectedRecipeId === recipe.id;
            return (
              <div
                key={recipe.id}
                onClick={() => handleSelectRecipe(recipe)}
                style={{
                  padding: '18px',
                  backgroundColor: '#222',
                  border: isOpen ? '2px solid #10b981' : '1px solid #333',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{recipe.title}</h3>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#aaa', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} /> {recipe.servings}人分
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {recipe.cookingTime}分
                      </span>
                      {recipe.reproducibility && (
                        <span style={{ color: '#34d399' }}>再現性: {recipe.reproducibility}</span>
                      )}
                      <span>保存日: {recipe.createdAt}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(recipe.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '6px',
                    }}
                    title="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* クリックで詳細・キッチンモード開閉 */}
                {isOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #333', cursor: 'default' }}
                  >
                    {/* Re:Make Challenge シェアカード生成ボタン */}
                    <button
                      onClick={() => setShareTargetRecipe(recipe)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginBottom: '18px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        color: '#34d399',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <Share2 size={16} /> Re:Make Challenge カードを作る（SNSシェア用画像）
                    </button>

                    <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '16px', lineHeight: '1.6' }}>
                      {recipe.description}
                    </p>

                    {/* 材料チェックリスト */}
                    <h4 style={{ marginBottom: '8px' }}>材料（タップで準備チェック）</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                      {recipe.ingredients.map((ing, i) => {
                        const checkKey = `${recipe.id}-${i}`;
                        const checked = !!checkedItems[checkKey];
                        return (
                          <div
                            key={ing.id || i}
                            onClick={(e) => toggleCheck(checkKey, e)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 8px',
                              backgroundColor: '#1a1a1a',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              textDecoration: checked ? 'line-through' : 'none',
                              color: checked ? '#666' : '#fff',
                              fontSize: '14px',
                            }}
                          >
                            {checked ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color="#888" />}
                            <span>
                              {ing.name}：{ing.amount}{ing.unit}
                            </span>
                            {ing.isSubstituted && (
                              <span style={{ color: '#10b981', fontSize: '11px', marginLeft: 'auto' }}>★Re:Make</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 作り方 */}
                    <h4 style={{ marginBottom: '8px' }}>作り方</h4>
                    <ol style={{ paddingLeft: '20px', fontSize: '14px', marginBottom: '20px' }}>
                      {recipe.steps.map((step, i) => (
                        <li key={i} style={{ marginBottom: '8px', lineHeight: '1.6' }}>{step}</li>
                      ))}
                    </ol>

                    {/* 失敗ポイント */}
                    {recipe.failurePoints && recipe.failurePoints.length > 0 && (
                      <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#fde68a' }}>
                        <strong>注意ポイント：</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                          {recipe.failurePoints.map((pt, idx) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 作ったメモ・改善記録 */}
                    <div style={{ padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#a5b4fc' }}>
                        <Edit3 size={14} /> 作った記録・次回アレンジメモ
                      </div>
                      <textarea
                        rows={2}
                        placeholder="例：焼き時間は20分でちょうど良かった！次はココアを少し増やす。"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#222',
                          color: '#fff',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          fontSize: '13px',
                          marginBottom: '8px',
                        }}
                      />
                      <button
                        onClick={(e) => handleSaveNote(recipe.id, e)}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#4f46e5',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        メモを保存
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* シェアカード生成モーダル */}
      {shareTargetRecipe && (
        <ShareCardModal
          recipe={shareTargetRecipe}
          onClose={() => setShareTargetRecipe(null)}
        />
      )}
    </div>
  );
};