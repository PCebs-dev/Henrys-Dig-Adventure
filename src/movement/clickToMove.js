import { findPath, pathToWorldWaypoints, worldToCell } from '../pathfinding/gridPathfind.js'

export function setupClickToMove(scene, { map, speed = 180 }) {
  scene.waypoints = []
  scene.waypointIndex = 0
  scene.moveSpeed = speed

  scene.setMoveTarget = (worldX, worldY, pendingDig = null) => {
    if (scene.revealActive || scene.isDigging) return

    const start = worldToCell(scene.player.x, scene.player.y, map.tileSize)
    let end = worldToCell(worldX, worldY, map.tileSize)

    if (end.col < 0 || end.row < 0 || end.col >= map.cols || end.row >= map.rows) return
    if (!map.walkGrid[end.row][end.col]) {
      end = findNearestWalkable(map, end)
      if (!end) return
    }

    const path = findPath(map.walkGrid, start, end)
    if (path.length === 0) return

    scene.waypoints = pathToWorldWaypoints(path, map.tileSize)
    if (scene.waypoints.length > 0) {
      scene.waypoints.shift()
    }
    scene.waypointIndex = 0
    scene.target.set(worldX, worldY)
    scene.pendingDig =
      pendingDig === undefined ? { x: worldX, y: worldY } : pendingDig
  }

  scene.updateClickToMove = () => {
    if (scene.revealActive || scene.isDigging) {
      scene.player.body.setVelocity(0, 0)
      return true
    }

    if (scene.waypoints.length === 0) {
      const dx = scene.target.x - scene.player.x
      const dy = scene.target.y - scene.player.y
      const d = Math.hypot(dx, dy)
      if (d < 8) {
        scene.player.body.setVelocity(0, 0)
        return false
      }
      scene.player.body.setVelocity((dx / d) * scene.moveSpeed, (dy / d) * scene.moveSpeed)
      return true
    }

    const wp = scene.waypoints[scene.waypointIndex]
    const dx = wp.x - scene.player.x
    const dy = wp.y - scene.player.y
    const d = Math.hypot(dx, dy)

    if (d < 8) {
      scene.waypointIndex++
      if (scene.waypointIndex >= scene.waypoints.length) {
        scene.waypoints = []
        scene.waypointIndex = 0
        scene.player.body.setVelocity(0, 0)
        return false
      }
      return true
    }

    scene.player.body.setVelocity((dx / d) * scene.moveSpeed, (dy / d) * scene.moveSpeed)
    return true
  }
}

function findNearestWalkable(map, target) {
  const maxR = Math.max(map.cols, map.rows)
  for (let r = 1; r <= maxR; r++) {
    for (let dr = -r; dr <= r; dr++) {
      for (let dc = -r; dc <= r; dc++) {
        const c = target.col + dc
        const row = target.row + dr
        if (c >= 0 && row >= 0 && c < map.cols && row < map.rows && map.walkGrid[row][c]) {
          return { col: c, row }
        }
      }
    }
  }
  return null
}
