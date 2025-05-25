// script.js

// Elementos del modal de victoria
const victoryModal    = document.getElementById('victory-modal');
const victoryTitle    = document.getElementById('victory-title');
const victoryMessage  = document.getElementById('victory-message');
const closeVictoryBtn = document.getElementById('close-victory');

// ——— Elementos del modal y configuración inicial ———
const configModal = document.getElementById('config-modal');
const startBtn    = document.getElementById('start-game');
const nameInput   = document.getElementById('player-name-input');

let playerName, playerSymbol, aiSymbol, currentPlayer;

// Mostrar modal al cargar la página
window.addEventListener('load', () => {
  configModal.style.display = 'flex';
});

// Al pulsar "Iniciar Juego"
startBtn.addEventListener('click', () => {
  // 1) Nombre del jugador
  playerName = nameInput.value.trim() || 'Retador';
  document.getElementById('player-name').textContent = playerName;

  // 2) Símbolo elegido
  playerSymbol = document.querySelector('input[name="symbol"]:checked').value;
  aiSymbol     = playerSymbol === 'X' ? 'O' : 'X';

  // 3) Quién comienza
  const turnChoice = document.querySelector('input[name="turn"]:checked').value;
  currentPlayer = (turnChoice === 'player') ? playerSymbol : aiSymbol;

  // 4) Ocultar modal y mostrar área de juego
  configModal.style.display     = 'none';
  document.getElementById('game-area').style.display = 'flex';

  // 5) Si la IA empieza, invocarla tras un breve delay
  if (currentPlayer === aiSymbol) {
    setTimeout(turnoIA, 500);
  }
});

// ——— Lógica del juego ———
const celdas          = document.querySelectorAll('.celda');
const mensaje         = document.getElementById('mensaje');
const btnReiniciar    = document.getElementById('reiniciar');
const lineaVictoriaEl = document.getElementById('linea-victoria');

let tablero = Array(9).fill(null);
let jugando = true;

// Definición de combinaciones ganadoras
const combinacionesGanadoras = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// Asignar listener a cada celda
celdas.forEach(celda =>
  celda.addEventListener('click', () => turnoHumano(+celda.dataset.index))
);


// Cerrar modal de victoria
closeVictoryBtn.addEventListener('click', () => {
  victoryModal.classList.add('hidden');
});



// Botón reiniciar
btnReiniciar.addEventListener('click', reiniciarJuego);

function obtenerResultado(tab) {
  for (let combo of combinacionesGanadoras) {
    const [a,b,c] = combo;
    if (tab[a] && tab[a] === tab[b] && tab[a] === tab[c]) {
      return { ganador: tab[a], combo };
    }
  }
  if (tab.every(v => v)) return { ganador: 'Empate' };
  return null;
}


// 2) Turno humano
function turnoHumano(idx) {
  if (!jugando || tablero[idx] || currentPlayer !== playerSymbol) return;
  tablero[idx] = playerSymbol;
  actualizarUI();

  const res = obtenerResultado(tablero);
  if (res) {
    if (res.ganador !== 'Empate') dibujarLinea(res.combo);
    return terminarJuego(res.ganador);
  }

  currentPlayer = aiSymbol;
  setTimeout(turnoIA, 300);
}


function turnoIA() {
  if (!jugando || currentPlayer !== aiSymbol) return;
  const idx = mejorJugada(tablero);
  if (idx != null) tablero[idx] = aiSymbol;
  actualizarUI();

  const res = obtenerResultado(tablero);
  if (res) {
    if (res.ganador !== 'Empate') dibujarLinea(res.combo);
    return terminarJuego(res.ganador);
  }

  currentPlayer = playerSymbol;
}

function actualizarUI() {
  tablero.forEach((val, i) => {
    const celda = celdas[i];
    celda.textContent = val || '';
    // Limpia clases previas
    celda.classList.remove('x-simbolo', 'o-simbolo');
    // Añade la clase correspondiente
    if (val === 'X') celda.classList.add('x-simbolo');
    if (val === 'O') celda.classList.add('o-simbolo');
  });
}


