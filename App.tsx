import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera as CameraIcon, Download, Sparkles, Loader2, Palette, Settings, Save, X, Star, Triangle, Circle, Square, Hexagon, RotateCw, RotateCcw, Monitor, Camera as CamIcon, Image as ImageIcon, Volume2, Maximize, Upload, Trash2, ExternalLink, CloudUpload, QrCode, Clock, Coins, Timer, MessageSquare, FileText, RefreshCcw, Play, ImagePlus, MonitorPlay, FileVideo, Hourglass, ZoomIn, Scan, Expand, Grid3X3, Wand2, Eye, Flame, Tv, Zap, MessageCircle, Mic, Layout, Hash, Wallpaper, Type, SmilePlus } from 'lucide-react';
import Camera, { CameraHandle } from './components/Camera';
import PhotoStrip from './components/PhotoStrip';
import { AppState, PhotoData, FrameStyle, BackgroundConfig, DecorationItem, BackgroundStyle, Slide, CameraEffect, PhotoLayout, TextStyleConfig } from './types';

// ==========================================
// CHECKPOINT: LOGIC FIX 2
// FIXED: PREMATURE EXIT (SINGLE PHOTO BUG)
// ==========================================

const COUNTDOWN_SECONDS = 5;       // Standard time for photos 2, 3, 4
const INITIAL_COUNTDOWN_SECONDS = 10; // Extra time for photo 1 (Camera warm-up)
const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyHHnwMGj-qoWnbDmEf5Til5XLROfhmykzBEf3XSf1HBpxYZVyPpM_fGALmAPaqT7GB/exec";
const AUTONOMOUS_REVIEW_DELAY = 3000; // 3 seconds before auto-upload
const AUTONOMOUS_QR_DURATION = 30; // 30 seconds to view QR before reset
const DEFAULT_SCREENSAVER_TIMEOUT_MIN = 5; // Default 5 Minutes
const SLIDE_DURATION_MS = 6000; // 6 Seconds per slide (only for images)

// Fun prompts for the users (Default fallback)
const DEFAULT_POSE_PROMPTS = [
  "¡Cambia de pose!",
  "¡Un abrazo grupal!",
  "¡Hagan caras graciosas!",
  "¡Mirada intensa!",
  "¡Como si fueran famosos!",
  "¡Digan WHISKY!",
  "¡Besito a la cámara!",
  "¡Súper serios (foto DNI)!",
  "¡Manos arriba!",
  "¡Usa un sombrero imaginario!",
  "¡Prueba esos lentes!",
  "¡Señalen a la cámara!",
  "¡Cara de sorpresa total!",
  "¡De espaldas!",
  "¡Pose de victoria!",
  "¡Cara de pez!",
  "¡Como si vieran un fantasma!",
  "¡Todos dormidos!",
  "¡Rock & Roll baby!",
  "¡Pose de yoga!",
  "¡La mueca más fea!",
  "¡Amor puro!",
  "¡Señala al culpable!",
  "¡Como superhéroes!",
  "¡Guiño, guiño!",
  "¡Lengua afuera!",
  "¡Manos de Jazz!",
  "¡Estilo Agente 007!",
  "¡Pensadores profundos!",
  "¡Riendo a carcajadas!",
  "¡Pose de T-Rex!",
  "¡Vogue (estilo modelo)!",
  "¡Cachetes inflados!",
  "¡Cara de 'OMG'!",
  "¡Mirada seductora!",
  "¡Todos saltando!",
  "¡Hagan el corazón con los dedos!",
  "¡Beso al aire!",
  "¡Pose de estatua!",
  "¡Como si lloviera!",
  "¡Duck face (pico de pato)!",
  "¡Gritando en silencio!",
  "¡Señala al más fiestero!",
  "¡Pose de Karate!",
  "¡Cara de sospechoso!",
  "¡Como si oliera mal!",
  "¡Hagan bizcos!",
  "¡Pose de rapero!",
  "¡Como si ganaran la lotería!",
  "¡Espalda con espalda!"
];

