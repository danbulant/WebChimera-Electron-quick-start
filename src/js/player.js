import ipc from "./ipc";
import { readable, writable } from "svelte/store";

ipc.log("Player init...");
const path = require("path");
const { EventEmitter } = require("events");
const wc = require("webchimera.js");
const renderer = require("webgl-video-renderer");

function toPublicWritable(store, cb) {
    return {
        ...store,
        set(val) {
            return store.set(cb(val));
        }
    }
}

export class Player {
    constructor(element) {
        if(element) this.init(element);
        this.player = new wc.VlcPlayer();
        this.events = new EventEmitter();
        this.setters = {};
        this.mrl = null;
        this.player.volume = 100;
        this.stores = {
            time: toPublicWritable(writable(0, (set) => this.setters.time = set), (time) => this.player.time = time),
            playing: toPublicWritable(writable(false, (set) => this.setters.playing = set), (shouldPlay) => shouldPlay ? this.resume() : this.pause()),
            position: toPublicWritable(writable(0, (set) => this.setters.position = set), (pos) => this.player.position = pos),
            seekable: readable(false, (set) => this.setters.seekable = set),
            pausable: readable(false, (set) => this.setters.pausable = set),
            length: readable(0, (set) => this.setters.length = set),
            buffering: readable(false, (set) => this.setters.buffering = set),
            volume: toPublicWritable(writable(this.player.volume, (set) => this.setters.volume = set), (vol) => this.player.volume = vol),
            mute: toPublicWritable(writable(this.player.mute, (set) => this.setters.mute = set), (mute) => this.player.mute = mute),
            rate: toPublicWritable(writable(this.player.input.rate, (set) => this.setters.rate = set), (rate) => this.player.input.rate = rate)
        };
    }

    /**
     * @param {HTMLCanvasElement} element 
     */
    init(element) {
        if(this.renderer) return;
        if(!element) throw new Error("Element must be passed to player");
        this.renderer = renderer.setupCanvas(element);

        this.attachEvents();
    }

    play(url) {
        this.mrl = url;
        if(!/^[a-z0-9]+:\/\//.test(url)) { // if doesn't start with a protocol, expect filename
            url = "file://" + path.resolve(url);
        }
        ipc.log("Playing", url);
        this.player.play(url);
        return this;
    }
    resume() {
        this.player.play();
        this.setters.playing?.(true);
        return this;
    }
    pause() {
        this.player.pause();
        this.setters.playing?.(false);
        return this;
    }
    stop() {
        this.player.stop();
    }

    togglePause() {
        this.player.togglePause();
        this.setters.playing?.(this.player.playing);
        return this;
    }
    toggleMute() {
        this.player.toggleMute();
        this.setters.mute?.(this.player.mute);
        return this;
    }

    getMedia() {
        return this.player.playlist.items[this.player.playlist.currentItem]
    }

    onLogMessage(level, message) {
        if(level > 0) {
            ipc.log(level, message);
        }
    }

    onFrameReady(frame) {
		this.renderer.render(frame, frame.width, frame.height, frame.uOffset, frame.vOffset);
    }

    onEncounteredError(...err) {
        ipc.error("Playback error:", err);
    }

    attachEvents() {
        this.player.onLogMessage = (...args) => this.onLogMessage(...args);
        this.player.onFrameReady = (...args) => this.onFrameReady(...args);
        this.player.onEncounteredError = (...args) => this.onEncounteredError(...args);

        const player = this;
        function emit(event, cb) {
            return (...args) => {
                if(cb) cb(...args);
                player.events.emit(event, ...args);
            }
        }

        this.player.onStopped = emit("stopped", () => this.setters.playing?.(false));
        this.player.onPaused = emit("paused", () => this.setters.playing?.(false));
        this.player.onPlaying = emit("playing", () => this.setters.playing?.(true));
        this.player.onOpening = emit("opening");
        this.player.onBuffering = emit("buffering", (progress) => this.setters.buffering?.(progress));
        this.player.onTimeChanged = emit("time", (time) => this.setters.time?.(time));
        this.player.onPositionChanged = emit("position", (pos) => this.setters.position?.(pos));
        this.player.onSeekableChanged = emit("seekable", (seekable) => this.setters.seekable?.(seekable));
        this.player.onPausableChanged = emit("pausable", (pausable) => this.setters.pausable?.(pausable));
        this.player.onLengthChanged = emit("length", (length) => this.setters.length?.(length));
    }
}