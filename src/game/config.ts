// Port of js/config.js:1 — numbers kept verbatim for parity. No THREE imports.
import type { AbilityDef, CareerUpgradeDef, GameMode, ShopItemDef, WeaponDef, ZombieKind, ZombieTypeDef } from './types'

export const WEAPONS: WeaponDef[] = [
  { id: 0, name: 'PISTOL', auto: false, dmg: 34, cd: 0.22, pellets: 1, spread: 0.012, mag: 12, reload: 1.1, range: 200, recoil: 0.02, sfx: 'pistol' },
  { id: 1, name: 'SMG', auto: true, dmg: 16, cd: 0.06, pellets: 1, spread: 0.03, mag: 32, reload: 1.4, range: 170, recoil: 0.012, sfx: 'smg' },
  { id: 2, name: 'SHOTGUN', auto: false, dmg: 11, cd: 0.72, pellets: 9, spread: 0.11, mag: 7, reload: 1.9, range: 85, recoil: 0.055, sfx: 'shotgun' },
  { id: 3, name: 'RIFLE', auto: true, dmg: 42, cd: 0.11, pellets: 1, spread: 0.014, mag: 25, reload: 1.6, range: 260, recoil: 0.03, sfx: 'rifle' },
  { id: 4, name: 'LMG', auto: true, dmg: 22, cd: 0.075, pellets: 1, spread: 0.035, mag: 80, reload: 2.4, range: 220, recoil: 0.018, sfx: 'smg' },
  { id: 5, name: 'SNIPER', auto: false, dmg: 150, cd: 1.1, pellets: 1, spread: 0.001, mag: 6, reload: 2.2, range: 400, recoil: 0.09, sfx: 'rifle' },
  { id: 6, name: 'CROSSBOW', auto: false, dmg: 90, cd: 0.9, pellets: 1, spread: 0.003, mag: 1, reload: 1.8, range: 300, recoil: 0.02, sfx: 'pistol' },
  { id: 7, name: 'FLAMER', auto: true, dmg: 8, cd: 0.05, pellets: 1, spread: 0.05, mag: 100, reload: 2.0, range: 40, recoil: 0.008, sfx: 'flamer' },
]

export const ABILITIES: AbilityDef[] = [
  { id: 'dmg', ico: '🔥', name: 'High Caliber', desc: '+25% bullet damage.' },
  { id: 'rof', ico: '⚡', name: 'Rapid Fire', desc: '+18% fire rate.' },
  { id: 'hp', ico: '❤️', name: 'Vitality', desc: '+30 max health & heal.' },
  { id: 'speed', ico: '🏃', name: 'Adrenaline', desc: '+13% move speed.' },
  { id: 'multi', ico: '🌀', name: 'Multishot', desc: '+1 pellet to all guns.' },
  { id: 'pierce', ico: '➡️', name: 'Piercing Rounds', desc: 'Bullets pierce +1 zombie.' },
  { id: 'head', ico: '🎯', name: 'Sharpshooter', desc: '+40% headshot damage.' },
  { id: 'vamp', ico: '🩸', name: 'Vampire', desc: 'Heal 3 HP per kill.' },
]

export const ZTYPES: Record<ZombieKind, ZombieTypeDef> = {
  normal: { hp: 60, speed: 1.7, scale: 1.0, color: 0x4a7a3a, dmg: 8, score: 10, cash: 8, groan: [60, 90] },
  runner: { hp: 32, speed: 3.4, scale: 0.85, color: 0xb6a23a, dmg: 6, score: 14, cash: 12, groan: [90, 130] },
  brute: { hp: 180, speed: 1.05, scale: 1.7, color: 0x7a2a2a, dmg: 18, score: 26, cash: 24, groan: [45, 70] },
  boss: { hp: 5000, speed: 2.0, scale: 2.8, color: 0x7a2a9a, dmg: 40, score: 200, cash: 220, groan: [40, 60] },
  spitter: { hp: 45, speed: 2.2, scale: 0.95, color: 0x3a9a5a, dmg: 10, score: 18, cash: 16, groan: [70, 110], ranged: true },
  exploder: { hp: 50, speed: 2.6, scale: 0.9, color: 0x9a4a2a, dmg: 26, score: 20, cash: 18, groan: [50, 80], boom: true },
  screamer: { hp: 70, speed: 1.5, scale: 1.1, color: 0x7a5a9a, dmg: 5, score: 30, cash: 26, groan: [120, 180], summon: true },
  shield: { hp: 220, speed: 1.0, scale: 1.5, color: 0x5a6a7a, dmg: 14, score: 32, cash: 28, groan: [40, 60], shielded: true },
  crawler: { hp: 40, speed: 2.9, scale: 1.0, color: 0x6a8a4a, dmg: 6, score: 16, cash: 13, groan: [70, 110] },
}

