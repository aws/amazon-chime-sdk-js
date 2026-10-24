/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const url: string;
  export default url;
}
