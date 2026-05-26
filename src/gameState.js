import { CRYSTAL_TYPES } from './systems/LootTables.js'

export function createInitialGameState() {
  const gems = { extraDig: 0 }
  for (const c of CRYSTAL_TYPES) gems[c.key] = 0

  return {
    digsMax: 25,
    digsLeft: 25,
    score: 0,
    gems,
    health: 3,
    healthMax: 3,
  }
}

export function addScore(state, points) {
  state.score += points
}

export function addGem(state, gemKey, count = 1) {
  if (!state.gems[gemKey]) state.gems[gemKey] = 0
  state.gems[gemKey] += count
}

export function resetDigs(state) {
  state.digsLeft = state.digsMax
}

export function consumeDig(state) {
  if (state.digsLeft <= 0) return false
  state.digsLeft -= 1
  return true
}

export function ensureHealth(state) {
  if (state.healthMax == null) state.healthMax = 3
  if (state.health == null) state.health = state.healthMax
  return state.health
}

export function takeDamage(state, amount = 1) {
  ensureHealth(state)
  state.health = Math.max(0, state.health - amount)
  return state.health
}

export function isAlive(state) {
  return state.health > 0
}
