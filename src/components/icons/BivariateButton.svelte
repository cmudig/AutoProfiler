<script>
    export let size = '1em';
    export let color = 'currentColor';
</script>

<svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
>
    <circle cx="12" cy="12" r="9" stroke={color} stroke-width="2" />
    <path d="M12 7V17" stroke={color} stroke-width="2" stroke-linecap="round" />
    <path
        d="M7 12L17 12"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
    />
</svg>
