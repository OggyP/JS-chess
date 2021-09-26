let flipBoard = false;
let valid_positions = $("#valid_positions");
let piecesLayer = $("#pieces_layer");
let promotionSelector = $("#promotion_selector")
let promotionSelectorImg = $("#promotion_options")
let moveList = $("#move_list")
let PGNView = $("#PGN_view")
let openingDisplay = $("#opening")
let selectedPiece = null;
let moveNum = 0
let fiftyMoveRuleCountDown = 50

let turn = true;
let forcedEnpassant = false; // I added this because it is funny (Off by default)
let drawCurrentBoard = true;
let boardAtMove = []
let showingBoard = 0;

let pgnMetaValues = {
    "Event" : "?",
    "Site"  : "chess.oggyp.com",
    "Date"  : new Date().getFullYear() + '.' + new Date().getMonth() + '.' + new Date().getDate(),
    "Round" : "?",
    "White" : "?",
    "Black" : "?",
    "Result": "*"
}
let pgnMeta = ["Event", "Site", "Date", "Round", "White", "Black", "Result"]
let pgnText = ""
let pgnDownload = ""

class Piece {
    constructor(pieceId) {
        this.code = pieceId;
        // true = white | false = black
        this.team = (pieceId[1] === 'l');
        this.piece = pieceId[0];
        this.moves = 0;
        this.clicked = false;
        this.lastMoveNum = -10;
    }
}

const chessNotation = {
    x: {
        0: 'a',
        1: 'b',
        2: 'c',
        3: 'd',
        4: 'e',
        5: 'f',
        6: 'g',
        7: 'h'
    },
    y: {
        0: '8',
        1: '7',
        2: '6',
        3: '5',
        4: '4',
        5: '3',
        6: '2',
        7: '1'
    }
}

let chessBoard = [
    ["rd", "nd", "bd", "qd", "kd", "bd", "nd", "rd"],
    ["pd", "pd", "pd", "pd", "pd", "pd", "pd", "pd"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["pl", "pl", "pl", "pl", "pl", "pl", "pl", "pl"],
    ["rl", "nl", "bl", "ql", "kl", "bl", "nl", "rl"],
]

for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
        if (chessBoard[y][x] !== "NA") {
            chessBoard[y][x] = new Piece(chessBoard[y][x]);
        }
    }
}

boardAtMove.push(clone(chessBoard))
drawBoard()

function pieceClicked(xVal, yVal) {
    if (drawCurrentBoard) {
        $(".chess_piece").css("opacity", "1")
        $("#piece" + xVal + yVal).css("opacity", "0.6")
        valid_positions.empty()
        selectedPiece = [xVal, yVal]
        let clickedPiece = chessBoard[yVal][xVal]
        if (turn === clickedPiece.team) {
            let locations = legalMovesOfPiece(xVal, yVal, clickedPiece)
            locations.forEach(location => {
                let newBoard = clone(chessBoard)
                newBoard[location[1]][location[0]] = clone(clickedPiece)
                newBoard[yVal][xVal] = "NA"
                let drawY = (!flipBoard) ? location[1] : 7 - location[1]
                let drawX = (!flipBoard) ? location[0] : 7 - location[0]
                if (location.length === 3) {
                    if (location[2]) {
                        //check if the king is in check
                        newBoard[yVal][location[0]] = "NA"
                        // ENPASSANT
                        if (!inCheck(newBoard, clickedPiece.team)) {
                            valid_positions.append(' <div onclick="pieceMove(' + location[0] + ', ' + location[1] + ', true)" ondrop="drop()" class="valid_position" style="top: ' + drawY * 100 + 'px; left: ' + drawX * 100 + 'px;"><svg  height="100" width="100">\n' +
                                '  <circle cx="50" cy="50" r="30" fill="gray" fill-opacity="0.6"/>\n' +
                                '</svg></div>')
                        }
                    } else {
                        // castle
                        if (!inCheck(newBoard, clickedPiece.team)) {
                            valid_positions.append(' <div onclick="pieceMove(' + location[0] + ', ' + location[1] + ', true, \'castle\')" ondrop="drop()" class="valid_position" style="top: ' + drawY * 100 + 'px; left: ' + drawX * 100 + 'px;"><svg  height="100" width="100">\n' +
                                '  <circle cx="50" cy="50" r="30" fill="gray" fill-opacity="0.6"/>\n' +
                                '</svg></div>')
                        }
                    }
                } else {
                    //check if the king is in check
                    if (!inCheck(newBoard, clickedPiece.team)) {
                        valid_positions.append(' <div onclick="pieceMove(' + location[0] + ', ' + location[1] + ')" ondrop="drop()" class="valid_position" style="top: ' + drawY * 100 + 'px; left: ' + drawX * 100 + 'px;"><svg  height="100" width="100">\n' +
                            '  <circle cx="50" cy="50" r="30" fill="gray" fill-opacity="0.6"/>\n' +
                            '</svg></div>')
                    }
                }
            })
        }
    }
}

