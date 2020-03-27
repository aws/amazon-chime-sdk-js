import React from 'react';

export interface SvgProps {
  className?: string;
  viewBox?: string;
  width?: string;
  height?: string;
}

const Svg: React.SFC<React.SVGAttributes<HTMLOrSVGElement>> = ({
  className,
  children,
  viewBox = '0 0 24 24',
  xmlns = 'http://www.w3.org/2000/svg',
  width,
  height,
  ...otherProps
}) => {
  // This is necessary because some versions of Firefox would not use rems as values
  // for width and height attributes: https://bugzilla.mozilla.org/show_bug.cgi?id=1231147
  const styles = {
    width: width,
    height: height,
  };

  return (
    <svg
      xmlns={xmlns}
      className={`Svg ${className || ''}`}
      height={height}
      style={styles}
      viewBox={viewBox}
      width={width}
      {...otherProps}
    >
      <g fillRule="evenodd" fill="currentColor">
        {children}
      </g>
    </svg>
  );
};

export default Svg;
