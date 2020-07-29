var board = null
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
  heuristic()

  // game over
  if (possibleMoves.length === 0) return

  var randomIdx = Math.floor(Math.random() * possibleMoves.length)
  game.move(possibleMoves[randomIdx])
  board.position(game.fen())
}

function heuristic() {
  // At the start our heuristic will be simple, just count our points (pawn - 1pt bishop/knight - 3pt rook - 5pt queen - 10pt)
  var score = 0

  var cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  for (var i = 1; i < 9; i++){
    for (var j = 0; j < 8; j++){
      var piece = game.get(`${cols[j]}${i}`)

      if (piece){
        console.log(piece['color'])
        if (piece['color'] == ai_color){
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

function makeMinMaxMove() {

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
  window.setTimeout(makeRandomMove, 250)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('board', config)