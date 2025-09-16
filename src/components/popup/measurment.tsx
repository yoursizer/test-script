
import { motion } from "framer-motion";
import { X } from "lucide-react";


interface MeasurementGuideProps {
  onClose: () => void;
  measurementType: 'chest' | 'waist' | 'hips' | null;
}

export function MeasurementGuide({ onClose, measurementType }: MeasurementGuideProps) {
  const guides = {
    chest: {
      title: "How to Measure Chest/Bust",
      steps: [
        "Stand straight with arms relaxed at sides",
        "Wrap measuring tape around the fullest part of your chest",
        "Keep the tape parallel to the ground",
        "Breathe normally and don't pull the tape too tight"
      ],
      image: "/assets/measurements/chest.png"
    },
    waist: {
      title: "How to Measure Waist",
      steps: [
        "Find your natural waistline (the narrowest part)",
        "Keep measuring tape snug but not tight",
        "Stand straight and breathe normally",
        "Measure at belly button level for consistency"
      ],
      image: "/assets/measurements/waist.png"
    },
    hips: {
      title: "How to Measure Hips",
      steps: [
        "Stand with feet together",
        "Measure around the fullest part of your hips",
        "Include buttocks in the measurement",
        "Keep measuring tape parallel to the floor"
      ],
      image: "/assets/measurements/hips.png"
    }
  };

  const currentGuide = measurementType ? guides[measurementType] : null;

  if (!currentGuide) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4">{currentGuide.title}</h2>

        <div className="aspect-video relative mb-6 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={currentGuide.image}
            alt={currentGuide.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-4">
          {currentGuide.steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-gray-600">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
} 