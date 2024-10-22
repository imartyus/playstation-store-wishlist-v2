import { getWishlist, updateBadge, updateWishlist } from './browserApi'
import type { WishlistItem } from '../types'

function pickBetween(input: string, start: string, end: string) {
	const parsed_1 = input.split(start)
	if (parsed_1.length > 1) {
		const parsed_2 = parsed_1[1].split(end)
		return parsed_2[0]
	}
	return null
}

export async function fetchAndScrapeUrl(url: string): Promise<WishlistItem> {
	try {
		const res = await fetch(url)
		const html = await res.text()
		const title = pickBetween(html, 'data-qa="mfe-game-title#name">', '</h1>') || pickBetween(html, '<h1 class="game-title">', '</h1>')
		const price = pickBetween(html, '"discountedPrice":"', '",')
		const ogPrice = pickBetween(html, '"originalPrice":"', '",') || ''
		const saleEnds = pickBetween(html, 'data-qa="mfeCtaMain#offer0#discountDescriptor" class="psw-c-t-2">', '</span>') || ''

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

export function refreshPriceData(): Promise<void> {
	return new Promise((resolve) => {
		getWishlist(wishlist => {
			if (!wishlist.items.length) {
				return resolve()
			}

			const requests = wishlist.items.map(item => fetchAndScrapeUrl(item.url))

			Promise.allSettled(requests)
				.then(results => {
					const updatedItems = wishlist.items.map(item => {
						const updatedItem = results.find(el => el.status === 'fulfilled' && el.value.url === item.url)
						// @ts-ignore
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
