<script>
	export let unlockedScreens
	export let screen

	let screenNames = [
		"Addition",
		"Subtraction",
		"Multiplication",
		"Division",
		"Exponents",
		"Roots",
		"Shop"
	]
</script>

{#each screenNames as screenName}
	{#if unlockedScreens[screenName]}
		<input
			type="button"
			value={screenName}
			on:click={() => screen = screenName}
		>
	{/if}
{/each}

<style>
	input[type="button"] {
		width: 100%;
		height: 50px;
		font-size: 20px;
	}
</style>
