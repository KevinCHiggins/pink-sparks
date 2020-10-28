import {nextVal} from "./smoothnoise.js";
import {setStepMinMax} from "./smoothnoise.js";
import {lerp} from "./lerp.js";
const camera_x = 800.0;
const WIDTH = 800;
const HEIGHT = 600;
const MAX_ALPHA = 1.0;
const MIN_ALPHA = 0.7;
const ENOUGH_PARTICLES = 800;
let topBaseEnergy = 4;
let ang = 0;
let k = 0.001;
let sourceCount = 0;
let pNum = 0;
let energy = 0;
let sources = [];
const pVars = 9; // pos x y z, vel x y z, brightness (life), fading (dying) factor, colour tint
// X and Y are horizontal with X pointing towards camera, Z is vertical. So screen X corresponds to sparks' Y, screen Y to inverse of sparks' Z
var canv = document.getElementById("c");
canv.style.width = "800px";
canv.style.height = "600px";
canv.width = 800;
canv.height = 600;
console.log("Canv width: " + canv.style.width);
var ctx;
ctx = canv.getContext("2d");
window.requestAnimationFrame(anim);
console.log("Done" + ctx);
let p = new Float32Array(ENOUGH_PARTICLES * pVars);

// assumes side is evenly divisible by 5
function initialiseSourcesCube(side) {
	let step = side / 2.5;

	let org1 = [side, side, side];
	addSource(side, side, side);
	addSource(side, side, 0 - side);
	addSource(side, 0 - side, side);
	addSource(0 - side, side, side);
	addSource(0 - side, 0 - side, side);
	addSource(0 - side, side, 0 - side);
	addSource(side, 0 - side, 0 - side);
	addSource(0 - side, 0 - side, 0 - side);
	for (let i = 1; i < 5; i++) {
		addSource(side, side - i * step, side);
		addSource(side - i * step, side, side);
		addSource(side, side, side - i * step);
		addSource(0 - side, side, side - i * step);
		addSource(0 - side, side - i * step, side);
		addSource(side, 0 - side, side - i * step);
		addSource(side - i * step, 0 - side, side);
		addSource(side, side - i * step, 0 - side);
		addSource(side - i * step, side, 0 - side);
		addSource(0 - side, 0 - side + i * step, 0 - side);
		addSource(0 - side + i * step, 0 - side, 0 - side);
		addSource(0 - side, 0 - side, 0 - side + i * step);
	}

}
function addSource(x, y , z) {
	sources.push(x);
	sources.push(y);
	sources.push(z);
	sourceCount++;
}
function rotateX(x, y, sinA, cosA) {
	return (x * cosA) - y * sinA;
}

function rotateY(x, y, sinA, cosA) {
	return (x * sinA) + (y * cosA);
}

