import { getWishlist, updateBadge, updateWishlist } from './browserApi'
import { NUMERIC_REGEXP } from '../constants'
import type { WishlistItem } from '../types'

function pickBetween (input: string, start: string, end: string) {
  const parsed_1 = input.split(start)
  if (parsed_1.length > 1) {
    // const parsed_2 = parsed_1[1].split(end)
    // Try multiple in case there's Game Trial
    return parsed_1[1]?.split(end)[0] || parsed_1[2]?.split(end)[0]
  }
  return null
}

function getPrice (html: string) {
  const attempts = [1, 2, 3, 4] // Try indices 1, 2, 3, 4 after splitting

  for (const attemptIndex of attempts) {
    const parsed_1 = html.split('"discountedPrice":"')

    if (parsed_1.length > attemptIndex) {
      const parsed_2 = parsed_1[attemptIndex]?.split('",')
      const candidate = parsed_2[0]

      if (candidate && Boolean(candidate.match(NUMERIC_REGEXP))) {
        return candidate
      }
    }
  }
  return null
}

export async function fetchAndScrapeUrl (url: string): Promise<WishlistItem> {
  try {
    const res = await fetch(url)
    const html = await res.text()
    const title = pickBetween(html, 'data-qa="mfe-game-title#name">', '</h1>') || pickBetween(html, '<h1 class="game-title">', '</h1>')
    const price = getPrice(html)
    const ogPrice = pickBetween(html, '"originalPrice":"', '",') || ''
    const saleEnds = pickBetween(html, 'data-qa="mfeCtaMain#offer0#discountDescriptor" class="psw-c-t-2">', '</span>') || pickBetween(html, 'data-qa="mfeCtaMain#offer1#discountDescriptor" class="psw-c-t-2">', '</span>') || ''

    // const nextData = pickBetween(html, '<script id="__NEXT_DATA__" type="application/json">', '</script>')

    return {
      title,
      price,
      ogPrice: price === ogPrice ? '' : ogPrice,
      saleEnds,
      url
    }
  } catch (err) {
    throw err
  }
}

export async function refreshPriceData (): Promise<void> {
  return await new Promise((resolve) => {
    getWishlist(wishlist => {
      if (wishlist.items.length === 0) {
        return resolve()
      }

      const requests = wishlist.items.map(async item => await fetchAndScrapeUrl(item.url))

      Promise.allSettled(requests)
        .then(results => {
          const updatedItems = wishlist.items.map(item => {
            const updatedItem = results.find(el => el.status === 'fulfilled' && el.value.url === item.url)
            return updatedItem ? updatedItem.value : { ...item, outdated: true }
          })

          const newWishlist = {
            items: updatedItems,
            lastUpdated: Date.now()
          }
          updateBadge(updatedItems)
          updateWishlist(newWishlist, true).then(resolve)
        })
        .catch(err => {
          console.log('Data refresh error: ', err)
          resolve()
        })
    })
  })
}
