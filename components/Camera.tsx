import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { CameraEffect } from '../types';
import { Heart, MessageCircle, Share2, Gift, User, X, Mic, Monitor } from 'lucide-react';

interface CameraProps {
  onStreamReady: (stream: MediaStream) => void;
  rotation?: number; // Rotación global de la App (0, 90, -90)
  previewOffset?: number; // Ajuste manual para el video en vivo (0, 90, 180, 270)
  captureOffset?: number; // Ajuste manual para la foto capturada (0, 90, 180, 270)
  zoom?: number; // 1.0 = Normal, >1.0 = Zoom In (Digital Crop)
  fitMode?: boolean; // TRUE = Mostrar toda la imagen (Fit), FALSE = Recortar (Cover)
  overlay?: string | null; // Imagen Base64 para el marco
  effect?: CameraEffect; // Filtro visual (CCTV, Heatmap, etc)
  eventText?: string; // Text to display in filters like News
  className?: string; // Permitir estilos personalizados desde fuera
}

export interface CameraHandle {
  takePhoto: () => string | null;
}

const NEWS_HEADLINES = [
    "¡LA MEJOR FIESTA DEL AÑO!",
    "TODOS ESTÁN DISFRUTANDO AL MÁXIMO",
    "IMÁGENES EXCLUSIVAS EN VIVO",
    "EL EVENTO ROMPE RÉCORDS DE ASISTENCIA",
    "INCREÍBLE AMBIENTE ESTA NOCHE",
    "MOMENTOS INOLVIDABLES AHORA MISMO",
    "LA DIVERSIÓN NO SE DETIENE",
    "REPORTANDO DESDE EL LUGAR DE LOS HECHOS",
    "TODO EL MUNDO QUIERE UNA FOTO AQUÍ"
];

