import { memo } from 'react';
import Snowfall from 'react-snowfall';

const SnowfallEffect = memo(({ 
  snowflakeCount = 50,
  speed = [0.5, 1.5],
  wind = [-0.5, 1.0],
  radius = [0.5, 3.0],
  style = {}
}) => {
  return (
    <Snowfall
      snowflakeCount={snowflakeCount}
      speed={speed}
      wind={wind}
      radius={radius}
      color="rgba(99, 102, 241, 0.8)"
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 9997,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
});

SnowfallEffect.displayName = 'SnowfallEffect';

export default SnowfallEffect;
