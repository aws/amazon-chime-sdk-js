import React from 'react';

interface AppProps {
  name: string;
}

export default function App({ name }: AppProps) {
  return <section>{name}</section>;
}
