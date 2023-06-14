module.exports = {
  mode: 'jit',
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  variants: {
    opacity: ({ after }) => after(["disabled"]),
  }
}
