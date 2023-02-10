<script lang="ts">
    export let size: number | string;
    export let x = 0;
    export let y = 0;
    export let mainColor = 'black';
    export let secondaryColor = 'currentColor';
</script>

<svg
    height={size}
    width={size}
    {x}
    {y}
    viewBox="0 0 24 24"
    fill="white"
    class="hover:bg-gray-100 bg-gray-50 text-gray-500"
    xmlns="http://www.w3.org/2000/svg"
>
    <path
        d="M17 3H21V7"
        stroke={mainColor}
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
    />
    <path
        d="M11 13L21 3"
        stroke={mainColor}
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
    />
    <path
        d="M17.5721 13.89V20C17.5721 20.2652 17.4667 20.5196 17.2792 20.7071C17.0917 20.8946 16.8373 21 16.5721 21H2.57208C2.30687 21 2.05251 20.8946 1.86498 20.7071C1.67744 20.5196 1.57208 20.2652 1.57208 20V6C1.57208 5.73478 1.67744 5.48043 1.86498 5.29289C2.05251 5.10536 2.30687 5 2.57208 5H8.68208"
        stroke={secondaryColor}
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
    />
</svg>