export const SHOP_ITEMS: ShopItemDef[] = [
  { id: 'medkit', name: 'Medkit', ico: '➕', desc: 'Heal 50 HP', cost: 150 },
  { id: 'nade', name: 'Grenades x3', ico: '💣', desc: '+3 grenades', cost: 120 },
  { id: 'dmg', name: 'Damage +10%', ico: '🔥', desc: 'Permanent +10% damage', cost: 200 },
  { id: 'rof', name: 'Fire Rate +8%', ico: '⚡', desc: 'Permanent +8% RoF', cost: 200 },
  { id: 'hp', name: 'Max HP +20', ico: '❤️', desc: '+20 max HP & heal', cost: 160 },
  { id: 'spd', name: 'Speed +8%', ico: '🏃', desc: '+8% move speed', cost: 160 },
  { id: 'unlock1', name: 'Unlock SMG', ico: '🔫', desc: 'Add SMG to loadout', cost: 300, once: true, key: 'w1' },
  { id: 'unlock2', name: 'Unlock Shotgun', ico: '🔫', desc: 'Add Shotgun to loadout', cost: 400, once: true, key: 'w2' },
  { id: 'unlock3', name: 'Unlock Rifle', ico: '🔫', desc: 'Add Rifle to loadout', cost: 500, once: true, key: 'w3' },
  { id: 'unlock4', name: 'Unlock LMG', ico: '🔫', desc: 'Add LMG to loadout', cost: 600, once: true, key: 'w4' },
  { id: 'unlock5', name: 'Unlock Sniper', ico: '🔫', desc: 'Add Sniper to loadout', cost: 700, once: true, key: 'w5' },
  { id: 'unlock6', name: 'Unlock Crossbow', ico: '🏹', desc: 'Add Crossbow to loadout', cost: 550, once: true, key: 'w6' },
  { id: 'unlock7', name: 'Unlock Flamethrower', ico: '🔥', desc: 'Add Flamethrower to loadout', cost: 800, once: true, key: 'w7' },
  { id: 'attSup', name: 'Suppressor', ico: '🔇', desc: '-40% recoil, quieter shots', cost: 400, once: true, key: 'sup' },
  { id: 'attScope', name: 'Tactical Scope', ico: '🔭', desc: 'Deeper aim zoom', cost: 450, once: true, key: 'scope' },
]

export const CAREER_UPGRADES: CareerUpgradeDef[] = [
  { id: 'health', name: 'Toughness', ico: '❤️', desc: '+20 starting HP', max: 5, cost: (l) => 200 + l * 150 },
  { id: 'cash', name: 'War Chest', ico: '💰', desc: '+100 starting cash', max: 5, cost: (l) => 150 + l * 100 },
  { id: 'grenades', name: 'Demo Man', ico: '💣', desc: '+1 starting grenade', max: 3, cost: (l) => 250 + l * 200 },
  { id: 'rifle', name: 'Veteran', ico: '🎖️', desc: 'Start with Rifle unlocked', max: 1, cost: () => 600 },
]

export const MODES: Record<GameMode, { ico: string; name: string; desc: string }> = {
  endless: { ico: '♾️', name: 'ENDLESS HORDE', desc: 'Survive escalating waves as long as you can.' },
  time: { ico: '⏱️', name: 'TIME ATTACK', desc: 'Survive 3 minutes. Score big before time runs out.' },
  bossrush: { ico: '👹', name: 'BOSS RUSH', desc: 'A boss every wave. How many can you down?' },
  defense: { ico: '🛡️', name: 'WAVE DEFENSE', desc: 'Protect the beacon from the horde.' },
  sandbox: { ico: '🧪', name: 'SANDBOX', desc: 'God mode + spawn menu (T). No challenge, all chaos.' },
}
