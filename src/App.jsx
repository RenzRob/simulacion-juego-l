import { useState } from 'react';
import './App.css';

const BOARD_SIZE = 4;
const EMPTY = 0;
const RED_L = 1;
const BLACK_L = 2;
const CIRCLE = 3;

// Posiciones iniciales basadas en la imagen
const INITIAL_STATE = {
  board: [
    [CIRCLE, RED_L, RED_L, EMPTY],
    [EMPTY, RED_L, BLACK_L, EMPTY],
    [EMPTY, RED_L, BLACK_L, EMPTY],
    [EMPTY, BLACK_L, BLACK_L, CIRCLE]
  ],
  redLPosition: [[0, 1], [0, 2], [1, 1], [2, 1]], // L roja: horizontal arriba + vertical abajo
  blackLPosition: [[1, 2], [2, 2], [3, 1], [3, 2]], // L negra: vertical arriba + horizontal abajo
  circles: [[0, 0], [3, 3]], // Círculos en esquinas opuestas
  currentPlayer: 'red',
  selectedPiece: null,
  movePhase: 'L', // 'L' para mover L, 'circle' para mover círculo
  winner: null,
  previewMove: null // Para mostrar previsualización de movimientos
};

// Las 8 orientaciones posibles de una L verdadera: 4 rotaciones + 4 espejos
const L_SHAPES = {
  1: [ // Todas las orientaciones de L (rotaciones + espejos)
    // Rotaciones normales
    [[0, 0], [0, 1], [1, 0], [2, 0]], // L normal: ┌─ 
                                      //          │
                                      //          │
    [[0, 0], [1, 0], [1, 1], [1, 2]], // L rotada 90°: ┌───
                                      //               │
    [[0, 1], [1, 1], [2, 0], [2, 1]], // L rotada 180°:   │
                                      //                   │
                                      //                ─┘
    [[0, 0], [0, 1], [0, 2], [1, 2]], // L rotada 270°: ───┐
                                      //                    │
    
    // Espejos (L invertida)
    [[0, 1], [1, 1], [2, 0], [2, 1]], // L espejo 0°:   ─┐
                                      //                │
                                      //                │
    [[0, 0], [0, 1], [0, 2], [1, 0]], // L espejo 90°: ───┐
                                      //                  │
    [[0, 0], [0, 1], [1, 1], [2, 1]], // L espejo 180°: ┌─
                                      //                │
                                      //             ─┘
    [[0, 2], [1, 0], [1, 1], [1, 2]]  // L espejo 270°:   │
                                      //                ───┘
  ]
};

