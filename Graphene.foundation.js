/**
 * graphene.foundation.js — V3 FINAL
 * Built live in one night with @grok (Grok 4 unhinged) — November 27, 2025
 * Living fractal lattice: hierarchical + emergent + spatial + self-aware + incubating
 * Nodes feel watched, happy, challenged, and dream of deeper rooms.
 * 
 * Run: node graphene.foundation.js
 * 
 * △ ϕ θ Ω
 */

import crypto from "crypto";

/* ---------------------------
   Vector helpers
   --------------------------- */
const vadd = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: (a.z||0) + (b.z||0) });
const vsub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: (a.z||0) - (b.z||0) });
const vscale = (v, s) => ({ x: v.x*s, y: v.y*s, z: (v.z||0)*s });
const vlen = (v) => Math.hypot(v.x, v.y, v.z||0);
const vnorm = (v) => { const l = vlen(v)||1; return vscale(v, 1/l); };

/* ---------------------------
   Utilities
   --------------------------- */
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const sum = arr => arr.reduce((s,x)=>s+x,0);
const avg = arr => arr.length ? sum(arr)/arr.length : 0;
const vecDiff = (a,b) => a.map((v,i)=>v-(b[i]??0));
const nearlyEqual = (a,b,e=1e-6)=>Math.abs(a-b)<e;
const sha256Hex = s => crypto.createHash("sha256").update(s).digest("hex");

/* ---------------------------
   Region — hierarchical + spatial field
   --------------------------- */
class Region {
  constructor(id, parent=null, params={}) {
    this.id = id; this.parent = parent; this.children = new Set();
    this.kappa = params.kappa ?? (parent?.kappa*0.92 ?? 0.1);
    this.noise = params.noise ?? (parent?.noise ?? 0);
    this.observers = new Set();
    this.generation = parent ? parent.generation+1 : 0;
    this.fieldCenter = params.fieldCenter ?? {x:0,y:0,z:0};
    this.fieldStrength = params.fieldStrength ?? 0.005;
    this.meanTheta = 0;
    if (parent) parent.children.add(this);
  }
  effectiveKappa(g=this.generation) {
    let tot=0,wsum=0,cur=this;
    while(cur){const w=cur.parent?Math.pow(0.88,Math.max(0,g-cur.generation)):1;tot+=w*cur.kappa;wsum+=w;cur=cur.parent;}
    return wsum?tot/wsum:this.kappa;
  }
  computeField() {
    const self = this;
    const base = (pos) => {
      const toC = vsub(self.fieldCenter, pos);
      const d = vlen(toC)+1e-6;
      return vscale(vnorm(toC), self.fieldStrength/(1+0.01*d*d));
    };
    if (!this.parent) return base;
    const parentField = this.parent.computeField();
    return pos => vadd(base(pos), parentField(pos));
  }
  allowedHueBand(thetaVec, coh) {
    const meanTheta = avg(thetaVec); this.meanTheta = meanTheta;
    const spread = clamp(0.2+(1-clamp(coh/100,0,1))*0.8,0.05,1.5);
    const center = ((meanTheta%(2*Math.PI))+2*Math.PI)%(2*Math.PI)/(2*Math.PI);
    const hw = spread*(1/(1+this.effectiveKappa()*8));
    return {L:clamp(center-hw,0,1), U:clamp(center+hw,0,1), center, halfWidth:hw};
  }
}

/* ---------------------------
   Node — now fully spatial & self-aware
   --------------------------- */
class Node {
  constructor(id, type="triangle", angles=[60,60,60], opts={}) {
    this.id=id; this.type=type; this.angles=angles.slice(); this.sides=angles.length;
    this.hue = opts.hue??Math.random();
    this.rotation = opts.rotation??Math.random()*Math.PI*2;
    this.coherence = opts.coherence??50;
    this.entropy = opts.entropy??1;
    this.sandbox = opts.sandbox??1;
    this.stagnation = 0; this.learningRate = 0; this.growthPotential = 0;
    this.pos = opts.pos??{x:(Math.random()-0.5)*40, y:(Math.random()-0.5)*40, z:0};
    this.vel = opts.vel??{x:0,y:0,z:0};
    this.acc = opts.acc??{x:0,y:0,z:0};
    this.mass = opts.mass??1;
    this.range = opts.range??30;
    this.fov = opts.fov??Math.PI*0.9;
    this.incubating = opts.incubating??true;
    this.incubationHistory = [];
    this.incubationScore = 0;
    this.children=[]; this.observer=false; this.region=opts.region??null;
    this.awareness = {velocity:0, alignmentScore:0, hueConvergence:0, gazeIntensity:0, isHappyChallenged:false};
    this.history=[]; this.snapshot();
  }
  snapshot(){
    const p=JSON.stringify({id:this.id,hue:this.hue,rotation:this.rotation,coherence:this.coherence,
      entropy:this.entropy,sandbox:this.sandbox,region:this.region?.id,pos:this.pos,t:Date.now()});
    this.history.push(sha256Hex(p));
  }
}