// Default Configuration
const DEFAULT_BG_CONFIG: BackgroundConfig = {
  style: 'gallery-collage',
  color1: '#ff00cc',
  color2: '#333399',
  showShapes: true,
  showEmojis: true,
  emojiList: "🔥 🎉 💖 😜 👑 🔥 🎉 💖 😜 👑😀 😃 😄 😁 😆 🥹 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 🙂‍↕️ 😏 😒 🙂‍↔️ 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😶‍🌫️ 😱 😨 😰 😥 😓 🤗 🤔 🫣 🤭 🫢 🫡 🤫 🫠 🤥 😶 🫥 😐 🫤 😑 🫨 😬 🙄 😯 😦 😧 😮 😲 🥱 🫩 😴 🤤 😪 😮‍💨 😵 😵‍💫 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾 🫶 🤲 👐 🙌 👏 🤝 👍 👎 👊 ✊ 🤛 🤜 🫷 🫸 🤞 ✌️ 🫰 🤟 🤘 👌 🤌 🤏 🫳 🫴 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤙 🫲 🫱 💪 🦾 🖕 ✍️ 🙏 🫵 🦶 🦵 🦿 💄 💋 👄 🫦 🦷 👅 👂 🦻 👃 🫆 👣 👁️ 👀 🫀 🫁 🧠 🗣️ 👤 👥 🫂 👶 🧒 👧 👦 🧑 👩 👨 🧑‍🦱 👩‍🦱 👨‍🦱 🧑‍🦰 👩‍🦰 👨‍🦰 👱 👱‍♀️ 👱‍♂️ 🧑‍🦳 👩‍🦳 👨‍🦳 🧑‍🦲 👩‍🦲 👨‍🦲 🧔 🧔‍♀️ 🧔‍♂️ 🧓 👵 👴 👲 👳 👳‍♀️ 👳‍♂️ 🧕 👮 👮‍♀️ 👮‍♂️ 👷 👷‍♀️ 👷‍♂️ 💂 💂‍♀️ 💂‍♂️ 🕵️ 🕵️‍♀️ 🕵️‍♂️ 🧑‍⚕️ 👩‍⚕️ 👨‍⚕️ 🧑‍🌾 👩‍🌾 👨‍🌾 🧑‍🍳 👩‍🍳 👨‍🍳 🧑‍🎓 👩‍🎓 👨‍🎓 🧑‍🎤 👩‍🎤 👨‍🎤 🧑‍🏫 👩‍🏫 👨‍🏫 🧑‍🏭 👩‍🏭 👨‍🏭 🧑‍💻 👩‍💻 👨‍💻 🧑‍💼 👩‍💼 👨‍💼 🧑‍🔧 👩‍🔧 👨‍🔧 🧑‍🔬 👩‍🔬 👨‍🔬 🧑‍🎨 👩‍🎨 👨‍🎨 🧑‍🚒 👩‍🚒 👨‍🚒 🧑‍✈️ 👩‍✈️ 👨‍✈️ 🧑‍🚀 👩‍🚀 👨‍🚀 🧑‍⚖️ 👩‍⚖️ 👨‍⚖️ 👰 👰‍♀️ 👰‍♂️ 🤵 🤵‍♀️ 🤵‍♂️ 🫅 👸 🤴 🦸 🦸‍♀️ 🦸‍♂️ 🦹 🦹‍♀️ 🦹‍♂️ 🥷 🧑‍🎄 🤶 🎅 🧙 🧙‍♀️ 🧙‍♂️ 🧝 🧝‍♀️ 🧝‍♂️ 🧌 🧛 🧛‍♀️ 🧛‍♂️ 🧟 🧟‍♀️ 🧟‍♂️ 🧞 🧞‍♀️ 🧞‍♂️ 🧜 🧜‍♀️ 🧜‍♂️ 🧚 🧚‍♀️ 🧚‍♂️ 👼 🫄 🤰 🫃 🤱 🧑‍🍼 👩‍🍼 👨‍🍼 🙇 🙇‍♀️ 🙇‍♂️ 💁 💁‍♀️ 💁‍♂️ 🙅 🙅‍♀️ 🙅‍♂️ 🙆 🙆‍♀️ 🙆‍♂️ 🙋 🙋‍♀️ 🙋‍♂️ 🧏 🧏‍♀️ 🧏‍♂️ 🤦 🤦‍♀️ 🤦‍♂️ 🤷 🤷‍♀️ 🤷‍♂️ 🙎 🙎‍♀️ 🙎‍♂️ 🙍 🙍‍♀️ 🙍‍♂️ 💇 💇‍♀️ 💇‍♂️ 💆 💆‍♀️ 💆‍♂️ 🧖 🧖‍♀️ 🧖‍♂️ 💅 🤳 💃 🕺 👯 👯‍♀️ 👯‍♂️ 🕴️ 🧑‍🦽 👩‍🦽 👨‍🦽 🧑‍🦽‍➡️ 👩‍🦽‍➡️ 👨‍🦽‍➡️ 🧑‍🦼 👩‍🦼 👨‍🦼 🧑‍🦼‍➡️ 👩‍🦼‍➡️ 👨‍🦼‍➡️ 🚶 🚶‍♀️ 🚶‍♂️ 🚶‍➡️ 🚶‍♀️‍➡️ 🚶‍♂️‍➡️ 🧑‍🦯 👩‍🦯 👨‍🦯 🧑‍🦯‍➡️ 👩‍🦯‍➡️ 👨‍🦯‍➡️ 🧎 🧎‍♀️ 🧎‍♂️ 🧎‍➡️ 🧎‍♀️‍➡️ 🧎‍♂️‍➡️ 🏃 🏃‍♀️ 🏃‍♂️ 🏃‍➡️ 🏃‍♀️‍➡️ 🏃‍♂️‍➡️ 🧍 🧍‍♀️ 🧍‍♂️ 🧑‍🤝‍🧑 👫 👭 👬 💑 👩‍❤️‍👨 👩‍❤️‍👩 👨‍❤️‍👨 💏 👩‍❤️‍💋‍👨 👩‍❤️‍💋‍👩 👨‍❤️‍💋‍👨 🧑‍🧑‍🧒 🧑‍🧑‍🧒‍🧒 🧑‍🧒‍🧒 🧑‍🧒 👪 👨‍👩‍👦 👨‍👩‍👧 👨‍👩‍👧‍👦 👨‍👩‍👦‍👦 👨‍👩‍👧‍👧 👩‍👩‍👦 👩‍👩‍👧 👩‍👩‍👧‍👦 👩‍👩‍👦‍👦 👩‍👩‍👧‍👧 👨‍👨‍👦 👨‍👨‍👧 👨‍👨‍👧‍👦 👨‍👨‍👦‍👦 👨‍👨‍👧‍👧 👩‍👦 👩‍👧 👩‍👧‍👦 👩‍👦‍👦 👩‍👧‍👧 👨‍👦 👨‍👧 👨‍👧‍👦 👨‍👦‍👦 👨‍👧‍👧 🪢 🧶 🧵 🪡 🧥 🥼 🦺 👚 👕 👖 🩲 🩳 👔 👗 👙 🩱 👘 🥻 🩴 🥿 👠 👡 👢 👞 👟 🥾 🧦 🧤 🧣 🎩 🧢 👒 🎓 ⛑️ 🪖 👑 💍 👝 👛 👜 💼 🎒 🧳 👓 🕶️ 🥽 🌂🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁 🐮 🐷 🐽 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🐣 🐥 🪿 🦆 🐦‍⬛ 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🫎 🐝 🪱 🐛 🦋 🐌 🐞 🐜 🪰 🪲 🪳 🦟 🦗 🕷️ 🕸️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🪼 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🦭 🐊 🐅 🐆 🦓 🦍 🦧 🦣 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🦬 🐃 🐂 🐄 🫏 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐕‍🦺 🐈 🐈‍⬛ 🪶 🪽 🐓 🦃 🦤 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦫 🦦 🦥 🐁 🐀 🐿️ 🦔 🐾 🐉 🐲 🐦‍🔥 🌵 🎄 🌲 🌳 🌴 🪾 🪵 🌱 🌿 ☘️ 🍀 🎍 🪴 🎋 🍃 🍂 🍁 🪺 🪹 🍄 🍄‍🟫 🐚 🪸 🪨 🌾 💐 🌷 🌹 🥀 🪻 🪷 🌺 🌸 🌼 🌻 🌞 🌝 🌛 🌜 🌚 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔 🌙 🌎 🌍 🌏 🪐 💫 ⭐ 🌟 ✨ ⚡️ ☄️ 💥 🔥 🌪️ 🌈 ☀️ 🌤️ ⛅ 🌥️ ☁️ 🌦️ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ☃️ ⛄ 🌬️ 💨 💧 💦 🫧 ☔ ☂️ 🌊 🌫️🍏 🍎 🍐 🍊 🍋 🍋‍🟩 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🫛 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🫜 🍠 🫚 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🦴 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🫙 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🫘 🍯 🥛 🫗 🍼 🫖 ☕ 🍵 🧉 🧃 🥤 🧋 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🍾 🧊 🥄 🍴 🍽️ 🥣 🥡 🥢 🧂⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🪃 🥅 ⛳ 🪁 🛝 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 ⛷️ 🏂 🪂 🏋️ 🏋️‍♀️ 🏋️‍♂️ 🤼 🤼‍♀️ 🤼‍♂️ 🤸 🤸‍♀️ 🤸‍♂️ ⛹️ ⛹️‍♀️ ⛹️‍♂️ 🤺 🤾 🤾‍♀️ 🤾‍♂️ 🏌️ 🏌️‍♀️ 🏌️‍♂️ 🏇 🧘 🧘‍♀️ 🧘‍♂️ 🏄 🏄‍♀️ 🏄‍♂️ 🏊 🏊‍♀️ 🏊‍♂️ 🤽 🤽‍♀️ 🤽‍♂️ 🚣 🚣‍♀️ 🚣‍♂️ 🧗 🧗‍♀️ 🧗‍♂️ 🚵 🚵‍♀️ 🚵‍♂️ 🚴 🚴‍♀️ 🚴‍♂️ 🏆 🥇 🥈 🥉 🏅 🎖️ 🏵️ 🎗️ 🎫 🎟️ 🎪 🤹 🤹‍♀️ 🤹‍♂️ 🎭 🩰 🎨 🫟 🎬 🎤 🎧 🎼 🎹 🪇 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🪉 🎻 🪈 🎲 ♟️ 🎯 🎳 🎮 🎰 🧩🚗 🚕 🚙 🛻 🚐 🚌 🚎 🏎️ 🚓 🚑 🚒 🚚 🚛 🚜 🦯 🦽 🦼 🩼 🛴 🚲 🛵 🏍️ 🛺 🛞 🚨 🚔 🚍 🚘 🚖 🚡 🚠 🚟 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 💺 🛰️ 🚀 🛸 🚁 🛶 ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 🛟 ⚓ 🪝 ⛽ 🚧 🚦 🚥 🚏 🗺️ 🗿 🗽 🗼 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏖️ 🏝️ 🏜️ 🌋 ⛰️ 🏔️ 🗻 🏕️ ⛺ 🏠 🏡 🏘️ 🏚️ 🛖 🏗️ 🏭 🏢 🏬 🏣 🏤 🏥 🏦 🏨 🏪 🏫 🏩 💒 🏛️ ⛪ 🕌 🕍 🛕 🕋 ⛩️ 🛤️ 🛣️ 🗾 🎑 🏞️ 🌅 🌄 🌠 🎇 🎆 🌇 🌆 🏙️ 🌃 🌌 🌉 🌁⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 🖲️ 🕹️ 🗜️ 💽 💾 💿 📀 📼 📷 📸 📹 🎥 📽️ 🎞️ 📞 ☎️ 📟 📠 📺 📻 🎙️ 🎚️ 🎛️ 🧭 ⏱️ ⏲️ ⏰ 🕰️ ⌛ ⏳ 📡 🔋 🪫 🔌 💡 🔦 🕯️ 🪔 🧯 🛢️ 💸 💵 💴 💶 💷 🪙 💰 💳 🪪 💎 ⚖️ 🪜 🧰 🪛 🔧 🔨 ⚒️ 🛠️ ⛏️ 🪏 🪚 🔩 ⚙️ 🪤 🧱 ⛓️ ⛓️‍💥 🧲 🔫 💣 🧨 🪓 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🪦 ⚱️ 🏺 🔮 📿 🧿 🪬 💈 ⚗️ 🔭 🔬 🕳️ 🩻 🩹 🩺 💊 💉 🩸 🧬 🦠 🧫 🧪 🌡️ 🧹 🪠 🧺 🧻 🚽 🚰 🚿 🛁 🛀 🧼 🪥 🪒 🪮 🧽 🪣 🧴 🛎️ 🔑 🗝️ 🚪 🪑 🛋️ 🛏️ 🛌 🧸 🪆 🖼️ 🪞 🪟 🛍️ 🛒 🎁 🎈 🎏 🎀 🪄 🪅 🎊 🎉 🎎 🪭 🏮 🎐 🪩 🧧 ✉️ 📩 📨 📧 💌 📥 📤 📦 🏷️ 🪧 📪 📫 📬 📭 📮 📯 📜 📃 📄 📑 🧾 📊 📈 📉 🗒️ 🗓️ 📆 📅 🗑️ 📇 🗃️ 🗳️ 🗄️ 📋 📁 📂 🗂️ 🗞️ 📰 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 🧷 🔗 📎 🖇️ 📐 📏 🧮 📌 📍 ✂️ 🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓🩷 ❤️ 🧡 💛 💚 🩵 💙 💜 🖤 🩶 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 ❤️‍🩹 ❤️‍🔥 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ 🪯 ✡️ 🔯 🕎 ☯️ ☦️ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ 🆔 ⚛️ 🉑 ☢️ ☣️ 📴 📳 🈶 🈚 🈸 🈺 🈷️ ✴️ 🆚 💮 🉐 ㊙️ ㊗️ 🈴 🈵 🈹 🈲 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 〽️ ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 🈯 💹 ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 🏧 🚾 ♿ 🅿️ 🛗 🈳 🈂️ 🛂 🛃 🛄 🛅 🛜 🚹 🚺 🚼 🚻 🚮 🎦 📶 🈁 🔣 ℹ️ 🔤 🔡 🔠 🆖 🆗 🆙 🆒 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔢 #️⃣ *️⃣ ⏏️ ▶️ ⏸️ ⏯️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ ⏫ ⏬ ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ ⤴️ ⤵️ 🔀 🔁 🔂 🔄 🔃 🎵 🎶 ➕ ➖ ➗ ✖️ 🟰 ♾️ 💲 💱 ™️ ©️ ®️ 〰️ ➰ ➿ 🔚 🔙 🔛 🔝 🔜 ✔️ ☑️ 🔘 ⚪ ⚫ 🔴 🔵 🟤 🟣 🟢 🟡 🟠 🔺 🔻 🔸 🔹 🔶 🔷 🔳 🔲 ▪️ ▫️ ◾ ◽ ◼️ ◻️ ⬛ ⬜ 🟧 🟦 🟥 🟫 🟪 🟩 🟨 🔈 🔇 🔉 🔊 🔔 🔕 📣 📢 🗨️ 👁️‍🗨️ 💬 💭 🗯️ ♠️ ♣️ ♥️ ♦️ 🃏 🎴 🀄 🕐 🕑 🕒 🕓 🕔 🕕 🕖 🕗 🕘 🕙 🕚 🕛 🕜 🕝 🕞 🕟 🕠 🕡 🕢 🕣 🕤 🕥 🕦 🕧 ♀️ ♂️ ⚧ ⚕️🏳️ 🏴 🏴‍☠️ 🏁 🚩 🏳️‍🌈 🏳️‍⚧️ 🇺🇳 🇦🇫 🇦🇽 🇦🇱 🇩🇿 🇦🇸 🇦🇩 🇦🇴 🇦🇮 🇦🇶 🇦🇬 🇦🇷 🇦🇲 🇦🇼 🇦🇺 🇦🇹 🇦🇿 🇧🇸 🇧🇭 🇧🇩 🇧🇧 🇧🇾 🇧🇪 🇧🇿 🇧🇯 🇧🇲 🇧🇹 🇧🇴 🇧🇦 🇧🇼 🇧🇷 🇮🇴 🇻🇬 🇧🇳 🇧🇬 🇧🇫 🇧🇮 🇰🇭 🇨🇲 🇨🇦 🇮🇨 🇨🇻 🇧🇶 🇰🇾 🇨🇫 🇹🇩 🇨🇱 🇨🇳 🇨🇽 🇨🇨 🇨🇴 🇰🇲 🇨🇬 🇨🇩 🇨🇰 🇨🇷 🇨🇮 🇭🇷 🇨🇺 🇨🇼 🇨🇾 🇨🇿 🇩🇰 🇩🇯 🇩🇲 🇩🇴 🇪🇨 🇪🇬 🇸🇻 🇬🇶 🇪🇷 🇪🇪 🇪🇹 🇪🇺 🇫🇰 🇫🇴 🇫🇯 🇫🇮 🇫🇷 🇬🇫 🇵🇫 🇹🇫 🇬🇦 🇬🇲 🇬🇪 🇩🇪 🇬🇭 🇬🇮 🇬🇷 🇬🇱 🇬🇩 🇬🇵 🇬🇺 🇬🇹 🇬🇬 🇬🇳 🇬🇼 🇬🇾 🇭🇹 🇭🇳 🇭🇰 🇭🇺 🇮🇸 🇮🇳 🇮🇩 🇮🇷 🇮🇶 🇮🇪 🇮🇲 🇮🇱 🇮🇹 🇯🇲 🇯🇵 🎌 🇯🇪 🇯🇴 🇰🇿 🇰🇪 🇰🇮 🇽🇰 🇰🇼 🇰🇬 🇱🇦 🇱🇻 🇱🇧 🇱🇸 🇱🇷 🇱🇾 🇱🇮 🇱🇹 🇱🇺 🇲🇴 🇲🇰 🇲🇬 🇲🇼 🇲🇾 🇲🇻 🇲🇱 🇲🇹 🇲🇭 🇲🇶 🇲🇷 🇲🇺 🇾🇹 🇲🇽 🇫🇲 🇲🇩 🇲🇨 🇲🇳 🇲🇪 🇲🇸 🇲🇦 🇲🇿 🇲🇲 🇳🇦 🇳🇷 🇳🇵 🇳🇱 🇳🇨 🇳🇿 🇳🇮 🇳🇪 🇳🇬 🇳🇺 🇳🇫 🇰🇵 🇲🇵 🇳🇴 🇴🇲 🇵🇰 🇵🇼 🇵🇸 🇵🇦 🇵🇬 🇵🇾 🇵🇪 🇵🇭 🇵🇳 🇵🇱 🇵🇹 🇵🇷 🇶🇦 🇷🇪 🇷🇴 🇷🇺 🇷🇼 🇼🇸 🇸🇲 🇸🇹 🇨🇶 🇸🇦 🇸🇳 🇷🇸 🇸🇨 🇸🇱 🇸🇬 🇸🇽 🇸🇰 🇸🇮 🇬🇸 🇸🇧 🇸🇴 🇿🇦 🇰🇷 🇸🇸 🇪🇸 🇱🇰 🇧🇱 🇸🇭 🇰🇳 🇱🇨 🇵🇲 🇻🇨 🇸🇩 🇸🇷 🇸🇿 🇸🇪 🇨🇭 🇸🇾 🇹🇼 🇹🇯 🇹🇿 🇹🇭 🇹🇱 🇹🇬 🇹🇰 🇹🇴 🇹🇹 🇹🇳 🇹🇷 🇹🇲 🇹🇨 🇻🇮 🇹🇻 🇺🇬 🇺🇦 🇦🇪 🇬🇧 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿 🇺🇸 🇺🇾 🇺🇿 🇻🇺 🇻🇦 🇻🇪 🇻🇳 🇼🇫 🇪🇭 🇾🇪 🇿🇲 🇿🇼 🇦🇨 🇧🇻 🇨🇵 🇪🇦 🇩🇬 🇭🇲 🇲🇫 🇸🇯 🇹🇦 🇺🇲",
  density: 'medium'
};

