// client/src/components/privacy/LowPowerPrivacy.tsx - Low-power offline indicator
import React, { useState, useEffect } from 'react';

interface Props {
  mode: 'offline' | 'hybrid' | 'cloud';
}

const LowPowerPrivacy: React.FC<Props> = ({ mode }) => {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const statuses = {
      offline: 'Private • Low-Power • Local',
      hybrid: 'Secure Hybrid • Edge-First',
      cloud: 'Connected • Optimized'
    };
    setStatus(statuses[mode]);
  }, [mode]);

  return (
    <div className="privacy-badge">
      Status: {status}
    </div>
  );
};

export default LowPowerPrivacy;
