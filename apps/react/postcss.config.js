// H5 视口适配：以 375 设计稿为基准，将 px 转换为 vw。
// Tailwind v4 通过 @tailwindcss/vite 处理，不经过此 PostCSS 流程，
// 因此这里仅作用于 antd-mobile 组件样式与项目内手写 px，不会影响 Tailwind 的工具类尺寸。
export default {
  plugins: {
    'postcss-px-to-viewport-8-plugin': {
      unitToConvert: 'px',
      viewportWidth: 375,
      unitPrecision: 5,
      propList: ['*'],
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      selectorBlackList: ['ignore-vw'],
      minPixelValue: 1,
      mediaQuery: false,
      replace: true,
      exclude: [/node_modules\/(?!antd-mobile)/],
      landscape: false,
    },
  },
};