// — Verificar ganador o empate — 
function verificarGanador() {
  for (let combo of combinacionesGanadoras) {
    const [a, b, c] = combo;
    if (
      tablero[a] &&
      tablero[a] === tablero[b] &&
      tablero[a] === tablero[c]
    ) {
      dibujarLinea(combo);
      return tablero[a];  // 'X' u 'O'
    }
  }
  // Empate si no quedan celdas vacías
  if (tablero.every(v => v)) return 'Empate';
  return null;
}

// — Dibujar la línea de victoria — 
function dibujarLinea([a, , c]) {
  // Helper para obtener el centro de una celda en coordenadas relativas
  function getCentro(i) {
    const rectCelda = celdas[i].getBoundingClientRect();
    const rectCont = document
      .getElementById('tablero-container')
      .getBoundingClientRect();
    return {
      x: rectCelda.left + rectCelda.width/2 - rectCont.left,
      y: rectCelda.top  + rectCelda.height/2 - rectCont.top
    };
  }

  const pA = getCentro(a);
  const pC = getCentro(c);
  const dx = pC.x - pA.x, dy = pC.y - pA.y;
  const dist = Math.hypot(dx, dy);
  const ang  = Math.atan2(dy, dx) * 180/Math.PI;

  // Inicializar línea oculta
  lineaVictoriaEl.style.transition = 'none';
  lineaVictoriaEl.style.width      = '0';
  lineaVictoriaEl.style.transform  = `translate(${pA.x}px, ${pA.y}px) rotate(${ang}deg)`;

  // Animar expansión de la línea
  requestAnimationFrame(() => {
    lineaVictoriaEl.style.transition = 'width 0.5s ease';
    lineaVictoriaEl.style.width      = `${dist}px`;
  });
}




function terminarJuego(resultado) {
  jugando = false;

  // Texto en pantalla (opcional)
  mensaje.textContent = resultado === 'Empate'
    ? '¡Empate!'
    : `¡Ganador: ${resultado}!`;

  // Prepara el modal de victoria
  if (resultado === 'Empate') {
    victoryTitle.textContent   = '¡Este es un empateee!';
    victoryMessage.textContent = 'No hubo ganador.';
  } else {
    victoryTitle.textContent   = '¡Victoriaaaaa!';
    victoryMessage.textContent = `¡Gana "${resultado}"!`;
  }

  // Muestra el modal
  victoryModal.classList.remove('hidden');
}


// — Calcular mejor jugada con Minimax — 
function mejorJugada(tab) {
  let mejor = -Infinity, mov = null;
  for (let i = 0; i < tab.length; i++) {
    if (!tab[i]) {
      tab[i] = aiSymbol;
      let score = minimax(tab, 0, false);
      tab[i] = null;
      if (score > mejor) {
        mejor = score;
        mov = i;
      }
    }
  }
  return mov;
}


function minimax(tab, depth, esMax) {
  const res = obtenerResultado(tab);
  if (res) {
    if (res.ganador === aiSymbol)     return 10 - depth;
    if (res.ganador === playerSymbol) return depth - 10;
    if (res.ganador === 'Empate')     return 0;
  }
  if (esMax) {
    let best = -Infinity;
    for (let i=0; i<9; i++) {
      if (!tab[i]) {
        tab[i] = aiSymbol;
        best = Math.max(best, minimax(tab, depth+1, false));
        tab[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i=0; i<9; i++) {
      if (!tab[i]) {
        tab[i] = playerSymbol;
        best = Math.min(best, minimax(tab, depth+1, true));
        tab[i] = null;
      }
    }
    return best;
  }
}

// — Reiniciar la partida — 
function reiniciarJuego() {
  tablero.fill(null);
  jugando = true;
  mensaje.textContent = '';
  lineaVictoriaEl.style.transition = 'none';
  lineaVictoriaEl.style.width      = '0';
  actualizarUI();

  // Si le toca a la IA iniciar, la lanzamos
  if (currentPlayer === aiSymbol) {
    setTimeout(turnoIA, 300);
  }
}
