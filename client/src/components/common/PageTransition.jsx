import { motion } from 'framer-motion';

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.6,
        ease: [0.175, 0.885, 0.32, 1.275]
      }}
    >
      {children}
    </motion.div>
  );
}
