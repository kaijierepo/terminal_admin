import { useRenderMenuTitle } from "./useRenderMenuTitle";
import { ElSubMenu, ElMenuItem } from 'element-plus'

const { renderMenuTitle } = useRenderMenuTitle();

const resolvePath = (route) => {
  return `${String(route?.name)}/${route?.meta?.title}`;
}

export const useRenderMenuItem = () => {
  const renderMenuItem = (routers) => {
    return routers
      .filter(v => !v.meta?.hidden)
      .map(v => {
        const meta = v.meta ?? {};
        const childLen = Number(v?.children?.length);
        
        if (childLen > 1) {
          return (
            <ElSubMenu index={resolvePath(v)}>
              {{ 
                title: () => renderMenuTitle(meta),
                default: () => renderMenuItem(v.children)
              }}
            </ElSubMenu>
          )
        } else {
          const lastRoute = (v?.children?.length) ? v.children[0] : v;
          const lastMeta = lastRoute.meta ?? {};
          // console.log('lastRoute', lastRoute)
          return (
            <ElMenuItem index={resolvePath(lastRoute)}>
              {{ default: () => renderMenuTitle(lastMeta) }}
            </ElMenuItem>
          )
        }
      })
  }

  return { renderMenuItem }
}