import React from 'react';
import { motion } from 'framer-motion';

const Orb: React.FC = () => (
  <motion.div
    className="orb"
    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 2, repeat: Infinity }}
    style={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      background: 'radial-gradient(circle, #ff00ff, #00ffff)',
    }}
  />
);

export default Orb;
