# Chime SDK UI Component Library

This contains reusable components written with React, TypeScript and styled components to be used to create UIs with Chime SDK JS.

## To genereate dependencies

```
npm install
```

## To run Storybook locally

```
npm start
```

## Build

```
npm run build
```

# Usage

After publishing your lib (ie `my-react-lib`) you can use it by importing the styles in your App's entry point:



Then you can import and use your components:

```tsx
//
import React from 'react'
import { Example } from 'my-react-lib'

export class App extends React.Component {
  render() {
    return <Example />
  }
}
```
