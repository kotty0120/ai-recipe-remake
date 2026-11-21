import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Check } from 'lucide-react';
import { getMyIngredients, saveMyIngredients } from '../utils/storage';

export const IngredientSelect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prevData = location.state || {};

  const [availableList, setAvailableList] = useState<string[]>(getMyIngredients());
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['米粉', 'デーツ']);
  const [newIngredient, setNewIngredient] = useState('');
  const [preference, setPreference] = useState('ヘルシー・砂糖控えめ');

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
      saveMyIngredients(updated); // LocalStorageに保存
      setSelectedIngredients([...selectedIngredients, trimmed]);
      setNewIngredient('');
    }
  };

  const handleTransform = () => {
    navigate('/result', {
      state: {
        ...prevData,
        selectedIngredients,
        preference,
      },
    });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>2. 使いたい食材・条件を選択</h2>
      <p style={{ color: '#aaa', fontSize: '14px' }}>
        家にある食材や、今回のアレンジで優先したい条件を選んでください。
      </p>

      {/* 手持ち食材リスト */}
      <div style={{ margin: '20px 0' }}>
        <h3>手持ち食材から選ぶ</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
          {availableList.map((item) => {
            const isSelected = selectedIngredients.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleIngredient(item)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: isSelected ? '2px solid #10b981' : '1px solid #555',
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : '#222',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                {isSelected && <Check size={14} color="#10b981" />}
                {item}
              </button>
            );
          })}
        </div>

        {/* 新しい食材の追加 */}
        <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
          <input
            type="text"
            placeholder="新しい食材を追加（例：豆乳、プロテイン）"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #444',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> 追加
          </button>
        </form>
      </div>

      {/* アレンジの方向性 */}
      <div style={{ margin: '25px 0' }}>
        <h3>アレンジの方向性</h3>
        <select
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #444',
            marginTop: '8px',
            fontSize: '15px',
          }}
        >
          <option value="ヘルシー・砂糖控えめ">ヘルシー・砂糖控えめ</option>
          <option value="高タンパク（ボディメイク向け）">高タンパク（ボディメイク向け）</option>
          <option value="グルテンフリー（小麦不使用）">グルテンフリー（小麦不使用）</option>
          <option value="プラントベース（植物性中心）">プラントベース（植物性中心）</option>
          <option value="とにかく家にある食材を使い切る">とにかく家にある食材を使い切る</option>
        </select>
      </div>

      <button
        onClick={handleTransform}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#4f46e5',
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
        <Sparkles size={20} /> AIでレシピを再構築する
      </button>
    </div>
  );
};