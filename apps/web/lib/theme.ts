export const theme = {
  colors: {
    brand: '#62B6FF',
    soft: '#DFF1FF',
    strong: '#1F7AE0',
    deep: '#1F2A44',
    cloud: '#F6FBFF',
    line: '#D7E7F5'
  },
  navItems: [
    { href: '/', label: '总览' },
    { href: '/projects', label: '项目管理' },
    { href: '/workbench', label: '标注工作台' },
    { href: '/qa-delivery', label: '质检交付台' },
    { href: '/algorithm', label: '算法验收台' },
    { href: '/assistant', label: '智能助手' }
  ]
} as const;
