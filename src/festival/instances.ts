import * as T from 'three';

/** Shares original meshes/materials across repeated static models. No simplification. */
export class ModelInstances {
  readonly handles=new Set<T.Group>();
  readonly parts:{mesh:T.InstancedMesh;local:T.Matrix4}[]=[];
  private capacity=32;
  private readonly matrix=new T.Matrix4();
  private readonly sphere=new T.Sphere();
  private readonly viewCenter=new T.Vector3();
  private readonly bounds:T.Sphere;
  private readonly fogged:boolean;
  constructor(private scene:T.Scene,template:T.Group){
    template.updateMatrixWorld(true);
    this.bounds=new T.Box3().setFromObject(template).getBoundingSphere(new T.Sphere());
    let fogged=true;
    template.traverseVisible(object=>{
      if(!(object instanceof T.Mesh))return;
      const mesh=new T.InstancedMesh(object.geometry,object.material,this.capacity);
      mesh.name='Shared '+object.name;
      mesh.castShadow=object.castShadow;mesh.receiveShadow=object.receiveShadow;
      mesh.renderOrder=object.renderOrder;
      // Each instance is culled below; a stale aggregate bound must not hide a recycled row.
      mesh.frustumCulled=false;mesh.count=0;mesh.matrixAutoUpdate=false;
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      for(const m of Array.isArray(object.material)?object.material:[object.material])fogged&&=m.fog;
      this.parts.push({mesh,local:object.matrixWorld.clone()});scene.add(mesh);
    });
    this.fogged=fogged;
  }
  create(){const handle=new T.Group();this.handles.add(handle);return handle;}
  remove(handle:T.Group){this.handles.delete(handle);handle.removeFromParent();}
  sync(camera:T.Camera,frustum:T.Frustum,fogFar=Infinity){
    if(this.handles.size>this.capacity){
      this.capacity=2**Math.ceil(Math.log2(this.handles.size));
      for(const part of this.parts){
        const old=part.mesh,mesh=new T.InstancedMesh(old.geometry,old.material,this.capacity);
        mesh.name=old.name;mesh.castShadow=old.castShadow;mesh.receiveShadow=old.receiveShadow;
        mesh.renderOrder=old.renderOrder;mesh.frustumCulled=false;mesh.matrixAutoUpdate=false;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);old.removeFromParent();old.dispose();
        part.mesh=mesh;this.scene.add(mesh);
      }
    }
    const castsShadow=this.parts.some(part=>part.mesh.castShadow);
    let count=0;
    for(const handle of this.handles){
      let visible=true;
      for(let parent:T.Object3D|null=handle;parent;parent=parent.parent)if(!parent.visible){visible=false;break;}
      if(!visible)continue;
      handle.updateWorldMatrix(true,false);
      this.sphere.copy(this.bounds).applyMatrix4(handle.matrixWorld);
      // These pools contain non-shadow-casting GLBs. Preserve offscreen casters if used elsewhere.
      if(!castsShadow&&!frustum.intersectsSphere(this.sphere))continue;
      this.viewCenter.copy(this.sphere.center).applyMatrix4(camera.matrixWorldInverse);
      if(this.fogged&&-this.viewCenter.z-this.sphere.radius>=fogFar)continue;
      for(const part of this.parts){this.matrix.multiplyMatrices(handle.matrixWorld,part.local);part.mesh.setMatrixAt(count,this.matrix);}
      count++;
    }
    for(const {mesh} of this.parts){mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;}
  }
  dispose(){for(const {mesh} of this.parts){mesh.removeFromParent();mesh.dispose();}this.handles.clear();}
}
