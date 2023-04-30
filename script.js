import Grid, { clearScore } from "./Grid.js"
import Tile from "./Tile.js"

let gridSize = 6

const diffSelect = document.getElementById('diff-select')
const botButton = document.getElementById('bot')
const gameBoard = document.getElementById("game-board")

let lost = false

diffSelect.addEventListener('change', e => {
    const diff = e.target.value
    if (diff === 'easy') {
        gridSize = 6
    } else if (diff === 'medium') {
        gridSize = 5
    } else {
        gridSize = 4
    }
    grid = newGame()
    diffSelect.blur()
})

let grid = newGame()

botButton.addEventListener('click', async () => {
    grid = newGame()
    lost = false

    const id = setInterval(async () => {
        if (!lost) {
            if (canMoveUp()) {
                await moveUp()
            } else if (canMoveDown()) {
                await moveDown()
            } else if (canMoveLeft()) {
                await moveLeft()
            } else if (canMoveRight()) {
                await moveRight()
            } else {
                return
            }
            handleMove()
        } else {
            clearInterval(id)
        }
    }, 1000)
})

function newGame() {
    clearScore()
    gameBoard.replaceChildren()
    const grid = new Grid(gameBoard, gridSize)
    grid.randomEmptyCell().tile = new Tile(gameBoard)
    grid.randomEmptyCell().tile = new Tile(gameBoard)
    setupInput()
    return grid
}

function setupInput() {
    window.addEventListener("keydown", handleInput, { once: true })
}

async function handleInput(e) {
    switch (e.key) {
        case "ArrowUp":
            if (!canMoveUp()) {
                setupInput()
                return
            }
            await moveUp()
            break
        case "ArrowDown":
            if (!canMoveDown()) {
                setupInput()
                return
            }
            await moveDown()
            break
        case "ArrowLeft":
            if (!canMoveLeft()) {
                setupInput()
                return
            }
            await moveLeft()
            break
        case "ArrowRight":
            if (!canMoveRight()) {
                setupInput()
                return
            }
            await moveRight()
            break
        default:
            setupInput()
            return
    }

    handleMove()

    setupInput()
}

function handleMove() {
    grid.cells.forEach(cell => cell.mergeTiles())

    const newTile = new Tile(gameBoard)
    grid.randomEmptyCell().tile = newTile

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        lost = true
        newTile.waitForTransition(true).then(() => {
            alert("You lose")
        })
        return
    }
}

function moveUp() {
    return slideTiles(grid.cellsByColumn)
}

function moveDown() {
    return slideTiles(grid.cellsByColumn.map(column => [...column].reverse()))
}

function moveLeft() {
    return slideTiles(grid.cellsByRow)
}

function moveRight() {
    return slideTiles(grid.cellsByRow.map(row => [...row].reverse()))
}

function slideTiles(cells) {
    return Promise.all(
        cells.flatMap(group => {
            const promises = []
            for (let i = 1; i < group.length; i++) {
                const cell = group[i]
                if (cell.tile == null) continue
                let lastValidCell
                for (let j = i - 1; j >= 0; j--) {
                    const moveToCell = group[j]
                    if (!moveToCell.canAccept(cell.tile)) break
                    lastValidCell = moveToCell
                }

                if (lastValidCell != null) {
                    promises.push(cell.tile.waitForTransition())
                    if (lastValidCell.tile != null) {
                        lastValidCell.mergeTile = cell.tile
                    } else {
                        lastValidCell.tile = cell.tile
                    }
                    cell.tile = null
                }
            }
            return promises
        })
    )
}

function canMoveUp() {
    return canMove(grid.cellsByColumn)
}

function canMoveDown() {
    return canMove(grid.cellsByColumn.map(column => [...column].reverse()))
}

function canMoveLeft() {
    return canMove(grid.cellsByRow)
}

function canMoveRight() {
    return canMove(grid.cellsByRow.map(row => [...row].reverse()))
}

function canMove(cells) {
    return cells.some(group => {
        return group.some((cell, index) => {
            if (index === 0) return false
            if (cell.tile == null) return false
            const moveToCell = group[index - 1]
            return moveToCell.canAccept(cell.tile)
        })
    })
}