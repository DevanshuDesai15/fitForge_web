import React from 'react';

type HostProps = Record<string, unknown> & { children?: React.ReactNode };

const host = (name: string) => {
  const Component = React.forwardRef<unknown, HostProps>((props, ref) =>
    React.createElement(name, { ...props, ref }, props.children as React.ReactNode),
  );
  Component.displayName = `${name}Stub`;
  return Component;
};

export const View = host('View');
export const Text = host('Text');
export const Pressable = host('Pressable');
export const TextInput = host('TextInput');
export const ScrollView = host('ScrollView');
export const ActivityIndicator = host('ActivityIndicator');
export const Modal = ({ visible, children, ...props }: HostProps & { visible?: boolean }) =>
  visible ? React.createElement('Modal', props, children) : null;

export const StyleSheet = {
  create: <T,>(styles: T): T => styles,
  flatten: (style: unknown) => style,
  hairlineWidth: 1,
};

export const Platform = {
  OS: 'ios',
  select: <T,>(options: { ios?: T; default?: T }): T | undefined => options.ios ?? options.default,
};