function pieceMove(xVal, yVal, specialCase = false, type = "enpassant") {
    if (chessBoard[selectedPiece[1]][selectedPiece[0]].code === 'pl' && yVal === 0) {
        // show promotion selector light
        promotionSelectorImg.empty()
        let pieceCodes = ['ql', 'rl', 'bl', 'nl']
        for (let idx = 0; idx < pieceCodes.length; idx++) {
            promotionSelectorImg.append('<img onclick="promote(' + xVal + ', ' + yVal + ', \'' + pieceCodes[idx] + '\')" draggable="false" class="chess_piece_select" src="chessAssets/Chess_' + pieceCodes[idx] + 't60.png" alt="K-L" style="top: ' + (yVal * 100) + 'px; left: ' + (xVal * 100 + idx * 60 + 20) + 'px;">')
        }
        promotionSelector.show()
        promotionSelectorImg.show()
    }
    else if (yVal === 7 && chessBoard[selectedPiece[1]][selectedPiece[0]].code === 'pd') {
        // show promotion selector light
        promotionSelectorImg.empty()
        let pieceCodes = ['qd', 'rd', 'bd', 'nd']
        for (let idx = 0; idx < pieceCodes.length; idx++) {
            promotionSelectorImg.append('<img onclick="promote(' + xVal + ', ' + yVal + ', \'' + pieceCodes[idx] + '\')" draggable="false" class="chess_piece_select" src="chessAssets/Chess_' + pieceCodes[idx] + 't60.png" alt="K-L" style="top: ' + (yVal * 100) + 'px; left: ' + (xVal * 100 + idx * 60 + 20) + 'px;">')
        }
        promotionSelector.show()
        promotionSelectorImg.show()
    } else {
        if (selectedPiece !== null && chessBoard[selectedPiece[1]][selectedPiece[0]] !== 'NA') {
            if (turn) fiftyMoveRuleCountDown--
            chessBoard[selectedPiece[1]][selectedPiece[0]].moves++;
            chessBoard[selectedPiece[1]][selectedPiece[0]].lastMoveNum = moveNum;
            if (specialCase) {
                if (type === "enpassant") {
                    // delete enpassant pawn
                    appendMoveToList(selectedPiece, [xVal, yVal], true)
                    chessBoard[selectedPiece[1]][xVal] = 'NA'
                    chessBoard[yVal][xVal] = clone(chessBoard[selectedPiece[1]][selectedPiece[0]])
                    chessBoard[selectedPiece[1]][selectedPiece[0]] = "NA"
                } else if (type === "castle") {
                    appendMoveToList(selectedPiece, [xVal, yVal],false)
                    if (xVal > selectedPiece[0]) {
                        // castle right
                        chessBoard[yVal][7].moves++;
                        chessBoard[yVal][7].lastMoveNum = moveNum;
                        chessBoard[yVal][5] = clone(chessBoard[yVal][7])
                        chessBoard[yVal][6] = clone(chessBoard[yVal][4])
                        chessBoard[yVal][4] = 'NA'
                        chessBoard[yVal][7] = 'NA'
                    } else {
                        // castle left
                        chessBoard[yVal][0].moves++;
                        chessBoard[yVal][0].lastMoveNum = moveNum;
                        chessBoard[yVal][3] = clone(chessBoard[yVal][0])
                        chessBoard[yVal][2] = clone(chessBoard[yVal][4])
                        chessBoard[yVal][4] = 'NA'
                        chessBoard[yVal][0] = 'NA'
                    }
                }
            } else {
                appendMoveToList(selectedPiece, [xVal, yVal],false)
                chessBoard[yVal][xVal] = clone(chessBoard[selectedPiece[1]][selectedPiece[0]])
                chessBoard[selectedPiece[1]][selectedPiece[0]] = "NA"
            }
            valid_positions.empty();
            drawBoard()
            // if other team in checkmate
            if (!checkIfGameOver() && inCheck(chessBoard, !turn)) {
                appendToMove("+")
            }
            turn = !turn
            boardAtMove.push(clone(chessBoard))
            moveNum++;
        }
        if (moveNum < 30) {
            if (openingList.hasOwnProperty(pgnText.slice(0, -1))) {
                openingDisplay.text(openingList[pgnText.slice(0, -1)].ECO + " | " + openingList[pgnText.slice(0, -1)].Name)
            }
        }
    }
    if (forcedEnpassant) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (chessBoard[y][x] !== "NA" && chessBoard[y][x].team === turn && chessBoard[y][x].piece === 'p') {
                    let locations = legalMovesOfPiece(x, y, chessBoard[y][x])
                    for (let i = 0; i < locations.length; i++) {
                        if (locations[i].length === 3 && locations[i][2]) {
                            let newBoard = clone(chessBoard)
                            newBoard[locations[i][1]][locations[i][0]] = clone(chessBoard[y][x])
                            newBoard[y][x] = "NA"
                            newBoard[y][locations[i][0]] = "NA"
                            if (!inCheck(newBoard, chessBoard[y][x].team)) {
                                if (turn) fiftyMoveRuleCountDown--
                                chessBoard[y][x].moves++;
                                chessBoard[y][x].lastMoveNum = moveNum;
                                appendMoveToList([x, y], [locations[i][0], locations[i][1]], true)
                                chessBoard[y][locations[i][0]] = 'NA'
                                chessBoard[locations[i][1]][locations[i][0]] = clone(chessBoard[y][x])
                                chessBoard[y][x] = "NA"
                                valid_positions.empty();
                                drawBoard()
                                // if other team in checkmate
                                if (!checkIfGameOver() && inCheck(chessBoard, !turn)) {
                                    appendToMove("+")
                                }
                                turn = !turn
                                boardAtMove.push(clone(chessBoard))
                                moveNum++;
                            }
                        }
                    }
                }
            }
        }
    }
}

