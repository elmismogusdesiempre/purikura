import React, { useEffect, useRef } from 'react';
import { PhotoData, FrameStyle, PhotoLayout, TextStyleConfig } from '../types';

interface PhotoStripProps {
  photos: PhotoData[];
  customText: string;
  frameStyle: FrameStyle;
  onStripReady: (dataUrl: string) => void;
  isVertical?: boolean;
  overlay?: string | null; // Nuevo prop para el marco personalizado (Frente)
  customFrameBg?: string | null; // Nuevo prop para el fondo del papel (Atrás)
  layout?: PhotoLayout;
  textConfig?: TextStyleConfig; // NEW: Configuración avanzada de texto
}

const PhotoStrip: React.FC<PhotoStripProps> = ({ photos, customText, frameStyle, onStripReady, isVertical = false, overlay, customFrameBg, layout = 'strip', textConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only generate when photos are present. 
    if (photos.length === 0) return;

    const generateStrip = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Helper to convert Hex to RGBA for canvas background
      const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      // Preload overlay image if it exists
      let overlayImg: HTMLImageElement | null = null;
      if (overlay) {
          overlayImg = new Image();
          overlayImg.src = overlay;
          await new Promise((resolve) => {
              if (overlayImg) overlayImg.onload = resolve;
              else resolve(null);
          });
      }

      // Preload Custom Background Image if it exists
      let bgImg: HTMLImageElement | null = null;
      if (customFrameBg) {
          bgImg = new Image();
          bgImg.src = customFrameBg;
          await new Promise((resolve) => {
              if (bgImg) bgImg.onload = resolve;
              else resolve(null);
          });
      }

      // --- HELPER TO DRAW TEXT WITH BACKGROUND BOX ---
      // MODIFIED: Accepts explicit 'fontSize' number to prevent parsing errors
      const drawTextWithBg = (text: string, x: number, y: number, font: string, fontSize: number, color: string, bg: string, baseline: CanvasTextBaseline = 'alphabetic') => {
          if (!text) return;
          ctx.save();
          ctx.font = font;
          ctx.textBaseline = baseline;
          ctx.textAlign = 'center';

          // Solo dibujar caja si hay un color de fondo definido (no transparent) y opacity > 0
          // "transparent" is just a convention string, check rgba
          if (bg !== 'transparent' && !bg.endsWith(', 0)')) {
              const metrics = ctx.measureText(text);
              const width = metrics.width;
              
              const paddingX = 20;
              const paddingY = 10;
              
              let rectY = y;
              // Ajustar Y del rect según el baseline del texto
              if (baseline === 'middle') {
                  rectY = y - fontSize / 2;
              } else if (baseline === 'alphabetic') {
                  rectY = y - fontSize;
              } else if (baseline === 'top') {
                  rectY = y;
              }
              
              // Coordenadas del rectángulo
              const rx = x - width / 2 - paddingX;
              const ry = rectY - paddingY + (fontSize * 0.1); // Pequeño ajuste visual
              const rw = width + paddingX * 2;
              const rh = fontSize + paddingY * 2;

              ctx.fillStyle = bg;
              
              // Dibujar rectángulo con bordes redondeados
              ctx.beginPath();
              if (ctx.roundRect) {
                  ctx.roundRect(rx, ry, rw, rh, 10);
              } else {
                  ctx.rect(rx, ry, rw, rh);
              }
              ctx.fill();
          }

          ctx.fillStyle = color;
          ctx.fillText(text, x, y);
          ctx.restore();
      };

      // Determinar si necesitamos caja de fondo para el texto (Solo si hay imagen de fondo)
      // O si el usuario configuró una opacidad mayor a 0
      let textBgBoxColor = 'transparent';
      
      if (textConfig && textConfig.bgOpacity > 0) {
          // Use Custom Config
          textBgBoxColor = hexToRgba(textConfig.bgColor, textConfig.bgOpacity);
      } else if (bgImg) {
          // Fallback Default logic if no custom config but there IS an image
          if (frameStyle === 'modern' || frameStyle === 'baroque') {
              textBgBoxColor = 'rgba(0, 0, 0, 0.6)'; 
          } else {
              textBgBoxColor = 'rgba(255, 255, 255, 0.85)';
          }
      }

      // --- 18x13 CM LAYOUT LOGIC (MAPPED TO grid-16-9 KEY) ---
      if (layout === 'grid-16-9') {
          // Ajustado para papel fotográfico 18x13 cm a alta resolución (~300 DPI)
          const canvasWidth = 2100;
          const canvasHeight = 1500;
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          // 2. Background
          if (bgImg) {
              ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
          } else {
              let bgColor = '#ffffff';
              if (frameStyle === 'modern') bgColor = '#111111';
              if (frameStyle === 'baroque') bgColor = '#2e0404';
              
              ctx.fillStyle = bgColor;
              ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          }

          // Text Color (Override if config present)
          let textColor = '#000000';
          if (textConfig) {
              textColor = textConfig.color;
          } else {
              if (frameStyle === 'modern') textColor = '#ffffff';
              if (frameStyle === 'baroque') textColor = '#DAA520';
          }

          // 3. Grid Logic
          // DETECT LAYOUT MODE: Footer (Bottom Text) if Normal Orientation, Sidebar (Right Text) if Vertical.
          const isFooterLayout = !isVertical;

          let photoSize = 0;
          let gap = 30;
          let startX = 0;
          let startY = 0;

          if (isFooterLayout) {
              // --- FOOTER LAYOUT (TEXT AT BOTTOM) ---
              // Maximize photo space horizontally. Leave ~250px at bottom for text.
              const footerHeight = 280;
              const workingHeight = canvasHeight - footerHeight;
              const workingWidth = canvasWidth;
              const padding = 50;

              // Calculate Photo Size based on Count
              if (photos.length === 1) {
                  photoSize = Math.min(workingWidth - padding*2, workingHeight - padding*2);
                  startX = (workingWidth - photoSize) / 2;
                  startY = (workingHeight - photoSize) / 2;
              } else if (photos.length === 2) {
                  // Side by side
                  const maxW = (workingWidth - padding*2 - gap) / 2;
                  const maxH = workingHeight - padding*2;
                  photoSize = Math.min(maxW, maxH);
                  const totalW = photoSize * 2 + gap;
                  startX = (workingWidth - totalW) / 2;
                  startY = (workingHeight - photoSize) / 2;
              } else {
                  // 4 Photos (2x2)
                  const maxW = (workingWidth - padding*2 - gap) / 2;
                  const maxH = (workingHeight - padding*2 - gap) / 2;
                  photoSize = Math.min(maxW, maxH);
                  const totalW = photoSize * 2 + gap;
                  const totalH = photoSize * 2 + gap;
                  startX = (workingWidth - totalW) / 2;
                  startY = (workingHeight - totalH) / 2;
              }

          } else {
              // --- SIDEBAR LAYOUT (TEXT ON RIGHT) ---
              // Previous logic for sidebar
              const marginLeft = 80;
              const marginTop = 0; // Will calculate
              let gridWidth = 0;
              let gridHeight = 0;

              if (photos.length === 1) {
                  photoSize = 1350; 
                  gap = 0;
                  gridWidth = photoSize;
                  gridHeight = photoSize;
              } 
              else if (photos.length === 2) {
                  photoSize = 700;
                  gap = 30;
                  gridWidth = (photoSize * 2) + gap;
                  gridHeight = photoSize;
              } 
              else {
                  photoSize = 675; 
                  gap = 30;
                  gridWidth = (photoSize * 2) + gap;
                  gridHeight = (photoSize * 2) + gap;
              }
              
              startX = marginLeft;
              startY = (canvasHeight - gridHeight) / 2;
          }

          // Load and Draw Photos
          for (let i = 0; i < photos.length; i++) {
              const img = new Image();
              img.src = photos[i].dataUrl;
              await new Promise((resolve) => { img.onload = resolve; });

              let col = 0;
              let row = 0;

              if (photos.length === 1) {
                  col = 0; row = 0;
              } else if (photos.length === 2) {
                  col = i; row = 0; // Side by side
              } else {
                  // 2x2 Logic
                  col = i % 2;
                  row = Math.floor(i / 2);
              }

              const x = startX + col * (photoSize + gap);
              const y = startY + row * (photoSize + gap);

              // Draw Shadow for Polaroid effect
              if (frameStyle === 'polaroid') {
                  ctx.shadowColor = "rgba(0,0,0,0.3)";
                  ctx.shadowBlur = 15;
                  ctx.shadowOffsetX = 5;
                  ctx.shadowOffsetY = 5;
                  ctx.fillStyle = "#fff";
                  ctx.fillRect(x - 12, y - 12, photoSize + 24, photoSize + 24);
                  ctx.shadowColor = "transparent"; 
              }

              // Fit Logic (Center Cover)
              const imgRatio = img.width / img.height;
              const targetRatio = 1.0;
              let sWidth = img.width;
              let sHeight = img.height;
              let sx = 0;
              let sy = 0;

              if (imgRatio > targetRatio) {
                  sWidth = img.height * targetRatio;
                  sx = (img.width - sWidth) / 2;
              } else {
                  sHeight = img.width / targetRatio;
                  sy = (img.height - sHeight) / 2;
              }

              ctx.save();
              ctx.beginPath();
              ctx.rect(x, y, photoSize, photoSize);
              ctx.clip();
              ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, photoSize, photoSize);
              ctx.restore();

              // Overlay inside photo slot
              if (overlayImg) {
                  ctx.drawImage(overlayImg, x, y, photoSize, photoSize);
              }

              // Border Logic
              if (frameStyle === 'classic') {
                  ctx.strokeStyle = '#222';
                  ctx.lineWidth = 4;
                  ctx.strokeRect(x, y, photoSize, photoSize);
              } else if (frameStyle === 'baroque') {
                  ctx.strokeStyle = '#DAA520';
                  ctx.lineWidth = 12;
                  ctx.strokeRect(x, y, photoSize, photoSize);
              }
          }

          // 4. Draw Text
          
          // Event Title Configuration
          let titleFont = '';
          let titleSize = 70;

          if (textConfig) {
              const weight = textConfig.isBold ? 'bold' : 'normal';
              const style = textConfig.isItalic ? 'italic' : 'normal';
              titleSize = textConfig.fontSize;
              titleFont = `${style} ${weight} ${titleSize}px "${textConfig.fontFamily}", sans-serif`;
          } else {
              // Default Fallbacks
              titleFont = frameStyle === 'modern' ? '900 70px Arial, sans-serif' : 'bold 70px Courier New';
          }

          const words = (customText || "AI PHOTO BOOTH").toUpperCase().split(' ');
          
          if (isFooterLayout) {
               // --- FOOTER TEXT POSITIONING ---
               const centerX = canvasWidth / 2;
               // Position text at bottom
               const dateY = canvasHeight - 60;
               const titleY = canvasHeight - 140;

               // Title (Centered)
               if (words.length > 3) {
                   // Split if very long
                    const half = Math.ceil(words.length / 2);
                    const line1 = words.slice(0, half).join(' ');
                    const line2 = words.slice(half).join(' ');
                    drawTextWithBg(line1, centerX, titleY - (titleSize/2), titleFont, titleSize, textColor, textBgBoxColor, 'middle');
                    drawTextWithBg(line2, centerX, titleY + (titleSize/2), titleFont, titleSize, textColor, textBgBoxColor, 'middle');
               } else {
                    drawTextWithBg(customText, centerX, titleY, titleFont, titleSize, textColor, textBgBoxColor, 'middle');
               }

               // Date
               const date = new Date().toLocaleDateString();
               drawTextWithBg(date, centerX, dateY, 'bold 35px Arial', 35, textColor, textBgBoxColor, 'middle');

               // Brand Logo (Bottom Right Corner for Footer Layout)
               const brandFont = '900 24px "Bungee Inline", cursive';
               const brandColor = frameStyle === 'modern' ? '#ff00cc' : '#555';
               drawTextWithBg("PURIKURA", canvasWidth - 100, canvasHeight - 40, brandFont, 24, brandColor, textBgBoxColor, 'middle');

          } else {
               // --- SIDEBAR TEXT POSITIONING (Existing) ---
               // Re-calc specific sidebar center based on layout logic
               // To keep it simple, we assume roughly same sidebar area
               const gridWidth = (photos.length === 1) ? 1350 : (photos.length === 2 ? 1430 : 1380);
               const marginLeft = 80;
               const textStartX = marginLeft + gridWidth + 20; 
               const textCenterX = textStartX + (canvasWidth - textStartX) / 2;
               const textCenterY = canvasHeight / 2;
               
               let yText = textCenterY - 60;
               if (words.length >= 1) {
                   const half = Math.ceil(words.length / 2);
                   const line1 = words.slice(0, half).join(' ');
                   const line2 = words.slice(half).join(' ');
                   
                   drawTextWithBg(line1, textCenterX, yText - (titleSize * 0.6), titleFont, titleSize, textColor, textBgBoxColor, 'middle');
                   drawTextWithBg(line2, textCenterX, yText + (titleSize * 0.7), titleFont, titleSize, textColor, textBgBoxColor, 'middle');
               } else {
                   drawTextWithBg(customText, textCenterX, yText, titleFont, titleSize, textColor, textBgBoxColor, 'middle');
               }

               // Date & Decoration
               const date = new Date().toLocaleDateString();
               drawTextWithBg(date, textCenterX, textCenterY + 160, 'bold 35px Arial', 35, textColor, textBgBoxColor, 'middle');
               
               const brandFont = '900 30px "Bungee Inline", cursive';
               const brandColor = frameStyle === 'modern' ? '#ff00cc' : '#555';
               drawTextWithBg("PURIKURA", textCenterX, canvasHeight - 100, brandFont, 30, brandColor, textBgBoxColor, 'middle');
          }

      } 
      // --- ORIGINAL STRIP LAYOUT LOGIC ---
      else {
          // Standard Square Photos (1:1)
          const photoWidth = 600;
          const photoHeight = 600;
          
          let padding = 40;
          let bottomSpace = 200;
          
          // Default colors
          let bgColor = '#ffffff';
          let textColor = '#000000';
          let fontTitle = 'bold 50px Courier New';
          let fontDate = '30px Courier New';
          let titleSize = 50;
          
          // Apply User Text Config if exists
          if (textConfig) {
             const weight = textConfig.isBold ? 'bold' : 'normal';
             const style = textConfig.isItalic ? 'italic' : 'normal';
             titleSize = textConfig.fontSize;
             fontTitle = `${style} ${weight} ${titleSize}px "${textConfig.fontFamily}", sans-serif`;
             textColor = textConfig.color;
          }

          // Style Overrides (Colors only relevant if no bgImg AND no textConfig)
          if (!textConfig) {
              switch (frameStyle) {
                case 'modern':
                  bgColor = '#111111';
                  textColor = '#ffffff';
                  padding = 20;
                  fontTitle = 'bold 50px Arial, sans-serif';
                  fontDate = '30px Arial, sans-serif';
                  break;
                case 'baroque':
                  bgColor = '#2e0404'; // Dark Red
                  textColor = '#DAA520'; // Golden Rod
                  padding = 60;
                  fontTitle = 'bold 55px serif';
                  fontDate = 'italic 30px serif';
                  break;
                case 'polaroid':
                  bgColor = '#fff';
                  textColor = '#333';
                  padding = 50;
                  bottomSpace = 250;
                  fontTitle = '50px "Brush Script MT", cursive';
                  fontDate = '30px "Brush Script MT", cursive';
                  break;
                case 'classic':
                default:
                  break;
              }
          }

          // Vertical Strip Layout (Single Column)
          const stripWidth = photoWidth + (padding * 2);
          const stripHeight = (photoHeight * photos.length) + (padding * (photos.length + 1)) + bottomSpace;

          // Set Canvas Size
          canvas.width = stripWidth;
          canvas.height = stripHeight;

          // Draw Background (Image or Solid Color)
          if (bgImg) {
              ctx.drawImage(bgImg, 0, 0, stripWidth, stripHeight);
          } else {
              ctx.fillStyle = bgColor;
              ctx.fillRect(0, 0, stripWidth, stripHeight);
          }

          if (frameStyle === 'baroque') {
            ctx.strokeStyle = '#DAA520';
            ctx.lineWidth = 15;
            ctx.strokeRect(10, 10, stripWidth - 20, stripHeight - 20);
            ctx.lineWidth = 4;
            ctx.strokeRect(25, 25, stripWidth - 50, stripHeight - 50);
          }

          // Load and Draw Photos
          for (let i = 0; i < photos.length; i++) {
            const img = new Image();
            img.src = photos[i].dataUrl;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const x = padding;
            const y = padding + (i * (photoHeight + padding));
            
            // Draw Shadow for Polaroid
            if (frameStyle === 'polaroid') {
                ctx.shadowColor = "rgba(0,0,0,0.3)";
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 5;
                ctx.shadowOffsetY = 5;
                ctx.fillStyle = "#fff";
                ctx.fillRect(x - 10, y - 10, photoWidth + 20, photoHeight + 20);
                ctx.shadowColor = "transparent"; 
            }

            // --- ASPECT RATIO FITTING (COVER) ---
            const imgRatio = img.width / img.height;
            const targetRatio = photoWidth / photoHeight; // 1.0
            
            let sWidth = img.width;
            let sHeight = img.height;
            let sx = 0;
            let sy = 0;

            if (imgRatio > targetRatio) {
                sWidth = img.height * targetRatio;
                sx = (img.width - sWidth) / 2;
            } else {
                sHeight = img.width / targetRatio;
                sy = (img.height - sHeight) / 2;
            }

            ctx.save();
            // Clip to the slot area
            ctx.beginPath();
            ctx.rect(x, y, photoWidth, photoHeight);
            ctx.clip();
            
            // Draw Photo
            ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, photoWidth, photoHeight);
            
            ctx.restore();

            // --- DRAW OVERLAY IF EXISTS ---
            if (overlayImg) {
                // Draw the overlay ON TOP of the photo, fitted to the photo slot
                ctx.drawImage(overlayImg, x, y, photoWidth, photoHeight);
            }
            
            // Draw Borders (Only if no overlay, or on top if style dictates?)
            if (frameStyle === 'classic') {
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, photoWidth, photoHeight);
            } else if (frameStyle === 'baroque') {
                ctx.strokeStyle = '#DAA520';
                ctx.lineWidth = 10;
                ctx.strokeRect(x, y, photoWidth, photoHeight);
            }
          }

          // Draw Custom Text / Date
          
          let displayText = customText || "AI PHOTO BOOTH";
          if (displayText.length > 25) displayText = displayText.substring(0, 22) + "...";
          
          // Pass implicit font size from config or default
          drawTextWithBg(displayText.toUpperCase(), stripWidth / 2, stripHeight - 100, fontTitle, titleSize, textColor, textBgBoxColor, 'alphabetic');

          // Date
          const date = new Date().toLocaleDateString();
          // Pass implicit font size: 30
          drawTextWithBg(date, stripWidth / 2, stripHeight - 50, fontDate, 30, textColor, textBgBoxColor, 'alphabetic');

      } // End Else

      const dataUrl = canvas.toDataURL('image/png');
      onStripReady(dataUrl);
    };

    generateStrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, customText, frameStyle, isVertical, overlay, customFrameBg, layout, textConfig]);

  return (
    <div className="hidden">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default PhotoStrip;