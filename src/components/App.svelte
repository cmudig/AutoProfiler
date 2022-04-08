<script lang="ts">
	import {notebookStore, dfMapStore} from '../stores';


	// TODO make these reactive
	let lang = $notebookStore?.language || "?";
	let cell = $notebookStore?.activeCell;
</script>

<main>
	<div id="header-icon" />
	<div id="notebookInfo">
		<h4>{$notebookStore?.name}</h4>
		<p>is a <b>{lang}</b> notebook</p>
	</div>

	<div>
		<h5>{`you hath selected a ${cell?.type} cell:`}</h5>
		<p class="code">{`${cell?.text}`}</p>
	</div>

	<div>
		<h5>Dataframes in user's environment:</h5>
		{#if $dfMapStore}
			{#each Object.entries($dfMapStore) as [dfName, dfColTup]}
				<h2>{dfName}</h2>
				<ul>
					{#each dfColTup as tup}
						<li>{tup[0]}: {tup[1]}</li>
					{/each}
				</ul>
			{/each}
			
		{/if}
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