function promote(xVal, yVal, choice) {
    if (turn) fiftyMoveRuleCountDown--
    appendMoveToList(selectedPiece, [xVal, yVal], false, choice)
    promotionSelector.hide()
    promotionSelectorImg.hide()
    valid_positions.empty();
    chessBoard[yVal][xVal] = new Piece(choice)
    chessBoard[yVal][xVal].moves = chessBoard[selectedPiece[1]][selectedPiece[0]].moves + 1;
    chessBoard[yVal][xVal].lastMoveNum = moveNum;
    chessBoard[selectedPiece[1]][selectedPiece[0]] = "NA"
    drawBoard()
    // if other team in checkmate
    if (!checkIfGameOver() && inCheck(chessBoard, !turn)) {
        appendToMove("+")
    }
    turn = !turn
    boardAtMove.push(clone(chessBoard))
    moveNum++;
}

function legalMovesOfPiece(xVal, yVal, clickedPiece) {
    let locations = []
    if (clickedPiece.code === 'pl') {
        if (chessBoard[yVal - 1][xVal] === "NA") {
            locations.push([xVal, yVal - 1])
            // First move
            if (yVal - 2 > 0 && clickedPiece.moves === 0 && chessBoard[yVal - 2][xVal] === "NA") {
                locations.push([xVal, yVal - 2])
            }
        }
        // take on diagonals
        if (xVal - 1 >= 0 && chessBoard[yVal - 1][xVal - 1] !== "NA" && !chessBoard[yVal - 1][xVal - 1].team) {
            locations.push([xVal - 1, yVal - 1])
        }
        if (xVal + 1 <= 7 && chessBoard[yVal - 1][xVal + 1] !== "NA" && !chessBoard[yVal - 1][xVal + 1].team) {
            locations.push([xVal + 1, yVal - 1])
        }
        // enpassant right
        if (xVal + 1 <= 7 && yVal === 3 && chessBoard[yVal][xVal + 1].code === 'pd' && chessBoard[yVal][xVal + 1].moves === 1 && chessBoard[yVal][xVal + 1].lastMoveNum === moveNum - 1) {
            locations.push([xVal + 1, yVal - 1, true])
        }
        // enpassant left
        if (xVal - 1 >= 0 && yVal === 3 && chessBoard[yVal][xVal - 1].code === 'pd' && chessBoard[yVal][xVal - 1].moves === 1 && chessBoard[yVal][xVal - 1].lastMoveNum === moveNum - 1) {
            locations.push([xVal - 1, yVal - 1, true])
        }
    }
    if (clickedPiece.code === 'pd') {
        // normal move
        if (chessBoard[yVal + 1][xVal] === "NA") {
            locations.push([xVal, yVal + 1])
            // First move
            if (yVal + 2 < 8 && clickedPiece.moves === 0 && chessBoard[yVal + 2][xVal] === "NA") {
                locations.push([xVal, yVal + 2])
            }
        }
        // take on diagonals
        if (xVal - 1 >= 0 && chessBoard[yVal + 1][xVal - 1] !== "NA" && chessBoard[yVal + 1][xVal - 1].team) {
            locations.push([xVal - 1, yVal + 1])
        }
        if (xVal + 1 <= 7 && chessBoard[yVal + 1][xVal + 1] !== "NA" && chessBoard[yVal + 1][xVal + 1].team) {
            locations.push([xVal + 1, yVal + 1])
        }
        // enpassant right
        if (xVal + 1 <= 7 && yVal === 4 && chessBoard[yVal][xVal + 1].code === 'pl' && chessBoard[yVal][xVal + 1].moves === 1 && chessBoard[yVal][xVal + 1].lastMoveNum === moveNum - 1) {
            locations.push([xVal + 1, yVal + 1, true])
        }
        // enpassant left
        if (xVal - 1 >= 0 && yVal === 4 && chessBoard[yVal][xVal - 1].code === 'pl' && chessBoard[yVal][xVal - 1].moves === 1 && chessBoard[yVal][xVal - 1].lastMoveNum === moveNum - 1) {
            locations.push([xVal - 1, yVal + 1, true])
        }
    }
    if (clickedPiece.piece === 'n') {
        let vectors = [[2, 1], [1, 2], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
        locations = getVectorsAbsolute(xVal, yVal, vectors, clickedPiece.team)
    }
    if (clickedPiece.piece === 'b') {
        let vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1]]
        locations = rayCastVectors(xVal, yVal, vectors, clickedPiece)
    }
    if (clickedPiece.piece === 'q') {
        let vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1], [0, 1], [1, 0], [0, -1], [-1, 0]]
        locations = rayCastVectors(xVal, yVal, vectors, clickedPiece)
    }
    if (clickedPiece.piece === 'r') {
        let vectors = [[0, 1], [1, 0], [0, -1], [-1, 0]]
        locations = rayCastVectors(xVal, yVal, vectors, clickedPiece)
    }
    if (clickedPiece.piece === 'k') {
        let vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1], [0, 1], [1, 0], [0, -1], [-1, 0]]
        locations = getVectorsAbsolute(xVal, yVal, vectors, clickedPiece.team)

        if (clickedPiece.moves === 0 && !inCheck(chessBoard, clickedPiece.team)) {
            // castling
            // right
            if (chessBoard[yVal][xVal + 3] !== 'NA' && chessBoard[yVal][xVal + 3].moves === 0) {
                if (chessBoard[yVal][xVal + 2] === 'NA' && chessBoard[yVal][xVal + 1] === 'NA') {
                    // can castle not including through check
                    // check if castling through check
                    let newBoard = clone(chessBoard)
                    newBoard[yVal][xVal + 1] = clone(clickedPiece)
                    newBoard[yVal][xVal] = "NA"
                    if (!inCheck(newBoard, clickedPiece.team)) {
                        newBoard[yVal][xVal + 2] = clone(clickedPiece)
                        newBoard[yVal][xVal + 1] = "NA"
                        if (!inCheck(newBoard, clickedPiece.team)) {
                            locations.push([xVal + 2, yVal, false])
                        }
                    }
                }
            }
            //left
            if (chessBoard[yVal][xVal - 4] !== 'NA' && chessBoard[yVal][xVal - 4].moves === 0) {
                if (chessBoard[yVal][xVal - 3] === 'NA' && chessBoard[yVal][xVal - 2] === 'NA' && chessBoard[yVal][xVal - 1] === 'NA') {
                    // can castle not including through check
                    // check if castling through check
                    let newBoard = clone(chessBoard)
                    newBoard[yVal][xVal - 1] = clone(clickedPiece)
                    newBoard[yVal][xVal] = "NA"
                    if (!inCheck(newBoard, clickedPiece.team)) {
                        newBoard[yVal][xVal - 2] = clone(clickedPiece)
                        newBoard[yVal][xVal - 1] = "NA"
                        if (!inCheck(newBoard, clickedPiece.team)) {
                            locations.push([xVal - 2, yVal, false])
                        }
                    }
                }
            }
        }
    }
    return locations;
}

