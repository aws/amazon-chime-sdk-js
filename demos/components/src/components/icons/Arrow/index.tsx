import React from 'react';
import Svg, { SvgProps } from '../Svg';

type Direction = 'up' | 'right' | 'down' | 'left';
const dirTransform = {
  up: '0',
  right: '90',
  down: '180',
  left: '270',
};

interface ArrowProps extends SvgProps {
  direction?: Direction;
}

const Arrow: React.SFC<ArrowProps> = ({ direction = 'up', ...props }) => (
  <Svg {...props}>
    <path
      transform-origin="center"
      transform={`rotate(${dirTransform[direction]})`}
      d="M16.85 10.53l-4.495-4.39c-.094-.09-.214-.132-.335-.136C12.013 6.003 12.007 6 12 6c-.006 0-.012.003-.02.004-.12.004-.24.047-.334.137L7.15 10.53c-.197.193-.201.51-.008.707.098.1.228.15.357.15.126 0 .252-.046.35-.141l3.646-3.56v9.812c0 .277.223.5.5.5.276 0 .5-.223.5-.5V7.677l3.655 3.57c.097.095.223.142.349.142.13 0 .26-.05.358-.151.193-.197.189-.514-.008-.707"
    />
  </Svg>
);

export default Arrow;
