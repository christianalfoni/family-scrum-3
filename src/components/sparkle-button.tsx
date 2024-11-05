import { motion, AnimatePresence } from "framer-motion";
import { Wand2 } from "lucide-react";

export function SparkleButton({
  onClick,
  loading,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center">
      <motion.button
        onClick={onClick}
        disabled={loading}
        className={`relative px-6 py-3 text-white rounded-full font-semibold text-lg shadow-lg transition-all duration-300 ${
          loading
            ? "bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 background-animate"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <span className="flex items-center justify-center">
          <motion.span
            animate={loading ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Wand2 className="w-6 h-6 mr-2" />
          </motion.span>
          {children}
        </span>
        <AnimatePresence>
          {loading && (
            <motion.span
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(20)].map((_, index) => (
                <motion.span
                  key={index}
                  className="absolute inline-flex h-2 w-2 bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