function checkIfGameOver() {
    if (inCheckMate(!turn)) {
        if (turn) {
            alert("White wins by checkmate!")
            appendToMove("#")
            moveList.append("<tr><td>Game Over</td><td>1-0</td></tr>")
            pgnMetaValues["Result"] = "1-0"
            pgnText += "1-0"

        } else {
            alert("Black wins by checkmate!")
            appendToMove("#")
            moveList.append("<tr><td>Game Over</td><td>0-1</td></tr>")
            pgnMetaValues["Result"] = "0-1"
            pgnText += "0-1"
        }
        writePGN()
        return true;
    }
    else if (inStaleMate(!turn)) {
        alert("Stalemate!")
        moveList.append("<tr><td>Stalemate</td><td>1/2-1/2</td></tr>")
        pgnMetaValues["Result"] = "1/2-1/2"
        pgnText += "1/2-1/2"
        writePGN()
        return true;
    }
    else if (fiftyMoveRuleCountDown === 0) {
        alert("Draw! (50 move rule)")
        moveList.append("<tr><td>50 Move Rule</td><td>1/2-1/2</td></tr>")
        pgnMetaValues["Result"] = "1/2-1/2"
        pgnText += "1/2-1/2"
        writePGN()
        return true;
    } else {
        return false;
    }
}

