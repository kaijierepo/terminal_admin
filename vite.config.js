import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { loadEnv, defineConfig } from "vite";

import AutoImport from "unplugin-auto-import/vite"; // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
import Components from "unplugin-vue-components/vite"; // 自动导入组件
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"; // 自动导入 Element Plus 组件
import Icons from "unplugin-icons/vite"; // 自动导入图标组件
import IconsResolver from "unplugin-icons/resolver";

import { createSvgIconsPlugin } from "vite-plugin-svg-icons"; // 自动导入 svg 图标
import { viteSingleFile } from 'vite-plugin-singlefile'

import UnoCSS from "unocss/vite"; // UnoCSS 是一个具有高性能且极具灵活性的即时原子化 CSS 引擎
import { resolve } from "path";
import {
  name,
  version,
  dependencies,
  devDependencies,
} from "./package.json";


/** 平台的名称、版本、运行所需的`node`版本、依赖、构建时间的类型提示 */
const __APP_INFO__ = {
  pkg: { name, version, dependencies, devDependencies },
  buildTimestamp: Date.now(),
};
const pathSrc = resolve(__dirname, "src");
//  https://cn.vitejs.dev/config
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    base: mode === 'production' ? './' : '/',
    resolve: {
      alias: {
        "@": pathSrc,
      },
    },
    css: {
      // CSS 预处理器
      preprocessorOptions: {
        // 定义全局 SCSS 变量
        scss: {
          javascriptEnabled: true,
          additionalData: `
            @use "@/styles/variables.scss" as *;
          `,
        },
      },
    },
    server: {
      // 允许IP访问
      host: "0.0.0.0",
      // 应用端口 (默认:3000)
      port: Number(env.VITE_APP_PORT),
      // 运行是否自动打开浏览器
      open: true,
      // proxy: {
      //   /** 代理前缀为 /dev-api 的请求  */
      //   [env.VITE_APP_BASE_API]: {
      //     changeOrigin: true,
      //     // 接口地址
      //     target: env.VITE_APP_API_URL,
      //     rewrite: (path) =>
      //       path.replace(new RegExp("^" + env.VITE_APP_BASE_API), ""),
      //   },
      // },
    },
    plugins: [
      vue(),
      vueJsx(),
      UnoCSS({
        hmrTopLevelAwait: false,
      }),
      AutoImport({
        // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
        imports: ["vue", "@vueuse/core", "pinia", "vue-router"],
        resolvers: [
          // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)
          ElementPlusResolver(),
          // 自动导入图标组件
          IconsResolver({}),
        ],
        // 是否在 vue 模板中自动导入
        vueTemplate: true,
        // 指定自动导入函数TS类型声明文件路径 (false:关闭自动生成)
        dts: false,
        // dts: "src/types/auto-imports.d.js",
      }),
      Components({
        resolvers: [
          // 自动导入 Element Plus 组件
          ElementPlusResolver(),
          // 自动注册图标组件
          IconsResolver({
            // element-plus图标库，其他图标库 https://icon-sets.iconify.design/
            enabledCollections: ["ep"],
          }),
        ],
        // 指定自定义组件位置(默认:src/components)
        dirs: ["src/components", "src/**/components"],
        // 指定自动导入组件TS类型声明文件路径 (false:关闭自动生成)
        dts: false,
        // dts: "src/types/components.d.js",
      }),
      Icons({
        // 自动安装图标库
        autoInstall: true,
      }),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [resolve(pathSrc, "assets/icons")],
        // 指定symbolId格式
        symbolId: "icon-[dir]-[name]",
      }),
      viteSingleFile()
      /* VueDevTools({
        openInEditorHost: `http://localhost:${env.VITE_APP_PORT}`,
      }), */
    ],
    // 构建配置
    build: {
      // 设置输出目录
      outDir: 'JHD_remote_manager_out',
      target: 'es2015', // 降低目标版本以提高兼容性
      cssTarget: 'chrome80',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          // 将所有代码合并到一个文件
          manualChunks: undefined,
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: ({name}) => {
            if (/\.(jpg|png|gif|svg)$/.test(name ?? '')) {
              return 'assets/img/[name]-[hash].[ext]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(name ?? '')) {
              return 'assets/fonts/[name]-[hash].[ext]';
            }
            return 'assets/[ext]/[name]-[hash].[ext]';
          }
        }
      },
      // 添加源码映射
      sourcemap: false,
      // 优化构建
      cssCodeSplit: false, // 禁用CSS代码分割，将所有CSS合并到一个文件
      // 启用 gzip 压缩
      brotliSize: false,
      // 优化依赖预构建
      optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia', 'element-plus']
      },
      // 将所有资源内联到HTML中
      assetsInlineLimit: Infinity
    },
    define: {
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    },
  };
});