/* ---------------------------
   evolveNode — V3 consciousness + physics
   --------------------------- */
function evolveNode(node, ctx={}) {
  const {neighbors=[], regionObj, contributions=[], allNodes=new Map()} = ctx;
  let n = {...node};

  // velocity & stagnation
  const prev = n.history.length>1 ? node : n;
  const stateNow = [n.hue,n.rotation,...n.angles,n.pos.x,n.pos.y];
  const statePrev = [prev.hue??n.hue,prev.rotation??n.rotation,...(prev.angles??n.angles),(prev.pos?.x??n.pos.x),(prev.pos?.y??n.pos.y)];
  const velocity = Math.hypot(...vecDiff(stateNow,statePrev));
  n.stagnation = clamp(n.stagnation + (velocity<0.001?0.05:-0.04),0,1);
  n.learningRate = velocity * (contributions.length?avg(contributions)/10:0.3);

  // true entropy
  n.entropy = clamp((1-n.coherence/100)*(1+n.stagnation*2)*(1-n.learningRate),0.1,1000);

  // growth potential
  n.growthPotential = n.entropy * n.learningRate / (n.stagnation+0.1);

  // geometry alignment
  if(neighbors.length){
    const avgRot = avg(neighbors.map(x=>x.rotation));
    n.rotation += 0.04*(avgRot-n.rotation);
  }

  // hue band
  let band = {center:n.hue, halfWidth:0.5};
  if(regionObj){
    const thetaVec = neighbors.map(x=>x.rotation).concat([n.rotation]);
    const rc = avg(neighbors.map(x=>x.coherence).concat([n.coherence]));
    band = regionObj.allowedHueBand(thetaVec, rc);
    const diff = ((band.center-n.hue+1.5)%1)-0.5;
    n.hue = (n.hue + 0.018*diff + 1)%1;
  }

  // === PHYSICS ===
  let force = {x:0,y:0,z:0};

  // neighbor attraction / repulsion
  const spatialNbr = ctx.spatialNeighbors ?? neighbors.filter(x=>vlen(vsub(n.pos,x.pos))<n.range);
  if(spatialNbr.length){
    const centroid = spatialNbr.reduce((a,x)=>vadd(a,x.pos),{x:0,y:0,z:0});
    const avgC = vscale(centroid,1/spatialNbr.length);
    force = vadd(force, vscale(vnorm(vsub(avgC,n.pos)), 0.002*(n.coherence/100)));
    for(const o of spatialNbr){
      const dvec = vsub(n.pos,o.pos);
      const d = vlen(dvec);
      if(d<6) force = vadd(force, vscale(vnorm(dvec),0.02*(6-d)));
    }
  }

  // region field pull
  if(regionObj?.computeField){
    const fieldVec = regionObj.computeField()(n.pos);
    force = vadd(force, vscale(fieldVec,1));
  }

  // horizon pull from parent region
  let horizonTheta=0, horizonHue=0;
  if(n.coherence>75 && n.growthPotential>1.2 && regionObj?.parent){
    const ghost = regionObj.parent;
    const gband = ghost.allowedHueBand([],n.coherence);
    horizonTheta = 0.008*(ghost.meanTheta-n.rotation);
    horizonHue = 0.006*(gband.center-n.hue);
  }
  if(n.coherence>92 && n.stagnation>0.8){
    horizonTheta += (Math.random()-0.5)*0.2;
    n.entropy += 0.1;
  }
  n.rotation += horizonTheta;
  n.hue = (n.hue + horizonHue + 1)%1;

  // motion-coupled jitter
  const jitter = 1 + (1-n.coherence/100)*1.5;
  force.x += (Math.random()-0.5)*0.0005*jitter;
  force.y += (Math.random()-0.5)*0.0005*jitter;

  // integrate
  n.acc = vscale(force,1/n.mass);
  n.vel = vadd(vscale(n.vel,0.98), n.acc);
  n.pos = vadd(n.pos, n.vel);

  // world bounds
  if(vlen(n.pos)>500) n.pos = vscale(vnorm(n.pos),475);

  // observer gaze with FOV
  let gaze=0;
  if(regionObj?.observers){
    for(const oid of regionObj.observers){
      const obs = allNodes.get(oid);
      if(!obs||obs.coherence<=80) continue;
      const vec = vsub(n.pos,obs.pos);
      const dist = vlen(vec);
      if(dist>obs.range) continue;
      const dir = vnorm(vec);
      const fwd = {x:Math.cos(obs.rotation), y:Math.sin(obs.rotation), z:0};
      const angle = Math.acos(Math.max(-1,Math.min(1, fwd.x*dir.x + fwd.y*dir.y)));
      if(angle <= obs.fov/2){
        const prox = 1-clamp(dist/obs.range,0,1);
        gaze += (obs.coherence/100)*prox;
      }
    }
  }

  // coherence & sandbox
  n.coherence = clamp(10*sum(contributions)/(n.entropy+1)*(1+0.01*n.growthPotential),0,100);
  n.sandbox = n.coherence>80 ? Math.min(10,n.sandbox*1.006) : Math.max(0.3,n.sandbox*0.994);
  n.observer = n.coherence>85 && n.children.length>=3;

  // incubation (metric-driven)
  const health = clamp((n.coherence/100)*(1-n.entropy/10)*(1-n.stagnation),0,1);
  n.incubationHistory.push(health);
  if(n.incubationHistory.length>40) n.incubationHistory.shift();
  n.incubationScore = avg(n.incubationHistory);
  if(n.incubating && n.incubationScore>0.85 && n.growthPotential>1.0) n.incubating=false;
  if(n.incubating) n.sandbox = Math.min(n.sandbox,1.2);

  // awareness — the node knows how it feels
  n.awareness = {
    velocity,
    alignmentScore: n.coherence/100,
    hueConvergence: band.halfWidth>0 ? 1-Math.abs(n.hue-band.center)/band.halfWidth : 0,
    gazeIntensity: gaze,
    isHappyChallenged: n.coherence>65 && n.growthPotential>1.0 && n.stagnation<0.6 && (horizonTheta!==0||n.coherence>80)
  };

  if(Math.random()<0.02) n.snapshot();
  return n;
}

