import grassImg from '../assets/Maps/Top world/grass.png'
import groundImg from '../assets/Maps/Top world/ground.png'
import sandImg from '../assets/Maps/Top world/sand.png'
import rockImg from '../assets/Maps/Top world/rock.png'
import wallImg from '../assets/Maps/Top world/wall.png'
import waterImg from '../assets/Maps/Top world/water.png'
import woodImg from '../assets/Maps/Top world/wood.png'

import caveDirt from '../assets/Maps/Cave World/Dirt.png'
import caveWallDark from '../assets/Maps/Cave World/RockWall_Dark.png'
import caveWall from '../assets/Maps/Cave World/RockWall_Normal.png'
import caveWallEnd from '../assets/Maps/Cave World/RockWall_Normal_End.png'
import caveWallGrass from '../assets/Maps/Cave World/RockWall_wGrass.png'
import caveBoxed from '../assets/Maps/Cave World/Boxed_Stones.png'
import caveBoxedLight from '../assets/Maps/Cave World/Boxed_Stones_Light.png'
import caveOreEmerald from '../assets/Maps/Cave World/Ore_Emerald.png'
import caveOreRuby from '../assets/Maps/Cave World/Ore_Ruby.png'
import caveOreSapphire from '../assets/Maps/Cave World/Ore_Sapphires.png'

const TOP_FRAME = { frameWidth: 32, frameHeight: 32 }

const TOP_SHEETS = [
  ['top-grass', grassImg],
  ['top-ground', groundImg],
  ['top-sand', sandImg],
  ['top-rock', rockImg],
  ['top-wall', wallImg],
  ['top-water', waterImg],
  ['top-wood', woodImg],
]

const CAVE_IMAGES = [
  ['cave-dirt', caveDirt],
  ['cave-wall-dark', caveWallDark],
  ['cave-wall', caveWall],
  ['cave-wall-end', caveWallEnd],
  ['cave-wall-grass', caveWallGrass],
  ['cave-boxed', caveBoxed],
  ['cave-boxed-light', caveBoxedLight],
  ['cave-ore-emerald', caveOreEmerald],
  ['cave-ore-ruby', caveOreRuby],
  ['cave-ore-sapphire', caveOreSapphire],
]

export function preloadMapAssets(scene) {
  for (const [key, url] of TOP_SHEETS) {
    scene.load.spritesheet(key, url, TOP_FRAME)
  }
  for (const [key, url] of CAVE_IMAGES) {
    scene.load.image(key, url)
  }
}

export const TOP_TILE = {
  GRASS: 'grass',
  GROUND: 'ground',
  SAND: 'sand',
  ROCK: 'rock',
  WALL: 'wall',
  WATER: 'water',
  WOOD: 'wood',
}

export const CAVE_TILE = {
  DIRT: 'dirt',
  WALL_DARK: 'wall_dark',
  WALL: 'wall',
  WALL_END: 'wall_end',
  WALL_GRASS: 'wall_grass',
  BOXED: 'boxed',
  BOXED_LIGHT: 'boxed_light',
  ORE_EMERALD: 'ore_emerald',
  ORE_RUBY: 'ore_ruby',
  ORE_SAPPHIRE: 'ore_sapphire',
}

export function topTextureKey(type, frame = 0) {
  const map = {
    [TOP_TILE.GRASS]: 'top-grass',
    [TOP_TILE.GROUND]: 'top-ground',
    [TOP_TILE.SAND]: 'top-sand',
    [TOP_TILE.ROCK]: 'top-rock',
    [TOP_TILE.WALL]: 'top-wall',
    [TOP_TILE.WATER]: 'top-water',
    [TOP_TILE.WOOD]: 'top-wood',
  }
  return { key: map[type] ?? 'top-grass', frame }
}

export function caveTextureKey(type) {
  const map = {
    [CAVE_TILE.DIRT]: 'cave-dirt',
    [CAVE_TILE.WALL_DARK]: 'cave-wall-dark',
    [CAVE_TILE.WALL]: 'cave-wall',
    [CAVE_TILE.WALL_END]: 'cave-wall-end',
    [CAVE_TILE.WALL_GRASS]: 'cave-wall-grass',
    [CAVE_TILE.BOXED]: 'cave-boxed',
    [CAVE_TILE.BOXED_LIGHT]: 'cave-boxed-light',
    [CAVE_TILE.ORE_EMERALD]: 'cave-ore-emerald',
    [CAVE_TILE.ORE_RUBY]: 'cave-ore-ruby',
    [CAVE_TILE.ORE_SAPPHIRE]: 'cave-ore-sapphire',
  }
  return map[type] ?? 'cave-dirt'
}

export function isTopBlocked(type) {
  return type === TOP_TILE.ROCK || type === TOP_TILE.WALL || type === TOP_TILE.WATER
}

export function isCaveBlocked(type) {
  return (
    type === CAVE_TILE.WALL_DARK ||
    type === CAVE_TILE.WALL ||
    type === CAVE_TILE.WALL_END ||
    type === CAVE_TILE.WALL_GRASS
  )
}
