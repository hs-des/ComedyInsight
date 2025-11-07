import { useEffect, useRef, useState } from 'react'

interface OtpInputProps {
  length?: number
  disabled?: boolean
  autoSubmit?: boolean
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
}

export default function OtpInput({ length = 6, disabled, autoSubmit = true, onChange, onComplete }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const focusInput = (index: number) => {
    const input = inputsRef.current[index]
    if (input) {
      input.focus()
      input.select()
    }
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newValues = [...values]
    newValues[index] = value.slice(-1)
    setValues(newValues)
    onChange?.(newValues.join(''))

    if (value && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !values[index] && index > 0) {
      const newValues = [...values]
      newValues[index - 1] = ''
      setValues(newValues)
      focusInput(index - 1)
      event.preventDefault()
    }
  }

  useEffect(() => {
    if (autoSubmit && values.every((char) => char !== '')) {
      onComplete?.(values.join(''))
    }
  }, [values, autoSubmit, onComplete])

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const newValues = pasted.split('')
    while (newValues.length < length) newValues.push('')
    setValues(newValues.slice(0, length))
    onChange?.(newValues.join(''))
    if (autoSubmit && newValues.every((char) => char !== '')) {
      onComplete?.(newValues.join(''))
    }
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {values.map((value, idx) => (
        <input
          key={idx}
          ref={(element) => (inputsRef.current[idx] = element)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          disabled={disabled}
          onChange={(event) => handleChange(idx, event.target.value)}
          onKeyDown={(event) => handleKeyDown(idx, event)}
          onPaste={handlePaste}
          className="w-12 h-12 text-xl text-center rounded-lg border border-gray-700 bg-gray-900 text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition"
        />
      ))}
    </div>
  )
}

