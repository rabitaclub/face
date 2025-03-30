import { motion } from "framer-motion";

interface Feature {
  title: string;
  details: string[];
}

interface FeatureModalProps {
  feature: Feature;
  onClose: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

export const FeatureModal = ({ feature, onClose }: FeatureModalProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={modalVariants}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <motion.div
      className="bg-background-light rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
      <div className="space-y-4 text-gray-300">
        {feature.details.map((detail: string, index: number) => (
          <p key={index}>{detail}</p>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-6 bg-primary text-button px-4 py-2 rounded-button hover:bg-primary-dark transition-colors"
      >
        close
      </button>
    </motion.div>
  </motion.div>
); 