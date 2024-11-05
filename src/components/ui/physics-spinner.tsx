import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const spinTransition = {
  repeat: Infinity,
  ease: "linear",
  duration: 1,
};

const slowDownTransition = {
  duration: 5,
  ease: [0.25, 0.1, 0.25, 1], // Custom easing function
};

export function PhysicsSpinner() {
  return (
    <div className="relative w-12 h-12">
      <motion.div
        className="absolute inset-0"
        animate={{
          rotate: 360,
        }}
        transition={spinTransition}
      >
        <motion.div
          animate={{
            rotate: [0, 1080],
          }}
          transition={slowDownTransition}
        >
          <Loader2 className="w-12 h-12 opacity-50" />
        </motion.div>
      </motion.div>
    </div>
  );
}
