import type { ComponentProps } from 'react';

export default function Svg(props: ComponentProps<'svg'>) { return <svg {...props} />; }
export function Circle(props: ComponentProps<'circle'>) { return <circle {...props} />; }
export function Defs(props: ComponentProps<'defs'>) { return <defs {...props} />; }
export function LinearGradient(props: ComponentProps<'linearGradient'>) { return <linearGradient {...props} />; }
export function Stop(props: ComponentProps<'stop'>) { return <stop {...props} />; }
export function Polygon(props: ComponentProps<'polygon'>) { return <polygon {...props} />; }
export function Path(props: ComponentProps<'path'>) { return <path {...props} />; }
