<script lang="ts">
	import Wishlist from "./Wishlist.svelte";
	import { onMount } from "svelte";
	import {
		isOnStoreUrl,
		getWishlist,
		updateWishlist,
	} from "./helpers/browserApi";
	import {
		fetchAndScrapeUrl,
		refreshPriceData,
	} from "./helpers/pageScraping";
	import orderBy from "lodash.orderby";

	let onStoreUrl: string;
	let onStoreAlreadyAdded: boolean;
	let loading: boolean;
	let gameList = [];
	let sortBy: "title" | "price";
	let sortOrder: "asc" | "desc";
	let lastUpdated: string;
	let refreshing: boolean;

	function getSortedList(_sortBy, _sortOrder, _list) {
		const NUMERIC_REGEXP = /[-]{0,1}[\d]*[.]{0,1}[\d]+/g; // extract price number

		const sort = (item) => {
			if (_sortBy === "price") {
				return parseInt(item.price.match(NUMERIC_REGEXP)[0]);
			}
			return item[_sortBy];
		};

		return orderBy(_list, sort, _sortOrder);
	}

	function addGameFromTab() {
		getWishlist((wishlist) => {
			loading = true;
			fetchAndScrapeUrl(onStoreUrl)
				.then((gameData) => {
					if (gameData) {
						wishlist.items.push(gameData);
						gameList = getSortedList(sortBy, sortOrder, [
							...gameList,
							gameData,
						]);
						updateWishlist(wishlist);
						onStoreAlreadyAdded = true;
					}
					loading = false;
				})
				.catch((err) => {
					console.log("Error in adding from tab: ", err);
				});
		});
	}

	async function manualRefresh() {
		refreshing = true;
		await refreshPriceData();
		refreshing = false;
		initWishlist();
	}

	function initWishlist() {
		getWishlist((wishlist) => {
			sortBy = wishlist.sortBy || "title";
			sortOrder = wishlist.sortOrder || "asc";
			gameList = wishlist.items;
			lastUpdated = wishlist.lastUpdated
				? new Date(wishlist.lastUpdated).toLocaleString()
				: "";

			isOnStoreUrl((currentUrl, isStoreUrl) => {
				if (isStoreUrl) {
					const existingGame = wishlist.items.find(
						(item) => item.url === currentUrl,
					);
					onStoreUrl = currentUrl;
					onStoreAlreadyAdded = !!existingGame;
				}
			});
		});
	}

	onMount(initWishlist);

	$: gameList = getSortedList(sortBy, sortOrder, gameList);
</script>

<main>
	{#if !onStoreUrl}
		<section class="info-block">
			Open this extension on a PlayStation Store product page to add it to
			the Wishlist
		</section>
	{:else}
		<section>
			<button
				class="btn btn-add"
				disabled={loading || onStoreAlreadyAdded}
				on:click={addGameFromTab}
			>
				{loading
					? "Adding!"
					: onStoreAlreadyAdded
						? "Already in Wishlist"
						: "Add this game to Wishlist"}
			</button>
		</section>
	{/if}
	<img class="logo" src="ps-icon-128.png" alt="" />
	{#if gameList.length}
		<Wishlist bind:gameList bind:sortBy bind:sortOrder />
		<section class="bottom-actions">
			<div>
				<button
					class="manual-refresh-button"
					on:click={manualRefresh}
					disabled={refreshing}
				>
					{refreshing ? "Refreshing..." : "Refresh prices 🔄"}
				</button>
				{#if lastUpdated}
					<div class="last-updated">
						Last updated: <span>{lastUpdated}</span>
					</div>
				{/if}
			</div>
		</section>
	{/if}
</main>

<style>
	.logo {
		position: absolute;
		top: 5px;
		right: 55px;
		height: 80px;
	}

	.info-block {
		font-size: 16px;
		border: 1px solid;
		width: 306px;
		padding: 10px;
		color: var(--color-gray);
	}

	.btn-add {
		padding: 12px;
	}

	/* .error-msg {
  color: var(--color-error);
  font-size: 13px;
  margin-left: 8px;
} */

	/* .warn-msg {
  color: var(--color-warn);
  font-size: 13px;
  margin-left: 8px;
} */

	.last-updated {
		float: right;
		margin-right: 40px;
	}

	.bottom-actions {
		color: var(--color-gray);
		padding-top: 18px;
	}

	.manual-refresh-button {
		background: none;
		color: inherit;
		border: none;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
	}
</style>
