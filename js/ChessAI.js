var chess_board = null
var game = new Chess()
var ai_color = 'b'

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for White
  if (piece.search(/^b/) !== -1) return false
}

function makeRandomMove () {
  var possibleMoves = game.moves()

  // game over
  if (possibleMoves.length === 0) return

  var randomIdx = Math.floor(Math.random() * possibleMoves.length)
  game.move(possibleMoves[randomIdx])
  chess_board.position(game.fen())
}

function piece_value(board_fen, color){
  var board = new Chess(board_fen)
  var score = 0

  var cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  for (var i = 1; i < 9; i++){
    for (var j = 0; j < 8; j++){
      var piece = board.get(`${cols[j]}${i}`)

      if (piece){
        if (piece['color'] == color){
          if (piece['type'] == 'p'){
            score += 1
          }
          if (piece['type'] == 'b' || piece['type'] == 'n'){
            score += 3
          }
          if (piece['type'] == 'r'){
            score += 5
          }
          if (piece['type'] == 'q'){
            score += 10
          }
        }
      }
    }
  }

  return score
}

function heuristic(board_fen, color) {
  // At the start our heuristic will be simple, just count our points (pawn - 1pt bishop/knight - 3pt rook - 5pt queen - 10pt)
  var score = 0
  var board = new Chess(board_fen)

  // If the game is over, check who won or if it was a stalemate.
  if (board.game_over()){
    if (board.in_draw()){
      return 0
    }
    if (board.in_checkmate()){
      if (board.turn() == color){
        return -100
      }
      else {
        return 100
      }
    }
  }
  if (color == 'b'){
    var other_color = 'w'
  }
  else {
    var other_color = 'b'
  }

  return piece_value(board_fen, color) - piece_value(board_fen, other_color)
}

function MiniMax(board_fen, color, max, depth){
  var board = new Chess(board_fen)

  if (board.game_over() || depth == 0){
    return [null, heuristic(board_fen, color)]
  }

  var possibleMoves = board.moves()

  if (max){
    var currMax = -1 * Infinity
    var currMove = null

    for (var i = 0; i < possibleMoves.length; i++){
      board.move(possibleMoves[i])
      var move_val = MiniMax(board.fen(), color, false, depth-1)

      if (move_val[1] > currMax){
        currMax = move_val[1]
        currMove = possibleMoves[i]
      }
      board = new Chess(board_fen)
    }
    return [currMove, currMax]
  }
  else {
    var currMin = Infinity
    var currMove = null

    for (var i = 0; i < possibleMoves.length; i++){
      board.move(possibleMoves[i])
      var move_val = MiniMax(board.fen(), color, true, depth-1)

      if (move_val[1] < currMin){
        currMin = move_val[1]
        currMove = possibleMoves[i]
      }
      board = new Chess(board_fen)
    }
    return [currMove, currMin]
  }
}

function makeMinMaxMove() {
  var move = MiniMax(game.fen(), ai_color, true, 2)
  console.log(`Move ${move[0]} has value ${move[1]}`)
  game.move(move[0])
  chess_board.position(game.fen())
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  // make random legal move for black
  window.setTimeout(makeMinMaxMove, 250)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  chess_board.position(game.fen())
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
chess_board = Chessboard('board', config)