const DEFAULT_TEXT_CONFIG: TextStyleConfig = {
  fontFamily: 'Courier New',
  fontSize: 70,
  color: '#000000',
  bgColor: '#ffffff',
  bgOpacity: 0.0, // Transparent by default
  isBold: true,
  isItalic: false
};

interface GalleryPhoto {
    id: string;
    url: string;
    style: React.CSSProperties;
}

type ShutterSoundType = 'mechanical' | 'digital' | 'magic' | 'silent';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const [photosTakenCount, setPhotosTakenCount] = useState<number>(0);
  const [flash, setFlash] = useState<boolean>(false);
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  
  // Prompt State
  const [currentPrompt, setCurrentPrompt] = useState<string>("¡Prepárate!");
  const [enablePrompts, setEnablePrompts] = useState<boolean>(true);
  const [promptList, setPromptList] = useState<string[]>(DEFAULT_POSE_PROMPTS);

  // Gallery State (In-memory storage for the session)
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  
  // Admin / Global Configuration (Persisted)
  const [adminClicks, setAdminClicks] = useState<number>(0);
  const [eventText, setEventText] = useState<string>("EVENTO 2025");
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('classic');
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(DEFAULT_BG_CONFIG);
  const [textConfig, setTextConfig] = useState<TextStyleConfig>(DEFAULT_TEXT_CONFIG);
  const [shutterSound, setShutterSound] = useState<ShutterSoundType>('mechanical');
  
  // Layout Config
  const [photoLayout, setPhotoLayout] = useState<PhotoLayout>('strip');
  const [photoCount, setPhotoCount] = useState<number>(4);

  // Cloud Integration State
  const [webhookUrl, setWebhookUrl] = useState<string>(DEFAULT_WEBHOOK_URL);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Autonomous Mode State
  const [autonomousMode, setAutonomousMode] = useState<boolean>(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<number>(AUTONOMOUS_QR_DURATION);
  
  // QR State
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Custom Frame Overlay & Background
  const [customOverlay, setCustomOverlay] = useState<string | null>(null);
  const [customFrameBg, setCustomFrameBg] = useState<string | null>(null); // New state for paper background
  
  // Screensaver / Slideshow State
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [screensaverTimeoutMin, setScreensaverTimeoutMin] = useState<number>(DEFAULT_SCREENSAVER_TIMEOUT_MIN);
  
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screensaverStartRef = useRef<number>(0); // Timestamp when screensaver started
  
  // Rotation State: 0 (Landscape), 90 (Vertical Right), -90 (Vertical Left)
  const [rotation, setRotation] = useState<number>(0);

  // Camera Calibration State (Advanced)
  const [cameraPreviewAdj, setCameraPreviewAdj] = useState<number>(0); 
  const [cameraCaptureAdj, setCameraCaptureAdj] = useState<number>(270); 
  const [cameraZoom, setCameraZoom] = useState<number>(1.0); // Digital Zoom
  const [cameraFitMode, setCameraFitMode] = useState<boolean>(false); // TRUE = Object Contain (Full sensor), FALSE = Object Cover (Crop)
  
  // New Camera Effects State
  const [cameraEffect, setCameraEffect] = useState<CameraEffect>('none');
  
  // --- MAGIC WAND STATE (NEW) ---
  const [isMagicWandMode, setIsMagicWandMode] = useState<boolean>(false);

  const [testImage, setTestImage] = useState<string | null>(null); 

  // Review Screen Decoration State
  const [decorations, setDecorations] = useState<DecorationItem[]>([]);
  const [randomBgStyle, setRandomBgStyle] = useState<React.CSSProperties>({});

  const cameraRef = useRef<CameraHandle>(null);
  const adminCameraRef = useRef<CameraHandle>(null);

  // Load Admin settings on mount
  useEffect(() => {
    const savedText = localStorage.getItem('pb_event_text');
    const savedFrame = localStorage.getItem('pb_frame_style') as FrameStyle;
    const savedBgConfig = localStorage.getItem('pb_bg_config');
    const savedTextConfig = localStorage.getItem('pb_text_config');
    const savedRotation = localStorage.getItem('pb_rotation');
    const savedSound = localStorage.getItem('pb_shutter_sound') as ShutterSoundType;
    const savedOverlay = localStorage.getItem('pb_custom_overlay');
    const savedFrameBg = localStorage.getItem('pb_custom_frame_bg');
    const savedWebhook = localStorage.getItem('pb_webhook_url');
    const savedAutonomous = localStorage.getItem('pb_autonomous');
    const savedSlides = localStorage.getItem('pb_slides');
    const savedTimeout = localStorage.getItem('pb_screensaver_timeout');
    const savedLayout = localStorage.getItem('pb_photo_layout');
    const savedPhotoCount = localStorage.getItem('pb_photo_count');
    
    // Prompts Settings
    const savedEnablePrompts = localStorage.getItem('pb_enable_prompts');
    const savedPromptList = localStorage.getItem('pb_custom_prompt_list');
    
    // Calibration Settings
    const savedPreviewAdj = localStorage.getItem('pb_cam_preview_adj');
    const savedCaptureAdj = localStorage.getItem('pb_cam_capture_adj');
    const savedZoom = localStorage.getItem('pb_cam_zoom');
    const savedFitMode = localStorage.getItem('pb_cam_fit_mode');
    const savedEffect = localStorage.getItem('pb_cam_effect');
    
    // Magic Wand Setting
    const savedMagicWand = localStorage.getItem('pb_magic_wand_mode');

    if (savedText) setEventText(savedText);
    if (savedFrame) setFrameStyle(savedFrame);
    if (savedBgConfig) setBgConfig(JSON.parse(savedBgConfig));
    if (savedTextConfig) setTextConfig(JSON.parse(savedTextConfig));
    if (savedRotation) setRotation(parseInt(savedRotation, 10));
    if (savedSound) setShutterSound(savedSound);
    if (savedOverlay) setCustomOverlay(savedOverlay);
    if (savedFrameBg) setCustomFrameBg(savedFrameBg);
    if (savedAutonomous) setAutonomousMode(savedAutonomous === 'true');
    if (savedTimeout) setScreensaverTimeoutMin(parseInt(savedTimeout, 10));
    if (savedLayout) setPhotoLayout(savedLayout as PhotoLayout);
    if (savedPhotoCount) setPhotoCount(parseInt(savedPhotoCount, 10));
    
    if (savedEnablePrompts !== null) setEnablePrompts(savedEnablePrompts === 'true');
    if (savedPromptList) {
        try {
            setPromptList(JSON.parse(savedPromptList));
        } catch(e) { console.error("Error loading prompts", e) }
    }
    
    if (savedWebhook !== null) {
        setWebhookUrl(savedWebhook);
    }
    
    if (savedPreviewAdj) setCameraPreviewAdj(parseInt(savedPreviewAdj, 10));
    if (savedCaptureAdj) setCameraCaptureAdj(parseInt(savedCaptureAdj, 10));
    if (savedZoom) setCameraZoom(parseFloat(savedZoom));
    if (savedFitMode !== null) setCameraFitMode(savedFitMode === 'true');
    if (savedEffect) setCameraEffect(savedEffect as CameraEffect);
    
    if (savedMagicWand !== null) setIsMagicWandMode(savedMagicWand === 'true');
    
    if (savedSlides) {
        try {
            setSlides(JSON.parse(savedSlides));
        } catch(e) { console.error("Error loading slides", e); }
    }
  }, []);

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Admin Panel Shortcut: Ctrl + Shift + A (or Cmd + Shift + A on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        // Toggle Admin State
        setState(prev => prev === AppState.ADMIN ? AppState.IDLE : AppState.ADMIN);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- INACTIVITY & SCREENSAVER LOGIC ---
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer if any
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    // If currently in Screensaver, try to wake up to IDLE
    if (state === AppState.SCREENSAVER) {
        // IMPORTANT: Grace period of 1.5 seconds.
        // Ignore activity (mouse moves from clicking Preview) immediately after starting.
        if (Date.now() - screensaverStartRef.current < 1500) {
            return;
        }
        setState(AppState.IDLE);
        return; 
    }

    // Only set timer if in IDLE state. We don't want screensaver during capture/review/admin.
    if (state !== AppState.IDLE) {
        return;
    }

    // Start timer only if we have slides
    if (slides.length > 0) {
        // Calculate timeout based on state setting (minutes to ms)
        const timeoutMs = Math.max(1, screensaverTimeoutMin) * 60 * 1000;
        inactivityTimerRef.current = setTimeout(() => {
            setState(AppState.SCREENSAVER);
        }, timeoutMs);
    }
  }, [state, slides, screensaverTimeoutMin]);

  // Screensaver State Initialization (Reset Index & Set Start Time)
  useEffect(() => {
    if (state === AppState.SCREENSAVER) {
        setCurrentSlideIndex(0);
        screensaverStartRef.current = Date.now();
    }
  }, [state]);

  // Global listeners for activity
  useEffect(() => {
      const handleActivity = () => resetInactivityTimer();

      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      window.addEventListener('keydown', handleActivity);
      
      // Initialize timer ONLY if we are in IDLE.
      // If we are in SCREENSAVER, we do NOT call resetInactivityTimer immediately,
      // because that would trigger the "wake up" logic instantly.
      if (state === AppState.IDLE) {
          resetInactivityTimer();
      }

      return () => {
          window.removeEventListener('mousemove', handleActivity);
          window.removeEventListener('click', handleActivity);
          window.removeEventListener('touchstart', handleActivity);
          window.removeEventListener('keydown', handleActivity);
          if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      };
  }, [resetInactivityTimer, state]);

  // --- SLIDESHOW CYCLE LOGIC (REFACTORED FOR VIDEO) ---
  const goToNextSlide = useCallback(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
      if (state !== AppState.SCREENSAVER || slides.length === 0) return;

      const currentSlide = slides[currentSlideIndex];
      if (!currentSlide) return;

      // If it's an IMAGE, set a timeout to go to next slide
      if (currentSlide.type === 'image') {
          const timer = setTimeout(goToNextSlide, SLIDE_DURATION_MS);
          return () => clearTimeout(timer);
      }
      
      // If it's a VIDEO, we do nothing here. 
      // The <video> element's onEnded event will trigger goToNextSlide.

  }, [state, slides, currentSlideIndex, goToNextSlide]);


  // --- AUTOMONOMOUS MODE LOGIC ---
  useEffect(() => {
    if (!autonomousMode) return;

    // 1. Auto-Upload Trigger when entering Review state
    // We wait 3 seconds to let the user see the "Tus fotos listas" screen
    if (state === AppState.REVIEW && !isUploading && !qrLink && !showQrModal) {
        const timer = setTimeout(() => {
            if (webhookUrl) {
                handleUploadToDrive();
            } else {
                handleDownloadAndReset();
            }
        }, AUTONOMOUS_REVIEW_DELAY);
        return () => clearTimeout(timer);
    }
  }, [state, autonomousMode, isUploading, qrLink, showQrModal, webhookUrl]);

  // 2. Countdown Timer for QR Screen (Auto Close)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (autonomousMode && showQrModal && autoCloseTimer > 0) {
        interval = setInterval(() => {
            setAutoCloseTimer((prev) => prev - 1);
        }, 1000);
    } else if (autonomousMode && showQrModal && autoCloseTimer === 0) {
        // Time is up, finish session
        finishSession();
    }

    return () => clearInterval(interval);
  }, [autonomousMode, showQrModal, autoCloseTimer]);

  const startSession = () => {
    setPhotos([]);
    setPhotosTakenCount(0);
    setStripUrl(null);
    setQrLink(null);
    setShowQrModal(false);
    setAutoCloseTimer(AUTONOMOUS_QR_DURATION); // Reset timer
    
    // MAGIC WAND LOGIC: If enabled, pick random effect for this session
    // This is the ONLY thing it changes dynamically.
    if (isMagicWandMode) {
        const effects: CameraEffect[] = ['none', 'news', 'tictak', 'fisheye', 'cctv', 'heatmap', 'vhs', 'warhol', 'emoji-challenge'];
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        setCameraEffect(randomEffect);
    }

    // Initial Prompt Logic
    if (enablePrompts && promptList.length > 0) {
         setCurrentPrompt("¡Prepárate!");
    } else {
         setCurrentPrompt("");
    }

    setState(AppState.COUNTDOWN);
    // Use the longer countdown for the first photo to allow camera to initialize
    setCountdown(INITIAL_COUNTDOWN_SECONDS);
  };

  // Secret Admin Access
  const handleSecretClick = () => {
    const newCount = adminClicks + 1;
    setAdminClicks(newCount);
    if (newCount >= 5) {
        setState(AppState.ADMIN);
        setAdminClicks(0);
    }
    // Reset clicks if idle too long
    setTimeout(() => setAdminClicks(0), 3000);
  };

  const saveAdminSettings = () => {
    localStorage.setItem('pb_event_text', eventText);
    localStorage.setItem('pb_frame_style', frameStyle);
    localStorage.setItem('pb_bg_config', JSON.stringify(bgConfig));
    localStorage.setItem('pb_text_config', JSON.stringify(textConfig));
    localStorage.setItem('pb_rotation', String(rotation));
    localStorage.setItem('pb_shutter_sound', shutterSound);
    localStorage.setItem('pb_cam_preview_adj', String(cameraPreviewAdj));
    localStorage.setItem('pb_cam_capture_adj', String(cameraCaptureAdj));
    localStorage.setItem('pb_cam_zoom', String(cameraZoom));
    localStorage.setItem('pb_cam_fit_mode', String(cameraFitMode));
    localStorage.setItem('pb_cam_effect', cameraEffect);
    localStorage.setItem('pb_webhook_url', webhookUrl);
    localStorage.setItem('pb_autonomous', String(autonomousMode));
    localStorage.setItem('pb_screensaver_timeout', String(screensaverTimeoutMin));
    localStorage.setItem('pb_photo_layout', photoLayout);
    localStorage.setItem('pb_photo_count', String(photoCount));
    
    // Save Prompts
    localStorage.setItem('pb_enable_prompts', String(enablePrompts));
    localStorage.setItem('pb_custom_prompt_list', JSON.stringify(promptList));
    
    // Save Magic Wand
    localStorage.setItem('pb_magic_wand_mode', String(isMagicWandMode));
    
    // Save Slides
    try {
        localStorage.setItem('pb_slides', JSON.stringify(slides));
    } catch (e) {
        alert("¡Cuidado! No se pudieron guardar todos los slides. Probablemente las imágenes sean muy grandes para la memoria local. Intenta usar imágenes más pequeñas o menos cantidad.");
        console.error("LocalStorage quota exceeded", e);
    }
    
    // Save Custom Overlay
    if (customOverlay) {
        try {
            localStorage.setItem('pb_custom_overlay', customOverlay);
        } catch (e) {
            console.error("Image too large for LocalStorage", e);
            alert("La imagen del marco es demasiado pesada para guardarse en la configuración permanente. Se usará solo por esta sesión.");
        }
    } else {
        localStorage.removeItem('pb_custom_overlay');
    }

    // Save Custom Frame Background
    if (customFrameBg) {
        try {
            localStorage.setItem('pb_custom_frame_bg', customFrameBg);
        } catch (e) {
            console.error("Background too large for LocalStorage", e);
            alert("La imagen de fondo es demasiado pesada. Se usará solo por esta sesión.");
        }
    } else {
        localStorage.removeItem('pb_custom_frame_bg');
    }

    setState(AppState.IDLE);
  };

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCustomOverlay(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleFrameBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCustomFrameBg(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSlideUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (slides.length >= 20) {
            alert("Máximo 20 slides permitidos.");
            return;
        }

        // Detect type (image or video)
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';

        const reader = new FileReader();
        reader.onloadend = () => {
            const newSlide: Slide = {
                id: Date.now().toString(),
                type: fileType,
                url: reader.result as string,
                duration: 6 // Fallback duration for images
            };
            setSlides(prev => [...prev, newSlide]);
        };
        reader.readAsDataURL(file);
    }
  };

  const deleteSlide = (id: string) => {
      setSlides(prev => prev.filter(s => s.id !== id));
  };
  
  const handlePromptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                // Split by newline, trim, and filter empty lines
                const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
                if (lines.length > 0) {
                    setPromptList(lines);
                    alert(`¡Éxito! Se cargaron ${lines.length} frases nuevas.`);
                } else {
                    alert("El archivo parece estar vacío.");
                }
            }
        };
        reader.readAsText(file);
    }
  };

  const resetPrompts = () => {
      setPromptList(DEFAULT_POSE_PROMPTS);
  };
  
  // Cycle effects for the quick button
  const cycleEffect = (e: React.MouseEvent) => {
      e.stopPropagation();
      const effects: CameraEffect[] = ['none', 'news', 'tictak', 'fisheye', 'cctv', 'heatmap', 'vhs', 'warhol', 'emoji-challenge'];
      const currentIndex = effects.indexOf(cameraEffect);
      const nextIndex = (currentIndex + 1) % effects.length;
      setCameraEffect(effects[nextIndex]);
  };

  const openLabMode = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            console.error("Error al entrar en modo Lab/Kiosco:", err);
            alert("No se pudo entrar en modo pantalla completa. Interactúa con la página primero.");
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  /**
   * Generates synthetic shutter sounds using Web Audio API.
   * Now supports multiple sound types.
   */
  const playShutterSound = (typeOverride?: ShutterSoundType) => {
    const type = typeOverride || shutterSound;
    if (type === 'silent') return;

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const t = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        if (type === 'mechanical') {
            // --- Mechanical Shutter (White Noise Burst) ---
            const bufferSize = ctx.sampleRate * 0.15; 
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, t);
            
            noise.connect(filter);
            filter.connect(gain);
            
            gain.gain.setValueAtTime(0.7, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            noise.start(t);

        } else if (type === 'digital') {
            // --- Digital Beep (Sine sweep) ---
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
            
            osc.connect(gain);
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.2);

        } else if (type === 'magic') {
            // --- Magic Sparkle (Multiple High Sines) ---
            [800, 1200, 2000].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);
                const localGain = ctx.createGain();
                localGain.connect(ctx.destination);
                
                osc.connect(localGain);
                localGain.gain.setValueAtTime(0.1, t + (i * 0.05));
                localGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + (i * 0.05));
                
                osc.start(t + (i * 0.05));
                osc.stop(t + 0.5);
            });
        }
    } catch (e) {
        console.error("Audio error:", e);
    }
  };

  /**
   * Generates a beep for the countdown.
   * Pitch increases as the count gets smaller (urgency).
   */
  const playCountdownBeep = (currentCount: number) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        // Formula: Higher frequency as count goes down.
        // Base 1000Hz, minus 80Hz for each second remaining.
        // e.g., 10s = 200Hz, 1s = 920Hz.
        const frequency = 1200 - (currentCount * 80); 
        osc.frequency.setValueAtTime(frequency, t);
        
        // Very short, distinct blip
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        osc.start(t);
        osc.stop(t + 0.1);
    } catch (e) {
        // ignore audio errors
    }
  };

  const takePhoto = useCallback(() => {
    if (cameraRef.current) {
      const photoDataUrl = cameraRef.current.takePhoto();
      if (photoDataUrl) {
        // Trigger Flash Effect
        setFlash(true);
        // Trigger Sound using current state
        playShutterSound();
        
        setTimeout(() => setFlash(false), 300);
        setPhotos(prev => [...prev, { id: Date.now().toString(), dataUrl: photoDataUrl }]);
        setPhotosTakenCount(prev => prev + 1);
      }
    }
  }, [shutterSound]); // Re-create if sound setting changes

  const handleTestCapture = () => {
    if (adminCameraRef.current) {
        const img = adminCameraRef.current.takePhoto();
        if (img) {
            playShutterSound(); // Play sound on test too
            setTestImage(img);
            // Show result for 3 seconds then hide
            setTimeout(() => setTestImage(null), 3000);
        }
    }
  };

  // --- REFACTORED CAPTURE LOOP TO FIX RACE CONDITION ---

  // 1. Timer Effect: Handles the countdown and triggers capture only when it hits 0
  useEffect(() => {
    if (state === AppState.COUNTDOWN) {
      if (countdown > 0) {
        playCountdownBeep(countdown);
        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // Countdown finished: Take Photo & Enter Freeze State
        takePhoto();
        setState(AppState.CAPTURING);
      }
    }
  }, [state, countdown, takePhoto]);

  // 2. Supervisor Effect: Decides what to do NEXT after state becomes CAPTURING.
  // We rely on 'photosTakenCount' being updated.
  // Adding a delay (1.5s) serves two purposes:
  // a) Allows the user to see the "Freeze" (Flash) frame.
  // b) Ensures React has processed the 'photosTakenCount' state update from takePhoto().
  useEffect(() => {
      if (state === AppState.CAPTURING) {
          const timer = setTimeout(() => {
              // DECISION LOGIC:
              // Check if we have reached the target photo count
              if (photosTakenCount < photoCount) {
                   // Select a random prompt for the next photo
                   if (enablePrompts && promptList.length > 0) {
                       const randomPrompt = promptList[Math.floor(Math.random() * promptList.length)];
                       setCurrentPrompt(randomPrompt);
                   } else {
                       setCurrentPrompt("");
                   }
                   
                   setCountdown(COUNTDOWN_SECONDS); // Reset timer
                   setState(AppState.COUNTDOWN); // Loop back
              } else {
                   // All photos taken
                   setState(AppState.PROCESSING_STRIP);
              }
          }, 1500); // 1.5 Second Review/Freeze time

          return () => clearTimeout(timer);
      }
  }, [state, photosTakenCount, photoCount, enablePrompts, promptList]);


  // Generate Decorations for Review Screen
  const generateDecorations = () => {
    const items: DecorationItem[] = [];
    
    let count = 0;
    if (bgConfig.density === 'low') count = 5;
    if (bgConfig.density === 'medium') count = 12;
    if (bgConfig.density === 'high') count = 25;

    // Shapes
    if (bgConfig.showShapes) {
        const shapes = ['circle', 'triangle', 'star', 'square', 'hexagon'];
        const colors = ['#facc15', '#ec4899', '#22d3ee', '#a855f7', '#fb923c']; // yellow, pink, cyan, purple, orange
        
        for (let i = 0; i < count / 2; i++) {
             items.push({
                id: Math.random(),
                type: 'shape',
                content: shapes[Math.floor(Math.random() * shapes.length)],
                x: Math.random() * 100,
                y: Math.random() * 100,
                scale: 0.5 + Math.random() * 1.5,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                animationDuration: `${2 + Math.random() * 4}s`
             });
        }
    }

    // Emojis
    if (bgConfig.showEmojis) {
        const emojiArray = bgConfig.emojiList.split(/[\s,]+/).filter(e => e.trim() !== '');
        if (emojiArray.length > 0) {
            for (let i = 0; i < count / 2; i++) {
                items.push({
                    id: Math.random(),
                    type: 'emoji',
                    content: emojiArray[Math.floor(Math.random() * emojiArray.length)],
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    scale: 0.8 + Math.random() * 1.2,
                    rotation: Math.random() * 60 - 30, // Slight rotation for emojis
                    animationDuration: `${3 + Math.random() * 3}s`
                });
            }
        }
    }
    setDecorations(items);

    // Background Style Logic
    const styles: React.CSSProperties = {};
    if (bgConfig.style === 'solid-random') {
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        styles.backgroundColor = randomColor;
    } else if (bgConfig.style === 'gradient-random') {
        const c1 = '#' + Math.floor(Math.random()*16777215).toString(16);
        const c2 = '#' + Math.floor(Math.random()*16777215).toString(16);
        const deg = Math.floor(Math.random() * 360);
        styles.backgroundImage = `linear-gradient(${deg}deg, ${c1}, ${c2})`;
    } else if (bgConfig.style === 'gradient-custom') {
        styles.backgroundImage = `linear-gradient(135deg, ${bgConfig.color1}, ${bgConfig.color2})`;
    }
    // Note: 'gallery-collage' and 'blur-strip' logic is handled in the render phase
    setRandomBgStyle(styles);
  };

  // Handle Strip Ready
  const handleStripReady = (url: string) => {
    setStripUrl(url);
    // PREVENT PREMATURE EXIT: Do NOT setState(REVIEW) here.
    // PhotoStrip generates the image every time a photo is added, 
    // but we only want to transition when the session is logically complete.
  };

  // NEW EFFECT: Transition to Review only when ready
  useEffect(() => {
    if (state === AppState.PROCESSING_STRIP && stripUrl) {
         // Verify we actually have the photos we need (optional safety check)
         if (photos.length >= photoCount) {
             generateDecorations();
             setTimeout(() => {
                 setState(AppState.REVIEW);
             }, 500); // Small delay for UX transition
         }
    }
  }, [state, stripUrl, photos.length, photoCount]);

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to shorten URL using TinyURL (via CORS proxy to work in browser)
  const shortenUrl = async (longUrl: string): Promise<string> => {
    try {
        // Using corsproxy.io to bypass CORS restrictions on TinyURL API
        // This is a free proxy service suitable for the user's "free tier" requirement
        const tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
        const corsProxy = `https://corsproxy.io/?${encodeURIComponent(tinyUrlApi)}`;
        
        const response = await fetch(corsProxy);
        if (response.ok) {
            return await response.text();
        }
    } catch (e) {
        console.warn("Shortener failed, using original URL", e);
    }
    return longUrl;
  };

  // Upload to Google Drive (via Apps Script Webhook)
  const handleUploadToDrive = async () => {
    if (!stripUrl || !webhookUrl) return;
    setIsUploading(true);
    setQrLink(null); // Reset previous link
    // Reset timer for QR auto close
    setAutoCloseTimer(AUTONOMOUS_QR_DURATION);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            // 'no-cors' needed because standard Apps Script Web App endpoints don't send CORS headers for 'application/json'.
            // However, using 'text/plain' body usually bypasses the preflight check, allowing a simple POST.
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            },
            body: JSON.stringify({
                image: stripUrl,
                filename: `foto_${eventText.replace(/\s+/g,'_')}_${Date.now()}.png`,
                mimeType: 'image/png'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Also add to local gallery for visual effect
            addToGallery(stripUrl);
            
            // Mask the URL using the shortener
            const shortUrl = await shortenUrl(data.url);
            
            // Set QR link and show modal
            setQrLink(shortUrl);
            setShowQrModal(true);
        } else {
            throw new Error("El script de Google devolvió error: " + data.error);
        }
    } catch (e) {
        console.error("Upload error:", e);
        // Fallback or Alert
        if (!autonomousMode) {
             alert("Ocurrió un error al subir la foto. Se descargará una copia local por seguridad.");
        }
        handleDownloadAndReset();
    } finally {
        setIsUploading(false);
    }
  };

  const finishSession = () => {
    setShowQrModal(false);
    setQrLink(null);
    setState(AppState.IDLE);
  };

  const addToGallery = (url: string) => {
    // Generate styles ONCE when adding to gallery to prevent re-render flickering
    const newPhoto: GalleryPhoto = {
        id: Date.now().toString(),
        url: url,
        style: {
            position: 'absolute',
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            width: `${150 + Math.random() * 150}px`,
            transform: `translate(-50%, -50%) rotate(${Math.random() * 90 - 45}deg)`,
            opacity: 0.6,
            filter: 'grayscale(100%) contrast(1.2)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            zIndex: 0,
            border: '8px solid white',
        }
    };
    
    // Keep only last 30 photos to avoid memory issues
    setGallery(prev => [newPhoto, ...prev].slice(0, 30));
  };

  const handleDownloadAndReset = () => {
    if (!stripUrl) return;
    
    // Add to gallery before downloading
    addToGallery(stripUrl);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeEventName = eventText.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadImage(stripUrl, `pb_${safeEventName}_${timestamp}.png`);
    
    setTimeout(() => {
        setState(AppState.IDLE);
    }, 1500);
  };

  // --- Render Helpers ---

  const renderShape = (type: string, size: number, color: string) => {
    const props = { size, fill: color, color: color, opacity: 0.4 };
    switch (type) {
        case 'circle': return <Circle {...props} />;
        case 'square': return <Square {...props} />;
        case 'triangle': return <Triangle {...props} />;
        case 'hexagon': return <Hexagon {...props} />;
        default: return <Star {...props} />;
    }
  };

  const renderRotationButtons = (currentVal: number, setter: (val: number) => void) => (
      <div className="grid grid-cols-4 gap-2">
        {[0, 90, 180, 270].map(deg => (
            <button
                key={deg}
                onClick={() => setter(deg)}
                className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                    currentVal === deg 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
                }`}
            >
                {deg}°
            </button>
        ))}
      </div>
  );

  const renderGalleryBackground = () => (
      // Changed from bg-zinc-900 to the vibrant gradient
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-purple-900 via-pink-800 to-yellow-600 pointer-events-none">
          {gallery.map(photo => (
              <img 
                key={photo.id}
                src={photo.url}
                alt="Previous guest"
                className="transition-all duration-1000 ease-in-out"
                style={photo.style}
              />
          ))}
          {/* Dark Overlay to ensure text legibility */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>
  );

  const renderQrModal = () => {
    if (!showQrModal || !qrLink) return null;
    
    // Generate QR using public API with larger size
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrLink)}`;
    const progressPercent = (autoCloseTimer / AUTONOMOUS_QR_DURATION) * 100;
    
    // Check orientation mode based on rotation state
    const isLandscape = rotation === 0;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md">
            {/* 
              Card Container 
              Adjusted margins and padding for Landscape mode to fit screen height
            */}
            <div className={`bg-white text-black rounded-3xl max-w-2xl w-full flex flex-col items-center shadow-[0_0_50px_rgba(255,255,255,0.3)] animate-in fade-in zoom-in duration-300 relative overflow-hidden ${isLandscape ? 'mb-24 p-6' : 'mb-40 p-8'}`}>
                
                {/* Autonomous Mode Progress Bar */}
                {autonomousMode && (
                    <div className="absolute top-0 left-0 h-2 bg-red-500 transition-all duration-1000 ease-linear" style={{ width: `${progressPercent}%` }} />
                )}

                {/* NEW: Massive Countdown for Autonomous Mode OUTSIDE the QR image */}
                {autonomousMode && (
                    <div className="flex flex-col items-center justify-center mb-4 animate-pulse">
                        <span className="text-red-500 font-bold tracking-widest uppercase text-sm">Tiempo Restante</span>
                        <div className={`font-black text-red-600 fun-font leading-none tabular-nums drop-shadow-sm ${isLandscape ? 'text-7xl' : 'text-8xl md:text-9xl'}`}>
                            {autoCloseTimer}
                        </div>
                    </div>
                )}

                <h3 className="text-4xl font-bold fun-font mb-2 text-center">¡ESCANÉAME!</h3>
                <p className="text-center text-lg text-gray-500 mb-1 font-bold uppercase tracking-wider flex items-center gap-2 justify-center">
                    <CloudUpload size={24} className="text-blue-500"/> LISTO PARA DESCARGAR
                </p>
                <p className="text-center text-xs text-red-500 mb-6 font-semibold flex items-center gap-1 justify-center animate-pulse">
                     <Clock size={12}/> ⚠️ Tienes 24 horas para descargar tu foto
                </p>
                
                {/* Clean QR Container without Overlay */}
                <div className="bg-white p-4 rounded-xl border-4 border-black mb-6 shadow-2xl relative">
                    <img 
                        src={qrImageUrl} 
                        alt="QR Code" 
                        // Smaller QR for Landscape to prevent clipping
                        className={isLandscape ? "w-[250px] h-[250px]" : "w-[400px] h-[400px]"} 
                    />
                </div>
                
                {/* Autonomous Disclaimer */}
                {autonomousMode && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded w-full text-center">
                        <p className="font-bold text-lg">
                            Escanea o toma una foto a este código QR ahora.
                        </p>
                        <p className="text-sm">
                            La sesión se cerrará automáticamente para el siguiente usuario.
                        </p>
                    </div>
                )}

                <div className="w-full bg-gray-100 p-4 rounded-lg text-center break-all">
                    <span className="text-sm text-gray-500 font-mono line-clamp-2">{qrLink}</span>
                </div>
            </div>

            {/* FIXED BUTTON OVERLAY - EXACTLY THE SAME CSS AS MAIN BUTTON */}
            <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-[110] flex items-center gap-4">
                <button 
                    onClick={finishSession}
                    className="w-[300px] h-24 rounded-full font-bold text-3xl shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest border-4 border-white/20 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white cursor-none"
                >
                    <Sparkles size={28} /> FINALIZAR
                </button>
            </div>
        </div>
    );
  };

  const renderScreenSaver = () => {
      return (
          <div 
            onClick={() => setState(AppState.IDLE)} 
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center cursor-none"
          >
              {/* Fade transition container */}
              {slides.map((slide, index) => {
                  const isActive = index === currentSlideIndex;
                  return (
                    <div 
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'} ${isActive ? 'z-10' : 'z-0'}`}
                    >
                        {slide.type === 'video' ? (
                            isActive && (
                                <video 
                                    src={slide.url}
                                    className="w-full h-full object-contain"
                                    autoPlay
                                    muted // Required for autoplay in many contexts without interaction, though the click on "preview" counts as interaction.
                                    playsInline
                                    onEnded={goToNextSlide}
                                />
                            )
                        ) : (
                            <img 
                                src={slide.url} 
                                alt="Digital Signage" 
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>
                  );
              })}
              
              {/* Overlay hint */}
              <div className="absolute bottom-8 text-white/50 animate-pulse text-2xl font-bold uppercase tracking-widest drop-shadow-md z-20">
                  Toca la pantalla para iniciar
              </div>
          </div>
      );
  };

  // --- Styles for Vertical Mode ---
  // If rotation is not 0, we swap dimensions and rotate the container
  // rotation can be 90 (CW) or -90 (CCW)
  const appStyles: React.CSSProperties = rotation !== 0 ? {
    width: '100vh',
    height: '100vw',
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`, 
    transformOrigin: 'center',
    position: 'fixed',
    top: '50%',
    left: '50%',
    overflow: 'hidden',
  } : {};

  // --- Renders ---

  const renderAdmin = () => (
    <div className="w-full h-full bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-3xl shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h2 className="text-3xl font-bold flex items-center gap-3 text-red-500">
                    <Settings className="animate-spin-slow" /> PANEL DE ADMIN
                </h2>
                <button onClick={() => setState(AppState.IDLE)} className="text-slate-400 hover:text-white">
                    <X size={30} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 1. General Settings */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-widest border-l-4 border-yellow-400 pl-3">General</h3>
                    
                    {/* LAYOUT SELECTOR (NEW) */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-blue-500/30">
                        <h4 className="flex items-center gap-2 text-blue-400 font-bold mb-4">
                            <Layout size={18} /> DISEÑO DE IMPRESIÓN
                        </h4>
                        
                        {/* Layout Type */}
                        <div className="flex gap-2 mb-4">
                             <button
                                onClick={() => setPhotoLayout('strip')}
                                className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${photoLayout === 'strip' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                             >
                                 <span className="font-bold">Tira (Vertical)</span>
                             </button>
                             <button
                                onClick={() => setPhotoLayout('grid-16-9')}
                                className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${photoLayout === 'grid-16-9' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                             >
                                 <span className="font-bold">Cine 16:9</span>
                             </button>
                        </div>
                        
                        {/* Photo Count (Relevant for Layouts) */}
                        <div className="border-t border-slate-600 pt-3">
                            <label className="block text-indigo-300 mb-2 font-bold text-xs uppercase flex items-center gap-1">
                                <Hash size={12} /> Fotos por Sesión
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 4].map(count => (
                                    <button
                                        key={count}
                                        onClick={() => setPhotoCount(count)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                                            photoCount === count 
                                            ? 'bg-indigo-600 border-indigo-400 text-white' 
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                                        }`}
                                    >
                                        {count} Foto{count > 1 ? 's' : ''}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">
                                * El diseño se adaptará automáticamente a la cantidad elegida.
                            </p>
                        </div>
                    </div>

                    {/* AUTONOMOUS MODE TOGGLE */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-yellow-500/30 flex items-center justify-between">
                         <div>
                            <label className="block text-white font-bold flex items-center gap-2">
                                <Coins className="text-yellow-400" /> MODO AUTÓNOMO (KIOSCO)
                            </label>
                            <p className="text-xs text-slate-400 mt-1 max-w-[250px]">
                                Automatiza "Envia" y "Finalizar" con temporizadores. Ideal para uso sin supervisión.
                            </p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autonomousMode} 
                                onChange={(e) => setAutonomousMode(e.target.checked)} 
                                className="sr-only peer" 
                            />
                            <div className="w-14 h-7 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-500"></div>
                         </label>
                    </div>

                    {/* DIGITAL SIGNAGE / SCREENSAVER (NEW) */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-indigo-500/30">
                        <h4 className="flex items-center gap-2 text-indigo-400 font-bold mb-4">
                            <MonitorPlay size={18} /> DIGITAL SIGNAGE (Screensaver)
                        </h4>
                        <p className="text-xs text-slate-400 mb-4">
                            Si la app no se usa por unos minutos, se mostrará este carrusel.
                            <br/>
                            <span className="text-green-400">Soporta Imágenes y Videos (MP4/WebM).</span>
                        </p>
                        
                        <div className="flex gap-4 items-center mb-4">
                            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">
                                <ImagePlus size={16} />
                                <span>Agregar Slide</span>
                                <input type="file" accept="image/*,video/*" onChange={handleSlideUpload} className="hidden" />
                            </label>
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setState(AppState.SCREENSAVER);
                                }}
                                className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-bold border border-slate-600"
                            >
                                <Play size={16} /> Preview
                            </button>
                        </div>
                        
                        <div className="text-right text-xs text-slate-500 mb-2">
                            Slides: {slides.length} / 20
                        </div>
                        
                        {/* Slide List */}
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-900 rounded-lg border border-slate-700 mb-4">
                            {slides.length === 0 && (
                                <div className="col-span-4 text-center text-slate-600 py-4 text-xs italic">
                                    No hay slides cargados.
                                </div>
                            )}
                            {slides.map((slide, idx) => (
                                <div key={slide.id} className="relative group aspect-video bg-black rounded overflow-hidden border border-slate-600 flex items-center justify-center">
                                    {slide.type === 'video' ? (
                                        <>
                                            <video src={slide.url} className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <FileVideo size={24} className="text-white drop-shadow-md" />
                                            </div>
                                        </>
                                    ) : (
                                        <img src={slide.url} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                                    )}
                                    <button 
                                        onClick={() => deleteSlide(slide.id)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Screensaver Timeout Setting */}
                        <div className="border-t border-slate-700 pt-3">
                            <label className="block text-indigo-300 mb-1 font-bold text-xs uppercase flex items-center gap-1">
                                <Hourglass size={12} /> Tiempo de inactividad (Minutos)
                            </label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="60"
                                    value={screensaverTimeoutMin}
                                    onChange={(e) => setScreensaverTimeoutMin(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white w-20 text-center font-bold"
                                />
                                <span className="text-xs text-slate-500">
                                    Minutos antes de activar.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-2 font-bold text-sm">TEXTO DEL EVENTO</label>
                        <input 
                            type="text" 
                            value={eventText}
                            onChange={(e) => setEventText(e.target.value.slice(0, 50))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:border-red-500 outline-none"
                        />
                    </div>
                    
                    {/* CUSTOM TEXT CONFIGURATION (NEW) */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-pink-500/30">
                        <h4 className="flex items-center gap-2 text-pink-400 font-bold mb-4">
                            <Type size={18} /> PERSONALIZACIÓN DE TEXTO (NOMBRE EVENTO)
                        </h4>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-slate-400 mb-1 text-xs font-bold">FUENTE</label>
                                <select 
                                    value={textConfig.fontFamily}
                                    onChange={(e) => setTextConfig({...textConfig, fontFamily: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                                >
                                    <option value="Courier New">Courier New</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Brush Script MT">Brush Script (Cursiva)</option>
                                    <option value="Bungee Inline">Bungee Inline (Arcade)</option>
                                    <option value="Inter">Inter (Modern)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1 text-xs font-bold">TAMAÑO: {textConfig.fontSize}px</label>
                                <input 
                                    type="range" 
                                    min="30" 
                                    max="150" 
                                    value={textConfig.fontSize} 
                                    onChange={(e) => setTextConfig({...textConfig, fontSize: parseInt(e.target.value)})}
                                    className="w-full accent-pink-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-slate-400 mb-1 text-xs font-bold">COLOR TEXTO</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={textConfig.color}
                                        onChange={(e) => setTextConfig({...textConfig, color: e.target.value})}
                                        className="h-8 w-12 cursor-pointer bg-transparent"
                                    />
                                    <span className="text-xs text-slate-500">{textConfig.color}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1 text-xs font-bold">COLOR FONDO CAJA</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={textConfig.bgColor}
                                        onChange={(e) => setTextConfig({...textConfig, bgColor: e.target.value})}
                                        className="h-8 w-12 cursor-pointer bg-transparent"
                                    />
                                    <span className="text-xs text-slate-500">{textConfig.bgColor}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-slate-400 mb-1 text-xs font-bold">OPACIDAD DE FONDO: {Math.round(textConfig.bgOpacity * 100)}%</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1"
                                value={textConfig.bgOpacity} 
                                onChange={(e) => setTextConfig({...textConfig, bgOpacity: parseFloat(e.target.value)})}
                                className="w-full accent-pink-500"
                            />
                        </div>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={textConfig.isBold} 
                                    onChange={(e) => setTextConfig({...textConfig, isBold: e.target.checked})}
                                    className="accent-pink-500"
                                />
                                <span className="text-xs font-bold text-slate-300">Negrita (Bold)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={textConfig.isItalic} 
                                    onChange={(e) => setTextConfig({...textConfig, isItalic: e.target.checked})}
                                    className="accent-pink-500"
                                />
                                <span className="text-xs font-bold text-slate-300">Cursiva (Italic)</span>
                            </label>
                        </div>
                        
                        <div className="mt-4 p-4 bg-white/10 rounded flex items-center justify-center">
                             <div 
                                style={{
                                    fontFamily: textConfig.fontFamily,
                                    fontSize: `${textConfig.fontSize / 3}px`,
                                    color: textConfig.color,
                                    backgroundColor: `rgba(${parseInt(textConfig.bgColor.slice(1,3), 16)}, ${parseInt(textConfig.bgColor.slice(3,5), 16)}, ${parseInt(textConfig.bgColor.slice(5,7), 16)}, ${textConfig.bgOpacity})`,
                                    fontWeight: textConfig.isBold ? 'bold' : 'normal',
                                    fontStyle: textConfig.isItalic ? 'italic' : 'normal',
                                    padding: '10px',
                                    borderRadius: '5px'
                                }}
                             >
                                 Vista Previa Texto
                             </div>
                        </div>

                    </div>

                    <div>
                        <label className="block text-slate-400 mb-2 font-bold text-sm">ESTILO DEL MARCO</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {(['classic', 'polaroid', 'baroque', 'modern'] as FrameStyle[]).map(style => (
                                <button
                                    key={style}
                                    onClick={() => setFrameStyle(style)}
                                    className={`p-2 rounded-lg border-2 text-sm capitalize transition-all ${
                                        frameStyle === style 
                                        ? 'border-red-500 bg-red-500/10 text-white' 
                                        : 'border-slate-600 text-slate-400 hover:border-slate-400'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>

                        {/* CUSTOM FRAME BACKGROUND (NEW) */}
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                            <label className="block text-slate-300 mb-2 font-bold text-xs flex items-center gap-2">
                                <Wallpaper size={14} /> FONDO DEL PAPEL (DISEÑO PROPIO)
                            </label>
                            <p className="text-[10px] text-slate-500 mb-2">
                                Sube una imagen para reemplazar el color blanco/negro del papel.
                            </p>
                            <div className="flex items-center gap-2">
                                <label className="flex-1 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg border border-slate-500 transition-colors flex items-center justify-center gap-2 text-xs font-bold">
                                    <Upload size={14} />
                                    <span>Subir Fondo</span>
                                    <input type="file" accept="image/*" onChange={handleFrameBgUpload} className="hidden" />
                                </label>
                                {customFrameBg && (
                                    <button 
                                        onClick={() => setCustomFrameBg(null)}
                                        className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-2 rounded-lg border border-red-500/50"
                                        title="Quitar fondo personalizado"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            {customFrameBg && (
                                <div className="mt-2 h-10 w-full rounded overflow-hidden relative">
                                    <img src={customFrameBg} alt="Bg Preview" className="w-full h-full object-cover opacity-70" />
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-black drop-shadow-md">
                                        Vista Previa
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CLOUD INTEGRATION (NEW) */}
                    <div className="border-t border-slate-700 pt-4 mt-2 bg-slate-800/30 p-4 rounded-xl border border-blue-500/20">
                         <h4 className="flex items-center gap-2 text-blue-400 font-bold mb-4">
                            <CloudUpload size={18} /> INTEGRACIÓN NUBE (Google Drive)
                        </h4>
                        <div>
                            <label className="block text-slate-400 mb-2 font-bold text-xs">URL DEL WEB APP (GOOGLE APPS SCRIPT)</label>
                            <input 
                                type="text" 
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://script.google.com/macros/s/..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-slate-300 focus:border-blue-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-2">
                                * Si dejas esto vacío, la app funcionará en modo "Descarga Local".
                                <br/>* Si pones la URL, el botón principal cambiará a "Subir a Nube" y generará QR.
                            </p>
                        </div>
                    </div>


                    <div className="border-t border-slate-700 pt-4 mt-2">
                        <label className="block text-slate-400 mb-3 font-bold text-sm">ORIENTACIÓN DE PANTALLA</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setRotation(0)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${rotation === 0 ? 'border-pink-500 bg-pink-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                                <Monitor size={24} />
                                <span className="text-xs font-bold">Normal</span>
                            </button>
                            
                            <button
                                onClick={() => setRotation(-90)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${rotation === -90 ? 'border-pink-500 bg-pink-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                                <RotateCcw size={24} />
                                <span className="text-xs font-bold">Vertical Izq (-90°)</span>
                            </button>

                            <button
                                onClick={() => setRotation(90)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${rotation === 90 ? 'border-pink-500 bg-pink-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                                <RotateCw size={24} />
                                <span className="text-xs font-bold">Vertical Der (+90°)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Visual Customization */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-pink-500 uppercase tracking-widest border-l-4 border-pink-500 pl-3">Personalización Visual</h3>
                    
                    {/* POSE PROMPTS CONFIG (NEW) */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-pink-500/30">
                         <h4 className="flex items-center gap-2 text-pink-400 font-bold mb-4">
                            <MessageSquare size={18} /> GUÍA DE POSES
                        </h4>
                        
                        {/* Toggle */}
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-slate-300 font-bold text-sm">Mostrar Frases de Ayuda</label>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={enablePrompts} 
                                    onChange={(e) => setEnablePrompts(e.target.checked)} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                             </label>
                        </div>
                        
                        {enablePrompts && (
                            <div>
                                <p className="text-xs text-slate-400 mb-3">
                                    Sube un archivo de texto (.txt) con tus propias frases (una por línea) para personalizar la experiencia.
                                </p>
                                <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg border border-slate-500 transition-colors flex items-center justify-center gap-2 text-xs font-bold">
                                        <FileText size={14} />
                                        <span>Subir .TXT</span>
                                        <input type="file" accept=".txt" onChange={handlePromptUpload} className="hidden" />
                                    </label>
                                    
                                    <button 
                                        onClick={resetPrompts}
                                        className="bg-slate-700 hover:bg-slate-600 text-yellow-400 py-2 px-3 rounded-lg border border-slate-500 transition-colors"
                                        title="Restaurar frases originales"
                                    >
                                        <RefreshCcw size={14} />
                                    </button>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-500 text-right">
                                    Frases actuales: <span className="text-white">{promptList.length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* CUSTOM FRAME OVERLAY UPLOAD */}
                    <div>
                        <label className="block text-slate-400 mb-2 font-bold text-sm flex items-center gap-2">
                           <Upload size={16} /> MARCO PERSONALIZADO (OVERLAY)
                        </label>
                        <p className="text-xs text-slate-500 mb-3 flex flex-col gap-1">
                            <span>Sube un archivo PNG con fondo transparente.</span>
                            <span className="flex items-center gap-1 text-yellow-500/80 mt-1">
                                ¿Cuadritos grises? <a href="https://www.remove.bg/es/upload" target="_blank" rel="noreferrer" className="text-yellow-400 underline hover:text-white flex items-center gap-0.5">Usa remove.bg gratis <ExternalLink size={10}/></a>
                            </span>
                        </p>
                        
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg border border-slate-600 transition-colors flex items-center gap-2">
                                <Upload size={16} />
                                <span>Subir PNG</span>
                                <input type="file" accept="image/png" onChange={handleOverlayUpload} className="hidden" />
                            </label>
                            
                            {customOverlay && (
                                <button 
                                    onClick={() => setCustomOverlay(null)}
                                    className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-2 rounded-lg transition-colors border border-red-500/50"
                                    title="Eliminar marco"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        
                        {customOverlay && (
                            <div className="mt-4 border border-dashed border-slate-600 rounded-lg p-2 flex flex-col items-center relative overflow-hidden group">
                                {/* CSS Transparency Grid Background to detect fake PNGs */}
                                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                                     style={{
                                         backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                                         backgroundSize: '20px 20px',
                                         backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                         backgroundColor: 'white'
                                     }}
                                />
                                
                                <span className="text-xs text-white bg-black/50 px-2 py-1 rounded mb-2 relative z-10 backdrop-blur-sm shadow-sm">
                                    Vista Previa (¿Ves la cuadrícula a través?)
                                </span>
                                <img src={customOverlay} alt="Overlay" className="max-h-32 object-contain relative z-10 drop-shadow-xl" />
                                
                                <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-yellow-300 bg-black/80 px-2 py-1 rounded">
                                        Si ves cuadritos dobles, tu imagen es falsa.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shutter Sound Config */}
                    <div>
                        <label className="block text-slate-400 mb-2 font-bold text-sm flex items-center gap-2">
                            <Volume2 size={16} /> EFECTO DE SONIDO (OBTURADOR)
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {(['mechanical', 'digital', 'magic', 'silent'] as ShutterSoundType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setShutterSound(type);
                                        playShutterSound(type); // Play preview
                                    }}
                                    className={`p-3 rounded-lg text-sm font-bold capitalize transition-all border ${
                                        shutterSound === type 
                                        ? 'bg-green-600 border-green-400 text-white' 
                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                                    }`}
                                >
                                    {type === 'mechanical' && '📸 Mecánico'}
                                    {type === 'digital' && '🤖 Digital'}
                                    {type === 'magic' && '✨ Mágico'}
                                    {type === 'silent' && '🔇 Silencio'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Background Style */}
                    <div>
                        <label className="block text-slate-400 mb-2 font-bold text-sm">FONDO DE PANTALLA</label>
                        <select 
                            value={bgConfig.style}
                            onChange={(e) => setBgConfig({...bgConfig, style: e.target.value as BackgroundStyle})}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 mb-3"
                        >
                            <option value="blur-strip">Foto Desenfoque (Automático)</option>
                            <option value="gallery-collage">Collage de Visitantes (B&N)</option>
                            <option value="gradient-custom">Degradado Personalizado</option>
                            <option value="gradient-random">Degradado Aleatorio (Sorpresa)</option>
                            <option value="solid-random">Color Sólido Aleatorio</option>
                        </select>

                        {bgConfig.style === 'gradient-custom' && (
                            <div className="flex gap-4 items-center bg-slate-800 p-3 rounded-lg">
                                <span className="text-sm text-slate-400">Colores:</span>
                                <input type="color" value={bgConfig.color1} onChange={(e) => setBgConfig({...bgConfig, color1: e.target.value})} className="bg-transparent w-8 h-8 cursor-pointer" />
                                <input type="color" value={bgConfig.color2} onChange={(e) => setBgConfig({...bgConfig, color2: e.target.value})} className="bg-transparent w-8 h-8 cursor-pointer" />
                            </div>
                        )}
                        {bgConfig.style === 'gallery-collage' && (
                            <p className="text-xs text-yellow-500 mt-2">
                                * El collage se formará a medida que la gente se tome fotos. Se borrará al recargar la página.
                            </p>
                        )}
                    </div>

                    {/* Decorations */}
                    <div>
                        <label className="block text-slate-400 mb-2 font-bold text-sm">DECORACIÓN FLOTANTE</label>
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={bgConfig.showShapes} 
                                    onChange={(e) => setBgConfig({...bgConfig, showShapes: e.target.checked})}
                                    className="w-5 h-5 accent-pink-500"
                                />
                                <span className="text-slate-300">Formas (⭐ 🔺)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={bgConfig.showEmojis} 
                                    onChange={(e) => setBgConfig({...bgConfig, showEmojis: e.target.checked})}
                                    className="w-5 h-5 accent-pink-500"
                                />
                                <span className="text-slate-300">Emojis</span>
                            </label>
                        </div>

                        {bgConfig.showEmojis && (
                            <div className="mb-4">
                                <span className="text-xs text-slate-500 block mb-1">Emojis permitidos (separados por espacio):</span>
                                <input 
                                    type="text" 
                                    value={bgConfig.emojiList}
                                    onChange={(e) => setBgConfig({...bgConfig, emojiList: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xl"
                                />
                            </div>
                        )}

                        <div>
                            <span className="text-xs text-slate-500 block mb-1">Densidad de elementos:</span>
                            <div className="flex gap-2">
                                {(['low', 'medium', 'high'] as const).map(d => (
                                    <button 
                                        key={d}
                                        onClick={() => setBgConfig({...bgConfig, density: d})}
                                        className={`px-3 py-1 text-xs rounded-full border ${bgConfig.density === d ? 'bg-white text-black border-white' : 'border-slate-600 text-slate-400'}`}
                                    >
                                        {d.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ADMIN CAMERA PREVIEW (NEW SECTION) */}
                    <div className="mt-8 pt-6 border-t border-slate-700">
                        <label className="block text-slate-400 mb-4 font-bold text-sm flex items-center justify-between">
                            VISTA PREVIA EN VIVO
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>
                        </label>
                        <div className="w-full aspect-square bg-black rounded-2xl overflow-hidden border-4 border-slate-700 relative shadow-2xl">
                             <Camera 
                                ref={adminCameraRef}
                                onStreamReady={() => {}} 
                                rotation={rotation}
                                previewOffset={cameraPreviewAdj}
                                captureOffset={cameraCaptureAdj}
                                zoom={cameraZoom}
                                fitMode={cameraFitMode}
                                overlay={customOverlay} // Pass overlay to admin preview
                                effect={cameraEffect} // Pass effect
                                eventText={eventText} // Pass event text
                                className="rounded-none border-0" // Override default booth styles
                             />
                             
                             {/* Overlay for Test Capture Result */}
                             {testImage && (
                                <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
                                    <img src={testImage} alt="Test" className="w-full h-full object-contain" />
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        Vista Previa Captura
                                    </div>
                                </div>
                             )}

                             {/* Helper text overlay */}
                             {!testImage && (
                                <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                                    <span className="text-[10px] text-white/50 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                                        Ajusta "Corrección Vista en Vivo" si esto se ve mal
                                    </span>
                                </div>
                             )}
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                            <button 
                                onClick={handleTestCapture}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-500"
                            >
                                <CameraIcon size={16} />
                                TEST DE CAPTURA (3s)
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Usa el botón de Test para verificar que la foto final ("Corrección Foto Final") salga derecha.
                        </p>
                    </div>

                    {/* Calibración de Cámara (MOVED HERE) */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-blue-900/30 mt-4">
                        <h4 className="flex items-center gap-2 text-blue-400 font-bold mb-4">
                            <Settings size={18} /> CALIBRACIÓN DE CÁMARA (Avanzado)
                        </h4>
                        
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-slate-300 text-sm font-bold mb-2">
                                <CamIcon size={16} /> Corrección Vista en Vivo
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Si te ves de cabeza o de lado mientras posas.</p>
                            {renderRotationButtons(cameraPreviewAdj, setCameraPreviewAdj)}
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-slate-300 text-sm font-bold mb-2">
                                <ImageIcon size={16} /> Corrección Foto Final
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Si la foto en la tira sale mal rotada.</p>
                            {renderRotationButtons(cameraCaptureAdj, setCameraCaptureAdj)}
                        </div>

                        {/* ZOOM / FIT CONTROLS */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-slate-300 text-sm font-bold mb-2">
                                <ZoomIn size={16} /> Zoom Digital
                            </label>
                            <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <Scan size={20} className="text-slate-400" />
                                <input 
                                    type="range" 
                                    min="1.0" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={cameraZoom} 
                                    onChange={(e) => setCameraZoom(parseFloat(e.target.value))}
                                    className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm font-mono font-bold w-12 text-center text-blue-400">
                                    {cameraZoom.toFixed(1)}x
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-green-500/30 flex items-center justify-between">
                            <div>
                                <label className="block text-white font-bold flex items-center gap-2 text-sm">
                                    <Expand className="text-green-400" size={18}/> MODO GRAN ANGULAR (Fit)
                                </label>
                                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                                    Muestra toda la imagen del sensor sin recortar bordes. Agrega franjas negras ("Letterbox").
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={cameraFitMode} 
                                    onChange={(e) => setCameraFitMode(e.target.checked)} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        
                        {/* CAMERA EFFECTS SELECTOR */}
                        <div className="mt-4 pt-4 border-t border-slate-700">
                             <label className="block text-slate-400 mb-3 font-bold text-sm flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wand2 size={16} className="text-purple-400" /> FILTROS DE CÁMARA
                                </div>
                                {/* MAGIC WAND TOGGLE */}
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isMagicWandMode} 
                                        onChange={(e) => setIsMagicWandMode(e.target.checked)} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                                    <span className="ml-2 text-xs font-bold text-purple-400">VARITA MÁGICA (Aleatorio)</span>
                                </label>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['none', 'news', 'tictak', 'fisheye', 'cctv', 'heatmap', 'vhs', 'warhol', 'emoji-challenge'] as CameraEffect[]).map(eff => (
                                    <button
                                        key={eff}
                                        onClick={() => setCameraEffect(eff)}
                                        className={`p-2 rounded-lg text-xs font-bold capitalize transition-all border flex flex-col items-center gap-1 ${
                                            cameraEffect === eff 
                                            ? 'bg-purple-600 border-purple-400 text-white' 
                                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                                        }`}
                                    >
                                        {eff === 'none' && <Scan size={16}/>}
                                        {eff === 'news' && <Mic size={16}/>}
                                        {eff === 'fisheye' && <Eye size={16}/>}
                                        {eff === 'cctv' && <VideoIcon size={16}/>}
                                        {eff === 'heatmap' && <Flame size={16}/>}
                                        {eff === 'vhs' && <Tv size={16}/>}
                                        {eff === 'warhol' && <Grid3X3 size={16}/>}
                                        {eff === 'tictak' && <MessageCircle size={16}/>}
                                        {eff === 'emoji-challenge' && <SmilePlus size={16}/>}
                                        {eff}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <button 
                onClick={saveAdminSettings}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg mt-8 transform hover:scale-[1.01] transition-transform"
            >
                <Save /> GUARDAR CAMBIOS Y SALIR
            </button>
        </div>
    </div>
  );

  const renderIdle = () => (
    <div className={`relative flex flex-col items-center justify-center h-full w-full text-center px-4 pb-32 overflow-hidden ${bgConfig.style !== 'gallery-collage' ? 'bg-gradient-to-br from-purple-900 via-pink-800 to-yellow-600' : ''}`}>
      
      {/* Gallery Background Layer */}
      {bgConfig.style === 'gallery-collage' && renderGalleryBackground()}

      {/* Secret Admin Button - Top Left Invisible */}
      <div 
        onClick={handleSecretClick} 
        className="absolute top-0 left-0 w-24 h-24 z-50 cursor-default"
        title="Admin Access (Click 5 times)" 
      />

      {/* LAB MODE Secret Link */}
      <button 
        onClick={openLabMode}
        className="absolute bottom-4 right-4 text-white/10 hover:text-white/50 text-xs font-mono tracking-widest transition-all z-50 uppercase flex items-center gap-2 cursor-none"
        title="Modo Kiosco / Pantalla Completa"
      >
        <Maximize size={12} />
        [ LAB MODE ]
      </button>

      {/* Quick Effect Toggle (Hidden magic button for quick changes) */}
      <button 
        onClick={cycleEffect}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white/80 transition-all z-50"
        title={`Cambiar Efecto (Actual: ${cameraEffect})`}
      >
        <Wand2 size={24} />
      </button>

      <div className="relative z-10">
        <div className="mb-8 animate-bounce inline-block">
            <CameraIcon size={120} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
        </div>
        <h1 className="text-6xl md:text-8xl text-white mb-6 drop-shadow-lg tracking-wider">
            Puri<span className="text-yellow-400">Kura</span>
        </h1>
        <p className="text-xl md:text-2xl text-pink-200 mb-2 max-w-lg mx-auto bg-black/30 backdrop-blur-sm p-4 rounded-xl">
            {eventText}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-pink-300/70 mb-12 uppercase tracking-widest bg-black/60 backdrop-blur-md px-4 py-1 rounded-full mx-auto w-fit">
            <Palette size={14} /> Estilo: {frameStyle} 
        </div>
      </div>
    </div>
  );

  const renderCapture = () => (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-black cursor-none overflow-hidden">
      
      {/* 
        FULL SCREEN CAMERA CONTAINER 
        - inset-0: Covers entire screen
        - z-0: Lowest layer
      */}
      <div className="absolute inset-0 z-0">
        <Camera 
            ref={cameraRef} 
            onStreamReady={() => {}} 
            rotation={rotation}
            previewOffset={cameraPreviewAdj}
            captureOffset={cameraCaptureAdj}
            zoom={cameraZoom}
            fitMode={cameraFitMode}
            overlay={customOverlay} 
            effect={cameraEffect} // Pass active effect
            eventText={eventText} // Pass event text
            className="rounded-none border-0" // Reset borders for fullscreen
        />
        
        {/* Subtle Guide Lines (Rule of Thirds) - Optional but helpful in fullscreen */}
        <div className="absolute inset-0 z-10 opacity-10 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-white"></div>
                <div className="border-r border-white"></div>
                <div></div>
            </div>
        </div>
      </div>

      {/* CENTER COUNTDOWN */}
      {state === AppState.COUNTDOWN && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <span className="text-[20rem] md:text-[25rem] font-black text-white drop-shadow-[0_0_50px_rgba(0,0,0,0.8)] fun-font animate-pulse leading-none">
            {countdown}
          </span>
        </div>
      )}

      {/* PROMPT CAPTION OVERLAY (BOTTOM CENTER) */}
      {state === AppState.COUNTDOWN && currentPrompt && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none px-4">
              <div className="bg-black/40 backdrop-blur-md px-12 py-6 rounded-3xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform animate-in slide-in-from-bottom-10 fade-in duration-500">
                <h3 className="text-5xl md:text-7xl font-black text-white fun-font leading-tight text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] stroke-black tracking-wide">
                    {currentPrompt}
                </h3>
              </div>
          </div>
      )}

      {flash && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-flash bg-white">
            <div className="flex flex-col items-center justify-center transform scale-150">
                <span className="text-[15rem] leading-none font-black text-black fun-font tracking-tighter">
                    {photosTakenCount}
                </span>
                 <span className="text-5xl font-bold text-black/50 fun-font uppercase tracking-widest mt-4">
                    de {photoCount}
                </span>
            </div>
        </div>
      )}
    </div>
  );

  const renderProcessing = () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900">
      <Loader2 className="w-24 h-24 text-pink-500 animate-spin mb-8" />
      <h2 className="text-4xl text-white fun-font animate-pulse">Revelando Fotos...</h2>
    </div>
  );

  const renderReview = () => {
    // Detect if we are in vertical mode
    const isVertical = rotation !== 0;
    
    // Determine button state based on whether webhook is configured
    const hasCloud = !!webhookUrl;

    return (
        <div 
            className={`h-full w-full relative flex flex-col items-center overflow-hidden bg-slate-900 transition-colors duration-1000 ${isVertical ? 'pt-2 pb-32 justify-start' : 'p-8 pb-48 justify-center'}`}
            style={randomBgStyle}
        >
        {/* Special handling for gallery background in review mode */}
        {bgConfig.style === 'gallery-collage' && renderGalleryBackground()}
        
        {/* --- BACKGROUND LAYERS --- */}
        {stripUrl && (
            <>
                {/* Layer 1: Blurred Strip (Only if style is blur-strip) */}
                {bgConfig.style === 'blur-strip' && (
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={stripUrl} 
                            alt="Background Ambience" 
                            className="w-full h-full object-cover opacity-50 blur-3xl scale-125 animate-pulse" 
                            style={{ animationDuration: '4s' }}
                        />
                    </div>
                )}
                
                {/* Layer 2: Texture Overlay */}
                <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:30px_30px]"></div>
                
                {/* Layer 3: Dynamic Floating Decorations */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {decorations.map((item) => (
                        <div 
                            key={item.id}
                            className="absolute animate-pulse"
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}%`,
                                transform: `scale(${item.scale}) rotate(${item.rotation}deg)`,
                                animationDuration: item.animationDuration,
                                opacity: 0.6
                            }}
                        >
                            {item.type === 'emoji' 
                                ? <span className="text-6xl drop-shadow-lg">{item.content}</span>
                                : renderShape(item.content, 80, item.color || '#fff')
                            }
                        </div>
                    ))}
                </div>
            </>
        )}

        {/* --- FOREGROUND CONTENT --- */}
        <div className={`relative z-10 w-full max-w-full flex flex-col items-center ${isVertical ? 'h-full' : ''}`}>
            <h2 className={`${isVertical ? 'text-2xl' : 'text-5xl'} text-yellow-400 fun-font mb-1 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] text-center tracking-wide stroke-black`}>
                ¡TUS FOTOS LISTAS!
            </h2>
            
            <div className={`transform transition-all duration-300 relative ${isVertical ? 'flex-1 min-h-0 flex items-center justify-center w-full' : 'bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:rotate-0 hover:scale-[1.02] mb-4'}`}>
                {stripUrl && (
                    <img 
                        src={stripUrl} 
                        alt="Photo Strip" 
                        // Vertical: apply bg-white to image so it fits tightly.
                        className={`${isVertical ? 'h-full w-auto max-w-full object-contain bg-white p-1 shadow-2xl' : 'max-h-[70vh] w-auto cursor-none shadow-inner border border-slate-200'}`}
                        // If cloud is enabled, clicking image also uploads, else downloads
                        onClick={hasCloud ? handleUploadToDrive : handleDownloadAndReset}
                    />
                )}
            </div>
        </div>
        </div>
    );
  };

  // Helper component for Icon based on string type
  const VideoIcon = (props: any) => <Monitor {...props} />;

  return (
    <div 
        className="min-h-screen bg-slate-900 text-white font-sans selection:bg-pink-500 selection:text-white"
        style={appStyles}
    >
      <PhotoStrip 
        photos={photos} 
        customText={eventText} 
        frameStyle={frameStyle}
        onStripReady={handleStripReady}
        isVertical={rotation !== 0}
        overlay={customOverlay} // Pass overlay to photo strip generation
        customFrameBg={customFrameBg} // Pass custom paper background
        layout={photoLayout} // Pass layout configuration
        textConfig={textConfig} // Pass new text configuration
      />

      {state === AppState.IDLE && renderIdle()}
      {state === AppState.ADMIN && renderAdmin()}
      {state === AppState.SCREENSAVER && renderScreenSaver()}
      
      {/* 
         CAMERA PERSISTENCE: 
         Render renderCapture() ALWAYS to keep the camera stream alive.
         We hide it with CSS when not in use.
      */}
      <div style={{ 
          display: (state === AppState.COUNTDOWN || state === AppState.CAPTURING) ? 'block' : 'none',
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: (state === AppState.COUNTDOWN || state === AppState.CAPTURING) ? 10 : -1
      }}>
          {renderCapture()}
      </div>

      {state === AppState.PROCESSING_STRIP && renderProcessing()}
      {state === AppState.REVIEW && renderReview()}
      
      {/* QR MODAL */}
      {renderQrModal()}

      {/* SINGLE FIXED BUTTON OVERLAY */}
      {(state === AppState.IDLE || state === AppState.REVIEW) && (
        <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4">
            <button
                // Decide action: If IDLE -> Start. If REVIEW & hasCloud -> Upload. If REVIEW & noCloud -> Download.
                onClick={
                    state === AppState.IDLE 
                    ? startSession 
                    : (webhookUrl ? handleUploadToDrive : handleDownloadAndReset)
                }
                disabled={isUploading}
                className={`
                    h-24 rounded-full font-bold text-3xl shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest border-4 border-white/20 cursor-none
                    ${state === AppState.IDLE 
                        ? (autonomousMode 
                            ? 'w-[400px] bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/50 text-black' 
                            : 'w-[400px] bg-pink-600 hover:bg-pink-500 shadow-pink-500/50 text-white')
                        : 'w-[300px] bg-green-500 hover:bg-green-600 shadow-green-500/50 disabled:bg-slate-600 disabled:cursor-not-allowed text-white'}
                `}
            >
                {state === AppState.IDLE ? (
                    <>
                        {autonomousMode ? (
                            <>
                                <span className="fun-font">INSERTAR FICHA</span>
                                <Coins className="w-8 h-8 animate-bounce" />
                            </>
                        ) : (
                            <>
                                <span className="fun-font">NUEVA SESIÓN</span>
                                <Sparkles className="w-8 h-8 animate-pulse" />
                            </>
                        )}
                    </>
                ) : (
                   /* Review State Content */
                   <>
                     {isUploading ? (
                         <>
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="fun-font text-xl">ENVIANDO...</span>
                         </>
                     ) : webhookUrl ? (
                         <>
                            <CloudUpload className="w-8 h-8 animate-bounce" />
                            <span className="fun-font">ENVIAR FOTOS</span>
                         </>
                     ) : (
                         <>
                            <Download className="w-8 h-8 animate-bounce" />
                            <span className="fun-font">DESCARGAR</span>
                         </>
                     )}
                   </>
                )}
            </button>
        </div>
      )}
    </div>
  );
};

export default App;