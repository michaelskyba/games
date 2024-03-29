// Decimal
const RNG = (min: number, max: number) => Math.random() * (max - min) + min

interface Position {
	x: number
	y: number
}

interface Directions {
	[key: number]: {
		dx: number
		dy: number
	}
}

interface RotationEnergy {
	[key: number]: number
}

class Config {
	pxScale = 5

	width = 200
	height = 100

	// Duration (ms)
	stepLength = 16

	// After how many ms to skip the step update
	// Useful if switching tabs or lagging for a while
	// Otherwise you'll have an enormous update at once
	get skipTime() {
		return this.stepLength * 50
	}

	// Energy change (lose) per step
	stepEnergy = -1

	// Energy change (lose) multiplier, for magnitude of rotation
	rotEnergyMul = -3

	// How much additional energy is spent for different rotations
	rotEnergy: RotationEnergy = {
		0: 0,

		1: 1,
		7: 1,

		2: 2,
		6: 2,

		3: 4,
		5: 4,

		4: 8,
	}

	protStartEnergy = 750
	protMaxEnergy = 1500

	// Energy required to reproduce
	protRepEnergy = 1000

	// Change in energy from consuming a bacterium
	bctEnergy = 40

	// Number of bacteria that spawn per step
	bctSpawn = 20

	bctStart = 6000
	protStart = 300

	mutRate = 1/8
	mutVar = 1/8

	// Must match the order of the <select> <option>s in the html
	bctPatterns = ["random", "circle", "lines"]
	bctPatternIdx = 0

	get bctPattern() {
		return this.bctPatterns[this.bctPatternIdx]
	}

	// The max number that can exist
	// It will progressively lag; try to stay low
	protMax = 3000
	bctMax = 6000

	// 8-grid, starting top left, going clockwise
	// Negative y: up
	// Positive y: down
	dirs: Directions = {
		// Top
		0: {dx: -1, dy: -1},
		1: {dx: 0, dy: -1},
		2: {dx: 1, dy: -1},

		// Right
		3: {dx: 1, dy: 0},

		// Bottom
		4: {dx: 1, dy: 1},
		5: {dx: 0, dy: 1},
		6: {dx: -1, dy: 1},

		// Left
		7: {dx: -1, dy: 0},
	}

	stats = ["protNum", "bctNum"]
	numInputs = [
		"pxScale", "width", "height", "stepLength",
		"stepEnergy", "rotEnergyMul",
		"protMax", "protMaxEnergy", "protRepEnergy",
		"bctEnergy", "bctSpawn", "bctMax",
		"mutRate", "mutVar",
		"protStart", "protStartEnergy",
	]
	buttons = [
		"stop", "step", "resume",
		"killProt", "killBct",
		"protCenter", "protRandom", "protLines",
	]
	checkboxes = ["useUserGen"]

	els = new Map<string, HTMLElement>()

	stop() {
		environment.running = false
	}

	step() {
		this.stop()
		environment.step()
	}

	resume() {
		if (environment.running)
			return

		environment.running = true
		environment.lastStep = 0
		window.requestAnimationFrame(environment.frameStep)
	}

	killProt() {
		environment.protozoa = new Set<Prot>()
		this.genAvg = [-1, -1, -1, -1, -1, -1, -1, -1]
	}

	killBct() {
		environment.bctNum = 0
		environment.bacteria = new Map<number, Set<number>>()
	}

	protNum = () => environment.protozoa.size
	bctNum = () => environment.bctNum

	protCenter = () => environment.addProts("center")
	protRandom = () => environment.addProts("random")
	protLines = () => environment.addProts("lines")

	useUserGen = false
	userGen = [1/8, 1/8, 1/8, 1/8, 1/8, 1/8, 1/8, 1/8]

	genAvg = [0, 0, 0, 0, 0, 0, 0, 0]

	// Runs when a new prot is added, and the average needs
	// to be updated. Updating on deletion is done in Environment.
	addGenAvg(prot: Prot) {
		for (let i = 0; i < 8; i++) {
			// They start at -1 before being initialized
			if (cfg.genAvg[i] == -1) {
				cfg.genAvg[i] = prot.genome[i]
				continue
			}

			const n = environment.protozoa.size
			cfg.genAvg[i] = cfg.genAvg[i] * (n-1)/n + prot.genome[i]/n
		}
	}

