import { Context } from 'hono'

// Types for card and hand
export type Card = {
  number: number // 1 = Ace, 11 = Jack, 12 = Queen, 13 = King, 2-10 = normal
  suite: string // e.g., 'hearts', 'diamonds', 'clubs', 'spades'
}

export type PokDengRequest = {
  playHands: Card[][]
  gameType: 1 | 2
}

export type PokDengResponse = {
  decisions: ('hit' | 'stand')[]
}

// Simple Pok Deng logic: stand if sum >= 6, else hit
function getHandValue(cards: Card[]): number {
  // Pok Deng: only last digit of sum counts, face cards = 0, Ace = 1
  let sum = 0
  for (const card of cards) {
    if (card.number >= 10) sum += 0
    else sum += card.number
  }
  return sum % 10
}

function isPok(value: number): boolean {
  return value === 8 || value === 9
}

function canBecomeTong(cards: Card[]): boolean {
  return cards.every((c) => c.number === cards[0].number)
}

function canBecomeSamLueang(cards: Card[]): boolean {
  return cards.every((c) => c.number >= 11 && c.number <= 13)
}

function canBecomeFlush(cards: Card[]): boolean {
  return cards[0].suite === cards[1].suite
}

function canBecomeStraight(cards: Card[]): boolean {
  const nums = cards.map((c) => c.number).sort((a, b) => a - b)
  // Ace is only low: [1,2], [2,3], ..., [12,13]
  if (nums[0] === 1 && nums[1] === 2) return true
  if (nums[1] - nums[0] === 1 && nums[0] !== 1) return true
  return false
}

export function pokDengDecision(playHands: Card[][]): ('hit' | 'stand')[] {
  return playHands.map((cards) => {
    const value = getHandValue(cards)
    // Always stand if Pok (8 or 9 with two cards)
    if (isPok(value)) {
      return 'stand'
    }

    if (
      canBecomeTong(cards) ||
      canBecomeSamLueang(cards) ||
      canBecomeFlush(cards) ||
      canBecomeStraight(cards)
    ) {
      return 'hit'
    }

    return value >= 6 ? 'stand' : 'hit'
  })
}

export function pokDengDecisionGame2(playHands: Card[][]): ('hit' | 'stand')[] {
  // Placeholder: currently uses same logic as normal, but can be extended to use knownHands
  return pokDengDecision(playHands)
}

export async function pokDengHandler(c: Context) {
  const body = await c.req.json<PokDengRequest>()
  let decisions: ('hit' | 'stand')[]
  if (body.gameType === 2) {
    decisions = pokDengDecisionGame2(body.playHands)
  } else {
    decisions = pokDengDecision(body.playHands)
  }
  return c.json({ decisions })
}
