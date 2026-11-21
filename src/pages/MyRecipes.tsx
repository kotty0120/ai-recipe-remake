import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Clock, Users, ChefHat, Plus } from 'lucide-react';
import { getSavedRecipes, deleteRecipe } from '../utils/storage';
import type { Recipe } from '../types/recipe';

export const MyRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    setRecipes(getSavedRecipes());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('このレシピを削除してもよろしいですか？')) {
      deleteRecipe(id);
      const updated = getSavedRecipes();
      setRecipes(updated);
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(null);
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>マイレシピ一覧（{recipes.length}件）</h2>
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
            <Plus size={18} /> 新しく変換する
          </button>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#1e1e1e', borderRadius: '12px' }}>
          <ChefHat size={48} color="#666" style={{ marginBottom: '10px' }} />
          <p style={{ color: '#aaa' }}>まだ保存されたレシピがありません。</p>
          <Link to="/input">
            <button style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              最初のレシピを変換してみる
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipe(selectedRecipe?.id === recipe.id ? null : recipe)}
              style={{
                padding: '18px',
                backgroundColor: '#222',
                border: selectedRecipe?.id === recipe.id ? '2px solid #10b981' : '1px solid #333',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{recipe.title}</h3>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#aaa' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} /> {recipe.servings}人分
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {recipe.cookingTime}分
                    </span>
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

              {/* クリックで詳細を開閉 */}
              {selectedRecipe?.id === recipe.id && (
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333' }}>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '15px' }}>{recipe.description}</p>
                  
                  <h4>材料</h4>
                  <ul style={{ paddingLeft: '20px', marginBottom: '15px', fontSize: '14px' }}>
                    {recipe.ingredients.map((ing) => (
                      <li key={ing.id} style={{ marginBottom: '4px' }}>
                        {ing.name}：{ing.amount}{ing.unit}
                        {ing.isSubstituted && <span style={{ color: '#10b981', marginLeft: '8px', fontSize: '12px' }}>★代替</span>}
                      </li>
                    ))}
                  </ul>

                  <h4>作り方</h4>
                  <ol style={{ paddingLeft: '20px', fontSize: '14px' }}>
                    {recipe.steps.map((step, i) => (
                      <li key={i} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};