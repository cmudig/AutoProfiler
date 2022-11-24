<script>
    import { createEventDispatcher } from 'svelte';
    import collapse from 'svelte-collapse';

    export let open = true;
    export let duration = 0.2;
    export let easing = 'ease';

    const dispatch = createEventDispatcher();

    function handleToggle() {
        open = !open;

        if (open) {
            dispatch('open');
        } else {
            dispatch('close');
        }
    }
</script>

<div class="card" class:open aria-expanded={open}>
    <div
        class="card-header flex items-center"
        on:mouseenter={() => dispatch('header-hover', { over: true })}
        on:mouseleave={() => dispatch('header-hover', { over: false })}
    >
        <div class="grow" on:click={handleToggle}>
            <slot name="header" />
        </div>

        <div class="justify-end">
            <slot name="header-no-collapse" />
        </div>
    </div>

    <div class="card-body" use:collapse={{ open, duration, easing }}>
        <slot name="body" />
    </div>
</div>

<style>
    .card-header {
        cursor: pointer;
        user-select: none;
    }
</style>
