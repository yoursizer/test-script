import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface FirstTimeNotificationProps {
  isVisible: boolean
  onClose: () => void
  className?: string
  autoDismiss?: boolean
  autoDismissDelay?: number
}

export function FirstTimeNotification({ 
  isVisible, 
  onClose, 
  className = "",
  autoDismiss = true,
  autoDismissDelay = 5000
}: FirstTimeNotificationProps) {
  
  // Auto-dismiss after specified delay
  useEffect(() => {
    if (isVisible && autoDismiss) {
      const timer = setTimeout(() => {
        onClose()
      }, autoDismissDelay)

      return () => clearTimeout(timer)
    }
  }, [isVisible, autoDismiss, autoDismissDelay, onClose])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 20 }}
        className={`absolute top-4 right-16 z-50 ${className}`}
      >
        <div className="relative">
          {/* Notification Bubble */}
          <div className="bg-gray-100 rounded-lg p-2 shadow-lg w-64">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  You can create your measurement profile,{" "}
                  <button 
                    onClick={onClose}
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    click here
                  </button>
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Arrow pointing to user profile */}
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
            <div className="w-0 h-0 border-l-8 border-l-gray-100 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 