interface UndoToastProps {
  onUndo: () => void
}

export const UndoToast = ({ onUndo }: UndoToastProps) => {
  return (
    <div className="undo-toast">
      <span>Activity deleted</span>
      <button 
        className="undo-btn"
        onClick={onUndo}
      >
        Undo
      </button>
    </div>
  )
}