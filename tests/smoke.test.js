const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('index.js','utf8');

function has(x,msg){assert(src.includes(x),msg||('missing '+x))}
function no(x,msg){assert(!src.includes(x),msg||('unexpected '+x))}

// Parse/load-time safety
new vm.Script(src);
assert(/^\(function\(\)\{'use strict';/.test(src),'plugin must stay wrapped in strict IIFE');

// Current architecture
has("VERSION='0.7.6-ux'","unexpected plugin version");
has("Lampa.Component.add('anime_lite',Main)","main component not registered");
has("Lampa.Component.add('anime_lite_results',Results)","results component not registered");
has("new Lampa.InteractionMain","native Lampa navigation missing");
has("addMenu('Anime Lite'","sidebar menu missing");
has("menu__ico","sidebar icon missing");
has("anime_lite_ready_ux6","duplicate-init guard missing");

// API/auth safety
has("API='https://api.yani.tv'","Yani API missing");
has("'X-Application':APP","application header missing");
no("Authorization","personal Bearer auth must not be embedded");

// Refresh lifecycle
has("POLL=60000","poll interval must be 60 seconds");
has("setInterval(function(){draw(self,true)},POLL)","polling not wired");
has("clearInterval(timer)","polling cleanup missing");

// Features
has("/anime/'+encodeURIComponent(c.yani_id)+'/videos","video loading missing");
has("★ Авто — ","auto source selector missing");
has("PROVIDER_SCORE","provider ranking missing");
has("anime_lite_provider","persistent preferred provider setting missing");
has("function autoChoice(a,c)","smart auto-source chooser missing");
has("Авто выбрал: ","auto-source disclosure missing");
has("Приоритет источника","provider priority UI missing");
has("seen={auto:1}","dynamic available-provider filter missing");
has("Сохранённый источник сейчас не найден","missing unavailable preferred-provider fallback");
has("preferred.length","preferred provider fallback logic missing");
has("anime_lite_history","watch history storage missing");
has("Продолжить просмотр","continue watching rail missing");
has("function detailScreen(c,d)","cinema detail screen missing");
has("function textVal(x,keys)","object metadata normalizer missing");
has("function ratingVal(x)","rating normalizer missing");
has("height:38vh","compact hero height missing");
no("min-height:68vh","oversized old hero must not return");
has("anime-lite-hero","detail backdrop hero missing");
has("▶ Продолжить · серия ","resume action missing");
has("function search()","anime search missing");
has("/anime/genres","genres missing");
has("/anime/schedule","schedule missing");
has("function scheduleRows(schedule)","grouped schedule missing");
has("function toolsBar()","compact tools bar missing");
has("function openSchedule()","separate schedule screen missing");
has("anime_lite_schedule","schedule component missing");
has("anime-lite-tools","tools bar CSS missing");
has("POSTER_ACTIVE<2","poster fallback concurrency limit missing");
has("Расписание · ","dated schedule UI missing");
has("if(quiet&&self.empty)self.empty()","poll refresh must clear old rows");
no("scheduleRows(schedule).concat","schedule must not be mixed into home rows");
no("self.build([navRow()]","placeholder navigation cards must not be built");

// Posters and UI
has("api.jikan.moe/v4/anime","internet poster fallback missing");
has("anime-lite-badge--eps","episode badge missing");
has("anime-lite-badge--rating","rating badge missing");
has("anime-lite-badge--quality","quality badge missing");
has("function decorateRows(rootEl,rows)","post-build badge overlay missing");
has("decorateRows(self.render(),rows)","main poster badges not applied after render");
has("function qualityShort(q)","short quality formatter missing");
has("'4K'","4K quality label missing");
has("'FHD'","FHD quality label missing");
has("'HD'","HD quality label missing");
has("anime-lite-badge--done","completion badge missing");
has("anime-lite-badge--air","ongoing badge missing");
has("anime-lite-badge--season","season count badge missing");
has("seasons_count","season metadata missing");
has("next_date","next episode metadata missing");
has("СЕЗОН ЗАВЕРШЁН","completed season state missing");
has("ЗАВЕРШЁН","completed title state missing");
has("ОНГОИНГ","ongoing state missing");
has("aspect-ratio:2/3","cinema poster ratio missing");
has("backdrop-filter:none","heavy backdrop blur must stay disabled");

// Basic regression guards
assert(src.length<60000,'index.js unexpectedly large');
assert((src.match(/setInterval\(/g)||[]).length===1,'unexpected extra polling loops');

console.log('Anime Lite current smoke tests passed');