const Camera = forwardRef<CameraHandle, CameraProps>(({ 
  onStreamReady, 
  rotation = 0, 
  previewOffset = 0, 
  captureOffset = 0,
  zoom = 1.0,
  fitMode = false,
  overlay,
  effect = 'none',
  eventText = "EVENTO",
  className
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [timeString, setTimeString] = useState<string>("");
  
  // State for Emoji Challenge items
  const [challengeIcons, setChallengeIcons] = useState<{char: string, x: number, y: number, size: number, rot: number}[]>([]);

  // Reloj para efectos VHS/CCTV
  useEffect(() => {
      const interval = setInterval(() => {
          const now = new Date();
          setTimeString(now.toLocaleTimeString([], { hour12: false }));
      }, 1000);
      return () => clearInterval(interval);
  }, []);

  // Generate Emoji Challenge items when effect activates
  const generateChallengeIcons = () => {
    const icons = ['🎩', '🕶️', '👄', '👑', '🎀', '🥸'];
    const newItems = [];
    // Generate 3 random items
    for(let i=0; i<3; i++) {
        newItems.push({
            char: icons[Math.floor(Math.random() * icons.length)],
            x: 10 + Math.random() * 80, // 10-90% safe area
            y: 20 + Math.random() * 60, // 20-80% safe area
            // BIGGER EMOJIS REQUEST: 180px base + up to 120px variation = 180px to 300px
            size: 180 + Math.random() * 120, 
            rot: Math.random() * 40 - 20 // -20 to 20 deg
        });
    }
    setChallengeIcons(newItems);
  };

  useEffect(() => {
    if (effect === 'emoji-challenge') {
        generateChallengeIcons();
    }
  }, [effect]);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        // REQUEST HIGHER RESOLUTION TO MAXIMIZE FOV
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
              facingMode: 'user',
              width: { ideal: 1920 },
              height: { ideal: 1920 }
          },
          audio: false,
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          onStreamReady(stream);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    takePhoto: () => {
      if (!videoRef.current || !canvasRef.current) return null;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return null;

      // Source Dimensions
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;
      
      // Destination Dimensions (Square Canvas)
      const size = Math.min(vWidth, vHeight);
      
      canvas.width = size;
      canvas.height = size;
      
      // 1. Clear Canvas (Important for Fit Mode where black bars appear)
      context.fillStyle = "black";
      context.fillRect(0, 0, size, size);

      context.save();
      
      const cx = size / 2;
      const cy = size / 2;

      // 2. Center Context
      context.translate(cx, cy);
      
      // 3. Mirror (Standard for Selfie Booths)
      context.scale(-1, 1);

      // 4. Zoom Logic (CRITICAL FIX: Match CSS Logic)
      // Check for vertical rotation (90 or -90)
      const isVerticalRotation = Math.abs(rotation % 180) === 90;
      
      let effectiveZoom = zoom;
      // MATCH CSS LOGIC: If Vertical + FitMode, we scale up to fill vertical space better
      if (isVerticalRotation && fitMode) {
          effectiveZoom = zoom * 1.77; 
      }
      if (effect === 'fisheye') {
          effectiveZoom = effectiveZoom * 1.2;
      }

      context.scale(effectiveZoom, effectiveZoom);

      // 5. Rotation
      const totalRotation = -rotation + captureOffset;
      context.rotate((totalRotation * Math.PI) / 180);
      
      // 6. APPLY EFFECTS Logic
      
      // --- WARHOL EFFECT (Multiplied by 4 with Colors) ---
      if (effect === 'warhol') {
          // Calculate quadrants
          const qSize = size / 2;
          
          // Helper to draw quadrant
          const drawQuadrant = (dx: number, dy: number, color: string) => {
              context.save();
              
              // 1. Apply High Contrast B&W Filter to the IMAGE
              context.filter = 'grayscale(100%) contrast(250%) brightness(1.2)';
              
              // Draw image in quadrant
              if (fitMode) {
                  const scale = Math.min(qSize / vWidth, qSize / vHeight);
                  const drawnW = vWidth * scale;
                  const drawnH = vHeight * scale;
                  context.drawImage(video, 0, 0, vWidth, vHeight, dx - drawnW/2, dy - drawnH/2, drawnW, drawnH);
              } else {
                  // Center Crop Logic adjusted for quadrant
                  const minDim = Math.min(vWidth, vHeight);
                  const sx = (vWidth - minDim) / 2;
                  const sy = (vHeight - minDim) / 2;
                  context.drawImage(video, sx, sy, minDim, minDim, dx, dy, qSize, qSize);
              }

              // 2. CRITICAL FIX: RESET FILTER.
              context.filter = 'none';

              // 3. Apply Color Overlay (Multiply: Whites become Color, Blacks stay Black)
              context.globalCompositeOperation = 'multiply';
              context.fillStyle = color;
              
              // We fill the entire quadrant rect
              context.fillRect(dx, dy, qSize, qSize);
              
              context.restore();
          };

          // Quadrants
          drawQuadrant(-size/2, -size/2, '#FF00CC');
          drawQuadrant(0, -size/2, '#FFD700');
          drawQuadrant(-size/2, 0, '#00FFFF');
          drawQuadrant(0, 0, '#32CD32');
      } 
      else {
          // --- STANDARD & OTHER EFFECTS ---
          if (effect === 'cctv') context.filter = 'grayscale(100%) sepia(100%) hue-rotate(90deg) brightness(0.9) contrast(1.2)';
          else if (effect === 'heatmap') context.filter = 'contrast(200%) hue-rotate(180deg) invert(100%) saturate(200%)';
          else if (effect === 'vhs') context.filter = 'contrast(1.2) saturate(1.5) sepia(0.2) blur(0.5px)';
          else if (effect === 'tictak') context.filter = 'saturate(1.1) brightness(1.05)';
          else context.filter = 'none';

          // Draw Image Logic (Standard)
          if (fitMode) {
              const scale = Math.min(size / vWidth, size / vHeight);
              const drawnW = vWidth * scale;
              const drawnH = vHeight * scale;
              context.drawImage(video, 0, 0, vWidth, vHeight, -drawnW / 2, -drawnH / 2, drawnW, drawnH);
          } else {
              const xOffset = (vWidth - size) / 2;
              const yOffset = (vHeight - size) / 2;
              context.drawImage(video, xOffset, yOffset, size, size, -size/2, -size/2, size, size);
          }
      }
      
      context.restore();

      // 8. APPLY OVERLAYS (UI Elements "burnt" into the photo)
      context.save();
      
      // --- EMOJI CHALLENGE OVERLAY (BURNT IN) ---
      if (effect === 'emoji-challenge') {
          // Reverted to standard mapping now that ZOOM IS FIXED.
          // Since the capture zoom now matches the preview zoom (1.77x in vertical fitMode),
          // the emojis drawn relative to the full canvas size will match the user's perception.
          
          challengeIcons.forEach(item => {
              // Standard mapping: 0-100% of canvas width/height
              const x = (item.x / 100) * size;
              const y = (item.y / 100) * size;
              
              const scaleFactor = size / 800; 
              const fontSize = item.size * scaleFactor;

              context.save();
              context.translate(x, y);
              context.rotate((item.rot * Math.PI) / 180);
              context.font = `${fontSize}px sans-serif`;
              context.textAlign = 'center';
              context.textBaseline = 'middle';
              context.shadowColor = 'rgba(0,0,0,0.5)';
              context.shadowBlur = 10;
              context.fillStyle = 'white'; 
              context.fillText(item.char, 0, 0);
              context.restore();
          });
          
          // Trigger regeneration for the NEXT photo
          setTimeout(() => generateChallengeIcons(), 500);
      }

      // --- NEWS EFFECT OVERLAYS (CANVAS DRAWING) ---
      if (effect === 'news') {
          // Banner Heights
          const bannerHeight = size * 0.15;
          const tickerHeight = size * 0.08;
          
          // 1. Lower Third Blue Bar (Main Title)
          context.fillStyle = '#003399'; // TV Blue
          context.fillRect(0, size - bannerHeight - tickerHeight, size, bannerHeight);
          
          // 2. Yellow Ticker Bar
          context.fillStyle = '#ffcc00'; // TV Yellow
          context.fillRect(0, size - tickerHeight, size, tickerHeight);
          
          // 3. "LIVE" Red Box (Top Left)
          context.fillStyle = '#cc0000';
          context.fillRect(40, 40, 140, 60);
          
          context.fillStyle = 'white';
          context.font = 'bold 36px Arial, sans-serif';
          context.fillText("LIVE", 65, 83);
          
          // 4. Date/Time (Top Right)
          const dateStr = new Date().toLocaleDateString();
          const timeStr = new Date().toLocaleTimeString([], { hour12: false });
          
          context.fillStyle = 'white';
          context.shadowColor = 'black';
          context.shadowBlur = 4;
          context.textAlign = 'right';
          context.font = 'bold 30px Arial, sans-serif';
          context.fillText(dateStr, size - 40, 60);
          context.fillText(timeStr, size - 40, 100);
          context.shadowBlur = 0; // Reset shadow

          // 5. Main Headline Text
          context.textAlign = 'left';
          context.fillStyle = 'white';
          context.font = '900 60px Arial, sans-serif';
          context.fillText((eventText || "EVENTO").toUpperCase() + " NEWS", 40, size - tickerHeight - (bannerHeight/2) + 20);
          
          // 6. Ticker Text (Static random for capture)
          const randomNews = NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)];
          context.fillStyle = 'black';
          context.font = 'bold 40px Arial, sans-serif';
          context.fillText("ULTIMO MINUTO: " + randomNews, 40, size - (tickerHeight/2) + 14);

          // 7. BIG MICROPHONE
          const micX = size - 150;
          const micY = size - 200;
          const micScale = 1.5;

          context.save();
          context.translate(micX, micY);
          context.scale(micScale, micScale);
          
          context.fillStyle = '#333';
          context.beginPath();
          context.roundRect(-25, -50, 50, 140, 25);
          context.fill();

          const grad = context.createLinearGradient(-35, -90, 35, -30);
          grad.addColorStop(0, '#ccc');
          grad.addColorStop(0.5, '#666');
          grad.addColorStop(1, '#ccc');
          context.fillStyle = grad;
          context.beginPath();
          context.arc(0, -50, 35, 0, Math.PI * 2);
          context.fill();
          
          context.strokeStyle = '#444';
          context.lineWidth = 1;
          context.beginPath();
          for(let i=-20; i<=20; i+=10) {
              context.moveTo(i, -80);
              context.lineTo(i, -20);
          }
          context.stroke();
          
          context.fillStyle = 'red';
          context.beginPath();
          context.arc(0, 40, 4, 0, Math.PI * 2);
          context.fill();
          
          context.fillStyle = '#003399';
          context.fillRect(-26, 60, 52, 20);

          context.restore();
      }
      
      if (effect === 'cctv') {
          // ... CCTV Code ...
          context.fillStyle = "rgba(0, 0, 0, 0.15)";
          for (let y = 0; y < size; y += 4) {
              context.fillRect(0, y, size, 2);
          }
          const grad = context.createRadialGradient(size/2, size/2, size/3, size/2, size/2, size);
          grad.addColorStop(0, "transparent");
          grad.addColorStop(1, "rgba(0,0,0,0.6)");
          context.fillStyle = grad;
          context.fillRect(0,0,size,size);
          context.font = "bold 24px monospace";
          context.shadowColor = "black";
          context.shadowBlur = 2;
          context.fillStyle = "white";
          context.fillText("REC", 30, 50);
          context.beginPath();
          context.arc(90, 42, 8, 0, 2 * Math.PI);
          context.fillStyle = "red";
          context.fill();
          context.fillStyle = "white";
          context.fillText("CAM_01 [EXT]", 30, size - 30);
          const dateStr = new Date().toISOString().split('T')[0];
          context.textAlign = "right";
          context.fillText(`${dateStr} ${timeString}`, size - 30, size - 30);
          context.textAlign = "center";
          context.fillStyle = "rgba(255, 0, 0, 0.8)";
          context.font = "bold 30px monospace";
          context.fillText("⚠ INTRUDER DETECTED", size/2, size - 80);
          context.strokeStyle = "rgba(255,255,255,0.5)";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(size/2, 30);
          context.lineTo(size/2, size-30);
          context.moveTo(30, size/2);
          context.lineTo(size-30, size/2);
          context.stroke();
      }
      
      if (effect === 'fisheye') {
          const grad = context.createRadialGradient(size/2, size/2, size * 0.35, size/2, size/2, size * 0.6);
          grad.addColorStop(0, "transparent");
          grad.addColorStop(0.8, "rgba(0,0,0,0.4)");
          grad.addColorStop(1, "black");
          context.fillStyle = grad;
          context.fillRect(0,0,size,size);
      }

      if (effect === 'vhs') {
          // ... VHS Code ...
          context.fillStyle = "rgba(255, 0, 255, 0.05)";
          context.globalCompositeOperation = "screen";
          context.fillRect(4, 4, size, size);
          context.globalCompositeOperation = "source-over";
          context.font = "bold 28px sans-serif";
          context.shadowColor = "black";
          context.shadowBlur = 4;
          context.fillStyle = "white";
          context.fillText("▶ PLAY", 40, 50);
          context.font = "20px sans-serif";
          context.fillText("SP", 40, 80);
          const bx = size - 70;
          const by = 30;
          context.strokeStyle = "white";
          context.lineWidth = 3;
          context.strokeRect(bx, by, 45, 22);
          context.fillRect(bx + 47, by + 6, 4, 10);
          context.fillStyle = "#ff3333"; 
          context.fillRect(bx + 3, by + 3, 12, 16); 
          const now = new Date();
          const retroDate = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
          context.fillStyle = "white";
          context.font = "bold 24px monospace";
          context.fillText(retroDate, 40, size - 40);
          context.strokeStyle = "rgba(255, 255, 255, 0.6)";
          context.lineWidth = 2;
          const safeMargin = size * 0.1;
          const safeSize = size * 0.8;
          context.strokeRect(safeMargin, safeMargin, safeSize, safeSize);
          context.beginPath();
          context.moveTo(size/2 - 15, size/2);
          context.lineTo(size/2 + 15, size/2);
          context.moveTo(size/2, size/2 - 15);
          context.lineTo(size/2, size/2 + 15);
          context.stroke();
      }

      if (effect === 'heatmap') {
          // ... Heatmap Code ...
          context.font = "bold 20px monospace";
          context.fillStyle = "#00ff00"; 
          context.shadowColor = "#00ff00";
          context.shadowBlur = 5;
          context.textAlign = "center";
          context.fillText("ALIEN_VISION // TARGET_LOCKED", size/2, 40);
          context.font = "14px monospace";
          context.fillText(`TEMP: ${36 + Math.random() * 2}°C`, size/2, size - 30);
          context.font = "30px monospace";
          context.fillText("⏚ ⌖ ⏣", size/2, size - 60);
      }

      if (effect === 'tictak') {
        // ... TicTak Capture UI (Small) ...
        context.shadowColor = "rgba(0,0,0,0.8)";
        context.shadowBlur = 5;
        context.fillStyle = "white";
        context.font = "900 45px Arial, sans-serif"; 
        context.textAlign = "left";
        context.fillText("TicTak", 30, 70);
        context.fillStyle = "#fe2c55";
        context.font = "45px Arial";
        context.fillText("♪", 185, 70);

        const avatarX = 80;
        const avatarY = 160; 
        const avatarR = 40;  

        context.beginPath();
        context.arc(avatarX, avatarY, avatarR, 0, 2 * Math.PI);
        context.fillStyle = "#ddd";
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = "white";
        context.stroke();
        
        context.font = "40px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#333";
        context.fillText("😎", avatarX, avatarY + 2);

        context.textAlign = "left";
        context.shadowColor = "rgba(0,0,0,0.8)";
        context.shadowBlur = 3;
        context.fillStyle = "white";
        context.font = "bold 30px sans-serif"; 
        context.fillText("@party_star", 135, 150);
        context.font = "22px sans-serif";
        context.fillStyle = "#eee";
        context.fillText("Live now...", 135, 180);

        const badgeW = 70;
        const badgeH = 25;
        const badgeX = 320; 
        const badgeY = 130;
        
        context.beginPath();
        context.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
        context.fillStyle = "#fe2c55"; 
        context.fill();
        context.font = "bold 16px sans-serif";
        context.textAlign = "center";
        context.fillStyle = "white";
        context.fillText("LIVE", badgeX + badgeW/2, badgeY + 18);

        context.textAlign = "right";
        context.font = "bold 30px sans-serif";
        context.fillStyle = "white";
        context.fillText("👁️ 12.5k", size - 90, 80);
        context.font = "bold 40px sans-serif";
        context.fillText("✕", size - 40, 80);

        const rightX = size - 60;
        const bottomY = size - 80;
        const gap = 90; 
        
        context.textAlign = "center";
        context.textBaseline = "alphabetic"; 
        context.font = "45px Arial";
        
        context.beginPath();
        context.arc(rightX, bottomY, 40, 0, 2 * Math.PI);
        context.fillStyle = "#222";
        context.fill();
        context.strokeStyle = "#555";
        context.lineWidth = 6;
        context.stroke();
        context.fillText("🎵", rightX, bottomY + 15);

        context.font = "50px Arial";
        context.shadowColor = "rgba(0,0,0,0.5)";
        
        context.fillText("➡️", rightX, bottomY - gap);
        context.font = "18px sans-serif";
        context.fillStyle = "white";
        context.fillText("Share", rightX, bottomY - gap + 25);

        context.font = "50px Arial";
        context.fillText("🎁", rightX, bottomY - gap*2);
        context.font = "18px sans-serif";
        context.fillStyle = "white";
        context.fillText("Gift", rightX, bottomY - gap*2 + 25);

        context.font = "50px Arial";
        context.fillText("💬", rightX, bottomY - gap*3);
        context.font = "18px sans-serif";
        context.fillStyle = "white";
        context.fillText("1.2k", rightX, bottomY - gap*3 + 25);

        context.font = "50px Arial";
        context.fillText("❤️", rightX, bottomY - gap*4);
        context.font = "18px sans-serif";
        context.fillStyle = "white";
        context.fillText("85k", rightX, bottomY - gap*4 + 25);

        context.textAlign = "left";
        context.font = "20px sans-serif";
        context.fillStyle = "rgba(255,255,255,0.9)";
        context.shadowColor = "black";
        
        const commX = 30;
        const commY = size - 160;
        const commLineH = 35;
        
        context.font = "bold 20px sans-serif";
        context.fillStyle = "#88eebb";
        context.fillText("user_99:", commX, commY);
        context.font = "20px sans-serif";
        context.fillStyle = "white";
        context.fillText("Omg I love this! 😍", commX + 100, commY);

        context.font = "bold 20px sans-serif";
        context.fillStyle = "#ffaaaa";
        context.fillText("cool_guy:", commX, commY + commLineH);
        context.font = "20px sans-serif";
        context.fillStyle = "white";
        context.fillText("🔥🔥🔥", commX + 100, commY + commLineH);
        
        context.font = "bold 20px sans-serif";
        context.fillStyle = "#aaddff";
        context.fillText("bestie:", commX, commY + commLineH*2);
        context.font = "20px sans-serif";
        context.fillStyle = "white";
        context.fillText("Slay queen! 👑", commX + 90, commY + commLineH*2);

        context.fillStyle = "rgba(0,0,0,0.3)";
        context.roundRect(30, size - 85, size - 180, 50, 25);
        context.fill();
        context.fillStyle = "rgba(255,255,255,0.7)";
        context.fillText("Add comment...", 50, size - 55);
        
        context.font = "50px Arial";
        context.fillText("❤️", size - 150, size - 200);
        context.font = "40px Arial";
        context.fillText("🧡", size - 120, size - 300);
        context.font = "60px Arial";
        context.fillText("💖", size - 170, size - 400);
      }

      context.restore();
      
      return canvas.toDataURL('image/png');
    }
  }));

  // Default booth styles if className is not provided
  const defaultStyles = "rounded-3xl border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]";
  const finalClass = className !== undefined ? className : defaultStyles;

  // Determine Object Fit for CSS
  const objectFitStyle: React.CSSProperties['objectFit'] = fitMode ? 'contain' : 'cover';
  
  // Calculate Rotation Logic
  const isVerticalRotation = Math.abs(rotation % 180) === 90;
  
  // Compensation Scale for Fit Mode in Vertical Rotation
  let cssScale = zoom;
  if (isVerticalRotation && fitMode) {
      cssScale = zoom * 1.77; 
  }
  if (effect === 'fisheye') {
      cssScale = cssScale * 1.2;
  }

  // --- CSS FILTERS FOR LIVE PREVIEW ---
  let cssFilter = 'none';
  if (effect === 'cctv') cssFilter = 'grayscale(100%) sepia(100%) hue-rotate(90deg) brightness(0.9) contrast(1.2)';
  if (effect === 'heatmap') cssFilter = 'contrast(200%) hue-rotate(180deg) invert(100%) saturate(200%)';
  if (effect === 'vhs') cssFilter = 'contrast(1.2) saturate(1.5) sepia(0.2) blur(0.5px)';
  // WARHOL LIVE: We handle this with a specific grid overlay below, so we set filter to none here for the main video (which is hidden anyway)
  if (effect === 'warhol') cssFilter = 'none';
  if (effect === 'tictak') cssFilter = 'saturate(1.1) brightness(1.05)';
  // NEWS: Generally clean video, maybe slight saturation
  if (effect === 'news') cssFilter = 'saturate(1.1)';
  // EMOJI: Clean
  if (effect === 'emoji-challenge') cssFilter = 'none';

  // --- Date helpers for preview ---
  const dateStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const retroDate = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();

  // Helper to attach stream to extra video elements for Warhol grid
  const assignStream = (el: HTMLVideoElement | null) => {
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
        el.srcObject = streamRef.current;
        el.play().catch(e => console.error("Warhol grid play error:", e));
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${finalClass} bg-black`}>
      <canvas ref={canvasRef} className="hidden" />
      
      {/* 
        VISUALIZATION ON SCREEN (CSS)
        Fix: We MUST NOT unmount the main video element when effect === 'warhol', 
        because 'takePhoto' relies on 'videoRef.current' to capture frames.
        Instead, we hide it visually using CSS but keep it in the DOM.
      */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full transition-transform duration-500 ${effect === 'warhol' ? 'opacity-0 absolute inset-0 -z-10' : ''}`}
        style={{ 
            objectFit: objectFitStyle,
            transform: `scaleX(-1) rotate(${-rotation + previewOffset}deg) scale(${cssScale})`,
            filter: cssFilter
        }}
      />

      {/* --- WARHOL LIVE PREVIEW GRID --- */}
      {effect === 'warhol' && (
         <div className="absolute inset-0 w-full h-full grid grid-cols-2 grid-rows-2"
              style={{
                 transform: `scaleX(-1) rotate(${-rotation + previewOffset}deg) scale(${cssScale})`,
                 transformOrigin: 'center center'
              }}
         >
             {/* 
                COMMON STYLE FOR WARHOL QUADRANTS:
                1. High Contrast B&W (Threshold Simulation)
                2. Multiply Mix Mode for Color Overlay
             */}
             
             {/* Quadrant 1: Top-Left (Hot Pink) */}
             <div className="relative w-full h-full overflow-hidden bg-white">
                 <video ref={assignStream} autoPlay playsInline muted className="w-full h-full object-cover" style={{ filter: 'grayscale(100%) contrast(250%) brightness(1.2)' }} />
                 <div className="absolute inset-0 bg-[#FF00CC] mix-blend-multiply pointer-events-none"></div>
             </div>

             {/* Quadrant 2: Top-Right (Golden Yellow) */}
             <div className="relative w-full h-full overflow-hidden bg-white">
                 <video ref={assignStream} autoPlay playsInline muted className="w-full h-full object-cover" style={{ filter: 'grayscale(100%) contrast(250%) brightness(1.2)' }} />
                 <div className="absolute inset-0 bg-[#FFD700] mix-blend-multiply pointer-events-none"></div>
             </div>

             {/* Quadrant 3: Bottom-Left (Cyan) */}
             <div className="relative w-full h-full overflow-hidden bg-white">
                 <video ref={assignStream} autoPlay playsInline muted className="w-full h-full object-cover" style={{ filter: 'grayscale(100%) contrast(250%) brightness(1.2)' }} />
                 <div className="absolute inset-0 bg-[#00FFFF] mix-blend-multiply pointer-events-none"></div>
             </div>

             {/* Quadrant 4: Bottom-Right (Lime Green) */}
             <div className="relative w-full h-full overflow-hidden bg-white">
                 <video ref={assignStream} autoPlay playsInline muted className="w-full h-full object-cover" style={{ filter: 'grayscale(100%) contrast(250%) brightness(1.2)' }} />
                 <div className="absolute inset-0 bg-[#32CD32] mix-blend-multiply pointer-events-none"></div>
             </div>
         </div>
      )}
      
      {/* --- OVERLAYS FOR EFFECTS (LIVE PREVIEW HTML) --- */}

      {/* EMOJI CHALLENGE OVERLAY (LIVE PREVIEW) */}
      {effect === 'emoji-challenge' && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               {/* 
                 For the Live Preview, we just place the elements.
                 Note: The video behind this is mirrored.
                 If we place an element at Left: 20%, visually it is on the Left.
                 The user will move to the Left (their Right) to align.
                 When we capture, we replicate this placement.
               */}
               {challengeIcons.map((item, i) => (
                   <div 
                        key={i}
                        className="absolute flex items-center justify-center"
                        style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            fontSize: `${item.size}px`,
                            transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
                            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                        }}
                   >
                       {item.char}
                   </div>
               ))}
               
               {/* Instructions */}
               <div className="absolute top-10 w-full text-center">
                   <div className="inline-block bg-black/60 backdrop-blur-md text-white px-6 py-2 rounded-full font-bold text-xl border-2 border-yellow-400 shadow-lg animate-pulse">
                       ¡UBÍCATE EN LOS EMOJIS!
                   </div>
               </div>
          </div>
      )}

      {/* NEWS ANCHOR OVERLAY */}
      {effect === 'news' && (
          <div className="absolute inset-0 pointer-events-none z-20 font-sans flex flex-col justify-between">
              
              {/* Top Bar: LIVE + Date */}
              <div className="flex justify-between items-start p-6">
                  {/* LIVE BADGE */}
                  <div className="bg-[#cc0000] text-white px-4 py-1 font-bold text-2xl tracking-wider rounded shadow-md animate-pulse">
                      LIVE
                  </div>
                  
                  {/* Date/Time */}
                  <div className="text-right drop-shadow-md">
                      <div className="text-white font-bold text-2xl">{dateStr}</div>
                      <div className="text-white font-bold text-xl">{timeString}</div>
                  </div>
              </div>

              {/* Bottom Section: Microphone & Banners */}
              <div className="relative w-full">
                   {/* Giant Microphone Icon */}
                   <div className="absolute bottom-20 right-8 z-30 drop-shadow-2xl transform rotate-12 origin-bottom-right">
                       <Mic size={200} className="text-zinc-800 fill-zinc-400 stroke-[3px]" />
                       {/* Red dot indicator on mic */}
                       <div className="absolute top-10 right-16 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_10px_red]"></div>
                   </div>

                   {/* Lower Thirds Container */}
                   <div className="w-full flex flex-col items-start mt-auto relative z-10">
                       
                       {/* Main Headline Bar (Blue) */}
                       <div className="bg-[#003399] w-full py-4 px-6 border-t-4 border-yellow-400 shadow-lg">
                           <h2 className="text-white font-black text-4xl md:text-6xl tracking-tighter uppercase drop-shadow-md">
                               {(eventText || "EVENTO").toUpperCase()} NEWS
                           </h2>
                       </div>

                       {/* Ticker Bar (Yellow) */}
                       <div className="bg-[#ffcc00] w-full py-3 overflow-hidden relative border-t border-black">
                           <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite]">
                               <span className="text-black font-bold text-2xl mx-4 uppercase">
                                   🔴 ÚLTIMO MINUTO: {NEWS_HEADLINES.join("  ///  ")}  ///  REPORTANDO EN VIVO DESDE LA MEJOR FIESTA  ///
                               </span>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      )}
      
      {/* CCTV OVERLAY */}
      {effect === 'cctv' && (
          <div className="absolute inset-0 pointer-events-none z-10" 
               style={{
                   background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px)',
                   boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8)'
               }}>
               <div className="absolute top-4 left-4 flex items-center gap-2">
                   <span className="text-white font-mono font-bold text-lg drop-shadow-md">REC</span>
                   <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]"></div>
               </div>
               
               <div className="absolute top-4 right-4 text-green-500 font-mono text-sm opacity-80">
                   SIGNAL: GOOD
               </div>

               <div className="absolute bottom-4 left-4 text-white font-mono font-bold text-lg drop-shadow-md">
                   CAM_01 [EXT]
               </div>

               <div className="absolute bottom-4 right-4 text-white font-mono font-bold text-lg drop-shadow-md text-right">
                   <div>{dateStr}</div>
                   <div>{timeString}</div>
               </div>

               <div className="absolute bottom-20 left-0 right-0 flex justify-center">
                    <span className="bg-red-600/20 text-red-500 border border-red-500 px-4 py-1 font-mono font-bold text-xl animate-pulse backdrop-blur-sm">
                        ⚠ INTRUDER DETECTED
                    </span>
               </div>

               <div className="absolute inset-0 flex items-center justify-center opacity-30">
                   <div className="w-[90%] h-[1px] bg-white"></div>
               </div>
               <div className="absolute inset-0 flex items-center justify-center opacity-30">
                   <div className="h-[90%] w-[1px] bg-white"></div>
               </div>
          </div>
      )}

      {/* FISHEYE OVERLAY */}
      {effect === 'fisheye' && (
          <div className="absolute inset-0 pointer-events-none z-10"
               style={{
                   background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 80%, black 100%)',
                   transform: 'scale(1.1)' 
               }}
          />
      )}

      {/* VHS OVERLAY */}
      {effect === 'vhs' && (
          <>
            <div className="absolute inset-0 pointer-events-none z-10"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    opacity: 0.15,
                    mixBlendMode: 'overlay'
                }}
            />
            <div className="absolute inset-0 pointer-events-none z-20 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                            <h2 className="text-white text-3xl font-sans font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest flex items-center gap-2">
                                ▶ PLAY
                            </h2>
                            <span className="text-white text-xl font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ml-1">SP</span>
                    </div>
                    <div className="relative">
                        <div className="w-12 h-6 border-2 border-white flex p-0.5 shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/10">
                            <div className="h-full w-1/4 bg-red-500 animate-pulse"></div>
                        </div>
                        <div className="absolute top-1.5 -right-1.5 w-1.5 h-3 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.8)]"></div>
                    </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[85%] h-[85%] border-2 border-white/70 shadow-[0_0_5px_rgba(0,0,0,0.5)] flex items-center justify-center">
                        <div className="relative w-8 h-8 opacity-90">
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white shadow-[0_0_2px_black] transform -translate-y-1/2"></div>
                            <div className="absolute left-1/2 top-0 h-full w-[2px] bg-white shadow-[0_0_2px_black] transform -translate-x-1/2"></div>
                        </div>
                    </div>
                </div>
                <div className="text-white font-mono font-bold text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {retroDate} <span className="text-sm ml-2">{timeString}</span>
                </div>
            </div>
          </>
      )}

      {/* HEATMAP UI */}
      {effect === 'heatmap' && (
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
              <div className="text-center">
                  <span className="text-[#00ff00] font-mono font-bold text-xl drop-shadow-[0_0_5px_#00ff00] bg-black/50 px-2 rounded">
                      ALIEN_VISION // TARGET_LOCKED
                  </span>
              </div>
              <div className="flex justify-between items-end text-[#00ff00] font-mono opacity-80">
                   <div>
                       <div className="text-xs">SENSOR_ARRAY: ON</div>
                       <div className="text-xs">SPECTRAL: INFRARED</div>
                   </div>
                   <div className="text-center text-3xl animate-pulse">
                       ⏚
                   </div>
                   <div className="text-right">
                       <div className="text-xs">TEMP: 37°C</div>
                       <div className="text-xs">DIST: 2.4M</div>
                   </div>
              </div>
              
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00ff00]/50 shadow-[0_0_10px_#00ff00] animate-[scan_3s_linear_infinite]"></div>
          </div>
      )}

      {/* TICTAK (LIVE STREAM) OVERLAY */}
      {effect === 'tictak' && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 font-sans">
            
            {/* Top Header */}
            <div className="flex justify-between items-start">
                
                {/* Left Side: Logo + Profile */}
                <div className="flex flex-col gap-4 items-start">
                    {/* TicTak Logo */}
                    <div className="flex items-center gap-1 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] ml-2">
                        <span className="text-white font-black text-7xl tracking-tighter shadow-black">TicTak</span>
                        <span className="text-[#fe2c55] font-black text-7xl shadow-black">♪</span>
                    </div>

                    {/* Profile Pill */}
                    <div className="flex items-center gap-4 bg-black/20 p-3 pr-8 rounded-full backdrop-blur-sm">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 p-[3px]">
                            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                 <User className="text-gray-500 w-14 h-14" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-white font-bold text-2xl shadow-black drop-shadow-md">@party_star</span>
                            <span className="text-white/80 text-lg">03:22</span>
                        </div>
                        <div className="bg-[#fe2c55] px-5 py-1.5 rounded text-xl font-bold text-white ml-2 animate-pulse">
                            LIVE
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2 bg-black/20 px-6 py-3 rounded-full backdrop-blur-sm">
                        <span className="text-white text-2xl">👁️</span>
                        <span className="text-white font-bold text-2xl">12.5k</span>
                    </div>
                    <X className="text-white w-16 h-16 drop-shadow-md" />
                </div>
            </div>

            {/* Bottom Section */}
            <div className="flex items-end justify-between w-full">
                
                {/* Left: Comments & Input */}
                <div className="flex flex-col gap-4 w-2/3">
                    {/* Fake Comments List (Fading up) */}
                    <div className="flex flex-col gap-4 text-3xl mb-4 opacity-90 mask-image-gradient">
                         <div className="animate-fade-up delay-75">
                            <span className="font-bold text-green-300 drop-shadow-md">user_99:</span> <span className="text-white drop-shadow-md">Omg I love this! 😍</span>
                         </div>
                         <div className="animate-fade-up delay-150">
                            <span className="font-bold text-pink-300 drop-shadow-md">cool_guy:</span> <span className="text-white drop-shadow-md">🔥🔥🔥</span>
                         </div>
                         <div className="animate-fade-up delay-300">
                            <span className="font-bold text-blue-300 drop-shadow-md">bestie:</span> <span className="text-white drop-shadow-md">Slay queen! 👑</span>
                         </div>
                         <div className="animate-fade-up delay-500">
                            <span className="font-bold text-yellow-300 drop-shadow-md">fan_01:</span> <span className="text-white drop-shadow-md">Notice me pls!!</span>
                         </div>
                    </div>

                    {/* Fake Input */}
                    <div className="flex items-center gap-4 bg-black/30 backdrop-blur-sm rounded-full px-8 py-6 text-white/70 text-2xl w-full max-w-[600px]">
                        <span>Add comment...</span>
                        <div className="ml-auto text-white">...</div>
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-col gap-8 items-center pb-8 mr-4">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-24 h-24 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                            <User className="text-white w-14 h-14 drop-shadow-md" />
                            <div className="absolute -bottom-2 bg-[#fe2c55] rounded-full w-10 h-10 flex items-center justify-center border-2 border-white">
                                <span className="text-white text-2xl font-bold">+</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                         <Heart className="text-white w-20 h-20 fill-white/20 drop-shadow-md" />
                         <span className="text-white text-xl font-bold drop-shadow-md">85k</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                         <MessageCircle className="text-white w-20 h-20 drop-shadow-md" />
                         <span className="text-white text-xl font-bold drop-shadow-md">1.2k</span>
                    </div>

                     <div className="flex flex-col items-center gap-1">
                         <Gift className="text-pink-400 w-20 h-20 drop-shadow-md" />
                         <span className="text-white text-xl font-bold drop-shadow-md">Gift</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                         <Share2 className="text-white w-20 h-20 drop-shadow-md" />
                         <span className="text-white text-xl font-bold drop-shadow-md">Share</span>
                    </div>
                    
                    {/* Spinning Disc */}
                    <div className="w-28 h-28 rounded-full bg-gray-900 border-4 border-gray-700 mt-4 animate-[spin_4s_linear_infinite] flex items-center justify-center overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-white/20"></div>
                    </div>
                </div>

                {/* Floating Hearts Animation Container */}
                <div className="absolute bottom-40 right-4 w-24 h-96 pointer-events-none overflow-hidden">
                    <div className="absolute bottom-0 right-4 text-6xl animate-[floatUp_2s_ease-in_infinite] opacity-0">❤️</div>
                    <div className="absolute bottom-0 right-12 text-5xl animate-[floatUp_2.5s_ease-in_infinite_0.5s] opacity-0 text-pink-500">💖</div>
                    <div className="absolute bottom-0 right-0 text-7xl animate-[floatUp_3s_ease-in_infinite_1s] opacity-0 text-red-500">💗</div>
                </div>
            </div>
        </div>
      )}
      
      {overlay && (
        <img 
            src={overlay} 
            alt="Frame Overlay" 
            className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none"
        />
      )}
      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 1; }
          100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
        }
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-fade-up {
            animation: fadeUp 0.5s ease-out forwards;
            opacity: 0;
            transform: translateY(20px);
        }
        @keyframes fadeUp {
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

Camera.displayName = 'Camera';

export default Camera;