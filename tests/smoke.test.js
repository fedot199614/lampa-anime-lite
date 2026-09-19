const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('index.js','utf8');

function has(x,msg){assert(src.includes(x),msg||('missing '+x))}
function no(x,msg){assert(!src.includes(x),msg||('unexpected '+x))}

// Parse/load-time safety
new vm.Script(src);
assert(/^\(function\(\)\{'use strict';/.test(src),'plugin must stay wrapped in strict IIFE');

// Current architecture
has("VERSION='0.7.11-nav'","unexpected plugin version");
has("Lampa.Component.add('anime_lite',Main)","main component not registered");
has("Lampa.Component.add('anime_lite_results',Results)","results component not registered");
has("new Lampa.InteractionMain","native Lampa navigation missing");
has("addMenu('Anime Lite'","sidebar menu missing");
has("menu__ico","sidebar icon missing");
has("anime_lite_ready_panel11","duplicate-init guard missing");

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
has("anime_lite_voice","persistent preferred voice setting missing");
has("function autoChoice(a,c)","smart auto-source chooser missing");
has("Авто выбрал: ","auto-source disclosure missing");
has("Приоритетная озвучка","voice priority UI missing");
has("action:'voice'","voice action missing from detail panel");
has("seen={auto:'Авто — любая озвучка'}","dynamic available-voice filter missing");
has("Сохранённая озвучка сейчас недоступна","missing unavailable preferred-voice fallback");
has("preferred.length","preferred voice fallback logic missing");
has("anime_lite_history","watch history storage missing");
has("Продолжить просмотр","continue watching rail missing");
has("function detailScreen(c,d)","cinema detail screen missing");
has("function textVal(x,keys)","object metadata normalizer missing");
has("function ratingVal(x)","rating normalizer missing");
has("height:38vh","compact hero height missing");
no("function homeHero(host,c)","home must not contain detail hero");
no("function bindHero(host,rows)","home must not bind detail backdrop");
no("anime-lite-home-bg","home detail backdrop CSS must be removed");
has("anime-lite-chip","detail metadata chips missing");
has("anime-lite-action--primary","primary watch action missing");
no("min-height:68vh","oversized old hero must not return");
has("anime-lite-hero","detail backdrop hero missing");
has("<strong>Продолжить</strong>","resume action missing");
has("серия '+(hist.episode+1)","resume episode label missing");
has("function search()","anime search missing");
has("/anime/genres","genres missing");
has("/anime/schedule","schedule missing");
has("function scheduleRows(schedule)","grouped schedule missing");
has("function toolsBar()","compact tools bar missing");
has("anime-lite-tools items-line","tools must be a controller row");
has("anime-lite-tool card selector","tools must be controller cards");
has("function toolMenu()","remote-accessible tools menu missing");
no("addMenu('Поиск / Каталог'","duplicate sidebar tools entry must be removed");
has("focusKey","focus restoration state missing");
has("collectionSet(card)","focus restoration call missing");
has("naturalWidth","broken poster load verification missing");
has("function enrichCards(cards)","badge metadata enrichment missing");
has("function openSchedule()","separate schedule screen missing");
has("anime_lite_schedule","schedule component missing");
has("anime-lite-tools","tools bar CSS missing");
has("POSTER_ACTIVE<2","poster fallback concurrency limit missing");
has("Расписание · ","dated schedule UI missing");
no("if(quiet&&self.empty)self.empty()","polling must not trigger Lampa empty state");
has("body.find('.items-line').remove()","row refresh missing");
has("anime-lite-side-poster","right panel poster missing");
has("anime-lite-side-chips","right panel badges missing");
has("anime-lite-side-actions","right panel actions missing");
has("Lampa.Modal.open","visual right panel modal missing");
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
