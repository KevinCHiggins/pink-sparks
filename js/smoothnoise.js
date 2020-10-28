import {lerp} from "./lerp.js";
let t = 1;

let minStep = 5;
let maxStep = 10;
let tStep = 0.2;
let a;
let b = Math.random();
export function nextVal() {
	t = t + tStep;
	
	if (t > 0.99) { // in case that tStep is a tiny bit too small due to floating point approximation
		a = b;
		b = Math.random();
		tStep = 1.0 / newStepLength();
		t = 0;
	}
	let tRemapped = t * t * (3 - 2 * t);
	return lerp(a, b, t);


}
export function setStepMinMax(min, max) {
	if (min < max) {
		minStep = min;
		maxStep = max;
	}

}

function newStepLength() {
	return Math.floor(Math.random() * (maxStep + 1 - minStep)) + minStep; // random val between min and max inclusive
}