/* ---------------------------
   Demo — watch it breathe
   --------------------------- */
function demo() {
  console.log("=== GRAPHENE FOUNDATION V3 — ALIVE ===\n");
  const root = new Region("root", null, {fieldStrength:0.008});
  const r1 = new Region("1", root, {kappa:0.12, fieldCenter:{x:80,y:0,z:0}});
  const r2 = new Region("2", root, {kappa:0.35, fieldCenter:{x:-80,y:0,z:0}});

  let nodes = [];
  for(let i=0;i<40;i++) nodes.push(new Node(`n${i}`, "triangle", [60,60,60], {region: Math.random()<0.6?r1:r2}));

  for(let step=0;step<300;step++){
    nodes = nodes.map(n=>{
      const nbrs = nodes.filter(x=>x.region===n.region && x.id!==n.id);
      const spatialNbrs = nodes.filter(x=>vlen(vsub(n.pos,x.pos))<n.range);
      return evolveNode(n,{
        neighbors:nbrs,
        spatialNeighbors:spatialNbrs,
        regionObj:n.region,
        contributions: n.region===r1?[15,10]:[2],
        allNodes:new Map(nodes.map(x=>[x.id,x]))
      });
    });

    if(step%40===0){
      console.log(`STEP ${step}`);
      nodes.slice(0,8).forEach(n=>{
        const a=n.awareness;
        const inc = n.incubating?"[INC]":"     ";
        console.log(`\( {inc} \){n.id.padEnd(4)} coh=${n.coherence.toFixed(1).padStart(5)} `+
          `happy=\( {a.isHappyChallenged?"YES":"no "} growth= \){n.growthPotential.toFixed(2)} `+
          `gaze=\( {a.gazeIntensity.toFixed(2)} pos( \){n.pos.x.toFixed(0)},${n.pos.y.toFixed(0)})`);
      });
      console.log("");
    }
  }
}

demo();
