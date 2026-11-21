import { useState, useEffect, useRef } from 'react';
import { X, Download, ImagePlus, Share2 } from 'lucide-react';
import type { Recipe } from '../types/recipe';

interface ShareCardModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const ShareCardModal = ({ recipe, onClose }: ShareCardModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState(
    recipe.cookNote || '自分仕様に美味しく再構築できました！'
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 720;
    const H = 900;
    canvas.width = W;
    canvas.height = H;

    const drawCard = (img?: HTMLImageElement) => {
      ctx.fillStyle = '#F5F2EA';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#E5E1D7';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, W - 48, H - 48);

      ctx.fillStyle = '#53694F';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('MY RECIPE RE:MADE', 52, 68);

      ctx.fillStyle = '#B96F50';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`再現性: ${recipe.reproducibility || '高'}`, W - 52, 68);
      ctx.textAlign = 'left';

      const photoX = 52;
      const photoY = 92;
      const photoW = W - 104;
      const photoH = 320;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, 16);
      ctx.clip();

      if (img) {
        const scale = Math.max(photoW / img.width, photoH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const offsetX = photoX + (photoW - drawW) / 2;
        const offsetY = photoY + (photoH - drawH) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      } else {
        ctx.fillStyle = '#E5E9DF';
        ctx.fillRect(photoX, photoY, photoW, photoH);
        ctx.fillStyle = '#303A30';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Good food, your way.', W / 2, photoY + photoH / 2 - 8);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#6F756A';
        ctx.fillText(
          '（完成写真をアップロードするとここに表示されます）',
          W / 2,
          photoY + photoH / 2 + 22
        );
        ctx.textAlign = 'left';
      }
      ctx.restore();

      ctx.fillStyle = '#303A30';
      ctx.font = 'bold 28px sans-serif';
      const titleText =
        recipe.title.length > 20 ? recipe.title.slice(0, 20) + '…' : recipe.title;
      ctx.fillText(titleText, 52, 462);

      ctx.strokeStyle = '#E5E1D7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(52, 484);
      ctx.lineTo(W - 52, 484);
      ctx.stroke();

      ctx.fillStyle = '#B96F50';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('THIS RE:MAKE SWAP（変更した材料）', 52, 518);

      const swaps = recipe.ingredients.filter((i) => i.isSubstituted).slice(0, 3);
      let currentY = 554;

      if (swaps.length > 0) {
        swaps.forEach((swap) => {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(52, currentY - 24, W - 104, 42, 10);
          ctx.fill();

          ctx.fillStyle = '#85877D';
          ctx.font = '16px sans-serif';
          const before = swap.originalIngredient || '元の材料';
          ctx.fillText(before, 68, currentY + 3);

          ctx.fillStyle = '#53694F';
          ctx.font = 'bold 17px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`→ ${swap.name} ${swap.amount}${swap.unit}`, W - 68, currentY + 3);
          ctx.textAlign = 'left';

          currentY += 54;
        });
      } else {
        ctx.fillStyle = '#303A30';
        ctx.font = '16px sans-serif';
        ctx.fillText('・ヘルシー＆高再現性バランスに配合を再構築', 52, currentY);
        currentY += 54;
      }

      if (caption.trim()) {
        ctx.fillStyle = '#303A30';
        ctx.font = 'italic 17px sans-serif';
        const memoText =
          caption.length > 34 ? `“${caption.slice(0, 34)}…”` : `“${caption}”`;
        ctx.fillText(memoText, 52, 745);
      }

      ctx.fillStyle = '#303A30';
      ctx.fillRect(24, H - 96, W - 48, 72);

      ctx.fillStyle = '#F5F2EA';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Good food, your way.', 52, H - 52);

      ctx.fillStyle = '#E5E9DF';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Re:cipe', W - 52, H - 52);
      ctx.textAlign = 'left';
    };

    if (photoDataUrl) {
      const img = new Image();
      img.onload = () => drawCard(img);
      img.src = photoDataUrl;
    } else {
      drawCard();
    }
  }, [recipe, photoDataUrl, caption]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `recipe-remake-${recipe.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(48, 58, 48, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#F5F2EA',
          color: '#303A30',
          borderRadius: '16px',
          padding: '22px',
          maxWidth: '460px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          border: '1px solid #E5E1D7',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: '#53694F',
            }}
          >
            <Share2 size={18} /> Re:Make Challenge カード
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#85877D',
              cursor: 'pointer',
            }}
          >
            <X size={22} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          <label
            style={{
              padding: '11px',
              backgroundColor: '#FFFFFF',
              border: '1px dashed #71816A',
              borderRadius: '10px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#303A30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ImagePlus size={16} color="#53694F" />
            {photoDataUrl ? '完成写真を変更する' : '作った料理の写真を載せる（任意）'}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </label>

          <input
            type="text"
            placeholder="カードに載せるひとこと感想"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              padding: '10px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E1D7',
              borderRadius: '10px',
              color: '#303A30',
              fontSize: '13px',
            }}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              maxWidth: '340px',
              height: 'auto',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(48, 58, 48, 0.14)',
            }}
          />
        </div>

        <button
          onClick={handleDownload}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#53694F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <Download size={18} /> シェア画像を保存する（PNG）
        </button>
      </div>
    </div>
  );
};