	delGenAvg(prot: Prot) {
		/*
		other: The average not including this genome
		avg: The average including this genome genome
		n: The number of protozoa (=> genomes), including this one
		g: The genome of this protozoan

		We know
		avg = other * (n-1)/n + g * 1/n
		other * (n-1)/n = avg - g/n
		other * (n-1) = n * avg - g
		other = (n * avg - g)/(n-1)
		*/

		for (let i = 0; i < 8; i++) {
			const avg = cfg.genAvg[i]
			const n = environment.protozoa.size
			const g = prot.genome[i]

			if (n == 1) {
				cfg.genAvg[i] = -1
				continue
			}

			const other = (n * avg - g)/(n - 1)
			cfg.genAvg[i] = other
		}
	}

	constructor() {
		this.stats.forEach(id => {
			this.els.set(id, document.getElementById(id)!)
		})

		this.numInputs.forEach(id => {
			const el = document.getElementById(id) as HTMLInputElement

			// Not sure how to make this DRY
			// Don't really have time to research it so I will need
			// to take tech debt
			// @ts-ignore
			el.value = this[id]

			el.onchange = () => {
				const value = Number(el.value)

				if (isNaN(value) || !el.value)
					el.style.backgroundColor = "#ffaaaa"

				else {
					el.style.backgroundColor = "white"

					// @ts-ignore
					this[id] = value
				}

				if (["pxScale", "width", "height"].indexOf(id) != -1) {
					c.init()
					c.draw()
				}
			}

			this.els.set(id, el)
		})

		this.checkboxes.forEach(id => {
			const el = document.getElementById(id) as HTMLInputElement

			el.onchange = () => {
				// @ts-ignore
				this[id] = el.checked
			}

			this.els.set(id, el)
		})

		this.buttons.forEach(id => {
			const el = document.getElementById(id) as HTMLInputElement

			// @ts-ignore
			el.onclick = this[id].bind(this)
		})

		const bctPattern = document.getElementById("bctPattern") as HTMLSelectElement
		bctPattern.selectedIndex = this.bctPatternIdx
		this.els.set("bctPattern", bctPattern)

		bctPattern.onchange = () => {
			this.bctPatternIdx = bctPattern.selectedIndex
		}

		const userGen = document.getElementById("userGen")!
		for (let i = 0; i < 8; i++) {
			const li = document.createElement("li")
			li.innerHTML = `${i}: `

			const input = document.createElement("input")
			input.type = "number"
			input.value = this.userGen[i].toString()
			input.onchange = () => {
				let value = Number(input.value)

				if (isNaN(value) || !input.value || value < 0 || value > 1) {
					input.value = "0"
					value = 0
				}

				this.userGen[i] = value
			}

			li.appendChild(input)
			userGen.appendChild(li)
		}

		const avgGen = document.getElementById("avgGen")!
		for (let i = 0; i < 8; i++) {
			const el = document.createElement("li")
			this.els.set(`avgGen${i}`, el)
			avgGen.appendChild(el)
		}
	}

	updateStats() {
		this.stats.forEach(id => {
			// @ts-ignore
			this.els.get(id)!.innerHTML = this[id]().toString()
		})

		for (let i = 0; i < 8; i++) {
			const precision = 100000000
			const avg = Math.round(this.genAvg[i] * precision)/precision

			const val = `${i}: ${avg.toString()}`
			this.els.get(`avgGen${i}`)!.innerHTML = val
		}
	}
}
const cfg = new Config()

// Prot: protozoan
// Plural "protozoa"
// (Microbes that evolve to eat bacteria)
interface Prot {
	x: number
	y: number

	dir: number

	genome: number[]
	colour: string

	energy: number
}

class Environment {
	running = true

	// Timestamp (ms) after first step
	lastStep = 0

	protozoa = new Set<Prot>()

	bacteria = new Map<number, Set<number>>()
	bctNum = 0

	mutateGene(genome: number[], geneIdx: number) {
		const variance = cfg.mutVar

		// Avoid making gene go below 0
		const min = -Math.min(genome[geneIdx], variance)

		// Avoid making gene go above 1
		const max = Math.min(1 - genome[geneIdx], variance)

		const mod = RNG(min, max)
		genome[geneIdx] += mod

		// How much will be added to other genes collectively, to compensate
		let otherMod = -mod

		const sum = genome.reduce((a, b) => a + b) - genome[geneIdx]

		for (let i = 0; i < 8; i++) {
			if (i == geneIdx)
				continue

			if (sum == 0)
				genome[i] += otherMod/(8-1)
			else
				genome[i] += otherMod * genome[i]/sum
		}
	}