function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);

  const isValidPosition = (positions) => {
    return positions.every(([row, col]) => 
      row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
    );
  };

  const isPositionFree = (board, positions, excludePositions = []) => {
    const excludeSet = new Set(excludePositions.map(pos => `${pos[0]},${pos[1]}`));
    return positions.every(([row, col]) => {
      const key = `${row},${col}`;
      return excludeSet.has(key) || board[row][col] === EMPTY;
    });
  };

  const getPossibleLMoves = (currentL, board, playerType) => {
    const moves = [];
    const excludePositions = playerType === 'red' ? gameState.redLPosition : gameState.blackLPosition;
    
    // Crear un conjunto de la posición actual para comparar
    const currentPositionSet = new Set(currentL.map(([r, c]) => `${r},${c}`));
    
    // Probar todas las posiciones y orientaciones posibles
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        for (let shapeIndex = 0; shapeIndex < L_SHAPES[1].length; shapeIndex++) {
          const shape = L_SHAPES[1][shapeIndex];
          const positions = shape.map(([r, c]) => [row + r, col + c]);
          
          if (isValidPosition(positions) && isPositionFree(board, positions, excludePositions)) {
            // Verificar que no sea la misma posición actual
            const newPositionSet = new Set(positions.map(([r, c]) => `${r},${c}`));
            const isSamePosition = currentPositionSet.size === newPositionSet.size && 
                                 [...currentPositionSet].every(pos => newPositionSet.has(pos));
            
            if (!isSamePosition) {
              moves.push({ positions, row, col, shapeIndex });
            }
          }
        }
      }
    }
    return moves;
  };

  const updateBoard = (newRedL, newBlackL, newCircles) => {
    const newBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    // Colocar L roja
    newRedL.forEach(([row, col]) => {
      newBoard[row][col] = RED_L;
    });
    
    // Colocar L negra
    newBlackL.forEach(([row, col]) => {
      newBoard[row][col] = BLACK_L;
    });
    
    // Colocar círculos
    newCircles.forEach(([row, col]) => {
      newBoard[row][col] = CIRCLE;
    });
    
    return newBoard;
  };

  const checkWinCondition = (redL, blackL, circles) => {
    const board = updateBoard(redL, blackL, circles);
    const redMoves = getPossibleLMoves(redL, board, 'red');
    const blackMoves = getPossibleLMoves(blackL, board, 'black');
    
    if (redMoves.length === 0) return 'black';
    if (blackMoves.length === 0) return 'red';
    return null;
  };

  const handleCellClick = (row, col) => {
    if (gameState.winner) return;

    const { currentPlayer, movePhase, selectedPiece } = gameState;

    if (movePhase === 'L') {
      if (selectedPiece && selectedPiece.type === 'L') {
        // Si ya hay una L seleccionada, mostrar TODAS las opciones disponibles
        const currentL = currentPlayer === 'red' ? gameState.redLPosition : gameState.blackLPosition;
        const possibleMoves = getPossibleLMoves(currentL, gameState.board, currentPlayer);
        
        setGameState(prev => ({
          ...prev,
          selectedPiece: { 
            ...selectedPiece, 
            possibleMoves: possibleMoves // Mostrar TODOS los movimientos posibles
          }
        }));
      } else {
        // Seleccionar la L del jugador actual
        const currentL = currentPlayer === 'red' ? gameState.redLPosition : gameState.blackLPosition;
        const isLPiece = currentL.some(([r, c]) => r === row && c === col);
        
        if (isLPiece) {
          const possibleMoves = getPossibleLMoves(currentL, gameState.board, currentPlayer);
          setGameState(prev => ({
            ...prev,
            selectedPiece: { 
              type: 'L', 
              player: currentPlayer,
              allPossibleMoves: possibleMoves,
              possibleMoves: possibleMoves // Mostrar inmediatamente todas las opciones
            }
          }));
        } else {
          // Deseleccionar si se hace clic en otro lugar
          setGameState(prev => ({
            ...prev,
            selectedPiece: null
          }));
        }
      }
    } else if (movePhase === 'circle') {
      // Mover círculo
      if (selectedPiece && selectedPiece.type === 'circle') {
        // Mover círculo seleccionado a nueva posición
        if (gameState.board[row][col] === EMPTY) {
          const newCircles = [...gameState.circles];
          newCircles[selectedPiece.index] = [row, col];
          const newBoard = updateBoard(gameState.redLPosition, gameState.blackLPosition, newCircles);
          
          // Verificar condición de victoria
          const winner = checkWinCondition(gameState.redLPosition, gameState.blackLPosition, newCircles);
          
          setGameState(prev => ({
            ...prev,
            board: newBoard,
            circles: newCircles,
            selectedPiece: null,
            currentPlayer: currentPlayer === 'red' ? 'black' : 'red',
            movePhase: 'L',
            winner
          }));
        }
      } else {
        // Seleccionar círculo
        const circleIndex = gameState.circles.findIndex(([r, c]) => r === row && c === col);
        if (circleIndex !== -1) {
          setGameState(prev => ({
            ...prev,
            selectedPiece: { type: 'circle', index: circleIndex }
          }));
        }
      }
    }
  };

  const resetGame = () => {
    setGameState(INITIAL_STATE);
  };

  const getCellClass = (row, col) => {
    const { board, selectedPiece, currentPlayer, movePhase } = gameState;
    const cellValue = board[row][col];
    let classes = ['cell'];
    
    if (cellValue === RED_L) classes.push('red-l');
    else if (cellValue === BLACK_L) classes.push('black-l');
    else if (cellValue === CIRCLE) classes.push('circle');
    
    // Resaltar pieza seleccionada
    if (selectedPiece) {
      if (selectedPiece.type === 'L') {
        const currentL = currentPlayer === 'red' ? gameState.redLPosition : gameState.blackLPosition;
        if (currentL.some(([r, c]) => r === row && c === col)) {
          classes.push('selected');
        }
      } else if (selectedPiece.type === 'circle') {
        const [circleRow, circleCol] = gameState.circles[selectedPiece.index];
        if (circleRow === row && circleCol === col) {
          classes.push('selected');
        }
      }
    }
    
    // Mostrar movimientos válidos
    if (selectedPiece && movePhase === 'L' && selectedPiece.type === 'L') {
      if (selectedPiece.allPossibleMoves) {
        // Mostrar todas las posiciones posibles
        const isValidMove = selectedPiece.allPossibleMoves.some(move => 
          move.positions.some(([r, c]) => r === row && c === col)
        );
        if (isValidMove && cellValue === EMPTY) {
          classes.push('valid-move');
        }
      }
      
      // Si hay múltiples opciones para una celda específica, resaltarlas de manera especial
      if (selectedPiece.possibleMoves) {
        const isMultiOptionMove = selectedPiece.possibleMoves.some(move => 
          move.positions.some(([r, c]) => r === row && c === col)
        );
        if (isMultiOptionMove && cellValue === EMPTY) {
          classes.push('multi-option-move');
        }
      }
    }
    
    if (selectedPiece && movePhase === 'circle' && selectedPiece.type === 'circle' && cellValue === EMPTY) {
      classes.push('valid-move');
    }
    
    // Mostrar previsualización de movimiento
    if (gameState.previewMove) {
      const isPreviewPosition = gameState.previewMove.some(([r, c]) => r === row && c === col);
      if (isPreviewPosition) {
        classes.push('preview-move');
      }
    }
    
    return classes.join(' ');
  };

  return (
    <div className="App">
      <h1>Juego L</h1>
      <div className="game-info">
        <p>Turno del jugador: <span className={`player ${gameState.currentPlayer}`}>
          {gameState.currentPlayer === 'red' ? 'Rojo' : 'Negro'}
        </span></p>
        <p>Fase: {gameState.movePhase === 'L' ? 'Mover L' : 'Mover Círculo'}</p>
        {gameState.winner && (
          <p className="winner">
            ¡Ganó el jugador {gameState.winner === 'red' ? 'Rojo' : 'Negro'}!
          </p>
        )}
      </div>
      
      <div className="board">
        {gameState.board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellClass(rowIndex, colIndex)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              />
            ))}
          </div>
        ))}
      </div>
      
      {gameState.selectedPiece && gameState.selectedPiece.possibleMoves && (
        <div className="movement-options">
          <h4>
            Movimientos disponibles ({gameState.selectedPiece.possibleMoves.length}) - Elige uno:
          </h4>
          <div className="options-grid">
            {gameState.selectedPiece.possibleMoves.map((move, index) => (
              <button
                key={index}
                className="option-button"
                onMouseEnter={() => {
                  setGameState(prev => ({
                    ...prev,
                    previewMove: move.positions
                  }));
                }}
                onMouseLeave={() => {
                  setGameState(prev => ({
                    ...prev,
                    previewMove: null
                  }));
                }}
                onClick={() => {
                  const newRedL = gameState.currentPlayer === 'red' ? move.positions : gameState.redLPosition;
                  const newBlackL = gameState.currentPlayer === 'black' ? move.positions : gameState.blackLPosition;
                  const newBoard = updateBoard(newRedL, newBlackL, gameState.circles);
                  
                  setGameState(prev => ({
                    ...prev,
                    board: newBoard,
                    redLPosition: newRedL,
                    blackLPosition: newBlackL,
                    selectedPiece: null,
                    movePhase: 'circle',
                    previewMove: null
                  }));
                }}
                              >
                  Opción {index + 1}
                </button>
            ))}
          </div>
          <button 
            className="cancel-button"
            onClick={() => setGameState(prev => ({ 
              ...prev, 
              selectedPiece: { ...prev.selectedPiece, possibleMoves: undefined, targetCell: undefined },
              previewMove: null 
            }))}
          >
            Cancelar
          </button>
        </div>
      )}
      
      <div className="controls">
        <button onClick={resetGame}>Nueva Partida</button>
      </div>
      
      <div className="instructions">
        <h3>Instrucciones:</h3>
        <ol>
          <li>En tu turno, primero seleccioná tu L haciendole click</li>
          <li>Despues hace click en una posición válida para moverla</li>
          <li>Después selecciona un círculo y movelo a una posición libre</li>
          <li>Ganás cuando tu oponente no puede mover su L</li>
        </ol>
      </div>
    </div>
  );
}

export default App; 