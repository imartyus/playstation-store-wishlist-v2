import { getWishlist, updateBadge, updateWishlist } from './browserApi'
import type { WishlistItem } from '../types'

const priceQuery = "span[data-qa='mfeCtaMain#offer0#finalPrice']"
const ogPriceQuery = "span[data-qa='mfeCtaMain#offer0#originalPrice']"
const saleEndsQuery = "span[data-qa='mfeCtaMain#offer0#discountDescriptor']"
const nameQuery = 'h1'

export async function fetchAndScrapeUrl(url: string): Promise<WishlistItem> {
	try {
		const res = await fetch(url)
		const html = await res.text()
		const doc = htmlToElement(html) as HTMLElement
		const price = doc.querySelector(priceQuery) as HTMLElement
		const ogPrice = doc.querySelector(ogPriceQuery) as HTMLElement
		const saleEnds = doc.querySelector(saleEndsQuery) as HTMLElement
		const title = doc.querySelector(nameQuery) as HTMLElement

		return {
			title: title.innerText.trim(),
			price: price.innerText,
			ogPrice: ogPrice ? ogPrice.innerText : '',
			saleEnds: saleEnds ? saleEnds.innerText : '',
			url
		}
	} catch (err) {
		throw err
	}
}

function htmlToElement(html: string) {
	const template = document.createElement('template')
	html = html.trim() // Never return a text node of whitespace as the result
	template.innerHTML = html
	return template.content.cloneNode(true)
}

export async function refreshPriceData(): Promise<void> {
	return await new Promise((resolve) => {
		getWishlist(wishlist => {
			if (wishlist.items.length === 0) {
				return resolve()
			}

			const requests = wishlist.items.map(item => fetchAndScrapeUrl(item.url))

			Promise.allSettled(requests)
				.then(results => {
					const updatedItems = wishlist.items.map(item => {
						const updatedItem = results.find(el => el.status === 'fulfilled' && el.value.url === item.url)
						// @ts-expect-error
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