	randomGenome() {
		const genome: number[] = []

		// Start with equal distribution
		for (let i = 0; i < 8; i++)
			genome.push(1/8)

		for (let i = 0; i < 8; i++)
			this.mutateGene(genome, i)

		return genome
	}

	setProtColour(prot: Prot) {
		const genome = prot.genome

		const r = (genome[6] + genome[2]) * 1.5 * 1.4 * 255
		const g = (genome[0] + genome[1] + genome[7]) * 1.4 * 255
		const b = (genome[3] + genome[4] + genome[5]) * 1.4 * 255

		prot.colour = `rgb(${r}, ${g}, ${b})`
	}

	getPos(pattern: string): Position {
		if (pattern == "center")
			return {
				x: Math.round(cfg.width/2),
				y: Math.round(cfg.height/2),
			}

		if (pattern == "random")
			return {
				x: Math.round(RNG(0, cfg.width)),
				y: Math.round(RNG(0, cfg.height)),
			}

		if (pattern == "circle") {
			const r = Math.min(cfg.width, cfg.height) / 4
			const dx = RNG(-r, r)
			const x = Math.round(cfg.width/2 + dx) % cfg.width

			/*
			x^2 + y^2 = r^2
			y = +- sqrt(r^2 - x^2)
			*/

			const r2 = Math.sqrt(r * r - dx * dx)
			const y = Math.round(cfg.height/2 + RNG(-r2, r2)) % cfg.height

			return {
				x: x,
				y: y,
			}
		}

		// pattern == "lines"

		const line = Math.round(RNG(1, 4))
		let x = 0
		let y = 0

		if (line == 1 || line == 2) {
			// 1: Diagonal top left to bottom right
			// 2: Diagonal bottom left to top right

			x = Math.round(RNG(0, cfg.width))

			if (line == 1)
				y = x * cfg.height/cfg.width
			else
				y = cfg.height - x * cfg.height/cfg.width

			const range = Math.max(cfg.height * 0.01, 1)
			const offset = RNG(-range, range)

			y = Math.round(y + offset + cfg.height) % cfg.height
		}

		// 3: Horizontal
		else if (line == 3) {
			x = Math.round(RNG(0, cfg.width))

			const range = Math.max(cfg.height * 0.01, 1)
			const offset = RNG(-range, range)

			y = Math.round(cfg.height/2 + offset + cfg.height) % cfg.height
		}

		// 4: Vertical
		else {
			y = Math.round(RNG(0, cfg.height))

			const range = Math.max(cfg.width * 0.01, 1)
			const offset = RNG(-range, range)

			x = Math.round(cfg.width/2 + offset + cfg.width) % cfg.width
		}

		return {
			x: x,
			y: y,
		}
	}

	addProt(pattern: string) {
		if (this.protozoa.size >= cfg.protMax)
			return

		const pos = this.getPos(pattern)

		const genome = cfg.useUserGen ? cfg.userGen : this.randomGenome()
		const prot = {
			x: pos.x, y: pos.y,
			genome: genome,
			dir: Math.round(RNG(0, 7)),
			energy: cfg.protStartEnergy,
			colour: ""
		}
		this.setProtColour(prot)
		this.protozoa.add(prot)

		cfg.addGenAvg(prot)
	}

	addProts(pattern: string) {
		for (let i = 0; i < cfg.protStart; i++)
			this.addProt(pattern)
	}

	addBct() {
		if (this.bctNum >= cfg.bctMax)
			return

		const pos = this.getPos(cfg.bctPattern)
		const bct = this.bacteria

		if (!bct.has(pos.x))
			bct.set(pos.x, new Set<number>())

		if (!bct.get(pos.x)!.has(pos.y))
			this.bctNum++

		bct.get(pos.x)!.add(pos.y)
	}

	// Returns change in index of dirs
	// Emergent change in behaviour:
	// 0: No change
	// 1: Slight right turn
	// 2: Moderate right turn
	// 3: Hard right turn
	// 4: Reverse
	// 5: Hard left turn
	// 6: Moderate left turn
	// 7: Slight left turn
	getDirChange(prot: Prot) {
		const threshold = RNG(0, 1)

		let sum = 0
		let i = 0

		for (; sum < threshold && i < 8; i++)
			sum += prot.genome[i]

		return i-1
	}

