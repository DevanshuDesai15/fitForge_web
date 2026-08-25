import type { ComponentProps } from 'react';

export function SafeAreaView(props: ComponentProps<'div'> & { edges?: string[] }) {
  const { edges: _edges, ...viewProps } = props;
  return <div {...viewProps} />;
}
