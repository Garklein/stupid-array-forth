/* ---------------------------------------------------
|               stupid-array-forth.js
|        written by Garklein, 20/8/20 - 21/8/21
--------------------------------------------------- */

const rlSync = require("readline-sync");

let s = [], m = []; // stack, memory
const cdr = ([x, ...xs]) => xs;
// pushes array to stack                   pushes array and length to stack
const pa = a => a.forEach(e => s.push(e)); const sp = (a, l) => { pa(a); s.push(l); } 
const arr = (p=s.length-1) => { // gets array from stack
	if (s.length === 0) { console.log("stack underflow error"); return; }
	let n = s[p], a = [];
	for (let i = 0; i < n; i++) { a.unshift(s[s.length-1-(s.length-p)-i]); }
	return [a, n];
};
const arrer = p => { let [a, n] = arr(p); s.splice(s.length-n-1, n+1); return [a, n]; } // arr + delete from stack
const map1 = (f, pushl=true) => {
	let [a, n] = arrer(), r = a.map(x => f(x));
	if (pushl) { sp(r, r.length); } else { r.map(a => pa(a)); }
};
const map2 = f => {
	let as = []; ls = []; r = [];
	for (let i = 0; i < 2; i++) { let [a, n] = arrer(); as.unshift(a); ls.unshift(n); }
	if (ls[0] !== 1 && ls[1] !== 1 && ls[0] !== ls[1]) {
		console.log("length error"); sp(as[0], ls[0]); sp(as[1], ls[1]); return;
	}
	if (ls[0] === 1) { r = as[1].map(x => f(as[0][0], x)); }
	else if (ls[1] === 1) { r = as[0].map(x => f(x, as[1][0])); }
	else { r = as[0].map((x, i) => f(x, as[1][i])); }
	sp(r, r.length);
};
const gv = (addr, n) => { // get var from memory
	let a = []; for (let i = 0; i < n; i++) { a.unshift(m[m.length-1-(m.length-addr)-i]); } 
	sp(a, n);
};
let w = { // words
	"c":     () => s = [], ",": () => {}, "len": () => { const [a, n] = arr(); sp([n], 1); },
	".s":    () => {
		let as = [], ls = [], pos = s.length-1;
		while (pos >= 0) { const [a, n] = arr(pos); as.unshift(a); ls.unshift(n); pos -= n+1; }	
		for (let i = 0; i < ls.length; i++) { process.stdout.write(`${as[i]} A${ls[i]} `); }
		process.stdout.write("\n");
	},
	"s":     () => console.log(s),
	"dup":   () => { const [a, n] = arr(); sp(a, n); },
	"drop":  () => arrer(), "swap": () => { const [a1, n1] = arrer(), [a2, n2] = arrer(); sp(a1, n1); sp(a2, n2); },
	"bye":   () => { console.log("see you around"); process.exit(); },
	"p":     () => s.drop(), "d": () => { const [[dn], _] = arrer(); s.splice(s.length-dn, dn); },
	"rot":   () => { const [a, n] = arrer(); eval(["swap"]); sp(a, n); eval(["swap"]); },

	"rev":   () => { let [a, n] = arrer(); a.reverse(); sp(a, n); },
	"cat":   () => { const [a, n] = arrer(); const m = s.pop(); sp(a, m+n); },
	"iota":  () => map1(n => { let r = [...Array(n).keys()]; r.push(n); return r; }, false),
	"take":  () => { 
		let [a, n] = arrer(), [[tn], _] = arrer(), r=false; if (tn < 0) { r=true; a.reverse(); tn = Math.abs(tn) }
		if (tn < n) { a = a.slice(0, tn); } else { for (let i = 0; i < tn-n; i++) { a.push(0) } }
		if (r) { a = a.reverse(); } sp(a, tn);
	},
	"dropa":  () => { 
		let [a, n] = arrer(), [[dn], _] = arrer(), r=false; if (dn < 0) { r=true; a.reverse(); dn = Math.abs(dn) }
		a = a.slice(dn); if (a.length) { if (r) { a = a.reverse(); } sp(a, n-dn); }
	},

	"sign":  () => map1(Math.sign),          ">>>":  () => map2((a, b) => a>>>b),
	"<<":    () => map2((a, b) => a<<b),     ">>":   () => map2((a, b) => a>>b),
	"not":   () => map1(n => +!n),           "and":  () => map2((a, b) => a&b),
	"or":    () => map2((a, b) => a|b),      "xor":  () => map2((a, b) => a^b),
	"max":   () => map2(Math.max),           "min":  () => map2(Math.min),
	"floor": () => map2(Math.floor),         "ceil": () => map2(Math.ceil),
	"+":     () => map2((a, b) => a+b),      "-":    () => map2((a, b) => a-b),
	"*":     () => map2((a, b) => a*b),      "/":    () => map2((a, b) => a/b),
	"**":    () => map2((a, b) => a**b),     "sqrt": () => map1(a => Math.sqrt(a)), 
	"=":     () => map2((a, b) => +(a===b)), 
	"m=":    () => { eval(["="]); const [a, _] = arrer(); sp([a.reduce((x, y) => x&y)], 1); },
	"<":     () => map2((a, b) => +(a<b)),   ">":    () => map2((a, b) => +(a>b)),
	"<=":    () => map2((a, b) => +(a<=b)),  ">=":   () => map2((a, b) => +(a>=b)),

	"alloc": () => { const [[a], _] = arrer(); for (let i = 0; i < a; i++) { m.push(0); } sp([m.length-1], 1); }, 
	"free":  () => { const [[a], _] = arrer(); for (let i = 0; i < a; i++) { m.pop(); } },
	"!":     () => { 
		const [[addr], _] = arrer(), [a, n] = arrer(); 
		m[addr] = n; for (let i = 1; i <= n; i++) { m[addr-i] = a[n-i] }
	},
	"@":     () => { const [[addr], _] = arrer(); let n = m[addr], a = []; gv(addr, n); },
	"f!":    () => { 
		const [[addr], _] = arrer(), [[n], ignore] = arrer(); for (let i = 0; i < n; i++) { m[addr-i] = s.pop(); }
	},
	"f@":    () => { const [[addr], _] = arrer(), [n, ignore] = arrer(); let a = []; gv(addr, n); },
	"dump":  () => console.log(m),

	"(":     ts => {
		let lvl = 1; ts.shift();
		while (ts.length) { 
			switch (ts[0]) { case "(": lvl++; break; case ")": lvl--; break; }
			if (lvl === 0) { return; } ts.shift();
		}
	},
	":":     tks => {
		let lvl = 1, ts = []; tks.shift();
		while (tks.length) { 
			switch (tks[0]) { case ":": lvl++; break; case ";": lvl--; break; } 
			if (lvl === 0) { w[ts[0]] = () => eval(cdr(ts)); return; } 
			if (lvl === 1 && tks[0] === "$s") { const [a, _] = arrer(); ts.push(...a); tks.shift(); }
			else { ts.push(tks.shift()); }
		}
		console.log("error: mismatched : and ;s"); return;
	},
	"g":     () => { const [[n], _] = arrer(); if (n !== 0) { s.push("ret"); } }
};
const t = str => str.split(" ").filter(s => s.trim() !== "").map(s => s.trim());
const validNum = str => !isNaN(parseInt(str));
const evalA = ts => {
	let num = 0;
	while (validNum(ts[0])) { s.push(parseInt(ts.shift())); num++; }
	if (num) s.push(num);
}
const eval = ts => {
	while (ts.length) {
		if (s[s.length-1] === "ret") { s.pop(); return; }
		evalA(ts); if (ts.length === 0) { break; }
		if (w.hasOwnProperty(ts[0])) { w[ts[0]](ts); ts.shift(); } 
		else { console.log(`error: I have no clue what '${ts[0]}' means`); return; }
	}
}

console.log("'bye' to exit");
let line; while ((line = rlSync.question(":; ")) !== null) { ts = t(line); eval(ts); }