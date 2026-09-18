import {load3DModel} from '@/Game/utils/model';
import * as THREE from 'three';
import Game from '.';
import {playerStatus} from './const';
import {ControlPlayer} from './contorlPlayer';

import {EventEmitter} from 'events';

export default class Player extends EventEmitter {
    static instance: Player;
    playerAnimationMixer: THREE.AnimationMixer | null = null;
    mixer: THREE.AnimationMixer | null = null;
    game!: Game;
    scene: THREE.Scene = new THREE.Scene();
    allAnimate = {} as any;
    playerScene: THREE.Object3D | any;
    camera: THREE.PerspectiveCamera | any;
    controlPlayer: ControlPlayer | any;
    light!: THREE.DirectionalLight;
    collision!: boolean;
    boxHelper!: THREE.BoxHelper;
    boundingBoxMesh: THREE.Mesh = new THREE.Mesh();
    private _shakeVec: THREE.Vector3 = new THREE.Vector3(); // reusable for camera shake
    private _lookAtVec: THREE.Vector3 = new THREE.Vector3(); // reusable for camera lookAt


    constructor() {
        super();
        if (Player.instance) {
            return Player.instance;
        }
        Player.instance = this;
        this.game = new Game();
        this.scene = this.game.scene;
        this.camera = this.game.camera.perspectiveCamera;
        this.createPlayer();
        this.collision = false;

    }
    // 创建玩家
    async createPlayer(first: boolean = true) {
        const {scene: playerScene, animations = []} = await load3DModel('/assets/glb/player1.glb');
        playerScene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.emissive = child.material.color;
                child.material.emissiveMap = child.material.map;
                child.material.metalness = 0;
            }
        });
        playerScene.position.set(0, 20, 5);
        first && playerScene.rotateY(Math.PI);
        playerScene.scale.set(2.8, 2.8, 2.8);

        this.playerAnimationMixer = new THREE.AnimationMixer(playerScene);
        this.mixer = new THREE.AnimationMixer(playerScene);
        this.allAnimate = {};

        for (const animate of animations) {
            const actionName = animate.name;
            let action = this.mixer.clipAction(animate);
            if (actionName === playerStatus.JUMP) {
                const actionClip = THREE.AnimationUtils.subclip(animate, 'run', 12, 30);

                action = this.mixer.clipAction(actionClip);
                action.loop = THREE.LoopOnce;
                // 播放到最后一帧
                action.clampWhenFinished = true;
                action.timeScale = 1;
            }
            if (actionName === playerStatus.RUN) {
                action.timeScale = 1.1;
            }
            if (actionName === playerStatus.ROLL) {
                const actionClip = THREE.AnimationUtils.subclip(animate, 'run', 0, 44);
                action = this.mixer.clipAction(actionClip);
                action.loop = THREE.LoopOnce;
                // Do NOT clamp — let it blend smoothly back to run when finished
                action.clampWhenFinished = false;
                action.timeScale = 1.3; // natural speed (was 2x — too fast/snappy)
            }
            if (actionName === playerStatus.LOOKBACK || actionName === playerStatus.RUNLOOKBACK) {
                action.loop = THREE.LoopOnce;
                action.timeScale = 1.8;
                action.clampWhenFinished = true;
            }
            if (actionName === playerStatus.FALL) {
                const actionClip = THREE.AnimationUtils.subclip(animate, 'run', 3, 12);
                action = this.mixer.clipAction(actionClip);
                action.loop = THREE.LoopOnce;
                // 播放到最后一帧s
                // action.clampWhenFinished = true;
                action.timeScale = 0.2;
            }
            if (actionName === playerStatus.DIE) {
                action.loop = THREE.LoopOnce;
                // 播放到最后一帧s
                action.clampWhenFinished = true;
                // 播放到最后一帧s
                // action.clampWhenFinished = true;
                // action.timeScale = 0.2;
            }

            this.allAnimate[actionName as playerStatus] = action;
        }
        this.playerScene = playerScene;
        this.scene.add(playerScene);
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(0, 10, 5);
        this.light.lookAt(new THREE.Vector3(0, 100, 5));
        this.light.castShadow = true;
        const cam = this.light.shadow.camera;
        cam.near = 0.1;
        cam.far = 120;
        cam.left = -20;
        cam.right = 20;
        cam.bottom = -20;
        // const helper = new THREE.DirectionalLightHelper(this.light, 0.5);
        this.scene.add(this.light);
        // this.scene.add(helper);


        const control = new ControlPlayer(playerScene, this.mixer, 'dance', this.allAnimate);
        this.controlPlayer = control;
        this.controlPlayer.on('collision', () => {
            this.collision = true;
            setTimeout(() => {
                this.collision = false;
            }, 300);
        });
    }
    updateCamrera(delta: number) {
        const playerPosition = this.playerScene?.position;
        this._lookAtVec.set(
            playerPosition.x,
            playerPosition.y + 5.8,
            playerPosition.z
        );
        this.camera.position.set(playerPosition.x, playerPosition.y + 9, playerPosition.z + 17);
        if (this.collision) {
            this.shakeCamera(delta);
        }
        this.camera.lookAt(this._lookAtVec);
    }
    shakeCamera(delta: number) {
        this._shakeVec.set(Math.sin(delta * Math.PI) * 5, Math.random() * 0, 0);
        // 修改摄像机的位置
        this.camera.position.add(this._shakeVec);
    }

    update(delta: number) {
        if (this.controlPlayer) {
            this.controlPlayer?.update(delta);
        }
        if (this.mixer) {
            this.mixer?.update(delta);
            this.updateCamrera(delta);
        }

    }
}
