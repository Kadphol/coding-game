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
    return 'hit'

    // if (
    //   canBecomeTong(cards) ||
    //   canBecomeSamLueang(cards) ||
    //   canBecomeFlush(cards) ||
    //   canBecomeStraight(cards)
    // ) {
    //   return 'hit'
    // }

    // return value >= 6 ? 'stand' : 'hit'
  })
}

function getFullDeck(): Card[] {
  const deck: Card[] = []
  const suites = ['hearts', 'diamonds', 'clubs', 'spades']
  for (const suite of suites) {
    for (let number = 1; number <= 13; number++) {
      deck.push({ number, suite })
    }
  }
  return deck
}

function isCardEqual(a: Card, b: Card): boolean {
  return a.number === b.number && a.suite === b.suite
}

export function pokDengDecisionGame2(playHands: Card[][]): ('hit' | 'stand')[] {
  // Flatten all playHands to get used cards
  const usedCards: Card[] = playHands.flat()
  const fullDeck = getFullDeck()
  // Remove used cards from deck
  const remainingDeck = fullDeck.filter(
    (deckCard) => !usedCards.some((used) => isCardEqual(deckCard, used))
  )

  return playHands.map((cards) => {
    const value = getHandValue(cards)
    if (isPok(value)) {
      return 'stand'
    }
    // Calculate if any special hand is still possible
    let canHitSpecial = false
    // Tong: need a third card matching number
    if (!canHitSpecial && canBecomeTong(cards)) {
      const needed = cards[0].number
      canHitSpecial = remainingDeck.some((card) => card.number === needed)
    }
    // Sam Lueang: need a third face card
    if (!canHitSpecial && canBecomeSamLueang(cards)) {
      canHitSpecial = remainingDeck.some(
        (card) => card.number >= 11 && card.number <= 13
      )
    }
    // Flush: need a third matching suite
    if (!canHitSpecial && canBecomeFlush(cards)) {
      const needed = cards[0].suite
      canHitSpecial = remainingDeck.some((card) => card.suite === needed)
    }
    // Straight: need a third card to form a valid straight
    if (!canHitSpecial && canBecomeStraight(cards)) {
      const nums = cards.map((c) => c.number).sort((a, b) => a - b)
      let neededNum: number | null = null
      // Ace is only low
      if (nums[0] === 1 && nums[1] === 2) neededNum = 3
      else if (nums[1] - nums[0] === 1 && nums[0] !== 1) {
        // [x, x+1] -> need x-1 or x+2 (but only if in 1-13)
        if (nums[0] > 1) neededNum = nums[0] - 1
        else if (nums[1] < 13) neededNum = nums[1] + 1
      }
      if (neededNum && neededNum >= 1 && neededNum <= 13) {
        canHitSpecial = remainingDeck.some((card) => card.number === neededNum)
      }
    }
    if (canHitSpecial) return 'hit'
    return value >= 6 ? 'stand' : 'hit'
  })
}

export async function pokDengHandler(c: Context) {
  const body = await c.req.json<PokDengRequest>()
  let decisions: ('hit' | 'stand')[]
  if (body.gameType === 2) {
    decisions = pokDengDecisionGame2(body.playHands)
  } else {
    decisions = pokDengDecision(body.playHands)
  }
  return c.json(decisions)
}
