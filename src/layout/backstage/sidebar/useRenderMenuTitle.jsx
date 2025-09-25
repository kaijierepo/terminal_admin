import { Icon } from '@/components/Icon';

export const  useRenderMenuTitle = () => {
  const renderMenuTitle = (meta) => {
    const { title = 'please set title', icon } = meta;
    return (
      <>
        {icon && <Icon style="margin-right: 10px" icon={icon} />}
        <span>{title}</span>
      </>
    )
  }

  return {
    renderMenuTitle
  }
}