import React from 'react';
import { motion } from 'framer-motion';

const cardVariants = {
  hover: {
    scale: 1.03,
    boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      stiffness: 300
    }
  },
  tap: {
    scale: 0.98
  }
};

const AnimatedCard = ({ children, className, onClick }) => {
  return (
    <motion.div
      className={className}
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;