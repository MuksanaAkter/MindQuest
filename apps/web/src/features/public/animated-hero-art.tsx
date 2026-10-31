"use client";
import { useState, type PointerEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { Pause, Play } from "lucide-react";
import "./animated-hero.css";
export function AnimatedHeroArt() {
  const [paused,setPaused]=useState(false); const reduced=useReducedMotion();
  const targetX=useMotionValue(0);const targetY=useMotionValue(0);
  const rotateY=useSpring(targetX,{stiffness:35,damping:22});const rotateX=useSpring(targetY,{stiffness:35,damping:22});
  const still=paused||Boolean(reduced);
  function move(event:PointerEvent<HTMLDivElement>){if(still)return;const box=event.currentTarget.getBoundingClientRect();targetX.set((event.clientX-box.left)/box.width*4-2);targetY.set(1-(event.clientY-box.top)/box.height*2);}
  function reset(){targetX.set(0);targetY.set(0);}
  return <><div className={`hero-motion-scene ${still?"hero-motion-paused":""}`} onPointerMove={move} onPointerLeave={reset} aria-label="Animated magical castle with floating 3D books"><motion.div className="landing-art hero-depth-image" style={still?{}:{rotateX,rotateY}}><div className="hero-camera"><Image src="/images/curiosity-kingdom.png" alt="A friendly purple owl and orange fox exploring an enchanted floating castle" fill preload loading="eager" sizes="100vw"/></div></motion.div><div className="hero-enchantment" aria-hidden="true"><span className="hero-portal-ring"/><span className="hero-portal-ring inner"/><div className="hero-flying-book book-one"><em/><b/><i/></div><div className="hero-flying-book book-two"><em/><b/><i/></div><span className="hero-planet"/>{Array.from({length:12},(_,i)=><span key={i} className="hero-firefly" style={{left:`${44+(i*17)%53}%`,top:`${15+(i*13)%68}%`,animationDelay:`${i*-.47}s`}}/>)}</div></div><button className="hero-animation-toggle" aria-pressed={paused} disabled={Boolean(reduced)} onClick={()=>{setPaused(!paused);reset();}}>{still?<Play size={12}/>:<Pause size={12}/>} {reduced?"Motion reduced":paused?"Play animation":"Pause animation"}</button></>;
}