function writePGN() {
    let output = ""
    pgnMeta.forEach(metaItem => {
        output += "[" + metaItem + " \"" + pgnMetaValues[metaItem] + "\"]\n"
    })
    output += "\n"
    output += pgnText
    pgnDownload = output
}

function inCheck(board, team) {
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (board[y][x] !== "NA" && board[y][x].piece === 'k' && board[y][x].team === team) {
                let vectors;
                //diagonal
                vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1]]
                if (checkRayCastVectorsForPieces(vectors, ['b', 'q'], board, team, [x, y])) {
                    return true;
                }
                //straight
                vectors = [[0, 1], [1, 0], [0, -1], [-1, 0]]
                if (checkRayCastVectorsForPieces(vectors, ['r', 'q'], board, team, [x, y])) {
                    return true;
                }
                //knight
                vectors = [[2, 1], [1, 2], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
                if (checkVectorsForPieces(vectors, ['n'], board, team, [x, y])) {
                    return true;
                }
                //king
                vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1], [0, 1], [1, 0], [0, -1], [-1, 0]]
                if (checkVectorsForPieces(vectors, ['k'], board, team, [x, y])) {
                    return true
                }
                (team) ? vectors = [[1, -1], [-1, -1]] : vectors = [[1, 1], [-1, 1]]
                if (checkVectorsForPieces(vectors, ['p'], board, team, [x, y])) {
                    return true
                }
            }
        }
    }
    return false;
}

