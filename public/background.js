"use strict";function t(t){chrome.storage.sync.get(["wishlist"],(({wishlist:e})=>{e&&e.items?t(e):t({items:[],lastUpdated:null,sortBy:"title",sortOrder:"asc"})}))}function e(t,e,s){const r=t.split(e);if(r.length>1){return r[1].split(s)[0]}return null}chrome.alarms.create("wishlistPoll",{periodInMinutes:60}),chrome.alarms.onAlarm.addListener((function(){return new Promise((s=>{t((r=>{if(!r.items.length)return s();const n=r.items.map((t=>async function(t){try{const s=await fetch(t),r=await s.text(),n=e(r,'data-qa="mfe-game-title#name">',"</h1>"),a=e(r,'"discountedPrice":"','",'),i=e(r,'"originalPrice":"','",')||"";return{title:n,price:a,ogPrice:a===i?"":i,saleEnds:e(r,'data-qa="mfeCtaMain#offer0#discountDescriptor" class="psw-c-t-2">',"</span>")||"",url:t}}catch(t){throw t}}(t.url)));Promise.allSettled(n).then((e=>{const n=r.items.map((t=>{const s=e.find((e=>"fulfilled"===e.status&&e.value.url===t.url));return s?s.value:Object.assign(Object.assign({},t),{outdated:!0})})),a={items:n,lastUpdated:Date.now()};!function(t){const e=t.reduce(((t,e)=>e.ogPrice?t+1:t),0);chrome.action.setBadgeText({text:e?`${e}`:""}),chrome.action.setBadgeBackgroundColor({color:"#00439c"})}(n),async function(e,s=!1){return await new Promise((r=>{s?t((t=>{chrome.storage.sync.set({wishlist:Object.assign(Object.assign({},t),e)},(()=>{r()}))})):chrome.storage.sync.set({wishlist:e},(()=>{r()}))}))}(a,!0).then(s)})).catch((t=>{console.log("Data refresh error: ",t),s()}))}))}))}));
