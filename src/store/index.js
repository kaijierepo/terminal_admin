import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export const store = createPinia()

store.use(piniaPluginPersistedstate)

export const setupStore = (app) => {
  app.use(store)
}
