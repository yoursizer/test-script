import React, { useState, useEffect } from 'react'

// Simple widget without heavy dependencies
interface SimpleWidgetProps {
  buttonText?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  className?: string
  buttonBg?: string
  licenseKey?: string
  onSizeRecommended?: (size: string) => void
  productId?: string
  brandId?: string
  clothingType?: string
}

export function SimpleYourSizerWidget({ 
  buttonText = "🎯 Beden Önerisi Al",
  position = 'center',
  className = '',
  buttonBg = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  licenseKey = "demo-key",
  onSizeRecommended,
  productId = "default-product",
  brandId = "generic",
  clothingType = "tshirt"
}: SimpleWidgetProps) {
  
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [measurements, setMeasurements] = useState({
    height: 170,
    weight: 70,
    chest: 90,
    waist: 80,
    hips: 95
  })
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null)

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleCalculate = async () => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      // Simple size calculation based on measurements
      let size = 'M'
      
      if (gender === 'male') {
        if (measurements.chest < 85) size = 'S'
        else if (measurements.chest > 100) size = 'L'
        else if (measurements.chest > 110) size = 'XL'
      } else {
        if (measurements.chest < 80) size = 'S'
        else if (measurements.chest > 95) size = 'L'
        else if (measurements.chest > 105) size = 'XL'
      }
      
      setRecommendedSize(size)
      setIsLoading(false)
      
      if (onSizeRecommended) {
        onSizeRecommended(size)
      }
    }, 2000)
  }

  const buttonStyle = {
    background: buttonBg,
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    width: '100%',
    maxWidth: '300px',
    margin: '0 auto',
    display: 'block'
  }

  const modalStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  }

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    marginBottom: '16px'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333'
  }

  const closeButtonStyle = {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  }

  return (
    <div className={`yoursizer-widget-container ${className}`}>
      <button 
        style={buttonStyle}
        onClick={handleOpen}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        {buttonText}
      </button>

      {isOpen && (
        <div style={modalStyle} onClick={handleClose}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={handleClose}>×</button>
            
            <h2 style={{ marginBottom: '24px', textAlign: 'center', color: '#333' }}>
              Beden Önerisi Al
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Cinsiyet:</label>
              <select 
                style={inputStyle}
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
              >
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Boy (cm):</label>
              <input
                type="number"
                style={inputStyle}
                value={measurements.height}
                onChange={(e) => setMeasurements(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                min="140"
                max="220"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Kilo (kg):</label>
              <input
                type="number"
                style={inputStyle}
                value={measurements.weight}
                onChange={(e) => setMeasurements(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                min="40"
                max="150"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Göğüs (cm):</label>
              <input
                type="number"
                style={inputStyle}
                value={measurements.chest}
                onChange={(e) => setMeasurements(prev => ({ ...prev, chest: parseInt(e.target.value) || 0 }))}
                min="60"
                max="140"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Bel (cm):</label>
              <input
                type="number"
                style={inputStyle}
                value={measurements.waist}
                onChange={(e) => setMeasurements(prev => ({ ...prev, waist: parseInt(e.target.value) || 0 }))}
                min="50"
                max="120"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Kalça (cm):</label>
              <input
                type="number"
                style={inputStyle}
                value={measurements.hips}
                onChange={(e) => setMeasurements(prev => ({ ...prev, hips: parseInt(e.target.value) || 0 }))}
                min="60"
                max="140"
              />
            </div>

            {recommendedSize && (
              <div style={{
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#2e7d32', margin: '0 0 8px 0' }}>
                  Önerilen Beden: {recommendedSize}
                </h3>
                <p style={{ color: '#388e3c', margin: 0, fontSize: '14px' }}>
                  Bu beden önerisi ölçülerinize göre hesaplanmıştır.
                </p>
              </div>
            )}

            <button
              style={{
                ...buttonStyle,
                background: recommendedSize ? '#4caf50' : buttonBg,
                marginBottom: '12px'
              }}
              onClick={handleCalculate}
              disabled={isLoading}
            >
              {isLoading ? 'Hesaplanıyor...' : recommendedSize ? 'Yeni Hesaplama' : 'Beden Hesapla'}
            </button>

            {recommendedSize && (
              <button
                style={{
                  ...buttonStyle,
                  background: '#2196f3',
                  marginBottom: '0'
                }}
                onClick={() => {
                  if (onSizeRecommended) {
                    onSizeRecommended(recommendedSize)
                  }
                  handleClose()
                }}
              >
                Bu Bedeni Seç
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
