import * as THREE from 'three';
import Sizes from './size';
import Environment from './environment';
import Player from './player';
import Renderer from './render';
import Stats from 'stats.js';
import {EventEmitter} from 'events';
import {cache} from '@/Game/utils/model';
import {disposeNode} from './utils/dispose';
import { GameScene } from './scene';
import Camera from './camera';
import Time from './time';
let stats = new Stats();
// stats.dom is removed from screen for clean production HUD

export default class Game extends EventEmitter {
    static instance: Game;
    canvas: HTMLElement | undefined;
    sizes!: Sizes;
    time!: Time;
    renderer!: Renderer;
    scene!: THREE.Scene;
    camera!: Camera;
    environment: Environment | undefined;
    player: Player | undefined;
    clock: THREE.Clock = new THREE.Clock();
    windowResizeFn!: (e: Event) => void;
    public isPaused: boolean = false;
    constructor(canvas?: HTMLElement) {
        super();
        if (Game.instance) {
            return Game.instance;
        }
        Game.instance = this;
        this.canvas = canvas;
        // 尺寸相关
        this.sizes = new Sizes();
        // 监听window变化
        this.sizes.on("resize", () => {
            this.resize();
        })
        this.time = new Time();
        // 做每一帧的动作更新
        this.time.on("update", () => {
            this.update();
        })
        // scene 场景
        this.scene = new GameScene().scene;
        // 相机
        this.camera = new Camera();
        // 画布
        this.renderer = new Renderer();
        // 环境
        this.environment = new Environment();
        this.player = new Player();
        this.resize();
        this.resource();
    }
    togglePause() {
        this.isPaused = !this.isPaused;
        this.emit('gameStatus', this.isPaused ? 'pause' : 'start');
    }
    resumeGame() {
        this.isPaused = false;
        this.emit('gameStatus', 'start');
    }
    restartGame() {
        this.isPaused = false;
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    }
    startGame() {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    }
    update() {
        if (this.isPaused) {
            this.renderer.update();
            return;
        }
        const delta = this.time.delta / 1000;
        this.renderer.update();
        this.player?.update && this.player.update(delta);
    }
    resource() {
        THREE.DefaultLoadingManager.onLoad = () => {
            this.emit('progress', {type: 'successLoad'});
        };

        THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.emit('progress', {type: 'onProgress', url: url, itemsLoaded: itemsLoaded, itemsTotal: itemsTotal});
        };

        THREE.DefaultLoadingManager.onError = () => {
            this.emit('progress', {type: 'error'});
        };
    }
    removelistener() {
        window.removeEventListener('resize', this.windowResizeFn);
    }
    resize() {
        this.renderer.resize();
        this.camera.resize();
    }
    disposeGame() {
        cache?.clearCacheData();
        this.removelistener();
        disposeNode(this.scene);
        this.scene.clear();
        this.renderer.dispose();
        // this.renderer = null;
    }
}
