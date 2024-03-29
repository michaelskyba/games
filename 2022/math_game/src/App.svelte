<script>
	import MainMenu from "./MainMenu.svelte"
	import MathComponent from "./Math.svelte"
	import Shop from "./Shop.svelte"

	let startTime = new Date().getTime()
	let endTime = 0

	// "progress" increases with each Shop upgrade. progress = 0 means you only
	// have addition unlocked, progress = 4 means difficulty was unlocked, etc.
	let progress = 0

	let unlockedScreens = {
		"Addition": true,
		"Subtraction": false,
		"Multiplication": false,
		"Division": false,
		"Exponents": false,
		"Roots": false,
		"Shop": true
	}

	let points = {
		"Addition": 0,
		"Subtraction": 0,
		"Multiplication": 0,
		"Division": 0,
		"Exponents": 0,
		"Roots": 0
	}

	let unlockedFeatures = {
		"Difficulty": false,
		"Redirection": false
	}

	const RNG = (min, max) => {
		return Math.round(Math.random() * (max - min)) + min
	}

	const questions = {
		"Addition": (a, b) => {
			return {
				"question": `${a} + ${b} = _`,
				"answer": a + b
			}
		},
		"Subtraction": (a, b) => {
			return {
				"question": `${a + b} - ${b} = _`,
				"answer": a
			}
		},
		"Multiplication": (a, b) => {
			return {
				"question": `${a} × ${b} = _`,
				"answer": a * b
			}
		},
		"Division": (a, b) => {
			return {
				"question": `${a * b} ÷ ${b} = _`,
				"answer": a
			}
		},
		"Exponents": (a, b) => {
			return {
				"question": `${a}^${b} = _`,
				"answer": Math.pow(a, b)
			}
		},
		"Roots": (a, b) => {
			return {
				"question": `${b}th root of ${Math.pow(a, b)} = _`,
				"answer": a
			}
		}
	}

	const buy = () => {
		switch (progress) {
			case 0:
				points["Addition"] -= 15
				unlockedScreens["Subtraction"] = true
				break

			case 1:
				points["Addition"] -= 10
				points["Subtraction"] -= 20
				unlockedScreens["Multiplication"] = true
				break

			case 2:
				points["Addition"] -= 15
				points["Subtraction"] -= 15
				points["Multiplication"] -= 20
				unlockedScreens["Division"] = true
				break

			case 3:
				points["Addition"] -= 5
				points["Subtraction"] -= 5
				points["Multiplication"] -= 15
				points["Division"] -= 20
				unlockedFeatures["Difficulty"] = true
				break

			case 4:
				points["Addition"] -= 35
				points["Subtraction"] -= 45
				points["Multiplication"] -= 55
				points["Division"] -= 60
				unlockedScreens["Exponents"] = true
				break

			case 5:
				points["Multiplication"] -= 50
				points["Division"] -= 50
				points["Exponents"] -= 100
				unlockedScreens["Roots"] = true
				break

			case 6:
				points["Multiplication"] -= 50
				points["Exponents"] -= 50
				points["Roots"] -= 75
				unlockedFeatures["Redirection"] = true
				break

			case 7:
				points["Subtraction"] -= 150
				points["Roots"] -= 300
				endTime = new Date().getTime()
				break
		}

		progress++
	}

	let screen = "Main menu"
</script>

<h1>Arithmetic Game: {screen}</h1>
<p>Don't use a calculator.</p>
<hr>

{#if screen == "Main menu"}
	<MainMenu {unlockedScreens} bind:screen={screen} />

{:else if screen == "Shop"}
	<Shop
		bind:progress={progress}
		redirUnlocked={unlockedFeatures["Redirection"]}
		{buy}
		{points}
		{startTime}
		{endTime}
	/>

{:else}
	<MathComponent
		{questions}
		{RNG}
		{screen}
		difficultyUnlocked={unlockedFeatures["Difficulty"]}
		bind:points={points}
	/>

{/if}

<hr>

{#if screen != "Main menu"}
	<input
		type="button"
		value="Main menu"
		on:click={() => screen = "Main menu"}
	>
{/if}

<p>by Michael Skyba</p>
