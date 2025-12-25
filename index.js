const WIDTH = 150;
const HEIGHT = 60;
const PIXEL_SIZE = 2;
const SUBPIXEL = 2;

let currentWord = "";
let flickerInterval = null;

function generateRandomString(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

function createTextMask(text) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#000";
  ctx.font = "bold 40px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, WIDTH / 2, HEIGHT / 2);

  const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT);

  const mask = [];
  for (let y = 0; y < HEIGHT; y++) {
    mask[y] = [];
    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) * 4;
      mask[y][x] = imgData.data[idx] < 128 ? 1 : 0;
    }
  }
  return mask;
}

function generateVisualCryptography(mask) {
  const h = mask.length;
  const w = mask[0].length;
  const share1 = [];
  const share2 = [];

  const patterns = [
    [
      [0, 1],
      [1, 0],
    ],
    [
      [1, 0],
      [0, 1],
    ],
  ];

  for (let y = 0; y < h; y++) {
    share1[y] = [];
    share2[y] = [];
    for (let x = 0; x < w; x++) {
      const pixel = mask[y][x];
      const rand = Math.random() < 0.5 ? 0 : 1;
      if (pixel === 1) {
        share1[y][x] = patterns[rand];
        share2[y][x] = patterns[1 - rand];
      } else {
        share1[y][x] = patterns[rand];
        share2[y][x] = patterns[rand];
      }
    }
  }
  return [share1, share2];
}

function drawShareToCanvas(share, targetCanvas) {
  const h = share.length;
  const w = share[0].length;

  targetCanvas.width = w * SUBPIXEL * PIXEL_SIZE;
  targetCanvas.height = h * SUBPIXEL * PIXEL_SIZE;

  const ctx = targetCanvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.fillStyle = "#000";

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pattern = share[y][x];
      for (let py = 0; py < SUBPIXEL; py++) {
        for (let px = 0; px < SUBPIXEL; px++) {
          if (pattern[py][px] === 1) {
            ctx.fillRect(
              (x * SUBPIXEL + px) * PIXEL_SIZE,
              (y * SUBPIXEL + py) * PIXEL_SIZE,
              PIXEL_SIZE,
              PIXEL_SIZE
            );
          }
        }
      }
    }
  }
}

function startFlickering(share1, share2) {
  const canvas = document.getElementById("temporalCanvas");

  const c1 = document.createElement("canvas");
  const c2 = document.createElement("canvas");

  drawShareToCanvas(share1, c1);
  drawShareToCanvas(share2, c2);

  canvas.width = c1.width;
  canvas.height = c1.height;

  const ctx = canvas.getContext("2d");
  let showFirst = true;

  if (flickerInterval) clearInterval(flickerInterval);

  flickerInterval = setInterval(() => {
    if (showFirst) {
      ctx.drawImage(c1, 0, 0);
    } else {
      ctx.drawImage(c2, 0, 0);
    }
    showFirst = !showFirst;
  }, 50);
}

function generateNewCaptcha() {
  currentWord = generateRandomString(5);
  const mask = createTextMask(currentWord);
  const [share1, share2] = generateVisualCryptography(mask);

  startFlickering(share1, share2);

  document.getElementById("userInput").value = "";
  const msg = document.getElementById("message");
  msg.style.display = "none";
  msg.className = "message";
}

function checkCaptcha() {
  const userInput = document
    .getElementById("userInput")
    .value.trim()
    .toUpperCase();
  const message = document.getElementById("message");

  if (userInput === currentWord) {
    message.className = "message success";
    message.style.display = "block";
    message.textContent = "Verification passed. Redirecting...";
    setTimeout(() => {
      window.location.href =
        "https://shattereddisk.github.io/rickroll/rickroll.mp4";
    }, 2000);
  } else {
    message.className = "message error";
    message.textContent = "Verification failed. Please try again.";
    message.style.display = "block";
    document.getElementById("userInput").value = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  generateNewCaptcha();
  document.getElementById("userInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkCaptcha();
  });
});
