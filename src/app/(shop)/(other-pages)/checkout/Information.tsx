'use client'

import { useCart } from '@/components/useCartStore'
import ButtonThird from '@/shared/Button/ButtonThird'
import { Field, FieldGroup, Fieldset, Label } from '@/shared/fieldset'
import { Input } from '@/shared/input'
import { Radio, RadioField, RadioGroup } from '@/shared/radio'
import { isServiceablePostcode, isAllowedShippingState, normalizeShippingState, SHIPPING_STATES, SHIPPING_STATE, SHIPPING_STATE_ERROR } from '@/utils/deliveryArea'
import { useSignIn, useUser } from '@clerk/nextjs'
import axios from 'axios'
import clsx from 'clsx'
import gsap from 'gsap'
import { ArrowLeft, ArrowRight, CalendarCheck, Check, MapPin, UserRound } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import DeliveryDetails, { type DeliveryDetailsValue } from './DeliveryDetails'

// Recipient shipping is Victoria only (shared with create-order + account APIs).
const AU_STATES = [...SHIPPING_STATES]

interface InformationProps {
  onUpdateUserInfo: (info: {
    name: string
    lastName: string
    phone: string
    address: string
    email: string
    city: string
    state: string
    country: string
    zipcode: string
    gender?: string
    dob?: string
    addressType?: string
    id?: string
  }) => void
  onUpdatePaymentMethod: (method: string) => void
  onUpdateValidation: (isValid: boolean) => void
  createAccount?: boolean
  onCreateAccountChange?: (create: boolean) => void
  onPasswordChange?: (password: string) => void
  onDeliveryChange?: (value: DeliveryDetailsValue) => void
  /** Same checkout/payment action as the sticky sidebar Pay button. */
  onConfirmOrder?: () => void
  isConfirming?: boolean
  canConfirmOrder?: boolean
}

export interface AddressDTO {
  billing_address_type: 'home' | 'office' | 'other'
  billing_customer_name: string
  billing_last_name: string
  billing_addressLine: string
  billing_city: string
  billing_state: string
  billing_country: string
  billing_pincode: string
}

export interface UserDTO {
  id: string
  clerkId: string
  billing_fullname: string
  email: string
  billing_phone: string
  billing_customer_gender: 'male' | 'female' | 'other'
  billing_customer_dob: string
  billing_address: AddressDTO[]
  wallet: { points: number }
  createdAt?: string
  updatedAt?: string
}

