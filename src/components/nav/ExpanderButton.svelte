<script>
    import CaretDownIcon from '../icons/CaretDownIcon.svelte';

    export let rotated = false;
</script>

<button
    on:click
    style:width="16px"
    style:height="16px"
    style:grid-column="left-control"
    class="
    hover:bg-gray-100
    transition-tranform 
    text-gray-500
    duration-100
    grid
    items-center
    justify-center
    rounded
    {!rotated ? '-rotate-90' : ''}"
>
    <CaretDownIcon size="14px" />
</button>
