import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface CalculatingPageProps {
  onComplete: () => void
  duration?: number
}

const calculationSteps = [
 "Analyzing your measurements...",
 "Calculating approximate measurements...",
 "Analyzing your measurements...",
 "Calculating approximate measurements...",]

export function CalculatingPage({ onComplete, duration = 3000 }: CalculatingPageProps) {
  console.log('🎨 CalculatingPage rendered with duration:', duration);
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepDuration = duration / calculationSteps.length
    
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 50))
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 50)

    // Step text updates
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1
        if (nextStep >= calculationSteps.length) {
          clearInterval(stepInterval)
          return prev
        }
        return nextStep
      })
    }, stepDuration)

    // Complete calculation
    const completeTimer = setTimeout(() => {
      console.log('⏰ CalculatingPage animation complete, calling onComplete');
      clearInterval(progressInterval)
      clearInterval(stepInterval)
      onComplete()
    }, duration)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stepInterval)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="md:absolute md:inset-0 md:bg-white md:z-10 md:flex md:items-center md:justify-center bg-white border-b border-gray-200 w-full"
    >
      <div className="text-center space-y-3 md:space-y-6 px-4 md:px-6 py-4 md:py-8">

        {/* Responsive Title */}
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-sm md:text-2xl font-semibold md:font-bold text-gray-900"
        >
          Calculating Your Perfect Measurements...
        </motion.h3>

        {/* Responsive Progress Bar */}
        <div className="w-full max-w-sm md:max-w-md mx-auto">
          <div className="bg-gray-200 rounded-full h-1.5 md:h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          <motion.p
            className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2 md:block hidden"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {Math.round(progress)}% Complete
          </motion.p>
        </div>

        {/* Current Step Text - Responsive */}
        <motion.p
          key={currentStep}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          className="text-xs md:text-lg text-gray-600 min-h-[16px] md:min-h-[28px]"
        >
          {calculationSteps[currentStep]}
        </motion.p>

        {/* Responsive Processing Dots */}
        <div className="flex justify-center items-center space-x-1">
          <span className="text-xs md:text-sm text-gray-500 mr-2 hidden md:inline">Processing</span>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [0.5, 1, 0.5],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15
              }}
              className="w-1 h-1 md:w-1.5 md:h-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}