const Spinner = () => (
  <svg className="mr-2 -ml-1 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

const Information: React.FC<InformationProps> = ({
  onUpdateUserInfo,
  onUpdatePaymentMethod,
  onUpdateValidation,
  createAccount = false,
  onCreateAccountChange,
  onPasswordChange,
  onDeliveryChange,
  onConfirmOrder,
  isConfirming = false,
  canConfirmOrder = false,
}) => {
  // Wizard step: 0 = Delivery, 1 = Contact, 2 = Shipping (shown one at a time).
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserDTO | null>(null)
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0)
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser()
  const { orderSummary } = useCart()
  const [deliveryValid, setDeliveryValid] = useState(false)
  const [checkedDeliveryPostcode, setCheckedDeliveryPostcode] = useState('')
  const [isContactInfoComplete, setIsContactInfoComplete] = useState(false)
  const [isShippingAddressComplete, setIsShippingAddressComplete] = useState(false)

  // Overall checkout validity = all three steps complete.
  useEffect(() => {
    onUpdateValidation(deliveryValid && isContactInfoComplete && isShippingAddressComplete)
  }, [deliveryValid, isContactInfoComplete, isShippingAddressComplete, onUpdateValidation])

  // Stripe is the only payment method — lock it in on mount.
  useEffect(() => {
    onUpdatePaymentMethod('prepaid')
  }, [onUpdatePaymentMethod])

  // ─── GSAP step transition ───
  // Slide + fade the active step in each time the wizard advances/goes back.
  // Direction follows travel (forward → from the right, back → from the left).
  const stepRefs = useRef<Array<HTMLDivElement | null>>([])
  const prevStepRef = useRef(0)
  useEffect(() => {
    if (isLoading) return
    const el = stepRefs.current[step]
    const dir = step >= prevStepRef.current ? 1 : -1
    prevStepRef.current = step
    if (!el) return
    // Respect reduced-motion preferences — no slide, just show.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const ctx = gsap.context(() => {
      gsap.from(el, {
        autoAlpha: 0,
        x: 28 * dir,
        duration: 0.45,
        ease: 'power2.out',
        clearProps: 'transform,opacity,visibility',
      })
    }, el)
    return () => ctx.revert()
  }, [step, isLoading])

  useEffect(() => {
    if (userData) {
      const selectedAddress = userData.billing_address?.[selectedAddressIndex]

      onUpdateUserInfo({
        name: userData.billing_fullname || '',
        lastName: selectedAddress?.billing_last_name || '',
        phone: userData.billing_phone || '',
        email: userData.email || '',
        address: selectedAddress
          ? `${selectedAddress.billing_addressLine}, ${selectedAddress.billing_city}, ${selectedAddress.billing_state}`
          : '',
        city: selectedAddress?.billing_city || '',
        state: selectedAddress?.billing_state || '',
        country: selectedAddress?.billing_country || '',
        zipcode: selectedAddress?.billing_pincode || '',
        gender: userData.billing_customer_gender || '',
        dob: userData.billing_customer_dob || '',
        addressType: selectedAddress?.billing_address_type || '',
        id: userData.id || '',
      })
      // Complete when address is Victoria + serviceable and matches the Delivery-step postcode.
      const pin = selectedAddress?.billing_pincode?.replace(/\D/g, '').slice(0, 4) || ''
      setIsShippingAddressComplete(
        !!selectedAddress &&
          isAllowedShippingState(selectedAddress.billing_state) &&
          isServiceablePostcode(pin) &&
          (!checkedDeliveryPostcode || pin === checkedDeliveryPostcode)
      )
    }
  }, [userData, selectedAddressIndex, onUpdateUserInfo, checkedDeliveryPostcode])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isClerkLoaded) return

      // Guest checkout — keep any contact details already entered (e.g. after
      // creating an account but before Clerk session is ready).
      if (!clerkUser) {
        setIsLoading(false)
        return
      }
      try {
        const response = await axios.get(`/api/users/${clerkUser.id}`)
        const user = response.data
        if (user) {
          setUserData((prev) => ({
            ...(prev || {
              id: user.id || '',
              clerkId: user.clerkId || clerkUser.id,
              billing_fullname: '',
              email: '',
              billing_phone: '',
              billing_customer_gender: 'other',
              billing_customer_dob: '',
              billing_address: [],
              wallet: { points: 0 },
            }),
            ...user,
            billing_fullname: user.billing_fullname || prev?.billing_fullname || '',
            email: user.email || prev?.email || '',
            billing_phone: user.billing_phone || prev?.billing_phone || '',
            billing_address: user.billing_address?.length ? user.billing_address : prev?.billing_address || [],
          }))
          if (user.billing_fullname && user.email && user.billing_phone) {
            setIsContactInfoComplete(true)
          }
          if (
            user.billing_address?.[0] &&
            isAllowedShippingState(user.billing_address[0].billing_state) &&
            isServiceablePostcode(user.billing_address[0].billing_pincode)
          ) {
            setIsShippingAddressComplete(true)
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        // Keep local checkout details if the profile is not ready yet.
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserData()
  }, [clerkUser, isClerkLoaded])

  const handleUpdateUser = async (data: any) => {
    const mergeLocal = (incoming: any) => {
      setUserData((prev) => ({
        ...(prev || {
          id: incoming.id || 'guest',
          clerkId: '',
          billing_fullname: '',
          email: '',
          billing_phone: '',
          billing_customer_gender: 'other' as const,
          billing_customer_dob: '',
          billing_address: [],
          wallet: { points: 0 },
        }),
        ...incoming,
      }))
    }

    // Guests (including shoppers who just created an account but are not signed
    // in yet) only update local checkout state. PUT requires a Clerk session.
    if (!clerkUser) {
      mergeLocal(data)
      return
    }

    try {
      const updatedUserData = { ...userData, ...data }
      const targetClerkId = data.clerkId || userData?.clerkId || clerkUser.id

      if (!targetClerkId) {
        console.error('No clerkId available for update')
        throw new Error('No clerkId available')
      }

      const response = await axios.put(`/api/users/${targetClerkId}`, updatedUserData)
      setUserData(response.data.user)
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="size-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-cocoa dark:border-neutral-700 dark:border-t-[#6b69d6]" />
        </div>
        <p className="text-sm font-medium text-neutral-400 dark:text-neutral-500">Loading checkout...</p>
      </div>
    )
  }

  // Allow continuation for guest users (userData will be null)
  const selectedAddress = userData?.billing_address?.[selectedAddressIndex]

  const stepMeta = [
    { label: 'Delivery', icon: CalendarCheck, done: deliveryValid },
    { label: 'Contact', icon: UserRound, done: isContactInfoComplete },
    { label: 'Shipping', icon: MapPin, done: isShippingAddressComplete },
  ]
  // Jump only to a step you've already reached, or the next once prior steps are done.
  const goToStep = (i: number) => {
    if (i <= step || stepMeta.slice(0, i).every((s) => s.done)) setStep(i)
  }

  return (
    <div className="checkout-form font-bake-body space-y-5">
      {/* ─── Global checkout-only style overrides (bake palette + button shimmer) ─── */}
      <style jsx global>{`
        .checkout-form input[type='text'],
        .checkout-form input[type='tel'],
        .checkout-form input[type='email'],
        .checkout-form input[type='password'],
        .checkout-form input[type='number'],
        .checkout-form input[type='date'],
        .checkout-form textarea,
        .checkout-form select {
          font-family: var(--font-bake-body);
          font-size: 15px;
          line-height: 1.4;
          color: var(--color-cocoa);
          background-color: #fff;
          border: 1px solid var(--color-line) !important;
          border-radius: 14px !important;
          padding: 13px 16px !important;
          width: 100%;
          box-shadow: none !important;
          transition: border-color 220ms ease, box-shadow 220ms ease;
        }
        .checkout-form input::placeholder,
        .checkout-form textarea::placeholder {
          color: var(--color-taupe);
          font-style: italic;
          opacity: 0.85;
        }
        .checkout-form input:hover,
        .checkout-form textarea:hover,
        .checkout-form select:hover {
          border-color: rgba(46, 31, 21, 0.22) !important;
        }
        .checkout-form input:focus,
        .checkout-form textarea:focus,
        .checkout-form select:focus {
          outline: none;
          border-color: var(--color-rose-accent) !important;
          box-shadow: 0 0 0 5px rgba(217, 113, 133, 0.13) !important;
        }

        /* The shared <Input> wrapper paints a blue focus ring via an ::after
           pseudo. Kill it inside the checkout — our box-shadow halo above is
           the only focus indicator we want. */
        .checkout-form [data-slot='control']::after,
        .checkout-form [data-slot='control']::before {
          display: none !important;
        }
        .checkout-form [data-slot='control'] {
          box-shadow: none !important;
        }
        /* Re-paint Chrome's "Please fill out this field" bubble + invalid
           outline in our palette */
        .checkout-form input:user-invalid,
        .checkout-form input:invalid {
          border-color: var(--color-rose-accent) !important;
        }

        /* Label typography — small caps */
        .checkout-form label {
          color: var(--color-cocoa-soft);
        }
        .checkout-form label span.text-red-500 {
          color: var(--color-rose-accent);
          font-weight: 700;
        }

        /* Section headers */
        .checkout-form h3 {
          font-family: var(--font-bake-display);
          font-weight: 500;
          letter-spacing: -0.005em;
        }

        /* Shimmer on the primary CTA — runs only on hover */
        @keyframes checkout-cta-shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        .checkout-form .checkout-cta {
          position: relative;
          background-image: linear-gradient(
            110deg,
            transparent 30%,
            rgba(255, 255, 255, 0.18) 50%,
            transparent 70%
          ), linear-gradient(to right, var(--color-cocoa), var(--color-cocoa));
          background-size: 220% 100%, 100% 100%;
          background-position: 100% center, center;
          transition: background-color 220ms ease, transform 180ms ease,
            box-shadow 220ms ease;
        }
        .checkout-form .checkout-cta:hover:not(:disabled) {
          animation: checkout-cta-shimmer 1.6s linear infinite;
          background-image: linear-gradient(
            110deg,
            transparent 30%,
            rgba(255, 255, 255, 0.22) 50%,
            transparent 70%
          ), linear-gradient(to right, var(--color-rose-accent), var(--color-rose-deep));
          box-shadow: 0 16px 36px -16px rgba(217, 113, 133, 0.55);
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .checkout-form .checkout-cta:hover:not(:disabled) {
            animation: none;
          }
        }
      `}</style>

      {/* Progress stepper */}
      <Stepper current={step} steps={stepMeta} onJump={goToStep} />

      {/* Step 1 \u2014 Delivery details (kept mounted so entered values survive step changes) */}
      <div ref={(el) => { stepRefs.current[0] = el }} className={clsx(step !== 0 && 'hidden')}>
        <DeliveryDetails
          shippingZipcode={selectedAddress?.billing_pincode}
          onChange={(v) => {
            if (v.postcodeServiceable) setCheckedDeliveryPostcode(v.postcode)
            else setCheckedDeliveryPostcode('')
            onDeliveryChange?.(v)
          }}
          onValidityChange={setDeliveryValid}
          isPriorityDelivery={!!orderSummary?.isExpressDelivery}
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={!deliveryValid}
            onClick={() => setStep(1)}
            className="checkout-cta inline-flex items-center justify-center gap-2 rounded-full bg-cocoa px-7 py-3 text-[14px] font-medium text-ivory transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none"
          >
            Continue to contact
            <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {/* Step 2 \u2014 Contact information */}
      <div ref={(el) => { stepRefs.current[1] = el }} className={clsx(step !== 1 && 'hidden')}>
        <StepCard icon={UserRound} title="Contact information" subtitle="How we reach you about your order">
          <ContactInfo
            currentUser={userData || undefined}
            onUpdate={handleUpdateUser}
            onComplete={() => setStep(2)}
            onBack={() => setStep(0)}
            onValidationChange={setIsContactInfoComplete}
            createAccount={createAccount}
            onCreateAccountChange={onCreateAccountChange}
            onPasswordChange={onPasswordChange}
          />
        </StepCard>
      </div>

      {/* Step 3 \u2014 Shipping address */}
      <div ref={(el) => { stepRefs.current[2] = el }} className={clsx(step !== 2 && 'hidden')}>
        <StepCard icon={MapPin} title="Shipping address" subtitle="Where should we deliver your box in Melbourne?">
          <ShippingAddress
            currentUser={userData || undefined}
            onUpdate={handleUpdateUser}
            selectedAddressIndex={selectedAddressIndex}
            setSelectedAddressIndex={setSelectedAddressIndex}
            onComplete={() => onConfirmOrder?.()}
            onBack={() => setStep(1)}
            expectedPostcode={checkedDeliveryPostcode}
            isConfirming={isConfirming}
            canConfirm={canConfirmOrder}
          />
        </StepCard>
      </div>
    </div>
  )
}