	checkBct(prot: Prot) {
		if (!this.bacteria.has(prot.x))
			return

		if (!this.bacteria.get(prot.x)!.delete(prot.y))
			return

		this.bctNum--
		prot.energy += cfg.bctEnergy
		prot.energy = Math.min(prot.energy, cfg.protMaxEnergy)
	}

	reproduce(prot: Prot) {
		if (this.protozoa.size >= cfg.protMax)
			return

		const energy = Math.round(prot.energy/2)
		prot.energy = energy

		const prot2 = {
			x: prot.x,
			y: prot.y,
			dir: prot.dir,
			energy: energy,
			genome: prot.genome.slice(),
			colour: "",
		}

		for (let i = 0; i < 8; i++) {
			const mutRate = Math.min(cfg.mutRate, 1)

			if (mutRate == 0)
				break

			if (Math.round(RNG(1, 1/mutRate)) != 1)
				continue

			this.mutateGene(prot2.genome, i)
		}

		this.setProtColour(prot2)
		this.protozoa.add(prot2)

		cfg.addGenAvg(prot2)
	}

	step() {
		for (let i = 0; i < cfg.bctSpawn; i++)
			this.addBct()

		for (const prot of this.protozoa) {
			const dirChange = this.getDirChange(prot)

			prot.energy += cfg.stepEnergy + cfg.rotEnergy[dirChange] * cfg.rotEnergyMul

			if (prot.energy <= 0) {
				cfg.delGenAvg(prot)

				// The prot has to be deleted after the avg is updated,
				// because it relies on the previous protozoa.size.
				this.protozoa.delete(prot)

				continue
			}

			prot.dir = (prot.dir + dirChange) % 8
			const dir = cfg.dirs[prot.dir]

			prot.x += dir.dx
			prot.y += dir.dy

			// We're assuming you can't go back more than two screenfuls
			// in one step.
			if (prot.x < 0)
				prot.x += cfg.width
			if (prot.y < 0)
				prot.y += cfg.height

			prot.x = prot.x % cfg.width
			prot.y = prot.y % cfg.height

			this.checkBct(prot)

			if (prot.energy >= cfg.protRepEnergy)
				this.reproduce(prot)
		}

		c.draw()
		cfg.updateStats()
	}

	frameStep(time: number) {
		if (!this.lastStep) {
			this.step()
			this.lastStep = time
		}

		let elapsed = time - this.lastStep

		if (elapsed > cfg.skipTime)
			elapsed = cfg.stepLength + 1

		if (elapsed > cfg.stepLength)
			this.lastStep = time

		while (elapsed > cfg.stepLength) {
			this.step()
			elapsed -= cfg.stepLength
		}

		if (this.running)
			window.requestAnimationFrame(this.frameStep)
	}

	start() {
		for (let i = 0; i < cfg.bctStart; i++)
			this.addBct()

		this.addProts("center")

		window.requestAnimationFrame(this.frameStep)
	}

}

const environment = new Environment()
environment.step = environment.step.bind(environment)
environment.frameStep = environment.frameStep.bind(environment)

class Canvas {
	canvas: HTMLCanvasElement
	context: CanvasRenderingContext2D

	frect(x: number, y: number, w: number, h: number, colour: string) {
		this.context.fillStyle = colour
		this.context.fillRect(x, y, w, h)
	}

	draw() {
		this.frect(0, 0, cfg.width * cfg.pxScale, cfg.height * cfg.pxScale, "#eeeeff")

		for (const bctX of environment.bacteria) {
			const x = bctX[0] * cfg.pxScale

			for (const bctY of bctX[1]) {
				const y = bctY * cfg.pxScale
				this.frect(x, y, cfg.pxScale, cfg.pxScale, "#888")
			}
		}

		for (const prot of environment.protozoa) {
			const x = prot.x * cfg.pxScale
			const y = prot.y * cfg.pxScale
			this.frect(x, y, cfg.pxScale, cfg.pxScale, prot.colour)
		}
	}

	init() {
		this.canvas.width = cfg.width * cfg.pxScale
		this.canvas.height = cfg.height * cfg.pxScale
	}

	constructor() {
		this.canvas = document.getElementById("canvas") as HTMLCanvasElement
		this.init()
		this.context = this.canvas.getContext("2d")!
	}
}

const c = new Canvas()

environment.start()
