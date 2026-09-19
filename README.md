# Lampa Anime Lite

Experimental lightweight Lampa anime client optimized for low-memory Android TV boxes.

## Install

Add this URL in Lampa → Extensions:

`https://cdn.jsdelivr.net/gh/fedot199614/lampa-anime-lite@main/index.js`

Immediate/raw URL:

`https://raw.githubusercontent.com/fedot199614/lampa-anime-lite/main/index.js`

## Goals

- TV-remote-first catalog
- no backdrop, blur, dashboard animations, account sync or background refresh
- lazy video loading
- bounded rendering (24 catalog cards / 30 detected direct streams)
- direct HLS/MP4/WebM/DASH playback when exposed by the upstream response

This is an independent experimental client, not the official YummyAnime plugin. It uses the public Yani API application header documented by the official client. Availability and permission for third-party use remain controlled by the API operator.

## Limitations

Protected iframe-only sources cannot be played directly by Lampa. No account/login features in v0.1.0.
