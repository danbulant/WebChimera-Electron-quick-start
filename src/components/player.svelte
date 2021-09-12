<script>
    import { onMount } from "svelte";
    import { Player } from "../js/player";
    import { time } from "../js/time";
    const path = require("path");

    export var location;
    
    var /** @type {HTMLCanvasElement}*/playerElem, /** @type {HTMLDivElement}*/parent;
    /** @type {Player} */ 
    var player = new Player();
    const { playing, time: currentTime, length, volume, rate } = player.stores;
    window.player = player;
    var menuOpen = true;

    onMount(() => {
        player.init(playerElem);
        player.play(location);
        updateMedia();
        attachHandlers();
    });

    $: {
        if(player.mrl !== location) {
            player.play(location);
            updateMedia();
        }
    }

    $: {
        navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }

    function updateMedia() {
        navigator.mediaSession.metadata = new MediaMetadata({
            title,
        });
        updatePos();
    }
    function updatePos() {
        navigator.mediaSession.setPositionState({
            duration: $length / 1000,
            position: $currentTime / 1000,
            playbackRate: $rate
        });
    }

    function attachHandlers() {
        navigator.mediaSession.setActionHandler('play', () => { player.resume(); });
        navigator.mediaSession.setActionHandler('pause', () => { player.pause() });
        navigator.mediaSession.setActionHandler('stop', () => { player.stop(); });
        navigator.mediaSession.setActionHandler('seekto', (e) => console.log(e));
        navigator.mediaSession.setActionHandler('seekbackward', function() {
            $currentTime -= 5000;
            if($currentTime < 0) $currentTime = 0;
            updatePos();
        });
        navigator.mediaSession.setActionHandler('seekforward', function() {
            $currentTime += 5000;
            if($currentTime > $length) $currentTime = $length - 1;
            updatePos();
        });
        // navigator.mediaSession.setActionHandler('previoustrack', function() { /* Code excerpted. */ });
        // navigator.mediaSession.setActionHandler('nexttrack', function() { /* Code excerpted. */ });

    }

    var lastMove = new Date;
    var mouseIn = false;
    $: menuOpen = mouseIn || !$playing || $time - lastMove < 3000;

    function mousemove(e) {
        lastMove = new Date;
    }
    /**
     * 
     * @param {KeyboardEvent} e
     */
    function keydown(e) {
        lastMove = new Date;

        console.log(e.key);
        switch(e.key) {
            case " ":
                player.togglePause();
                break;
            case "ArrowRight": // seek+
                $currentTime += 5000;
                if($currentTime > $length) $currentTime = $length - 1;
                break;
            case "ArrowLeft": // seek-
                $currentTime -= 5000;
                if($currentTime < 0) $currentTime = 0;
                break;
            case "ArrowUp": // vol+
                $volume += 5;
                if($volume > 100) $volume = 100;
                break;
            case "ArrowDown": // vol-
                $volume -= 5;
                if($volume < 0) $volume = 0;
                break;
            case "m": // mute
                player.toggleMute();
                break;
            case "f":
                toggleFullscreen();
                break;
        }
        updatePos();
    }
    function mouseenter() {
        mouseIn = true;
    }
    function mouseleave() {
        mouseIn = false;
    }
    function mousedown() {
        player.togglePause();
    }
    function toggleFullscreen() {
        if(document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            parent.requestFullscreen();
        }
    }
    var title = path.basename(location).substr(0, path.basename(location).length - path.extname(location).length);

    $: console.log("vol", $volume);
</script>

<svelte:head>
    <title>{title} - Video Player</title>
</svelte:head>

<svelte:window on:keydown={keydown} />

<div class="parent" class:hiddenCursor={!menuOpen} on:mousemove={mousemove} bind:this={parent}>
    <div class="meta" class:visible={menuOpen}>
        <h1 class="title">{title}</h1>
        <h3 class="author">Unknown</h3>
    </div>
    <canvas bind:this={playerElem} on:mousedown={mousedown} on:doubleclick={toggleFullscreen}></canvas>
    <div class="menu" class:open={menuOpen} on:mouseenter={mouseenter} on:mouseleave={mouseleave}>
        <input type="range" class="progress" bind:value={$currentTime} max={$length}
            style="background: linear-gradient(to right, #EAC935 {($currentTime / $length * 100)}%, rgba(255,255,255,0.3) {($currentTime / $length * 100)}%);"
            >
        <div class="controls">
            <div class="vol">
                <input type="range" bind:value={$volume} max={100} step={1}
                    style="width: 70px; background: linear-gradient(to right, #EAC935 {($volume)}%, rgba(255,255,255,0.3) {($volume)}%);"
                    >
            </div>
        </div>
    </div>
</div>

<style>
    .parent {
        width: 100%;
        height: 100%;
        background: black;
        position: relative;
        overflow: hidden;
    }
    .parent.hiddenCursor {
        cursor: hidden;
    }

    .meta {
        position: absolute;
        top: -20px;
        left: 0;
        padding: 0 90px 90px 15px;
        background: linear-gradient(165deg, rgba(0, 0, 0, 0.6) 0%, transparent 50%);
        opacity: 0;
        transition: opacity .3s ease-out, top .3s ease-out;
    }
    .meta.visible {
        opacity: 1;
        top: 0;
        transition: opacity .3s ease-in, top .3s ease-in;
    }
    .meta .title {
        color: white;
        margin-block-end: 0;
    }
    .meta .author {
        color: #EAC935;
        margin: 0;
    }

    .menu {
        position: absolute;
        bottom: -60px;
        height: 60px;
        width: 100%;
        opacity: 0;
        transition: bottom .3s ease-out, opacity .3s ease-out;
    }
    .menu::after {
        content: "";
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: 0;
        backdrop-filter: blur(15px);
        background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
        /* opacity: 0.4; */
    }
    .menu.open {
        bottom: 0;
        opacity: 1;
        transition: bottom .3s ease-in, opacity .3s ease-in;
    }

    .controls {
        position: absolute;
        z-index: 1;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-evenly;
    }

    .progress {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
    }
    input[type=range] {
        padding: 0;
        margin: 0;
        height: 5px;
        z-index: 1;
        -webkit-appearance: none;
    }

    input[type=range]:focus {
        outline: none;
    }
    
    input[type='range']::-webkit-slider-runnable-track {
        height: 5px;
        -webkit-appearance: none;
        color: rgba(255,255,255,0.3);
        margin-top: -1px;
    }
    
    input[type='range']::-webkit-slider-thumb {
        border-radius: 50%;
        margin-top: -2.5px;
        width: 10px;
        -webkit-appearance: none;
        height: 10px;
        cursor: ew-resize;
        background: #EAC935;
    }

    canvas {
        margin: auto;
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
</style>