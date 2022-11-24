/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // https://coolors.co/c1b098-e9d2f4-9b9b93-39393a-63b0cd
        jet: '#39393A',
        'spanish-gray': '#9b9b93',
        thistle: '#E9D2F4',
        'maximum-blue': '#63b0cd'
      }
    },
  },
  plugins: [],
}