/* \u2500\u2500\u2500 Wizard chrome \u2500\u2500\u2500 */

type StepIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>

const Stepper = ({
  current,
  steps,
  onJump,
}: {
  current: number
  steps: { label: string; icon: StepIcon; done: boolean }[]
  onJump: (i: number) => void
}) => (
  <div className="flex items-stretch gap-2">
    {steps.map((s, i) => {
      const active = i === current
      const reachable = i <= current || steps.slice(0, i).every((x) => x.done)
      return (
        <button
          key={s.label}
          type="button"
          onClick={() => onJump(i)}
          disabled={!reachable}
          className={clsx(
            'flex flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors',
            active
              ? 'border-cocoa bg-cocoa text-ivory'
              : s.done
                ? 'border-line bg-ivory text-cocoa hover:border-rose-accent'
                : 'border-line bg-cream/50 text-cocoa-soft',
            !reachable && 'cursor-not-allowed opacity-60'
          )}
        >
          <span
            className={clsx(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-medium',
              active
                ? 'bg-ivory/20 text-ivory'
                : s.done
                  ? 'bg-rose-accent text-white'
                  : 'bg-cream-deep/60 text-cocoa-soft'
            )}
          >
            {s.done && !active ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-[0.08em] opacity-70">Step {i + 1}</span>
            <span className="block truncate text-[13px] font-medium">{s.label}</span>
          </span>
        </button>
      )
    })}
  </div>
)

const StepCard = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: StepIcon
  title: string
  subtitle: string
  children: React.ReactNode
}) => (
  <div className="scroll-mt-5 overflow-hidden rounded-3xl border border-line bg-ivory">
    <div className="bg-cream/60 px-6 py-4 lg:px-8">
      <div className="flex items-center gap-3.5">
        <div className="font-bake-display flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cocoa text-ivory">
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bake-display text-[16px] font-medium text-cocoa">{title}</h3>
          <p className="bake-caption mt-0.5 text-taupe">{subtitle}</p>
        </div>
      </div>
    </div>
    <div className="border-t border-neutral-100 p-6 lg:p-8">{children}</div>
  </div>
)

