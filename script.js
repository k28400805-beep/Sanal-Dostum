// Sanal Dostum: Web Audio API ile harici ses dosyası gerektirmeyen mini bir oyun.
const petState = { hunger: 82, happiness: 76, energy: 88 };
const audio = { context: null };

const $ = (selector) => document.querySelector(selector);
const clamp = (value) => Math.max(0, Math.min(100, value));

function getAudioContext() {
  if (!audio.context) audio.context = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.context.state === 'suspended') audio.context.resume();
  return audio.context;
}

function tone(frequency, duration, startTime, type = 'square', volume = 0.045, endFrequency = frequency) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playSound(kind) {
  const context = getAudioContext();
  const now = context.currentTime;
  if (kind === 'feed') {
    tone(660, .11, now); tone(880, .11, now + .12); tone(1046, .14, now + .24);
  } else if (kind === 'play') {
    [523, 659, 784, 1046].forEach((note, index) => tone(note, .16, now + index * .12, 'square', .04));
  } else if (kind === 'sleep') {
    tone(330, .38, now, 'sine', .05, 220); tone(261, .5, now + .3, 'sine', .04, 174);
  } else {
    tone(180, .16, now, 'sawtooth', .055, 120); tone(180, .16, now + .2, 'sawtooth', .055, 120);
  }
}

function updateBar(name, value) {
  const rounded = Math.round(value);
  const bar = $(`#${name}-bar`);
  $(`#${name}-value`).textContent = `${rounded}%`;
  bar.style.width = `${rounded}%`;
  bar.classList.toggle('critical', rounded < 20);
}

function updatePet() {
  const average = (petState.hunger + petState.happiness + petState.energy) / 3;
  const pet = $('#pet');
  const mouth = $('.mouth');
  const statusLabel = $('#status-label');
  const status = $('#pet-status');
  const message = $('#pet-message');
  let face = '⌣';
  let label = 'İyi hissediyor';
  let title = 'Çok mutlu!';
  let copy = 'Seninle vakit geçirmeye bayılıyor.';

  if (petState.energy < 20) { face = '﹏'; label = 'Dinlenmeye ihtiyacı var'; title = 'Çok uykum var zZZ'; copy = 'Biraz uyku bütün enerjisini yeniler.'; }
  else if (petState.hunger < 20) { face = '︵'; label = 'Karnı çok aç'; title = 'Açıktım...'; copy = 'Minik dostunun karnı gurulduyor.'; }
  else if (average < 25) { face = '︵'; label = 'Biraz üzgün'; title = 'Sana küstü!'; copy = 'Onunla ilgilenirsen hemen neşelenir.'; }
  else if (average < 55) { face = '•ᴗ•'; label = 'Biraz ilgi bekliyor'; title = 'Beni unutmadın, değil mi?'; copy = 'Bir oyun ya da atıştırmalık iyi gelebilir.'; }

  mouth.textContent = face;
  statusLabel.textContent = label;
  status.textContent = title;
  message.textContent = copy;
  pet.setAttribute('aria-label', `Sanal dostun: ${title}`);
  $('.status-pill').style.color = average < 25 ? '#d8666f' : '#5ba88f';
  $('.status-pill').style.background = average < 25 ? '#ffeaeb' : '#e3f6ee';
}

function render() {
  updateBar('hunger', petState.hunger);
  updateBar('happiness', petState.happiness);
  updateBar('energy', petState.energy);
  updatePet();
}

function interact(action) {
  if (action === 'feed') { petState.hunger = clamp(petState.hunger + 20); $('#interaction-note').textContent = 'Nefis! Şimdi karnı çok mutlu. 🍎'; }
  if (action === 'play') { petState.happiness = clamp(petState.happiness + 20); petState.energy = clamp(petState.energy - 10); $('#interaction-note').textContent = 'Oyun zamanı çok eğlenceliydi! 🎾'; }
  if (action === 'sleep') { petState.energy = clamp(petState.energy + 30); $('#interaction-note').textContent = 'Tatlı rüyalar, minik dostum... 🌙'; }
  playSound(action);
  const button = document.querySelector(`[data-action="${action}"]`);
  button.style.animation = 'action-pop .3s ease';
  button.addEventListener('animationend', () => { button.style.animation = ''; }, { once: true });
  render();
}

document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => interact(button.dataset.action)));

setInterval(() => {
  const before = { ...petState };
  petState.hunger = clamp(petState.hunger - (Math.floor(Math.random() * 4) + 5));
  petState.happiness = clamp(petState.happiness - (Math.floor(Math.random() * 4) + 5));
  petState.energy = clamp(petState.energy - (Math.floor(Math.random() * 4) + 5));
  if (Object.values(petState).some((value, index) => value === 0 && Object.values(before)[index] > 0)) {
    playSound('critical');
    $('#interaction-note').textContent = 'Dikkat! Bir ihtiyacı tamamen tükendi. 🚨';
  }
  render();
}, 3000);

render();
