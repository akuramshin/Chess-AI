var chess_board = null
var game = new Chess()
var ai_color = 'b'
var nodes = new Map()

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

  // Positional heuristic
  

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

function AlphaBeta(board_fen, color, max, depth, alpha, beta){
  var board = new Chess(board_fen)

  if (board.game_over() || depth == 0){
    return [null, heuristic(board_fen, color)]
  }

  var possibleMoves = board.moves()
  possibleMoves.sort(function (move) {
    var copy = new Chess(board_fen)
    copy.move(move)
    return heuristic(copy.fen(), color)
  })

  if (max){
    var currMove = null

    for (var i = 0; i < possibleMoves.length; i++){
      board.move(possibleMoves[i])
      var move_val = AlphaBeta(board.fen(), color, false, depth-1, alpha, beta)

      if (move_val[1] > alpha){
        alpha = move_val[1]
        currMove = possibleMoves[i]
      }
      if (beta <= alpha){
        break
      }
      board = new Chess(board_fen)
    }
    return [currMove, alpha]
  }
  else {
    var currMove = null

    for (var i = 0; i < possibleMoves.length; i++){
      board.move(possibleMoves[i])
      var move_val = AlphaBeta(board.fen(), color, true, depth-1, alpha, beta)

      if (move_val[1] < beta){
        beta = move_val[1]
        currMove = possibleMoves[i]
      }
      if (beta <= alpha){
        break
      }
      board = new Chess(board_fen)
    }
    return [currMove, beta]
  }
}

class State {
  constructor(game_fen, color, move){
    this.game_fen = game_fen
    this.color = color
    this.move = move
  }
}

class Node {
    constructor(parent, state, plays){
      this.parent = parent
      this.children = []
      this.state = state

      this.wins = 0
      this.simulations = 0

      this.unexpandedPlays = plays;
      let game = new Chess(this.state.game_fen)
      this.gameOver = game.game_over()
    }

    getUnexpandedPlays() {
      return this.unexpandedPlays
    }

    expand(move) {
      let board = new Chess(this.state.game_fen)
      board.move(move)

      let index = this.unexpandedPlays.indexOf(move)
      this.unexpandedPlays.splice(index, 1)

      let next_state = new State(board.fen(), board.turn(), move)
      let child_node = new Node(this, next_state, board.moves())
      this.children.push(child_node)
      nodes.set(board.fen(), child_node)
      
      return child_node
    }

    getUCB1(c) {
      return (this.wins/this.simulations) + c*(Math.sqrt(Math.log(this.parent.simulations)/this.simulations))
    }

    isFullyExpanded() {
      return this.unexpandedPlays.length == 0
    }

    isLeaf() {
      return this.gameOver
    }
}


function MCTS(root, timeout, c){

  let end = Date.now() + timeout * 1000
  while (Date.now() < end) {

    // Phase 1: Select
    let node = MCTSelect(root, c)

    if (node.isLeaf() === false) {
      // Phase 2: Expand
      node = MCTExpand(node)
    }
    // Phase 3: Simulate
    winner = MCTSimulate(node)

    // Phase 4: Backpropogate
    MCTBackpropogate(node, winner)
  }

  // If not all children are expanded, not enough information
  // if (root.isFullyExpanded() === false)
  //   throw new Error(`Not enough information! Size: ${root.getUnexpandedPlays().length}`)

  let allPlays = root.children
  let bestPlay
  let max = -Infinity

  for (let child of allPlays) {
    if (child.simulations > max) {
      bestPlay = child
      max = child.simulations
    }
  }

  return bestPlay
}

function MCTSelect(node, c) {
  while (node.isFullyExpanded() && !node.isLeaf()){
    let max_val = -Infinity
    let max_child

    for (let child of node.children){
      let child_val = child.getUCB1(c)

      if (child_val > max_val){
        max_val = child_val
        max_child = child
      }
    }
    node = max_child
  }

  return node
}

function MCTExpand(node) {
  let plays = node.getUnexpandedPlays()
  let index = Math.floor(Math.random() * plays.length)
  let play = plays[index]

  return node.expand(play)
}

function MCTSimulate(node) {
  let state = node.state
  let game = new Chess(state.game_fen)
  let gameOver = game.game_over()

  while (gameOver === false) {
    let plays = game.moves()
    let play = plays[Math.floor(Math.random() * plays.length)]

    game.move(play)
    gameOver = game.game_over()
  }

  let winner
  if (game.in_checkmate()){
    winner = (game.turn() === 'b') ? 'b' : 'w';
  }
  else {
    winner = 't'
  }

  return winner
}

function MCTBackpropogate(node, winner) {
  let state = node.state

  if (winner == state.color) {
    node.wins += 1
  }
  else if (winner == 't') {
    node.wins += 0.5
  }
  node.simulations += 1

  if (node.parent == null){
    return
  }
  MCTBackpropogate(node.parent, winner)
}

function makeMinMaxMove() {
  let move = MiniMax(game.fen(), ai_color, true, 2)
  console.log(`Move ${move[0]} has value ${move[1]}`)
  game.move(move[0])
  chess_board.position(game.fen())
}

function makeAlphaBetaMove(){
  let move = AlphaBeta(game.fen(), ai_color, true, 4, -1*Infinity, Infinity)
  console.log(`Move ${move[0]} has value ${move[1]}`)
  game.move(move[0])
  chess_board.position(game.fen())
}

function makeMCTSMove(){

  let state_fen = game.fen()
  let node
  if (!nodes.has(state_fen)) {
    let state = new State(state_fen, game.turn(), null)
    node = new Node(null, state, game.moves())
    nodes.set(state_fen, node)
  }
  else {
    console.log("Found!")
    node = nodes.get(state_fen)
  }

  let move_node = MCTS(node, 4, Math.sqrt(2))
  console.log(`Move ${move_node.state.move} has value ${move_node.wins}/${move_node.simulations}`)
  game.move(move_node.state.move)
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
  // makeRandomMove()

  // make alpha beta pruning move
  window.setTimeout(makeAlphaBetaMove, 4000)
  //makeAlphaBetaMove()

  //makeMCTSMove()
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

// let state_fen = game.fen()
// let state = new State(state_fen, game.turn(), null)
// node = new Node(null, state, game.moves())
// nodes.set(state_fen, node)

// let move_node = MCTS(node, 60, Math.sqrt(2))
// console.log("Done!")