const ContactInfo = ({
  onComplete,
  onBack,
  currentUser,
  onUpdate,
  onValidationChange,
  createAccount = false,
  onCreateAccountChange,
  onPasswordChange,
}: {
  onComplete: () => void
  onBack: () => void
  currentUser: UserDTO | undefined
  onUpdate: (data: Partial<UserDTO>) => Promise<void>
  onValidationChange: (isValid: boolean) => void
  createAccount?: boolean
  onCreateAccountChange?: (create: boolean) => void
  onPasswordChange?: (password: string) => void
}) => {
  const { isSignedIn } = useUser()
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn()
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState(currentUser?.billing_fullname || '')
  const [phone, setPhone] = useState(currentUser?.billing_phone || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [password, setPassword] = useState('')
  const [fullNameError, setFullNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountCreated, setAccountCreated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Validation: require password only when creating account
  useEffect(() => {
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean)
    const cleanPhone = phone.replace(/\D/g, '')
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    const nameValid = nameParts.length >= 2
    // AU mobile: 10 digits starting 0 (e.g. 0412 345 678) OR 11 digits with +61
    // prefix (e.g. 61412345678). Landlines (10 digits area-code) also pass.
    const phoneValid =
      cleanPhone.length === 10 ||
      (cleanPhone.length === 11 && cleanPhone.startsWith('61'))
    const emailValid = emailRegex.test(email.trim())
    const baseValid = nameValid && phoneValid && emailValid
    const passwordValid = !createAccount || (createAccount && !!password)
    onValidationChange(!!(baseValid && passwordValid))
  }, [fullName, phone, email, createAccount, password, onValidationChange])

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value)
    if (fullNameError && e.target.value) {
      setFullNameError('')
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value)
    if (phoneError && e.target.value) {
      setPhoneError('')
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError && e.target.value) {
      setEmailError('')
    }
  }

  const validateFullName = () => {
    if (!fullName.trim()) {
      setFullNameError('Full name is required.')
      return false
    }
    if (fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
      setFullNameError('Please enter both first and last name.')
      return false
    }
    setFullNameError('')
    return true
  }

  const validatePhone = () => {
    if (!phone) {
      setPhoneError('Phone number is required.')
      return false
    }
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '')

    // AU formats: 10 digits (e.g. 0412 345 678) or 11 digits with country code 61
    if (cleanPhone.length === 10) {
      setPhoneError('')
      return true
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('61')) {
      setPhoneError('')
      return true
    } else {
      setPhoneError('Please enter a valid Australian phone number (10 digits, or +61 followed by 9 digits).')
      return false
    }
  }

  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required.')
      return false
    }
    // More comprehensive email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.')
      return false
    }
    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
    const domain = email.split('@')[1]?.toLowerCase()
    if (domain && (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.'))) {
      setEmailError('Please check your email address for typos.')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePassword = () => {
    // Only validate password when user wants to create account
    if (isSignedIn || !createAccount) {
      setPasswordError('')
      return true
    }

    if (!password) {
      setPasswordError('Password is required to create your account.')
      return false
    }

    // Password must be at least 8 characters
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.')
      return false
    }

    // Password must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter.')
      return false
    }

    // Password must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter.')
      return false
    }

    // Password must contain at least one number
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number.')
      return false
    }

    // Password must contain at least one special character
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      setPasswordError('Password must contain at least one special character (!@#$%^&*...).')
      return false
    }

    setPasswordError('')
    return true
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (passwordError && e.target.value) {
      setPasswordError('')
    }
    onPasswordChange?.(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountError('')
    const isFullNameValid = validateFullName()
    const isPhoneValid = validatePhone()
    const isEmailValid = validateEmail()
    const isPasswordValid = validatePassword()

    if (!isFullNameValid || !isPhoneValid || !isEmailValid || !isPasswordValid) {
      return
    }

    setIsLoading(true)
    try {
      const contactPayload = {
        billing_fullname: fullName,
        billing_phone: phone,
        email: email.trim().toLowerCase(),
      }

      // If user is not signed in AND wants to create account, create a Clerk account
      if (!isSignedIn && createAccount && password) {
        const emailCheckResponse = await fetch(
          `/api/users/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`
        )
        const emailCheckData = await emailCheckResponse.json().catch(() => ({}))

        if (emailCheckData.exists) {
          setEmailError('An account with this email already exists. Please log in instead.')
          setIsLoading(false)
          return
        }

        const accountResponse = await fetch('/api/auth/create-guest-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            name: fullName,
            phone,
            createAccount: true,
          }),
        })

        const accountData = await accountResponse.json().catch(() => ({}))

        if (!accountData.success) {
          const message = accountData.message || 'Failed to create account. Please try again.'
          if (/password/i.test(message)) {
            setPasswordError(message)
          } else if (/email/i.test(message) && /exist|in use|already/i.test(message)) {
            setEmailError(message)
          } else {
            setAccountError(message)
          }
          setIsLoading(false)
          return
        }

        // Sign in immediately so the next checkout is actually easier.
        if (isSignInLoaded && signIn && setActive) {
          try {
            const signInAttempt = await signIn.create({
              identifier: email.trim().toLowerCase(),
              password,
            })
            if (signInAttempt.status === 'complete' && signInAttempt.createdSessionId) {
              await setActive({ session: signInAttempt.createdSessionId })
            }
          } catch (signInError) {
            console.warn('Account created but auto sign-in failed:', signInError)
          }
        }

        setAccountCreated(true)
        onCreateAccountChange?.(false)
        onPasswordChange?.('')
        setPassword('')

        await onUpdate({
          id: accountData.mongoUserId,
          clerkId: accountData.userId,
          ...contactPayload,
        })
      } else {
        await onUpdate(contactPayload)
      }
      onComplete()
    } catch (error) {
      console.error(error)
      setAccountError('An error occurred while creating your account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action="#" method="POST" onSubmit={handleSubmit}>
      <Fieldset>
        <FieldGroup className="mt-0!">
          {!isSignedIn && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Already have an account?{' '}
              <Link className="font-medium text-rose-accent hover:underline" href="/sign-in?redirect_url=/checkout">
                Log in
              </Link>
            </p>
          )}
          <Field className="max-w-lg">
            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="text-red-500">*</span> Full name
            </Label>
            <Input
              value={fullName}
              onChange={handleFullNameChange}
              onBlur={validateFullName}
              type="text"
              name="fullname"
              required
              placeholder="John Doe"
              className={clsx(
                'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                fullNameError ? 'border-red-500' : ''
              )}
            />
            {fullNameError && <p className="mt-1.5 text-sm font-medium text-red-600">{fullNameError}</p>}
          </Field>
          <Field className="max-w-lg">
            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="text-red-500">*</span> Your mobile number
            </Label>
            <Input
              value={phone}
              onChange={handlePhoneChange}
              onBlur={validatePhone}
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="04XX XXX XXX"
              required
              className={clsx(
                'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                phoneError ? 'border-red-500' : ''
              )}
            />
            {phoneError ? (
              <p className="mt-1.5 text-sm font-medium text-red-600">{phoneError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-neutral-500">Australian mobile — e.g. 0412 345 678 (or +61 412 345 678).</p>
            )}
          </Field>
          <Field className="max-w-lg">
            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="text-red-500">*</span> Email address
            </Label>
            <Input
              value={email}
              onChange={handleEmailChange}
              onBlur={validateEmail}
              type="email"
              name="email"
              required
              className={clsx(
                'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                emailError ? 'border-red-500' : ''
              )}
            />
            {emailError && <p className="mt-1.5 text-sm font-medium text-red-600">{emailError}</p>}
          </Field>

          {!isSignedIn && (
            <>
              <label className="mt-4 flex max-w-lg cursor-pointer items-start gap-3 rounded-xl border border-line bg-ivory px-3 py-3">
                <input
                  type="checkbox"
                  id="create-account"
                  name="create-account"
                  checked={createAccount}
                  onChange={(e) => {
                    const checked = e.target.checked
                    onCreateAccountChange?.(checked)
                    setAccountError('')
                    if (!checked) {
                      setPassword('')
                      onPasswordChange?.('')
                      setPasswordError('')
                    }
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-rose-accent focus:ring-cocoa"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Create an account with this email for easier checkout next time
                </span>
              </label>
              {accountError && <p className="mt-1.5 text-sm font-medium text-red-600">{accountError}</p>}
              {accountCreated && !createAccount && (
                <p className="mt-1.5 text-sm font-medium text-green-700">
                  Account created. You can sign in with this email next time.
                </p>
              )}
              {createAccount && (
                <Field className="mt-4 max-w-lg">
                  <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    <span className="text-red-500">*</span> Choose a password
                  </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password for your account"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={validatePassword}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 pr-10 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                    passwordError ? 'border-red-500' : ''
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.477 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="mt-1.5 text-sm font-medium text-red-600">{passwordError}</p>}
              {!passwordError && (
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Password must be at least 8 characters and include uppercase, lowercase, number, and special
                  character.
                </p>
              )}
                </Field>
              )}
            </>
          )}

          <Field>
            <Label className="text-sm text-neutral-600 dark:text-neutral-400">
              We'll use this information to contact you about your order.
            </Label>
          </Field>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-5 py-3 text-[14px] font-medium text-cocoa-soft transition-colors hover:border-rose-accent hover:text-cocoa"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="checkout-cta inline-flex items-center justify-center gap-2 rounded-full bg-cocoa px-7 py-3 text-[14px] font-medium text-ivory transition-transform active:scale-[0.98] disabled:opacity-50 disabled:hover:transform-none"
            >
              {isLoading ? <Spinner /> : null}
              {isLoading ? 'Updating...' : 'Continue to shipping'}
              {!isLoading && <ArrowRight className="h-4 w-4" strokeWidth={1.9} />}
            </button>
          </div>
        </FieldGroup>
      </Fieldset>
    </form>
  )
}

const ShippingAddress = ({
  currentUser,
  onUpdate,
  selectedAddressIndex,
  setSelectedAddressIndex,
  onComplete,
  onBack,
  expectedPostcode,
  isConfirming = false,
  canConfirm = false,
}: {
  currentUser: UserDTO | undefined
  onUpdate: (data: Partial<UserDTO>) => Promise<void>
  selectedAddressIndex: number
  setSelectedAddressIndex: (index: number) => void
  onComplete: () => void
  onBack: () => void
  /** Postcode confirmed on the Delivery step — shipping address must match. */
  expectedPostcode?: string
  isConfirming?: boolean
  canConfirm?: boolean
}) => {
  const [isAddingNew, setIsAddingNew] = useState(!currentUser?.billing_address?.length)
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null)
  const [tempSelectedIndex, setTempSelectedIndex] = useState(selectedAddressIndex)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (data: any) => {
    const newErrors: Record<string, string> = {}
    if (!data.billing_customer_name?.trim()) newErrors.firstName = 'First name is required'
    if (!data.billing_last_name?.trim()) newErrors.lastName = 'Last name is required'
    if (!data.billing_addressLine?.trim()) newErrors.address = 'Address is required'
    if (!data.billing_city?.trim()) newErrors.city = 'City is required'
    if (!data.billing_country?.trim()) newErrors.country = 'Country is required'
    if (!data.billing_state?.trim()) {
      newErrors.state = 'State/Province is required'
    } else if (!isAllowedShippingState(data.billing_state)) {
      newErrors.state = SHIPPING_STATE_ERROR
    }
    if (!data.billing_pincode?.trim()) {
      newErrors.zip = 'Postal code is required'
    } else if (!/^\d{4}$/.test(data.billing_pincode.trim())) {
      newErrors.zip = 'Postal code must be exactly 4 digits'
    } else if (!isServiceablePostcode(data.billing_pincode.trim())) {
      newErrors.zip =
        "Sorry, we don't deliver to this postcode yet — selected Greater Melbourne suburbs only."
    } else if (expectedPostcode && data.billing_pincode.trim() !== expectedPostcode) {
      newErrors.zip = `Use postcode ${expectedPostcode} — it must match the postcode you checked for delivery.`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formValues = Object.fromEntries(new FormData(e.target as HTMLFormElement))
    const addressData: AddressDTO = {
      billing_address_type: formValues['address-type'] as any,
      billing_customer_name: formValues['first-name'] as string,
      billing_last_name: formValues['last-name'] as string,
      billing_addressLine: formValues['address'] as string,
      billing_city: formValues['city'] as string,
      billing_state: normalizeShippingState(formValues['state-province'] as string) || SHIPPING_STATE,
      billing_country: formValues['country'] as string,
      billing_pincode: formValues['postal-code'] as string,
    }

    if (!validate(addressData)) return

    setIsLoading(true)
    try {
      if (isAddingNew) {
        // Create new billing_address array with the new address appended
        const updatedAddresses = [...(currentUser?.billing_address || []), addressData]
        await onUpdate({ billing_address: updatedAddresses })

        // Update local state
        const newLength = updatedAddresses.length
        setTempSelectedIndex(newLength - 1)
        setSelectedAddressIndex(newLength - 1)
        setIsAddingNew(false)
      } else if (editingAddressIndex !== null) {
        const updatedAddresses = [...(currentUser?.billing_address || [])]
        updatedAddresses[editingAddressIndex] = addressData
        await onUpdate({ billing_address: updatedAddresses })
        setEditingAddressIndex(null)
      }
    } catch (error: any) {
      console.error('Failed to save shipping address:', error)
      const errorMessage =
        error?.response?.data?.error || error?.message || 'Failed to save shipping address. Please try again.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Only update if selection has changed
    if (tempSelectedIndex !== selectedAddressIndex) {
      setSelectedAddressIndex(tempSelectedIndex)
    }
    onComplete()
  }

  const addressToEdit = editingAddressIndex !== null ? currentUser?.billing_address?.[editingAddressIndex] : null
  const showForm = isAddingNew || editingAddressIndex !== null

  // Form for adding or editing an address
  if (showForm) {
    const existingTypes = currentUser?.billing_address?.map((a) => a.billing_address_type) || []
    const isHomeDisabled =
      existingTypes.includes('home') && (isAddingNew || addressToEdit?.billing_address_type !== 'home')
    const isOfficeDisabled =
      existingTypes.includes('office') && (isAddingNew || addressToEdit?.billing_address_type !== 'office')
    const defaultType = addressToEdit?.billing_address_type || (isHomeDisabled ? 'office' : 'home')

    return (
      <form onSubmit={handleSaveAddress}>
        <Fieldset>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {isAddingNew ? 'Add a new address' : 'Edit address'}
          </h3>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> Recipient first name
                </Label>
                <Input
                  placeholder="John"
                  type="text"
                  name="first-name"
                  defaultValue={addressToEdit?.billing_customer_name}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.firstName ? 'border-red-500' : ''
                  )}
                  onChange={() => setErrors((prev) => ({ ...prev, firstName: '' }))}
                />
                {errors.firstName && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.firstName}</p>}
              </Field>
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> Recipient last name
                </Label>
                <Input
                  placeholder="Doe"
                  type="text"
                  name="last-name"
                  defaultValue={addressToEdit?.billing_last_name}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.lastName ? 'border-red-500' : ''
                  )}
                  onChange={() => setErrors((prev) => ({ ...prev, lastName: '' }))}
                />
                {errors.lastName && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.lastName}</p>}
              </Field>
            </div>
            <Field>
              <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <span className="text-red-500">*</span> Address
              </Label>
              <Input
                placeholder="123 Dream Avenue"
                type="text"
                name="address"
                defaultValue={addressToEdit?.billing_addressLine}
                className={clsx(
                  'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                  errors.address ? 'border-red-500' : ''
                )}
                onChange={() => setErrors((prev) => ({ ...prev, address: '' }))}
              />
              {errors.address && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.address}</p>}
            </Field>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> City
                </Label>
                <Input
                  placeholder="Melbourne"
                  type="text"
                  name="city"
                  defaultValue={addressToEdit?.billing_city}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.city ? 'border-red-500' : ''
                  )}
                  onChange={() => setErrors((prev) => ({ ...prev, city: '' }))}
                />
                {errors.city && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.city}</p>}
              </Field>
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> Country
                </Label>
                {/* Melbourne-based kitchen — we deliver within Australia only. */}
                <Input
                  type="text"
                  name="country"
                  defaultValue="Australia"
                  readOnly
                  className="cursor-not-allowed rounded-md border-neutral-200 px-4 py-2.5 text-neutral-500 dark:border-neutral-600 dark:bg-neutral-700"
                />
              </Field>
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> State / Territory
                </Label>
                <select
                  name="state-province"
                  defaultValue={
                    normalizeShippingState(addressToEdit?.billing_state) || SHIPPING_STATE
                  }
                  onChange={() => setErrors((prev) => ({ ...prev, state: '' }))}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.state ? 'border-red-500' : ''
                  )}
                >
                  {AU_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.state}</p>}
              </Field>
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> Postal code
                </Label>
                <Input
                  placeholder="3805"
                  type="text"
                  name="postal-code"
                  defaultValue={addressToEdit?.billing_pincode || expectedPostcode || ''}
                  maxLength={4}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-cocoa focus:ring-2 focus:ring-cocoa/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.zip ? 'border-red-500' : ''
                  )}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    e.target.value = value
                    setErrors((prev) => ({ ...prev, zip: '' }))
                  }}
                />
                {errors.zip && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.zip}</p>}
              </Field>
            </div>
            <Field>
              <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Address Type</Label>
              <RadioGroup name="address-type" defaultValue={defaultType}>
                <RadioField>
                  <Radio value="home" disabled={isHomeDisabled} />
                  <Label>Home</Label>
                </RadioField>
                <RadioField>
                  <Radio value="office" disabled={isOfficeDisabled} />
                  <Label>Office</Label>
                </RadioField>
                <RadioField>
                  <Radio value="other" />
                  <Label>Other</Label>
                </RadioField>
              </RadioGroup>
            </Field>
            <div className="flex flex-wrap gap-2.5 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="checkout-cta inline-flex items-center justify-center gap-2 rounded-full bg-cocoa px-7 py-3 text-[14px] font-medium text-ivory transition-transform active:scale-[0.98] disabled:opacity-50 disabled:hover:transform-none"
              >
                {isLoading ? <Spinner /> : null}
                {isLoading ? 'Saving...' : 'Save Address'}
              </button>
              <ButtonThird
                type="button"
                onClick={() => {
                  setIsAddingNew(false)
                  setEditingAddressIndex(null)
                  setErrors({})
                }}
              >
                Cancel
              </ButtonThird>
            </div>
          </FieldGroup>
        </Fieldset>
      </form>
    )
  }

  // View for selecting an existing address
  const selectedAddr = currentUser?.billing_address?.[tempSelectedIndex]
  const selectedPin = selectedAddr?.billing_pincode?.replace(/\D/g, '').slice(0, 4) || ''
  const selectedServiceable = selectedAddr ? isServiceablePostcode(selectedPin) : false
  const selectedMatchesDelivery =
    !expectedPostcode || !selectedPin || selectedPin === expectedPostcode

  return (
    <div className="space-y-6">
      <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-white">
        Choose a shipping address
      </h3>
      <RadioGroup
        value={String(tempSelectedIndex)}
        onChange={(val) => {
          setTempSelectedIndex(Number(val))
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {currentUser?.billing_address?.map((address, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_12px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-neutral-300 hover:shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:border-neutral-700 dark:bg-neutral-800/60 dark:hover:border-neutral-600"
            >
              <RadioField>
                <Radio value={String(index)} />
                <Label className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-md bg-cocoa/8 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cocoa uppercase dark:bg-[#6b69d6]/15 dark:text-[#8b89e6]">
                      {address.billing_address_type}
                    </span>
                  </div>
                  {(address.billing_customer_name || address.billing_last_name) && (
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {address.billing_customer_name} {address.billing_last_name}
                    </p>
                  )}
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {address.billing_addressLine}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {address.billing_city}, {address.billing_state} {address.billing_pincode}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{address.billing_country}</p>
                </Label>
              </RadioField>
              <button
                type="button"
                onClick={() => {
                  setEditingAddressIndex(index)
                  setErrors({})
                }}
                className="absolute top-3 right-3 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase transition-all hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-200"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </RadioGroup>

      <ButtonThird
        type="button"
        onClick={() => {
          setIsAddingNew(true)
          setErrors({})
        }}
      >
        + Add a new address
      </ButtonThird>

      {selectedAddr && !selectedServiceable && (
        <p className="text-sm font-medium text-rose-accent">
          We don&rsquo;t deliver to {selectedAddr.billing_pincode || 'this postcode'} yet — we currently cover
          selected Greater Melbourne suburbs only. Please choose or add an address in our delivery zone.
        </p>
      )}
      {selectedAddr && selectedServiceable && !selectedMatchesDelivery && (
        <p className="text-sm font-medium text-rose-accent">
          This address is {selectedPin}, but you checked delivery for {expectedPostcode}. Please use an
          address with postcode {expectedPostcode}, or go back and re-check availability.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-5 py-3 text-[14px] font-medium text-cocoa-soft transition-colors hover:border-rose-accent hover:text-cocoa"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !selectedServiceable ||
            !selectedMatchesDelivery ||
            isConfirming ||
            !canConfirm
          }
          className="checkout-cta inline-flex items-center justify-center gap-2 rounded-full bg-cocoa px-7 py-3 text-[14px] font-medium text-ivory transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none"
        >
          {isConfirming ? (
            <>
              <Spinner />
              Processing&hellip;
            </>
          ) : (
            <>
              Review &amp; pay
              <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default Information