function initialiseParticle(i, energy, x, y, z, x_vel, y_vel, z_vel) {
	let j = i * pVars;
	let speed = energy * 16;
	p[j] = x; // x pos
	p[j + 1] = y; // y pos
	p[j + 2] = z; // z pos
	let theta = (Math.PI * 2) * Math.random(); // evenly divide the sweep around 0, 0, 0 into pNum parts
	let phi = Math.acos(Math.random() * 2 - 1);
	p[j + 3] = Math.cos(theta) * Math.sin(phi) * speed; // x velocity
	p[j + 4] = Math.sin(theta) * Math.sin(phi) * speed; 
	p[j + 5] = Math.cos(phi) * speed;
	p[j + 6] = lerp(MIN_ALPHA, MAX_ALPHA, energy / (topBaseEnergy + 1));
	p[j + 7] = (Math.floor(Math.random() * 1) + 3) / 400.0;
	p[j + 8] = energy  / (topBaseEnergy + 1); // will yield a value from 0-1 we can use to interpolate between pink and blue
	//console.log("Particle " + i + " has brightness " + p[j + 6] + " has fading " + p[j + 7]);
}
function spawnParticle(energy, x, y, z, x_vel, y_vel, z_vel) {
	//console.log("Trying to spawn a particle, there are currently " + pNum);
	if (pNum <= ENOUGH_PARTICLES) {
		pNum++;
		initialiseParticle(pNum - 1, energy, x, y, z, x_vel, y_vel, z_vel);
	}
}
function anim(timestamp) {
	ang = ang + 0.001;
	if (ang > Math.PI * 2) {
		ang = 0;
	}
	// deal with spark creation
	energy = energy + nextVal() / 2;
	let divEnergy = energy / sourceCount;
	let cosA = Math.cos(ang);
	let sinA = Math.sin(ang);
	for (let i = 0; i < sourceCount; i++) {
		let sourceEnergy = divEnergy;
		let srcX = sources[i * 3];
		let srcY = sources[i * 3 + 1];

		let rotX = rotateX(srcX, srcY, sinA, cosA);
		let rotY = rotateY(srcX, srcY, sinA, cosA);
		for (let baseEnergy = topBaseEnergy; baseEnergy > 1; baseEnergy--) {
			let enoughEnergy = true;
			while (enoughEnergy) {
				let newSparkEnergy = baseEnergy * (sourceEnergy / 8) + Math.random();
				if (newSparkEnergy < sourceEnergy) {
					spawnParticle(newSparkEnergy, rotX, rotY, sources[i * 3 + 2], 0, 0, 0);
					sourceEnergy = sourceEnergy - newSparkEnergy;
					energy = energy - newSparkEnergy;
				}
				else {
					enoughEnergy = false;
				}
			}
		}		
	}

	ctx.globalCompositeOperation = "source-over";
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	ctx.globalCompositeOperation = "lighter";
	if (pNum == 0) { console.log("Out of particles");}
	for (let i = 0; i < pNum; i++) {
		let j = i * pVars;
		p[j + 6] = p[j + 6] - p[j + 7];
		if (p[j + 6] <= 0) {
			//console.log("Killing particle " + i);
			if (i == pNum - 1) { // if it's the last particle, all we have to do is lower the number of particles and exit the for loop
				pNum--;
				continue;
			}
			// otherwise swap last particle into this one 
			for (let k = 0; k < pVars; k++) { // k cycles through all the variables for the particle
				p[j + k] = p[((pNum - 1) * pVars) + k];
			}
			pNum--;
		}

		p[j + 5] = p[j + 5] - 0.05; //gravity
		// drag - find velocity, get vector pointing the opposite way, normalise it, multiply result by (k * v * v) where k is a magic number
		let x_vel = p[ j + 3];
		let y_vel = p[j + 4];
		let z_vel = p[j + 5];
		let length = Math.sqrt(x_vel * x_vel + y_vel * y_vel + z_vel * z_vel);
		//instead of calculating drag, we'll cancel out one of the multiplies by length by not normalising (dividing by length) the drag vel
		// this isn't needed: let drag = k * length * length; 
		let r = lerp(252, 123, p[j + 8]);
		let g = lerp(118, 283, p[j + 8]);
		let b = lerp(149, 252, p[j + 8]);
		p[j + 3] = p[j + 3] - (x_vel * k * length);
		p[j + 4] = p[j + 4] -  (y_vel * k * length);
		p[j + 5] = p[j + 5] - (z_vel * k * length);
		p[j] = p[j] + p[j + 3];
		p[j + 1] = p[j + 1] + p[j + 4];
		p[j + 2] = p[j + 2] + p[j + 5];

		ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + p[j + 6] +")";
		let x_diff = (camera_x - p[j + 0]) / 500;

		ctx.fillRect(p[j + 1] / x_diff + (WIDTH / 2), (HEIGHT / 2) - p[j + 2] / x_diff, 10 / x_diff, 10 / x_diff);
		//ctx.fillRect(20, 20, 5, 5);
	}
	//console.log("See that?");
	window.requestAnimationFrame(anim);

}
function noiseTest() {
	//console.log("Val: " + nextVal());
}
setStepMinMax(10, 100);
initialiseSourcesCube(300);
anim();
