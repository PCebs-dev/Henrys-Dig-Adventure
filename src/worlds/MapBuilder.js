import {
  topTextureKey,
  caveTextureKey,
  isTopBlocked,
  isCaveBlocked,
} from './mapAssets.js'

export function buildTopWorldMap(scene, layout) {
  return buildMap(scene, layout, { mode: 'top' })
}

export function buildCaveWorldMap(scene, layout) {
  return buildMap(scene, layout, { mode: 'cave' })
}

function buildMap(scene, layout, { mode }) {
  const { cols, rows, tileSize, grid, walkGrid, spawnCol, spawnRow, oreBonus } = layout
  const worldW = cols * tileSize
  const worldH = rows * tileSize

  const groundLayer = scene.add.layer()
  const decorLayer = scene.add.layer()
  const obstacles = scene.physics.add.staticGroup()

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col]
      const x = col * tileSize + tileSize / 2
      const y = row * tileSize + tileSize / 2
      let sprite

      if (mode === 'top') {
        const { key, frame } = topTextureKey(cell.type, cell.frame ?? 0)
        sprite = scene.add.sprite(x, y, key, frame)
        sprite.setDepth(y)
        if (isTopBlocked(cell.type)) {
          obstacles.add(sprite)
          sprite.body.setSize(tileSize - 4, tileSize - 4)
        } else {
          groundLayer.add(sprite)
        }
      } else {
        const key = caveTextureKey(cell.type)
        sprite = scene.add.image(x, y, key)
        sprite.setDepth(y)
        if (isCaveBlocked(cell.type)) {
          obstacles.add(sprite)
          sprite.body.setSize(tileSize - 8, tileSize - 8)
        } else {
          groundLayer.add(sprite)
          if (cell.type.includes('ore')) {
            scene.tweens.add({
              targets: sprite,
              alpha: 0.75,
              duration: 600,
              yoyo: true,
              repeat: -1,
            })
          }
        }
      }
    }
  }

  return {
    worldW,
    worldH,
    tileSize,
    cols,
    rows,
    walkGrid,
    obstacles,
    spawnX: spawnCol * tileSize + tileSize / 2,
    spawnY: spawnRow * tileSize + tileSize / 2,
    oreBonus,
    isWalkableAt(wx, wy) {
      const c = Math.floor(wx / tileSize)
      const r = Math.floor(wy / tileSize)
      if (r < 0 || c < 0 || r >= rows || c >= cols) return false
      return walkGrid[r][c]
    },
    isOreAt(wx, wy) {
      const c = Math.floor(wx / tileSize)
      const r = Math.floor(wy / tileSize)
      return oreBonus.has(`${c},${r}`)
    },
  }
}
