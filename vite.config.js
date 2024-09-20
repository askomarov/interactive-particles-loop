import glsl from 'vite-plugin-glsl';

export default {
  root: './',
  server: {
    port: 3000,
    open: true,
  },
  plugins: [glsl()],
};
