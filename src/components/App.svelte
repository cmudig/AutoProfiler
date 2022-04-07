<script lang="ts">
	import type { NotebookAPI } from '../jupyter-hooks/notebook';

	export let notebook: NotebookAPI;
	export let dfMap: { [key: string]: string[] };

	// TODO make these reactive
	let lang = notebook.language || "?";
	let cell = notebook.activeCell;
</script>

<main>
	<div id="header-icon" />
	<div id="notebookInfo">
		<h4>{notebook.name}</h4>
		<p>is a <b>{lang}</b> notebook</p>
	</div>

	<div>
		<h5>{`you hath selected a ${cell?.type} cell:`}</h5>
		<p class="code">{`${cell?.text}`}</p>
	</div>

	<div>
		<h5>Dataframes in user's environment:</h5>
		{#each Object.entries(dfMap) as [dfName, dfColTup]}
			<h2>{dfName}</h2>
			<ul>
				{#each dfColTup as tup}
					<li>{tup[0]}: {tup[1]}</li>
				{/each}
			</ul>
		{/each}
	</div>
</main>

<style>
	main {
		/* text-align: center; */
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
</style>
