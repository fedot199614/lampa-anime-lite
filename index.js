(function(){'use strict';
var VERSION='0.3.0',API='https://api.yani.tv',APP='p6_gpujl6d3pho8n',POLL=60000;
function req(path){return fetch(API+path,{headers:{'X-Application':APP,Accept:'application/json',Lang:'ru'}}).then(function(r){if(!r.ok)throw Error('API '+r.status);return r.json()})}
function root(p){return p&&p.response!==undefined?p.response:p}
function arr(p){var r=root(p);return Array.isArray(r)?r:(r&&(r.anime||r.results||r.items||r.data))||[]}
function val(o,keys){for(var i=0;i<keys.length;i++){var x=o&&o[keys[i]];if(x!==undefined&&x!==null&&x!=='')return x}return ''}
function animeId(x){return val(x,['anime_id','animeId','id'])||(x&&x.anime&&val(x.anime,['anime_id','id']))}
function title(x){return val(x,['title','anime_title','title_ru','name','russian','title_en'])||(x&&x.anime&&title(x.anime))||'Без названия'}
function poster(x){var p=val(x,['poster','image','img','cover']);if(!p&&x&&x.anime)p=poster(x.anime);if(p&&typeof p==='object')p=val(p,['huge','mega','big','large','fullsize','full','medium','small','original','url']);p=String(p||'');return p.indexOf('//')===0?'https:'+p:p}
function toCard(x){return {title:title(x),name:title(x),poster:poster(x),img:poster(x),release_date:val(x,['year','release_year']),yani_id:animeId(x),yani_raw:x}}
function note(s){if(Lampa.Noty)Lampa.Noty.show(s)}
function select(name,items,cb){Lampa.Select.show({title:name,items:items,onSelect:cb,onBack:function(){Lampa.Controller.toggle('content')}})}
function videoList(p){var r=root(p);return Array.isArray(r)?r:(r&&(r.videos||r.items))||[]}
function data(v){var d=v&&v.data||{};if(typeof d==='string'){try{d=JSON.parse(d)}catch(e){d={}}}return d||{}}
function voice(v){var d=data(v);return d.dubbing||d.translation||v.dub_title||v.dubbing||'Без указания озвучки'}
function source(v){var d=data(v);return d.player||v.player_title||v.player||d.player_id||'Источник'}
function episode(v){return String(v.number||v.episode||v.index||v.ep_title||'?')}
function mediaUrl(v){var d=data(v),u=v.stream_url||v.file||v.src||d.stream_url||d.file||d.src||'';if(/\.(m3u8|mpd|mp4|webm)(?:[?#].*)?$/i.test(String(u)))return u;return ''}
function iframeUrl(v){var d=data(v);return v.iframe_url||v.player_url||v.url||d.iframe_url||d.player_url||d.url||''}
function play(card,v){var u=mediaUrl(v);if(u){Lampa.Player.play({url:u,title:card.title+' · '+episode(v)+' серия'});Lampa.Player.playlist([{url:u,title:card.title}]);return}
 var frame=iframeUrl(v);var s=source(v);note(frame?'Источник «'+s+'» требует преобразования потока':'У источника нет ссылки на поток')}
function openVideos(card){note('Загружаю серии…');req('/anime/'+encodeURIComponent(card.yani_id)+'/videos').then(function(p){var list=videoList(p);if(!list.length)return note('Для этого аниме пока нет видео');
 var voices={};list.forEach(function(v){var k=voice(v);(voices[k]=voices[k]||[]).push(v)});
 var vi=Object.keys(voices).map(function(k){return {title:k,subtitle:voices[k].length+' вариантов',key:k}});
 select('Озвучка · '+card.title,vi,function(ch){var vl=voices[ch.key],eps={};vl.forEach(function(v){var k=episode(v);(eps[k]=eps[k]||[]).push(v)});
  var ei=Object.keys(eps).sort(function(a,b){return parseFloat(a)-parseFloat(b)}).map(function(k){return {title:k+' серия',key:k}});
  select(ch.title,ei,function(e){var options=eps[e.key].map(function(v){return {title:source(v),subtitle:val(v,['quality'])||'',video:v}});
   if(options.length===1)return play(card,options[0].video);select(e.title,options,function(o){play(card,o.video)})});
 })}).catch(function(){note('Не удалось загрузить видео')})}
function row(name,items){var seen={};return {title:name,results:(items||[]).map(toCard).filter(function(c){var k=String(c.yani_id||'');if(!k||seen[k])return false;seen[k]=1;return true}).slice(0,18),nomore:true,card_events:{onEnter:function(t,c){openVideos(c)}}}}
function feedRows(feed,catalog,schedule){var f=root(feed)||{},newItems=Array.isArray(f.new)?f.new:[],videos=Array.isArray(f.new_videos)?f.new_videos:[],cols=Array.isArray(f.collections)?f.collections:[];
 var latestVideos=videos.map(function(x){return x.anime&&typeof x.anime==='object'?Object.assign({},x.anime,{anime_id:animeId(x),title:title(x),poster:poster(x)}):x});
 var rows=[row('Новые релизы',newItems.length?newItems:catalog),row('Новые переводы',latestVideos),row('Сейчас выходит',arr(schedule))];
 if(cols.length){var ca=[];cols.forEach(function(c){(c.animes||[]).slice(0,8).forEach(function(a){ca.push(a)})});if(ca.length)rows.push(row('Подборки',ca))}
 return rows.filter(function(r){return r.results.length})}
function loadRows(){return Promise.all([req('/feed').catch(function(){return {}}),req('/anime?limit=18'),req('/anime/schedule')]).then(function(x){return feedRows(x[0],arr(x[1]),x[2])})}
function Component(object){var comp=new Lampa.InteractionMain(object),timer=null,last='';
 function render(self,quiet){loadRows().then(function(rows){var sig=JSON.stringify(rows.map(function(r){return [r.title,r.results.map(function(c){return c.yani_id})]}));if(quiet&&sig===last)return;last=sig;self.build(rows);self.render().addClass('anime-lite-v3');if(self.activity&&self.activity.loader)self.activity.loader(false)}).catch(function(e){console.error('[Anime Lite]',e);if(!quiet){if(self.activity&&self.activity.loader)self.activity.loader(false);note('Не удалось загрузить Anime Lite')}})}
 comp.create=function(){var self=this;if(this.activity&&this.activity.loader)this.activity.loader(true);render(this,false);timer=setInterval(function(){render(self,true)},POLL);return this.render()};
 var oldDestroy=comp.destroy;comp.destroy=function(){if(timer){clearInterval(timer);timer=null}if(oldDestroy)return oldDestroy.apply(this,arguments)};
 return comp}
function css(){if(document.getElementById('anime-lite-style'))return;var s=document.createElement('style');s.id='anime-lite-style';s.textContent='.anime-lite-v3{background:#0d0f14!important}.anime-lite-v3 .scroll__body{padding-top:1.1em}.anime-lite-v3 .items-line{margin-bottom:1.7em}.anime-lite-v3 .items-line__title{font-size:1.35em;font-weight:800;letter-spacing:.01em}.anime-lite-v3 .card__view{border-radius:.75em;overflow:hidden;box-shadow:0 .3em 1.2em rgba(0,0,0,.28)!important}.anime-lite-v3 .card.focus .card__view{outline:.18em solid #fff;outline-offset:.12em;transform:scale(1.035)}.anime-lite-v3 .card.focus .card__title{font-weight:700}.anime-lite-v3,.anime-lite-v3 *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.anime-lite-v3 .card,.anime-lite-v3 .card__view{transition:transform .12s ease!important}';document.head.appendChild(s)}
function menu(){if(document.querySelector('.anime-lite-menu'))return;var b=$('<li class="menu__item selector anime-lite-menu"><div class="menu__text">Anime Lite</div></li>');b.on('hover:enter',function(){Lampa.Activity.push({url:'anime-lite',title:'Anime Lite',component:'anime_lite',page:1})});$('.menu .menu__list').eq(0).append(b)}
function start(){if(window.anime_lite_ready_v3)return;window.anime_lite_ready_v3=true;css();Lampa.Component.add('anime_lite',Component);Lampa.Manifest.plugins={type:'video',version:VERSION,name:'Anime Lite',description:'Лёгкий современный клиент Yani',component:'anime_lite'};if(window.appready)menu();else Lampa.Listener.follow('app',function(e){if(e.type==='ready')menu()})}
if(window.Lampa)start()})();