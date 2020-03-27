## Icon

### Description

These icons are built with the SVG component (Core/Icon/Svg) so that they can scale for different use cases and varying screen sizes and devices.

The SVG component sets a default height, width, and viewBox for the SVG, so these do not (and should not) need to be set in the individual Icon components.

### Props

The props vary from icon to icon, but most of them simply take in props that are passed straight through to the SVG component. See the Core/Icon/Svg documentation for some examples of this, such as passing in a className to change the color of the icon.

In some cases, props can be passed in order to make other slight alterations to the icon. For example, the Microphone component takes in a `disabled` prop to toggle whether or not the icon is rendered with a strikethrough.
