'use client'

import CakeDateNotice from '@/components/order/CakeDateNotice'
import { useEffect, useState } from 'react'

/** Shown when a cake is added to the cart, from any product page. */
export default function CakePauseListener() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener('cake-pause-notice', show)
    return () => window.removeEventListener('cake-pause-notice', show)
  }, [])

  return <CakeDateNotice open={open} canKeepOthers={false} onClose={() => setOpen(false)} onRemoveCakes={() => setOpen(false)} onChooseAnotherDate={() => setOpen(false)} />
}