function inCheckMate(team) {
    if (inCheck(chessBoard, team)) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (chessBoard[y][x] !== "NA" && chessBoard[y][x].team === team) {
                    let locations = legalMovesOfPiece(x, y, chessBoard[y][x])
                    for (let i = 0; i < locations.length; i++) {
                        let newBoard = clone(chessBoard)
                        newBoard[locations[i][1]][locations[i][0]] = clone(newBoard[y][x])
                        newBoard[y][x] = "NA"
                        if (locations[i].length === 3 && locations[i][2]) {
                            // ENPASSANT
                            newBoard[y][locations[i][0]] = "NA"
                        }
                        if (!inCheck(newBoard, team)) {
                            return false;
                        }
                    }
                }
            }
        }
    } else {
        return false;
    }
    return true;
}

function appendToMove(string) {
    let element = $("#move" + moveNum)
    element.text(element.text() + string)
    pgnText = pgnText.slice(0, -1);
    pgnText += string + " "
    writePGN()
}

function appendMoveToList(startingPos, newPosition, isEnpassant, promotionChoice = false) {
    let movedPiece = chessBoard[startingPos[1]][startingPos[0]]
    let text = ""
    if (movedPiece.piece === 'p') {
        //pawn move
        fiftyMoveRuleCountDown = 50
        if (chessBoard[newPosition[1]][newPosition[0]] !== 'NA' || isEnpassant) {
            // capture
            text = text.concat(chessNotation.x[startingPos[0]] + "x")
        }
        text = text.concat(chessNotation.x[newPosition[0]] + chessNotation.y[newPosition[1]])
        if (promotionChoice !== false) {
            text = text.concat("=" + promotionChoice[0].toUpperCase())
        }
    } else {
        if (movedPiece.piece === 'k' && Math.abs(startingPos[0] - newPosition[0]) === 2) {
            if (startingPos[0] > newPosition[0]) {
                // castle left
                text = "O-O-O"
            } else {
                // castle right
                text = "O-O"
            }
        } else {
            let sameX = false;
            let sameY = false;
            let piecesInDoubt = []
            // check if any other piece can the move
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    if (chessBoard[y][x] !== "NA" && chessBoard[y][x].code === movedPiece.code && (x !== startingPos[0] || y !== startingPos[1])) {
                        let moves = legalMovesOfPiece(x, y, chessBoard[y][x])
                        for (let i = 0; i < moves.length; i++) {
                            if (moves[i][0] === newPosition[0] && moves[i][1] === newPosition[1]) {
                                piecesInDoubt.push([x, y])
                            }
                        }
                    }
                }
            }
            if (piecesInDoubt.length > 0) {
                for (let i = 0; i < piecesInDoubt.length; i++) {
                    if (piecesInDoubt[i][0] === startingPos[0]) {
                        sameX = true
                    }
                    else if (piecesInDoubt[i][1] === startingPos[1]) {
                        sameY = true
                    }
                    else {
                        sameY = true
                    }
                }
            }
            text = text.concat(movedPiece.piece.toUpperCase())
            if (sameY) {
                text = text.concat(chessNotation.x[startingPos[0]])
            }
            if (sameX) {
                text = text.concat(chessNotation.y[startingPos[1]])
            }
            if (chessBoard[newPosition[1]][newPosition[0]] !== 'NA' || isEnpassant) {
                //capture
                fiftyMoveRuleCountDown = 50
                text = text.concat("x")
            }
            text = text.concat(chessNotation.x[newPosition[0]] + chessNotation.y[newPosition[1]])
        }
    }
    if (turn) {
        // white so new line
        pgnText += (moveNum / 2 + 1) + ". " + text + " "
        moveList.append("<tr>\n" +
            "   <td>" + (moveNum / 2 + 1) + "</td>\n" +
            "   <td onclick='goToMove(" + (moveNum + 1) + ")' id='move" + moveNum + "'>" + text + "</td>\n" +
            "   <td id='move" + (moveNum + 1) + "'></td>\n" +
            "</tr>")
    } else {
        //black turn so edit td - id moveNum
        pgnText += text + " "
        let element = $("#move" + moveNum)
        element.text(text)
        element.attr("onclick", "goToMove(" + (moveNum + 1) + ")")
    }
    writePGN()
}

