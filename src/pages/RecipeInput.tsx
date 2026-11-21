import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, FileText, ArrowRight } from 'lucide-react';

export const RecipeInput = () => {
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<'image' | 'text'>('image');
  const [recipeText, setRecipeText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleNext = () => {
    // 入力データを次の画面へ引き継いで移動
    navigate('/ingredients', {
      state: {
        inputType,
        recipeText: recipeText || 'サンプル：濃厚チョコレートケーキ（小麦粉100g、砂糖60g、バター50g、卵2個）',
        imagePreview,
      },
    });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>1. 作りたいレシピを入力</h2>
      <p style={{ color: '#aaa', fontSize: '14px' }}>
        SNSで見つけたレシピのスクリーンショット、または文章を入力してください。
      </p>

      {/* 入力切り替えタブ */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <button
          onClick={() => setInputType('image')}
          style={{
            flex: 1,
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: inputType === 'image' ? '#4f46e5' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <ImageIcon size={18} /> スクリーンショット画像
        </button>
        <button
          onClick={() => setInputType('text')}
          style={{
            flex: 1,
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: inputType === 'text' ? '#4f46e5' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <FileText size={18} /> レシピ文章を貼り付け
        </button>
      </div>

      {/* 画像アップロードエリア */}
      {inputType === 'image' && (
        <div
          style={{
            border: '2px dashed #555',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginBottom: '15px' }}
          />
          {imagePreview ? (
            <div>
              <img
                src={imagePreview}
                alt="プレビュー"
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
              />
            </div>
          ) : (
            <p style={{ color: '#888', fontSize: '14px' }}>
              画像を選択するとここにプレビューが表示されます（未選択のまま次へ進むことも可能です）
            </p>
          )}
        </div>
      )}

      {/* テキスト入力エリア */}
      {inputType === 'text' && (
        <div style={{ marginBottom: '20px' }}>
          <textarea
            rows={8}
            placeholder="例：&#13;&#10;【材料】&#13;&#10;・薄力粉 100g&#13;&#10;・砂糖 60g&#13;&#10;・バター 50g&#13;&#10;【作り方】&#13;&#10;1. 材料を混ぜて180度のオーブンで25分焼く。"
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

      <button
        onClick={handleNext}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#10b981',
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
        次へ（使いたい食材を選ぶ） <ArrowRight size={20} />
      </button>
    </div>
  );
};