/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1a3a5c',        // alinhado ao web
        'primary-light': '#2d5a8e',
        secondary: '#c9a84c',
        background: '#f8fafc',
        // status do caso + feedback (espelham o web/index.css)
        'status-aberto': '#2563eb',
        'status-atendimento': '#059669',
        'status-encerrado': '#64748b',
        erro: '#dc2626',
        aviso: '#d97706',
        sucesso: '#059669',
      },
    },
  },
  plugins: [],
};