function goToMove(moveNum) {
    drawCurrentBoard = false;
    drawBoard(boardAtMove[moveNum])
    $("#resume_game").show()
}

function inStaleMate(team) {
    if (!inCheck(chessBoard, team)) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (chessBoard[y][x] !== "NA" && chessBoard[y][x].team === team) {
                    let locations = legalMovesOfPiece(x, y, chessBoard[y][x])
                    for (let i = 0; i < locations.length; i++) {
                        let newBoard = clone(chessBoard)
                        newBoard[locations[i][1]][locations[i][0]] = clone(newBoard[y][x])
                        newBoard[y][x] = "NA"
                        if (locations[i].length === 3 && locations[i][2]) {
                            // ENPASSANT
                            newBoard[y][locations[i][0]] = "NA"
                        }
                        if (!inCheck(newBoard, team)) {
                            return false;
                        }
                    }
                }
            }
        }
    } else {
        return false;
    }
    return true;
}

function checkVectorsForPieces (vectors, pieces, board, team, coords) {
    for (let v = 0; v < vectors.length; v++) {
        // if in bounds
        if (coords[0] + vectors[v][0] >= 0 && coords[0] + vectors[v][0] <= 7 && coords[1] + vectors[v][1] >= 0 && coords[1] + vectors[v][1] <= 7) {
            if (board[coords[1] + vectors[v][1]][coords[0] + vectors[v][0]] !== "NA") {
                // if on other team
                if (team !== board[coords[1] + vectors[v][1]][coords[0] + vectors[v][0]].team) {
                    // if designated piece
                    for (let i = 0; i < pieces.length; i++) {
                        if (board[coords[1] + vectors[v][1]][coords[0] + vectors[v][0]].piece === pieces[i]) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function checkRayCastVectorsForPieces (vectors, pieces, board, team, coords) {
    for (let v = 0; v < vectors.length; v++) {
        let vectorToCalc = [vectors[v][0], vectors[v][1]]
        let validVector = true;
        while (validVector) {
            // if in bounds
            if (coords[0] + vectorToCalc[0] >= 0 && coords[0] + vectorToCalc[0] <= 7 && coords[1] + vectorToCalc[1] >= 0 && coords[1] + vectorToCalc[1] <= 7) {
                if (board[coords[1] + vectorToCalc[1]][coords[0] + vectorToCalc[0]] !== "NA") {
                    if (team === board[coords[1] + vectorToCalc[1]][coords[0] + vectorToCalc[0]].team) {
                        validVector = false;
                    } else if (team !== board[coords[1] + vectorToCalc[1]][coords[0] + vectorToCalc[0]].team) {
                        for (let i = 0; i < pieces.length; i++) {
                            if (board[coords[1] + vectorToCalc[1]][coords[0] + vectorToCalc[0]].piece === pieces[i]) {
                                return true;
                            }
                        }
                        validVector = false;
                    }
                }
            } else {
                validVector = false;
            }
            vectorToCalc[0] += vectors[v][0]
            vectorToCalc[1] += vectors[v][1]
        }
    }
    return false;
}

function getVectorsAbsolute(xVal, yVal, vectors, team) {
    let locations = []
    vectors.forEach(vector => {
        if (xVal + vector[0] >= 0 && xVal + vector[0] <= 7 && yVal + vector[1] >= 0 && yVal + vector[1] <= 7 && (chessBoard[yVal + vector[1]][xVal + vector[0]] === 'NA' || team !== chessBoard[yVal + vector[1]][xVal + vector[0]].team)) {
            locations.push([xVal + vector[0], yVal + vector[1]])
        }
    })
    return locations
}

function drawBoard(board = chessBoard) {
    piecesLayer.empty();
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (board[y][x] !== "NA") {
                if (!flipBoard) {
                    piecesLayer.append('<img id="piece' + x + y + '" onclick="pieceClicked(' + x + ', ' + y + ')" draggable="false" class="chess_piece" src="chessAssets/Chess_' + board[y][x].code + 't60.png" alt="K-L" style="top: ' + (y * 100) + 'px; left: ' + (x * 100) + 'px;">')
                } else {
                    piecesLayer.append('<img id="piece' + x + y + '" onclick="pieceClicked(' + x + ', ' + y + ')" draggable="false" class="chess_piece" src="chessAssets/Chess_' + board[y][x].code + 't60.png" alt="K-L" style="top: ' + ((7 - y) * 100) + 'px; left: ' + ((7 - x) * 100) + 'px;">')
                }
            }
        }
    }
}

function rayCastVectors(xVal, yVal, vectors, clickedPiece) {
    let locations = []
    for (let v = 0; v < vectors.length; v++) {
        let vectorToCalc = [vectors[v][0], vectors[v][1]]
        let validVector = true;
        while (validVector) {
            if (xVal + vectorToCalc[0] >= 0 && xVal + vectorToCalc[0] <= 7 && yVal + vectorToCalc[1] >= 0 && yVal + vectorToCalc[1] <= 7) {
                if (chessBoard[yVal + vectorToCalc[1]][xVal + vectorToCalc[0]] === 'NA') {
                    locations.push([xVal + vectorToCalc[0], yVal + vectorToCalc[1]])
                } else if (clickedPiece.team !== chessBoard[yVal + vectorToCalc[1]][xVal + vectorToCalc[0]].team) {
                    locations.push([xVal + vectorToCalc[0], yVal + vectorToCalc[1]])
                    validVector = false;
                } else {
                    validVector = false;
                }
            } else {
                validVector = false;
            }
            vectorToCalc[0] += vectors[v][0]
            vectorToCalc[1] += vectors[v][1]
        }
    }
    return locations;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj))
}

// keyboard input
window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
    }

    if (event.key === "ArrowLeft") {
        if (drawCurrentBoard) {
            showingBoard = moveNum - 1
        } else {
            showingBoard--
        }
        console.log(showingBoard)
        if (showingBoard >= 0) {
            goToMove(showingBoard)
        } else {
            showingBoard = 0
            goToMove(showingBoard)
        }
    }
    if (event.key === "ArrowRight") {
        if (!drawCurrentBoard) {
            showingBoard ++
            console.log(showingBoard)
            if (showingBoard === moveNum) {
                drawCurrentBoard = true;
                drawBoard()
                $('#resume_game').hide()
            } else {
                goToMove(showingBoard)
            }
        }
    }
}, true);

// Download function found on https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
