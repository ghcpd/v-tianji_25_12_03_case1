interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
}

export const LoadingSpinner = ({ size = 'medium', fullScreen = false }: LoadingSpinnerProps) => {
  const sizeClass = `spinner-${size}`
  const containerClass = fullScreen ? 'spinner-fullscreen' : 'spinner-container'

  return (
    <div className={containerClass}>
      <div className={`spinner ${sizeClass}`}></div>
    </div>
  )
}

